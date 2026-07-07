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
let syncedSegmentIds = new Set<string>();
let segmentLastChangedTime = new Map<string, number>();

function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

function handleSegmentsUpdate(segments: any[]) {
  if (!meetingId) return;

  const currentActiveIds = new Set(segments.map(s => s.id));
  const now = Date.now();

  // 1. Any segment that was active in the previous cycle but is NOT active now is finalized!
  lastActiveSegmentIds.forEach(prevId => {
    if (!currentActiveIds.has(prevId) && !syncedSegmentIds.has(prevId)) {
      const finalSeg = transcriptMap.get(prevId);
      if (finalSeg && finalSeg.transcript_text) {
        console.log('[OxiqAI] Live segment finalized (removed), sending to Supabase:', finalSeg);
        saveLiveTranscriptSegment(meetingId, finalSeg.speaker, finalSeg.transcript_text, finalSeg.timestamp);
        syncedSegmentIds.add(prevId);
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

    const existing = transcriptMap.get(seg.id);
    if (!existing || existing.transcript_text !== data.transcript_text) {
       segmentLastChangedTime.set(seg.id, now);
    }
    
    // Store/Overwrite segment
    transcriptMap.set(seg.id, data);

    // Broadcast instantly to portal wrapper for snappy UI updates
    window.parent.postMessage({
      type: 'OXIQ_INTERIM_TRANSCRIPT',
      segment: data,
      id: seg.id
    }, '*');

    // 3. Auto-sync if it's been idle for 2 seconds
    if (!syncedSegmentIds.has(seg.id)) {
       const lastChanged = segmentLastChangedTime.get(seg.id) || now;
       if (now - lastChanged > 2000) {
           console.log('[OxiqAI] Live segment finalized (idle), sending to Supabase:', data);
           saveLiveTranscriptSegment(meetingId, data.speaker, data.transcript_text, data.timestamp);
           syncedSegmentIds.add(seg.id);
       }
    }
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
// OxiqAI Style Injection Method (Hide CC only)
// ============================================================

function injectCssToHideGoogleUi() {
  const styleId = 'oxiqai-hide-cc-style';
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Hide only the captions button from the Google Meet native bottom bar */
    button[aria-label*="caption" i],
    button[data-tooltip*="caption" i],
    /* Hide native Chat button since we have a custom tab for it */
    button[aria-label*="chat" i],
    button[data-tooltip*="chat" i],
    /* Hide native Chat panel specifically, but allow the People/Participants sidebar to open */
    div[aria-label*="In-call messages" i],
    div[aria-label="Chat" i] {
        display: none !important;
        pointer-events: none !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

function injectOxiqTopWrapper() {
  // Disabled as per user request
}

function hideMeetingDetailsLayout() {
  // Disabled as per user request
}

function runThrottledRegexTextSweeper() {
  // Disabled as per user request
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

      // Auto-admit guest participants is handled by the MutationObserver via handleAutomatedGuestAdmission
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
  const admitButton = Array.from(document.querySelectorAll('button:not([data-oxiq-clicked="true"]), span:not([data-oxiq-clicked="true"]), [role="button"]:not([data-oxiq-clicked="true"])')).find(el => {
    const text = el.textContent?.toLowerCase() || '';
    return text === 'admit' || text === 'admit all' || text.includes('admit entry') || text === 'admitir' || text === 'admitir a todos';
  }) as HTMLElement | null;

  if (admitButton) {
    console.log('[OxiqAI Engine] Incoming participant detected. Executing auto-admit click event...');
    admitButton.dataset.oxiqClicked = "true";
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
