import { MeetDomWatcher } from './meetDomWatcher.ts';
import { OverlayUI } from './overlay.ts';
import { saveTranscriptSegmentsBatch, saveLiveTranscriptSegment, SupabaseSegmentData } from '../supabaseClient.ts';

let isRunning = false;
let watcher: MeetDomWatcher | null = null;
let overlay: OverlayUI | null = null;

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let meetingId = '';
let meetingDay = '';
let meetingDate = '';

// Keeps track of the latest version of each segment ID
let transcriptMap = new Map<string, SupabaseSegmentData>();
let lastActiveSegmentIds = new Set<string>();

function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

function handleSegmentsUpdate(segments: any[]) {
  if (!meetingId) return;

  const currentActiveIds = new Set(segments.map(s => s.id));

  // 1. Any segment that was active in the previous cycle but is NOT active now is finalized!
  lastActiveSegmentIds.forEach(prevId => {
    if (!currentActiveIds.has(prevId)) {
      const finalSeg = transcriptMap.get(prevId);
      if (finalSeg && finalSeg.transcript_text) {
        console.log('[OxiqAI] Live segment finalized, sending to Supabase:', finalSeg);
        saveLiveTranscriptSegment(meetingId, finalSeg.speaker, finalSeg.transcript_text, finalSeg.timestamp);
      }
    }
  });

  // 2. Update map with latest interim text
  segments.forEach((seg) => {
    let speaker = seg.source || 'Speaker';
    let text = seg.text || '';

    // Clean up "You Text" parsing if Google Meet merges them
    if (speaker.toLowerCase() === 'speaker' && text.startsWith('You ')) {
      speaker = 'You';
      text = text.substring(4);
    }

    if (!text.trim()) return;

    const timeStr = formatTime(seg.timestampMs);
    const data: SupabaseSegmentData = {
      meeting_id: meetingId,
      platform: 'Google Meet',
      meeting_day: meetingDay,
      meeting_date: meetingDate,
      speaker: speaker,
      transcript_text: text.trim(),
      timestamp: timeStr,
    };

    // Store/Overwrite segment
    transcriptMap.set(seg.id, data);
  });

  lastActiveSegmentIds = currentActiveIds;
}

// Sync to Supabase in one batch
async function syncToSupabase() {
  const list = Array.from(transcriptMap.values());
  if (list.length > 0) {
    console.log(`[AudioAgent] Syncing final meeting transcript (${list.length} segments) to Supabase...`);
    await saveTranscriptSegmentsBatch(list);
  }
}

// ============================================================
// OxiqAI Visual Mirroring — Shadow DOM Injection Method
// ============================================================

let oxiqUIRoot: HTMLDivElement | null = null;
let videoMirrorInterval: ReturnType<typeof setInterval> | null = null;

// Inject immediate style to hide native Meet elements as early as possible
const startStyle = document.createElement('style');
startStyle.textContent = `
  body > *:not(#oxiqai-custom-interface):not(script):not(style):not(link) {
    position: fixed !important;
    left: -9999px !important;
    top: -9999px !important;
    opacity: 0.001 !important;
    pointer-events: none !important;
  }
`;
document.documentElement.appendChild(startStyle);

function injectOxiqAIInterface() {
  if (document.getElementById('oxiqai-custom-interface')) return;
  console.log('[OxiqAI] Injecting custom interface via Shadow DOM Visual Mirroring...');

  // STEP 1: Push the ENTIRE Google Meet body off-screen
  // We do NOT use display:none — that kills video streams.
  // opacity:0.001 keeps the browser rendering the video pipeline.
  const offscreenStyle = document.createElement('style');
  offscreenStyle.id = 'oxiqai-offscreen-style';
  offscreenStyle.textContent = `
    /* Push Google Meet UI completely off-screen while keeping streams alive */
    body > *:not(#oxiqai-custom-interface):not(script):not(style):not(link) {
      position: fixed !important;
      left: -9999px !important;
      top: -9999px !important;
      width: 100vw !important;
      height: 100vh !important;
      opacity: 0.001 !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(offscreenStyle);

  // STEP 2: Create the OxiqAI full-screen custom interface
  oxiqUIRoot = document.createElement('div');
  oxiqUIRoot.id = 'oxiqai-custom-interface';
  oxiqUIRoot.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: #0f172a;
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    font-family: 'Inter', system-ui, sans-serif;
    overflow: hidden;
  `;

  // ---- Header ----
  const header = document.createElement('div');
  header.style.cssText = `
    height: 56px;
    background: rgba(15,23,42,0.95);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255,255,255,0.07);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    flex-shrink: 0;
  `;
  header.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="width:32px;height:32px;background:linear-gradient(135deg,#0ea5e9,#6366f1);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:16px;">O</div>
      <span style="color:#f8fafc;font-weight:700;font-size:15px;">OxiqAI</span>
      <span id="oxiq-meet-badge" style="background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.25);color:#34d399;font-size:10px;font-weight:600;padding:3px 10px;border-radius:99px;letter-spacing:0.5px;margin-left:4px;">● LIVE SESSION</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <span id="oxiq-participant-count" style="color:#94a3b8;font-size:12px;"></span>
      <span style="background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.2);color:#38bdf8;font-size:11px;font-weight:600;padding:3px 10px;border-radius:6px;">Secure</span>
    </div>
  `;

  // ---- Video Grid ----
  const videoGrid = document.createElement('div');
  videoGrid.id = 'oxiqai-video-grid';
  videoGrid.style.cssText = `
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: #090d16;
    overflow: hidden;
  `;

  const emptyState = document.createElement('div');
  emptyState.id = 'oxiq-empty-state';
  emptyState.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    color: #475569;
  `;
  emptyState.innerHTML = `
    <div style="width:56px;height:56px;background:rgba(14,165,233,0.08);border-radius:50%;display:flex;align-items:center;justify-content:center;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
    </div>
    <p style="font-size:14px;font-weight:500;margin:0;">Setting up secure video session...</p>
  `;
  videoGrid.appendChild(emptyState);

  oxiqUIRoot.appendChild(header);
  oxiqUIRoot.appendChild(videoGrid);
  document.body.appendChild(oxiqUIRoot);

  // STEP 3: Mirror live video streams into OxiqAI video grid
  startVideoMirroring();
}

function makeVideoCard(origVid: HTMLVideoElement, label: string): HTMLDivElement {
  const card = document.createElement('div');
  card.style.cssText = `
    position: relative;
    background: #1e293b;
    border-radius: 12px;
    overflow: hidden;
    flex: 1 1 300px;
    max-width: 48%;
    aspect-ratio: 16/9;
    border: 1px solid rgba(255,255,255,0.06);
  `;

  const vid = document.createElement('video');
  vid.autoplay = true;
  vid.playsInline = true;
  vid.muted = true;
  
  if (origVid.srcObject) {
    vid.srcObject = origVid.srcObject;
  } else if (origVid.src) {
    vid.src = origVid.src;
  }

  vid.style.cssText = 'width:100%;height:100%;object-fit:cover;';

  const nameTag = document.createElement('div');
  nameTag.textContent = label;
  nameTag.style.cssText = `
    position: absolute; bottom: 8px; left: 12px;
    color: #f8fafc; font-size: 12px; font-weight: 600;
    text-shadow: 0 1px 4px rgba(0,0,0,0.6);
  `;

  card.appendChild(vid);
  card.appendChild(nameTag);
  return card;
}

function startVideoMirroring() {
  const seenStreamIds = new Set<string>();

  function mirror() {
    const grid = document.getElementById('oxiqai-video-grid');
    if (!grid) return;

    const liveVideos = Array.from(document.querySelectorAll('video')) as HTMLVideoElement[];
    
    // Filter to find newly appeared active video streams
    const activeVideos = liveVideos.filter(v => {
      const streamId = v.srcObject ? (v.srcObject as MediaStream).id : v.src;
      if (!streamId) return false;
      if (seenStreamIds.has(streamId)) return false;
      
      // Ensure the video is actively playing and has dimensions (prevents black empty boxes)
      return v.readyState >= 2 && v.videoWidth > 0;
    });

    if (activeVideos.length > 0) {
      const emptyState = document.getElementById('oxiq-empty-state');
      if (emptyState) emptyState.remove();

      activeVideos.forEach((origVid) => {
        const streamId = origVid.srcObject ? (origVid.srcObject as MediaStream).id : origVid.src!;
        seenStreamIds.add(streamId);
        
        // Find cleanest participant name/label
        let label = '';
        const nameEl = origVid.closest('[data-self-name]') || origVid.parentElement?.querySelector('[data-sender-name]');
        if (nameEl && nameEl.textContent) {
          label = nameEl.textContent.trim();
        } else {
          const participantId = origVid.closest('[data-participant-id]')?.getAttribute('data-participant-id');
          label = participantId || `Participant ${seenStreamIds.size}`;
        }

        // Check if this video represents a screen share presentation
        const isScreenShare = origVid.style.objectFit === 'contain' || origVid.classList.contains('p2hj7b') || label.toLowerCase().includes('presentation') || label.toLowerCase().includes('presentación');
        if (isScreenShare) {
          label = `🖥️ ${label} (Screen Share)`;
        }
        
        const card = makeVideoCard(origVid, label);
        card.dataset.streamId = streamId;
        
        // Style screen shares larger if desired
        if (isScreenShare) {
          card.style.flex = '2 1 600px';
          card.style.maxWidth = '98%';
        }

        grid.appendChild(card);
      });
    }

    // Dynamic clean-up: Remove cards for streams that are no longer active in Meet
    const currentGridCards = Array.from(grid.querySelectorAll('[data-stream-id]')) as HTMLDivElement[];
    const activeStreamIds = new Set(liveVideos.map(v => v.srcObject ? (v.srcObject as MediaStream).id : v.src).filter(Boolean));
    
    currentGridCards.forEach(card => {
      const streamId = card.dataset.streamId;
      if (streamId && !activeStreamIds.has(streamId)) {
        card.remove();
        seenStreamIds.delete(streamId);
      }
    });

    // Update live count indicator
    const countEl = document.getElementById('oxiq-participant-count');
    if (countEl) {
      countEl.textContent = `${seenStreamIds.size} participant${seenStreamIds.size !== 1 ? 's' : ''}`;
    }
  }

  videoMirrorInterval = setInterval(mirror, 1000);
  mirror();
}

function injectCssToHideGoogleUi() {
  injectOxiqAIInterface();
}

// --- Chrome Message Listener ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'PING_ENGINE') {
    sendResponse({ isRunning });
    return;
  }

  if (request.action === 'START_ENGINE') {
    if (isRunning) {
      sendResponse({ success: true, message: 'Already running' });
      return;
    }

    isRunning = true;

    // Init session
    const now = new Date();
    meetingId = `session_googlemeet_${now.getTime()}`;
    meetingDay = DAYS[now.getDay()];
    meetingDate = now.toISOString().split('T')[0];
    transcriptMap.clear();

    // Register meeting in index
    chrome.storage.local.get(['meetingIndex'], (result) => {
      const index = result.meetingIndex || [];
      index.push({ id: meetingId, platform: 'Google Meet', day: meetingDay, date: meetingDate, startTime: formatTime(now.getTime()) });
      chrome.storage.local.set({ meetingIndex: index });
    });

    overlay = new OverlayUI();
    overlay.setMeetingId(meetingId);
    overlay.mount();

    watcher = new MeetDomWatcher();
    watcher.start((segments) => {
      overlay?.updateSegments(segments);
      handleSegmentsUpdate(segments);
    }, (sender, text, timeMs) => {
      overlay?.receiveChat(sender, text, timeMs);
    });

    sendResponse({ success: true });
    return;
  }

  if (request.action === 'STOP_ENGINE') {
    // Synchronously copy the list before clearing the map
    const finalList = Array.from(transcriptMap.values());
    if (finalList.length > 0) {
      console.log(`[AudioAgent] Syncing final meeting transcript (${finalList.length} segments) to Supabase...`);
      saveTranscriptSegmentsBatch(finalList);
    }

    isRunning = false;
    meetingId = '';
    transcriptMap.clear();

    if (overlay) {
      overlay.unmount();
      overlay = null;
    }
    if (watcher) {
      watcher.stop();
      watcher = null;
    }
    sendResponse({ success: true });
    return;
  }
});

// Allow overlay.ts to trigger stop
window.addEventListener('OXIQ_STOP_ENGINE', () => {
    // Synchronously copy the list before clearing the map
    const finalList = Array.from(transcriptMap.values());
    if (finalList.length > 0) {
      console.log(`[AudioAgent] Syncing final meeting transcript (${finalList.length} segments) to Supabase...`);
      saveTranscriptSegmentsBatch(finalList);
    }

    isRunning = false;
    meetingId = '';
    transcriptMap.clear();

    if (overlay) {
      overlay.unmount();
      overlay = null;
    }
    if (watcher) {
      watcher.stop();
      watcher = null;
    }
    // Also notify popup if it's open (optional, but good practice)
    try { chrome.runtime.sendMessage({ action: 'ENGINE_STOPPED' }); } catch(e){}
});

// --- Parent Webpage postMessage Triggers ---
window.addEventListener('message', (event) => {
  if (!event.data || !event.data.type) return;

  if (event.data.type === 'OXIQ_INIT_MEETING') {
    const roomId = event.data.roomId;
    console.log('[OxiqAI] Auto-initializing room engine for ID:', roomId);
    
    // Send acknowledgement back immediately to stop the parent's retry interval
    window.parent.postMessage({ type: 'OXIQ_INIT_ACK' }, '*');

    if (!isRunning) {
      isRunning = true;
      const now = new Date();
      meetingId = roomId;
      meetingDay = DAYS[now.getDay()];
      meetingDate = now.toISOString().split('T')[0];
      transcriptMap.clear();
      
      // Inject CSS to hide Google Meet's native buttons and headers
      injectCssToHideGoogleUi();

      // Only start the watcher (scrapers) in the background.
      // Do NOT mount overlay so Google Meet remains fully visible and clickable inside the frame!
      watcher = new MeetDomWatcher();
      watcher.start((segments) => {
        handleSegmentsUpdate(segments);
      }, (sender, text, timeMs) => {
        // Chat messages are polled by the portal room page directly from Supabase,
        // but we keep the callback active in case.
      });
      
      // Auto-join loop
      const joinInterval = setInterval(() => {
        const joinBtn = Array.from(document.querySelectorAll('button, [role="button"]')).find(el => {
          const txt = (el.textContent || '').trim().toLowerCase();
          return txt === 'join now' || txt === 'ask to join' || txt === 'participar' || txt === 'reunirse ahora';
        }) as HTMLElement;

        if (joinBtn) {
          joinBtn.click();
          clearInterval(joinInterval);
        }
      }, 1000);

      // Auto-admit guest participants loop (runs continuously during session)
      const admitInterval = setInterval(() => {
        if (!isRunning) {
          clearInterval(admitInterval);
          return;
        }
        const admitBtns = Array.from(document.querySelectorAll('button, [role="button"]')).filter(el => {
          const txt = (el.textContent || '').trim().toLowerCase();
          return txt.includes('admit') || txt.includes('admit all') || txt.includes('admitir') || txt.includes('admitir a todos');
        }) as HTMLElement[];
        
        admitBtns.forEach(btn => {
          console.log('[OxiqAI] Automatically admitting guest participant.');
          btn.click();
        });
      }, 1000);
    }
  }

  if (event.data.type === 'OXIQ_TOGGLE_MIC') {
    console.log('[OxiqAI] Remote toggle mic triggered.');
    const micBtn = document.querySelector('[data-is-muted][aria-label*="micro" i], button[aria-label*="micro" i], [role="button"][aria-label*="micro" i]') as HTMLElement;
    if (micBtn) micBtn.click();
  }

  if (event.data.type === 'OXIQ_TOGGLE_CAM') {
    console.log('[OxiqAI] Remote toggle camera triggered.');
    const camBtn = document.querySelector('[data-is-muted][aria-label*="camera" i], [data-is-muted][aria-label*="video" i], button[aria-label*="camera" i], [role="button"][aria-label*="camera" i]') as HTMLElement;
    if (camBtn) camBtn.click();
  }

  if (event.data.type === 'OXIQ_TOGGLE_SCREEN') {
    console.log('[OxiqAI] Remote toggle screen share triggered.');
    const screenBtn = Array.from(document.querySelectorAll('button, [role="button"]')).find(el => {
      const label = (el.getAttribute('aria-label') || el.getAttribute('data-tooltip') || '').toLowerCase();
      return label.includes('present') || label.includes('screen') || label.includes('pantalla') || label.includes('écran') || label.includes('bildschirm') || label.includes('compartir');
    }) as HTMLElement;
    if (screenBtn) {
      console.log('[OxiqAI] Clicking screen share button:', screenBtn);
      screenBtn.click();
    } else {
      console.error('[OxiqAI] Could not find screen share button.');
    }
  }
});

// Announce extension readiness on script start
try {
  console.log('[OxiqAI] Extension content script active. Dispatching OXIQ_EXTENSION_READY.');
  window.parent.postMessage({ type: 'OXIQ_EXTENSION_READY' }, '*');
} catch (e) {
  console.error('[OxiqAI] Failed to dispatch readiness handshake:', e);
}
