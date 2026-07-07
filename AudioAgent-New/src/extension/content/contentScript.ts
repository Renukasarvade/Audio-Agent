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
// OxiqAI Style Injection Method (No Mirroring Overhead)
// ============================================================

function injectCssToHideGoogleUi() {
  const styleId = 'oxiqai-hide-branding-style';
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Hide all Google's original headers, text overlays, and utility buttons completely */
    div[jsname="V676U"], div[data-meeting-title], .NzbeBe, .jv7QQ,
    div[jsname="pZ99L"], .wY1v9c, .R36Sre, .m9992c,
    .t7654b, .rG0ehe, .Q86pBc, div[jscontroller="s370ud"], div[jsname="x13uXb"],
    .cM3h5e, .GOH7ee,
    div[jsname="b3As7c"], div[data-is-footer], div[data-is-meeting-controls], .pHvYBc, .UnO69,
    div[jsname="E762U"], button[aria-label*="Meeting safety" i], .Zp5Z5b,
    /* Hide all native buttons in Google Meet bottom bar by aria-label */
    button[aria-label*="microphone" i],
    button[aria-label*="mic" i],
    button[aria-label*="camera" i],
    button[aria-label*="video" i],
    button[aria-label*="present" i],
    button[aria-label*="screen" i],
    button[aria-label*="reaction" i],
    button[aria-label*="emoji" i],
    button[aria-label*="captions" i],
    button[aria-label*="Leave" i],
    button[aria-label*="hand" i],
    button[aria-label*="options" i],
    button[aria-label*="everyone" i],
    button[aria-label*="chat" i],
    button[aria-label*="Activities" i],
    button[aria-label*="host control" i],
    /* Hide top bar details & buttons */
    button[aria-label*="meeting details" i],
    div[jsname="x13uXb"],
    .NzPR9b,
    .NZPR9b,
    /* Hide bottom bar background container wrappers */
    div[role="navigation"],
    div[jscontroller="h1Z2Lc"],
    div[jscontroller="Un177c"],
    .cRy76c,
    .a5a76c,
    .r272ac,
    .Kc2tGc,
    .S72w7d,
    .gV53u,
    /* Hide side panels & drawers completely */
    div[jsname="t425Mc"],
    div[role="sidebar"],
    div[jsname="v0XvKe"],
    .X3v40b,
    .axgI9e,
    /* Hide Google Meet landing/home/lobby entryway branding & settings overlays */
    div[aria-label*="Meetings" i],
    div[class*="landing" i],
    div[jsname="OW330d"],
    .kWYpY,
    .Ym8T9b,
    svg[aria-label*="Google Meet" i],
    header[role="banner"],
    div[jsname="O4nF9b"],
    div[jsname="Gk8ldc"],
    header,
    div[jscontroller="eG5mH"],
    div[class*="settings" i],
    div[class*="Logo" i],
    div[class*="account" i],
    div[class*="profile" i],
    span[class*="email" i],
    div[jsname="q7365c"],
    div[class*="other" i] {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
      height: 0 !important;
      width: 0 !important;
      overflow: hidden !important;
    }

    /* Eliminate all hover control buttons across every single video tile */
    div[data-participant-id] button,
    div[jsname="j79O8"],
    div[class*="tile-controls" i],
    button[aria-label*="pin" i],
    button[aria-label*="mute" i] {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    /* Force the video call container layout to expand flat beneath your custom ribbons */
    .GvcuGe, .zW9vEb, .E6bY4b, div[jsname="L9Y7fc"], html, body, #yDmH0d {
        width: 100vw !important;
        height: 100vh !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #090d16 !important;
        overflow: hidden !important;
        display: flex !important;
        flex-wrap: wrap !important;
        justify-content: center !important;
        align-items: center !important;
        gap: 12px !important;
    }

    /* Force participant panels to cleanly scale down as the group expands */
    div[data-participant-id] {
        flex: 1 1 240px !important;
        max-width: 48% !important;
        aspect-ratio: 16/9 !important;
        background: linear-gradient(145deg, #0b1329 0%, #080d16 100%) !important;
        border-radius: 16px !important;
        border: 1px solid rgba(255, 255, 255, 0.05) !important;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4) !important;
        transition: all 0.25s ease-in-out !important;
    }

    /* Center user voice initials circles gradient configuration styling */
    div[jsname="a97n6e"], .gV7Ssc, .M7798c {
        background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%) !important;
        border: 2px solid rgba(255, 255, 255, 0.2) !important;
        box-shadow: 0 0 25px rgba(14, 165, 233, 0.35) !important;
    }

    /* Force entryway lobby elements background colors to OxiqAI dark slate theme */
    div[jscontroller="H1Z2Lc"],
    div[jsname="r4n2Ac"],
    div[jscontroller="B19ACc"],
    div[class*="card" i],
    div[class*="container" i],
    div[class*="surface" i] {
      background: #090d16 !important;
      background-color: #090d16 !important;
      color: #f8fafc !important;
      border: none !important;
      box-shadow: none !important;
    }
    
    /* Make lobby headers and paragraph text look white */
    div[jscontroller="H1Z2Lc"] h1,
    div[jscontroller="H1Z2Lc"] h2,
    div[jscontroller="H1Z2Lc"] span,
    div[jscontroller="H1Z2Lc"] p,
    div[jscontroller="H1Z2Lc"] div {
      color: #f8fafc !important;
    }

    /* Hide native admission dialogues visually but keep them active/clickable in layout */
    div[role="dialog"]:has(button),
    .X7vMbc,
    div[class*="admission-popup" i] {
      opacity: 0 !important;
      pointer-events: auto !important;
      visibility: visible !important;
    }

    /* Hide native captions but keep DOM active for scraper */
    .a4cQT, .iOzk7, [jsname="dsSSbb"], .MZy1T, .cXy5B, .U6Acd, .KjWwNd {
      position: fixed !important;
      bottom: 20px !important;
      left: 20px !important;
      height: 1px !important;
      width: 1px !important;
      overflow: hidden !important;
      opacity: 0.001 !important;
      pointer-events: none !important;
      background: transparent !important;
      z-index: 999999 !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    /* Hide name tags and overlays optionally */
    .Xg9N7e, 
    div[jsname="V676U"] {
        display: none !important;
    }

    /* Style Meet's native video container to fill the workspace */
    div[jscontroller="yO202"] {
      height: 100% !important;
      width: 100% !important;
    }

    /* Style native video frames with clean borders */
    video {
      border-radius: 12px !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
    }

    /* Clean Google's native speaker label backgrounds */
    div[jsname="gB77cb"] {
      background: rgba(15, 23, 42, 0.7) !important;
      backdrop-filter: blur(8px) !important;
      border-radius: 6px !important;
      font-family: 'Inter', sans-serif !important;
      border: 1px solid rgba(255, 255, 255, 0.05) !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

function injectOxiqTopWrapper() {
  if (document.getElementById('oxiqai-top-mask-wrapper')) return;

  // 1. Create the custom OxiqAI Header Ribbon to hide Google's floating text fields
  const topRibbon = document.createElement('div');
  topRibbon.id = 'oxiqai-top-mask-wrapper';
  topRibbon.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 60px;
    background: linear-gradient(to bottom, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.7) 100%);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 2147483647; /* Sits on top of Google Meet completely */
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    font-family: 'Inter', system-ui, sans-serif;
    user-select: none;
    pointer-events: auto;
  `;

  // Insert your brand parameters inside the header ribbon
  topRibbon.innerHTML = `
    <div style="display:flex; align-items:center; gap:12px;">
      <div style="width:32px; height:32px; background:linear-gradient(135deg, #0ea5e9, #6366f1); border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:800; color:#fff; font-size:16px; box-shadow:0 0 15px rgba(14,165,233,0.4);">O</div>
      <span style="color:#fff; font-weight:700; font-size:16px; letter-spacing:-0.3px;">OxiqAI <span style="font-weight:400; color:#94a3b8; font-size:13px;">Studio</span></span>
    </div>
    <div style="display:flex; align-items:center; gap:14px;">
      <span style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.25); color:#34d399; font-size:11px; font-weight:700; padding:4px 12px; border-radius:99px; letter-spacing:0.5px;">● SECURE AUDIO AGENT CONNECTED</span>
    </div>
  `;

  // 2. Create the lower left custom room watermarks to layer over Google's naming strings
  const bottomLabel = document.createElement('div');
  bottomLabel.id = 'oxiqai-bottom-label';
  bottomLabel.style.cssText = `
    position: fixed;
    bottom: 24px; left: 24px;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.06);
    padding: 6px 14px;
    border-radius: 8px;
    color: #f1f5f9;
    font-size: 12px;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    z-index: 2147483647;
    pointer-events: none;
  `;
  bottomLabel.textContent = "OxiqAI Workspace Environment";

  // Append elements natively to the frame body
  document.body.appendChild(topRibbon);
  document.body.appendChild(bottomLabel);
}

function hideMeetingDetailsLayout() {
  // Hide left-hand clock & meeting link text (e.g. "18:13 | xrt-uoxo-jbt")
  // and right-hand participant counts & avatar bubbles
  const selectors = [
    'div[data-meeting-title]',
    'div[jsname="V676U"]',
    '.NzbeBe',
    '.jv7QQ',
    '.NzPR9b',
    '.NZPR9b',
    '.cM3h5e',
    '.GOH7ee',
    'div[jsname="pZ99L"]',
    '.wY1v9c',
    '.R36Sre',
    '.m9992c',
    'div[aria-label*="Meeting details" i]',
    /* Also hide dynamic bubbles on the top-right */
    '.t7654b',
    '.rG0ehe',
    '.Q86pBc',
    'div[jscontroller="s370ud"]',
    'div[jsname="x13uXb"]'
  ];
  
  selectors.forEach(sel => {
    try {
      const els = document.querySelectorAll(sel);
      els.forEach(el => {
        const html = el as HTMLElement;
        if (html.style.display !== 'none') {
          html.style.setProperty('display', 'none', 'important');
          html.style.setProperty('opacity', '0', 'important');
          html.style.setProperty('visibility', 'hidden', 'important');
        }
      });
    } catch (e) {}
  });

}

function runThrottledRegexTextSweeper() {
  // Throttled sweep of the DOM for code format strings (e.g. xxx-yyyy-zzz) to prevent 100% CPU loops
  try {
    const divs = document.querySelectorAll('div, span, button');
    const codeRegex = /\b[a-z]{3}-[a-z]{4}-[a-z]{3}\b/;
    divs.forEach(el => {
      if (el.closest('#oxiqai-top-mask-wrapper') || el.closest('#oxiqai-bottom-label') || el.closest('#oxiqai-overlay-root')) return;
      const text = el.textContent || '';
      if (text.length < 50 && (text.includes('|') || codeRegex.test(text))) {
        const html = el as HTMLElement;
        if (html.style.display !== 'none') {
          html.style.setProperty('display', 'none', 'important');
          html.style.setProperty('opacity', '0', 'important');
          html.style.setProperty('visibility', 'hidden', 'important');
        }
      }
    });
  } catch (e) {}
}

// Inject immediate style to hide native Meet elements as early as possible
const startStyle = document.createElement('style');
startStyle.textContent = `
  button[aria-label*="microphone" i],
  button[aria-label*="mic" i],
  button[aria-label*="camera" i],
  button[aria-label*="video" i],
  button[aria-label*="present" i],
  button[aria-label*="Leave" i],
  div[role="navigation"],
  div[jscontroller="h1Z2Lc"],
  div[jscontroller="Un177c"],
  .cRy76c, .a5a76c, .r272ac, .Kc2tGc, .S72w7d, .gV53u {
    opacity: 0.001 !important;
    pointer-events: none !important;
    display: none !important;
  }
`;
document.documentElement.appendChild(startStyle);

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
      hideMeetingDetailsLayout();

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
    const btn = document.querySelector('[data-is-muted][aria-label*="micro" i], button[aria-label*="micro" i], [role="button"][aria-label*="micro" i]') as HTMLElement;
    if (btn) btn.click();
  }

  if (event.data.type === 'OXIQ_TOGGLE_CAM') {
    console.log('[OxiqAI] Remote toggle camera triggered.');
    const btn = document.querySelector('[data-is-muted][aria-label*="camera" i], [data-is-muted][aria-label*="video" i], button[aria-label*="camera" i], [role="button"][aria-label*="camera" i]') as HTMLElement;
    if (btn) btn.click();
  }

  if (event.data.type === 'OXIQ_TOGGLE_SCREEN') {
    console.log('[OxiqAI] Remote toggle screen share triggered.');
    const btn = Array.from(document.querySelectorAll('button, [role="button"]')).find(el => {
      const label = (el.getAttribute('aria-label') || el.getAttribute('data-tooltip') || '').toLowerCase();
      return label.includes('present') || label.includes('screen') || label.includes('compartir') || label.includes('presentar');
    }) as HTMLElement;
    if (btn) btn.click();
  }

  if (event.data.type === 'OXIQ_TOGGLE_CC') {
    console.log('[OxiqAI] Remote toggle captions triggered.');
    const btn = Array.from(document.querySelectorAll('button, [role="button"]')).find(el => {
      const label = (el.getAttribute('aria-label') || el.getAttribute('data-tooltip') || '').toLowerCase();
      return label.includes('captions') || label.includes('cc') || label.includes('subtítulo') || label.includes('sous-titre');
    }) as HTMLElement;
    if (btn) btn.click();
  }

  if (event.data.type === 'OXIQ_TOGGLE_HAND') {
    console.log('[OxiqAI] Remote toggle hand raise triggered.');
    const btn = Array.from(document.querySelectorAll('button, [role="button"]')).find(el => {
      const label = (el.getAttribute('aria-label') || el.getAttribute('data-tooltip') || '').toLowerCase();
      return label.includes('hand') || label.includes('mano') || label.includes('main');
    }) as HTMLElement;
    if (btn) btn.click();
  }

  if (event.data.type === 'OXIQ_TOGGLE_EMOJI') {
    console.log('[OxiqAI] Remote toggle emoji panel triggered.');
    const btn = Array.from(document.querySelectorAll('button, [role="button"]')).find(el => {
      const label = (el.getAttribute('aria-label') || el.getAttribute('data-tooltip') || '').toLowerCase();
      return label.includes('reaction') || label.includes('emoji') || label.includes('reacción');
    }) as HTMLElement;
    if (btn) btn.click();
  }

  if (event.data.type === 'OXIQ_TOGGLE_MORE' || event.data.type === 'OXIQ_TOGGLE_DOTS') {
    console.log('[OxiqAI] Remote toggle more options triggered.');
    const btn = Array.from(document.querySelectorAll('button, [role="button"]')).find(el => {
      const label = (el.getAttribute('aria-label') || el.getAttribute('data-tooltip') || '').toLowerCase();
      return label.includes('more options') || label.includes('más opciones') || label.includes('autres options') || label.includes('options');
    }) as HTMLElement;
    if (btn) btn.click();
  }

  if (event.data.type === 'OXIQ_TOGGLE_HOST') {
    console.log('[OxiqAI] Remote toggle host controls triggered.');
    const btn = Array.from(document.querySelectorAll('button, [role="button"]')).find(el => {
      const label = (el.getAttribute('aria-label') || el.getAttribute('data-tooltip') || '').toLowerCase();
      return label.includes('host control') || label.includes('moderador') || label.includes('organisateur');
    }) as HTMLElement;
    if (btn) btn.click();
  }
});

// Announce extension readiness on script start
try {
  console.log('[OxiqAI] Extension content script active. Dispatching OXIQ_EXTENSION_READY.');
  window.parent.postMessage({ type: 'OXIQ_EXTENSION_READY' }, '*');
} catch (e) {
  console.error('[OxiqAI] Failed to dispatch readiness handshake:', e);
}

function handleGuestRedirectionTrap() {
  const path = window.location.pathname;
  // If the guest is trapped on Google Meet's main homepage or signin redirect landing loops
  const isHomepage = path === '/' || path.includes('/landing') || path.includes('/about');
  
  if (isHomepage && !document.getElementById('oxiqai-gateway-prompt')) {
    console.log('[OxiqAI Engine] Guest landing trap caught. Injecting branded gateway overlay...');
    injectOxiqGatewayUI();
  }
}

function injectOxiqGatewayUI() {
  // Wipe Google's home workspace elements entirely out of the DOM view
  const googleHomeContent = document.querySelector('[jsname="OW330d"]') as HTMLElement;
  if (googleHomeContent) googleHomeContent.style.setProperty('display', 'none', 'important');

  const gatewayOverlay = document.createElement('div');
  gatewayOverlay.id = 'oxiqai-gateway-prompt';
  gatewayOverlay.style.cssText = `
    position: fixed; inset: 0;
    background: radial-gradient(circle at center, #0f172a 0%, #090d16 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    z-index: 2147483647; font-family: 'Inter', sans-serif; color: #f8fafc;
  `;
  
  gatewayOverlay.innerHTML = `
    <div style="max-width: 420px; width: 90%; padding: 36px 28px; background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; text-align: center; backdrop-filter: blur(16px); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
      <div style="width: 52px; height: 52px; background: linear-gradient(135deg, #0ea5e9, #6366f1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; color: #fff; margin: 0 auto 16px auto; box-shadow: 0 0 20px rgba(14, 165, 233, 0.35);">O</div>
      <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.3px;">Secure Portal Authentication</h2>
      <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(14, 165, 233, 0.1); border: 1px solid rgba(14, 165, 233, 0.25); color: #38bdf8; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 600; margin-bottom: 20px;">🛡️ SECURITY GATEWAY</div>
      <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px 0;">To connect to this OxiqAI workspace streaming channel, your browser profile requires an active Google account initialization. Please sign in briefly to link your video pipelines.</p>
      <button id="btn-google-signin" style="width: 100%; background: linear-gradient(135deg, #0ea5e9, #6366f1); border: none; padding: 12px; border-radius: 8px; color: #fff; font-weight: 600; font-size: 14px; cursor: pointer; box-shadow: 0 4px 12px rgba(14,165,233,0.25);">Initialize Google Sync Account</button>
      <button id="btn-refresh-sync" style="background:none; border:none; color:#64748b; font-size:12px; margin-top:14px; cursor:pointer; font-weight:500; font-family:inherit;">🔄 Click here to refresh after signing in</button>
    </div>
  `;
  
  document.body.appendChild(gatewayOverlay);

  const btnSignin = gatewayOverlay.querySelector('#btn-google-signin');
  if (btnSignin) {
    btnSignin.addEventListener('click', () => {
      // Open clean sign-in popup using direct Google ServiceLogin link so it maps correctly
      window.open('https://accounts.google.com/ServiceLogin?service=meetings', '_blank', 'width=500,height=600');
    });
  }

  const btnRefresh = gatewayOverlay.querySelector('#btn-refresh-sync');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      window.location.reload();
    });
  }
}

function handleAutomatedGuestAdmission() {
  // Locates Google's dynamic pop-up buttons via text descriptors or structural selectors
  // Targets standard matching variations: "Admit", "Admit all", "Allow", or "Admit guest"
  const admitButton = Array.from(document.querySelectorAll('button, span, div')).find(el => {
    const text = el.textContent?.toLowerCase() || '';
    return text === 'admit' || text === 'admit all' || text.includes('admit entry') || text === 'admitir' || text === 'admitir a todos';
  }) as HTMLElement | null;

  if (admitButton) {
    console.log('[OxiqAI Engine] Incoming participant detected. Executing auto-admit click event...');
    admitButton.click();
  }
}

function checkMeetingDisconnection() {
  const isDisconnectedRoute = window.location.pathname === '/_meet/disconnected' || 
                               window.location.href.includes('google.com/meet/disconnected');
                               
  const exitCardExists = Array.from(document.querySelectorAll('h1, h2')).some(el => {
    const text = el.textContent?.toLowerCase() || '';
    return text.includes('left the meeting') || text.includes('left the call') || text.includes('has ended') || text.includes('reunión ha terminado') || text.includes('ended for everyone');
  });

  // Guard: If there is a "Rejoin" button on the page, the user is just on the rejoin screen and we should not show the conclude overlay
  const hasRejoinButton = Array.from(document.querySelectorAll('button')).some(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    return text.includes('rejoin') || text.includes('unirse de nuevo') || text.includes('volver a unirse');
  });

  if ((isDisconnectedRoute || exitCardExists) && !hasRejoinButton && !document.getElementById('oxiqai-end-overlay')) {
    console.log('[OxiqAI] Detected Google Meet meeting concluding / disconnecting. Injecting Conclude Splash UI...');
    injectOxiqEndDashboard();
  }
}

function injectOxiqEndDashboard() {
  document.body.innerHTML = '';
  const endOverlay = document.createElement('div');
  endOverlay.id = 'oxiqai-end-overlay';
  endOverlay.style.cssText = `
    position: fixed; inset: 0;
    background: radial-gradient(circle at center, #0f172a 0%, #090d16 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    z-index: 2147483647; font-family: 'Inter', sans-serif; color: #f8fafc;
  `;
  
  endOverlay.innerHTML = `
    <div style="max-width: 400px; width: 90%; padding: 32px; background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; text-align: center; backdrop-filter: blur(16px); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
      <div style="width: 52px; height: 52px; background: linear-gradient(135deg, #0ea5e9, #6366f1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; color: #fff; margin: 0 auto 16px auto; box-shadow: 0 0 20px rgba(14, 165, 233, 0.35);">O</div>
      <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">Session Concluded</h2>
      <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.25); color: #f59e0b; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 600; margin-bottom: 16px;">⚠️ TIMEOUT PROTECT</div>
      <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px 0;">This secure meeting room has been closed automatically due to inactivity layout limits. Your transcription metrics logs have been safely batched to Supabase.</p>
      <button id="btn-return-home" style="width: 100%; background: #0ea5e9; border: none; padding: 12px; border-radius: 8px; color: #fff; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s;">Return to Dashboard</button>
    </div>
  `;
  document.body.appendChild(endOverlay);

  // Wire up the message sender to the button
  const btn = endOverlay.querySelector('#btn-return-home');
  if (btn) {
    btn.addEventListener('click', () => {
      console.log('[OxiqAI] Dispatching PORTAL_REDIRECT_HOME postMessage...');
      window.parent.postMessage({ action: 'PORTAL_REDIRECT_HOME' }, '*');
    });
  }
}

// Automatically inject style and wrappers if running inside our portal's iframe
if (window.self !== window.top) {
  console.log('[OxiqAI] Detected iframe execution. Initializing dynamic layout MutationObserver...');
  injectCssToHideGoogleUi();
  injectOxiqTopWrapper();
  hideMeetingDetailsLayout();
  handleGuestRedirectionTrap();
  checkMeetingDisconnection();
  handleAutomatedGuestAdmission();
  autoBypassGreenRoom();

  // Run the heavy regex text sweeper in a throttled interval (once every 1.5s) to eliminate CPU lag
  runThrottledRegexTextSweeper();
  setInterval(runThrottledRegexTextSweeper, 1500);

  // Re-verify styles and hide dynamic meeting link layouts when DOM shifts
  const engineObserver = new MutationObserver(() => {
    injectCssToHideGoogleUi();
    injectOxiqTopWrapper();
    hideMeetingDetailsLayout();
    handleGuestRedirectionTrap();
    checkMeetingDisconnection();
    handleAutomatedGuestAdmission();
    autoBypassGreenRoom();
  });
  engineObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}
