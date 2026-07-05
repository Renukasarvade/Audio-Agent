import { PlatformDomWatcher, TranscriptSegment } from '../../types/engine.ts';

/**
 * MICROSOFT TEAMS CAPTIONS LIMITATIONS & NOTES
 * 
 * 1. Transcription vs Captions: Teams captions often paraphrase or truncate speech rather than 
 *    transcribing verbatim. This is a Teams platform behavior, not a scraping limitation.
 * 2. Selectors: The data-tid selectors below are based on a community open-source project as of Jan 2025.
 *    Microsoft updates these values without notice. They MUST be re-verified against a live Teams meeting.
 * 3. Scope: This watcher only supports the Teams WEB client (teams.microsoft.com / teams.live.com), 
 *    not the desktop app.
 */
const TEAMS_SELECTORS = {
  container: [
    '[data-tid="closed-caption-v2-virtual-list-content"]',
    '[data-tid*="closed-caption"][data-tid*="list"]',
    '[data-tid*="caption-container"]',
    '[aria-label*="caption" i] > div'
  ],
  captionBlock: [
    '.fui-ChatMessageCompact',
    '[data-tid="closed-caption-chat-message"]',
    '[data-tid*="caption-message"]',
    '[data-tid*="closed-caption-chat"]',
    '.ui-chat__item'
  ],
  author: [
    '[data-tid="author"]',
    '.fui-ChatMessageCompact__author',
    '.ui-chat__message__author',
    '[data-tid="closed-caption-author"]',
    '.ui-chat__message__sender',
    '[data-tid*="author"]'
  ],
  text: [
    '[data-tid="closed-caption-text"]',
    '[data-tid*="caption-text"]',
    '.ui-chat__message__content'
  ],
  meetingTitle: ['h2[data-tid="chat-title"] span'],
  
  // Auto-enable navigation selectors
  moreButton: ["button[data-tid='more-button']", "button[id='callingButtons-showMoreBtn']"],
  moreButtonExpanded: ["button[data-tid='more-button'][aria-expanded='true']", "button[id='callingButtons-showMoreBtn'][aria-expanded='true']"],
  languageMenu: ["div[id='LanguageSpeechMenuControl-id']", "li[data-tid='language-and-speech']"],
  turnOnCaptionsBtn: ["div[id='closed-captions-button']", "button[data-tid='turn-on-captions']"]
};

function resolveSelector(candidates: string[], root: ParentNode = document): Element | null {
  for (const sel of candidates) {
    const el = root.querySelector(sel);
    if (el) return el;
  }
  return null;
}

export class TeamsDomWatcher implements PlatformDomWatcher {
  public readonly platformName = 'teams';
  private timer: ReturnType<typeof setInterval> | null = null;
  private onSegmentsCb?: (segments: TranscriptSegment[]) => void;
  private localUserName: string = '';

  constructor() {
    // Fetch local user name from storage
    chrome.storage.local.get(['localUserName'], (result) => {
      this.localUserName = result.localUserName || '';
    });
  }

  isCaptionsAvailable(): boolean {
    // If we find the container, great. Otherwise, check if any caption blocks exist directly on the body.
    return !!resolveSelector(TEAMS_SELECTORS.container) || !!resolveSelector(TEAMS_SELECTORS.captionBlock);
  }

  start(onSegments: (segments: TranscriptSegment[]) => void) {
    this.onSegmentsCb = onSegments;
    this.injectCssToHideNativeCaptions();
    
    // Attempt to automatically turn on captions
    this.turnOnCaptions();

    this.timer = setInterval(() => this.pollCaptions(), 300);
    console.log('[OxiqAI] DOM Scraper started – simple polling (Teams)');
    
    // Check if we have the username configured
    if (!this.localUserName) {
      console.warn('[OxiqAI] localUserName is not set in chrome.storage.local. All speech will default to remote.');
      // You could trigger a UI prompt here if desired.
    }
  }

  private async turnOnCaptions() {
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    
    try {
      console.log('[OxiqAI] Attempting to auto-enable Teams captions...');
      
      const moreBtn = resolveSelector(TEAMS_SELECTORS.moreButton) as HTMLElement;
      if (!moreBtn) {
        console.warn('[OxiqAI] Auto-enable failed: "More" button not found.');
        return;
      }
      
      const expandedBtn = resolveSelector(TEAMS_SELECTORS.moreButtonExpanded);
      if (!expandedBtn) {
        moreBtn.click();
        await delay(500);
      }
      
      const langMenu = resolveSelector(TEAMS_SELECTORS.languageMenu) as HTMLElement;
      if (!langMenu) {
        console.warn('[OxiqAI] Auto-enable failed: "Language and speech" menu not found.');
        // Clean up: close the More menu
        (resolveSelector(TEAMS_SELECTORS.moreButtonExpanded) as HTMLElement)?.click();
        return;
      }
      
      langMenu.click();
      await delay(500);
      
      const turnOnBtn = resolveSelector(TEAMS_SELECTORS.turnOnCaptionsBtn) as HTMLElement;
      if (turnOnBtn) {
        console.log('[OxiqAI] Clicking "Turn on live captions"...');
        turnOnBtn.click();
        await delay(500);
      } else {
        console.log('[OxiqAI] "Turn on live captions" not found. Captions may already be active.');
      }
      
      // Close the More menu if it's still open
      const finalExpandedBtn = resolveSelector(TEAMS_SELECTORS.moreButtonExpanded) as HTMLElement;
      if (finalExpandedBtn) {
        finalExpandedBtn.click();
      }
      
    } catch (e) {
      console.error('[OxiqAI] Error during auto-enable captions attempt:', e);
    }
  }

  private injectCssToHideNativeCaptions() {
    const styleId = 'oxiqai-hide-native-captions-teams';
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    // We must keep elements in the viewport so Teams doesn't pause the scraper.
    style.textContent = `
      [data-tid="closed-caption-v2-window-wrapper"],
      [data-tid="closed-captions-renderer"],
      [data-tid*="closed-caption-window"],
      [data-tid*="caption-container"],
      .___1xriypo, /* The specific black box wrapper identified via DevTools */
      .fui-ChatMessageCompact:has([data-tid="closed-caption-text"]) {
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
        border: none !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  private pollCaptions() {
    // We completely skip the container search because it's too brittle and causes false positives.
    // Instead, query all potential caption blocks across the entire DOM.
    const blockCandidates = Array.from(document.querySelectorAll(TEAMS_SELECTORS.captionBlock.join(', ')));
    if (blockCandidates.length === 0) return;

    const segments: TranscriptSegment[] = [];
    const seenTexts = new Set<string>();

    blockCandidates.forEach((block, idx) => {
      const authorEl = resolveSelector(TEAMS_SELECTORS.author, block);
      const textEl = resolveSelector(TEAMS_SELECTORS.text, block);

      if (!authorEl || !textEl) {
        return; // Probably a regular chat message, not a caption block.
      }

      const speaker = authorEl.textContent?.trim() || 'Speaker';
      const text = textEl.textContent?.trim() || '';

      if (!text) return;

      const isLocal = this.localUserName ? speaker.toLowerCase() === this.localUserName.toLowerCase() : false;
      const timestamp = Date.now();
      
      // Deduplication based on speaker + text
      const compositeKey = `${speaker}::${text}`;
      if (seenTexts.has(compositeKey)) {
        return;
      }
      
      seenTexts.add(compositeKey);
      
      // Prune Set to prevent memory leaks over long meetings
      if (seenTexts.size > 500) {
        const oldest = seenTexts.keys().next().value;
        if (oldest !== undefined) {
           seenTexts.delete(oldest);
        }
      }

      // Maintain stability ID
      let id = (block as HTMLElement).dataset.oxiqaiId;
      if (!id) {
        id = `seg_${Date.now()}_${idx}`;
        (block as HTMLElement).dataset.oxiqaiId = id;
      }

      segments.push({
        id,
        speaker,
        source: speaker,
        text,
        isLocal,
        timestamp,
        timestampMs: timestamp,
        isFinal: true
      });
    });

    if (segments.length > 0 && this.onSegmentsCb) {
      this.onSegmentsCb(segments);
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const style = document.getElementById('oxiqai-hide-native-captions-teams');
    if (style) style.remove();
    console.log('[OxiqAI] DOM Scraper stopped (Teams)');
  }
}
