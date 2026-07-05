// ==========================================================================
// OxiqAI Chrome Extension — Background Service Worker
// Automatically creates Google Meet & Teams calls and registers them in Supabase
// ==========================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CREATE_MEET_AUTO') {
    const platform = request.platform;
    const targetUrl = platform === 'google_meet' ? 'https://meet.google.com/new' : 'https://teams.live.com/meet';
    
    console.log('[OxiqAI Background] Generating meeting URL for platform:', platform);

    // Create a tab to generate the real meeting URL
    chrome.tabs.create({ url: targetUrl, active: true }, (tab) => {
      const tabId = tab.id;
      if (!tabId) {
        sendResponse({ success: false, error: 'Failed to open helper tab' });
        return;
      }

      const listener = (changedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
        if (changedTabId === tabId && changeInfo.url) {
          const url = changeInfo.url;
          let linkFound = false;
          let link = '';

          if (platform === 'google_meet') {
            const match = url.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/);
            if (match) {
              linkFound = true;
              link = `https://meet.google.com/${match[1]}`;
            }
          } else {
            if (url.includes('teams.live.com/meet/') || url.includes('teams.microsoft.com/l/meetup-join/')) {
              linkFound = true;
              link = url;
            }
          }

          if (linkFound) {
            chrome.tabs.onUpdated.removeListener(listener);
            chrome.tabs.remove(tabId);
            
            console.log('[OxiqAI Background] Link found successfully:', link);
            sendResponse({ success: true, link });
          }
        }
      };
      
      chrome.tabs.onUpdated.addListener(listener);

      // Auto-timeout fallback if it takes too long to load (e.g. 8 seconds)
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        chrome.tabs.get(tabId, (checkTab) => {
          if (chrome.runtime.lastError || !checkTab) return;
          chrome.tabs.remove(tabId);
        });
        sendResponse({ success: false, error: 'Request timed out. Please try again.' });
      }, 8000);
    });

    return true; // keep channel open asynchronously
  }
});
