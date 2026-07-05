// ==========================================================================
// OxiqAI Chrome Extension — Dashboard Page Bridge
// Runs on OxiqAI web portal dashboard and handles automatic meet triggers
// ==========================================================================

// Verify if the page is actually an OxiqAI portal page before running
const isOxiqPage = document.querySelector('.video-container') || 
                   document.querySelector('.dashboard-container') || 
                   document.getElementById('btn-generate-meet-link') || 
                   document.querySelector('.room-header');

if (isOxiqPage) {
  console.log('[OxiqAI] Web Dashboard Bridge active.');

  // Tell the webpage that the extension bridge is active
  document.documentElement.setAttribute('data-oxiqai-extension-active', 'true');

  window.addEventListener('OXIQ_TRIGGER_AUTO_MEET', (e: any) => {
    const platform = e.detail?.platform || 'google_meet';
    console.log('[OxiqAI Bridge] Triggering meet creation for platform:', platform);

    chrome.runtime.sendMessage({ action: 'CREATE_MEET_AUTO', platform }, (res) => {
      if (chrome.runtime.lastError) {
        console.error('[OxiqAI Bridge] Extension communication failed:', chrome.runtime.lastError.message);
        window.dispatchEvent(new CustomEvent('OXIQ_AUTO_MEET_FAILED', { detail: { error: 'Please reload extension and webpage.' } }));
        return;
      }
      
      if (res && res.success && res.link) {
        console.log('[OxiqAI Bridge] Meeting link generated successfully:', res.link);
        window.dispatchEvent(new CustomEvent('OXIQ_AUTO_MEET_SUCCESS', { detail: { link: res.link } }));
      } else {
        console.error('[OxiqAI Bridge] Meeting link generation failed:', res?.error || 'Unknown error');
        window.dispatchEvent(new CustomEvent('OXIQ_AUTO_MEET_FAILED', { detail: { error: res?.error || 'Link generation failed.' } }));
      }
    });
  });
}
