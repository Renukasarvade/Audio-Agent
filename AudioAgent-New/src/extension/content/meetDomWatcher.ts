import { PlatformDomWatcher, TranscriptSegment } from '../../types/engine.ts';

export class MeetDomWatcher implements PlatformDomWatcher {
  public readonly platformName = 'meet';
  private timer: ReturnType<typeof setInterval> | null = null;
  private onChatCb?: (sender: string, text: string, timeMs: number) => void;
  private seenChats = new Set<string>();
  private onSegmentsCb?: (segments: TranscriptSegment[]) => void;
  private lastSeenText = '';
  private lastSpeaker = 'Speaker'; // fallback speaker when we cannot infer

  isCaptionsAvailable(): boolean {
    const container = document.querySelector('[role="region"][aria-label*="caption" i], [aria-label*="caption" i] [jsname="dsSSbb"]');
    return !!container;
  }

  start(onSegments: (segments: TranscriptSegment[]) => void, onChat?: (sender: string, text: string, timeMs: number) => void) {
    this.onChatCb = onChat;
    this.onSegmentsCb = onSegments;
    this.turnOnCaptions();
    this.injectCssToHideNativeCaptions();
    // Simple polling every 300 ms – reliable and easy to understand
    this.timer = setInterval(() => {
      this.pollCaptions();
      this.pollChats();
    }, 300);
    console.log('[OxiqAI] DOM Scraper started – simple polling (Meet)');
  }

  private pollCaptions() {
    // 1. Find the true caption container, avoiding any hardcoded class names that might match the Participant List or Chat.
    let container = document.querySelector('[role="region"][aria-label*="caption" i], [aria-label*="caption" i] [jsname="dsSSbb"]') as HTMLElement | null;
    
    if (!container) {
      // Fallback: Find the deepest container in the bottom half of the screen that contains a time string.
      const allDivs = Array.from(document.querySelectorAll('div'));
      const candidateDivs = allDivs.filter(div => {
        // Must contain a timestamp
        if (!/\b\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?\b/.test(div.innerText || '')) return false;
        // Skip body/html/large wrappers
        if (div.children.length > 10) return false;
        return true;
      });
      // Pick the most deeply nested one
      candidateDivs.sort((a, b) => {
        return (b.innerText || '').length - (a.innerText || '').length;
      });
      container = candidateDivs[candidateDivs.length - 1]; // Smallest enclosing div
    }

    if (!container) return;

    // The children of the container are the speaker rows.
    const speakerRows = Array.from(container.children).filter(child => (child as HTMLElement).innerText?.trim());
    if (speakerRows.length === 0) return;

    let fullText = '';
    const segments: TranscriptSegment[] = [];
    const seenTexts = new Set<string>();

    speakerRows.forEach((row, idx) => {
      // Use innerText to get the text exactly as visually rendered, separated by newlines for blocks.
      const rawText = (row as HTMLElement).innerText || '';
      
      // Clean out UI noise
      let cleanedText = rawText.replace(/format_size|Font size|circle|Font color settings|Font color|Open caption settings|settings|language|arrow_downward|jump to bottom|English|Spanish|French|German/gi, ' ');
      
      // Split by newline. Google Meet visually separates the header (Name + Time) from the Text with a newline.
      let lines = cleanedText.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length === 0) return;

      let speaker = this.lastSpeaker;
      let spoken = '';

      // Google Meet structures each row as:
      // Row (div) -> Child 1: Speaker Name (div), Child 2: Text (div)
      const children = Array.from(row.children).filter(child => {
        const text = (child as HTMLElement).innerText?.trim() || '';
        // Skip images, icons, and menus
        if (child.tagName === 'IMG' || text.includes('format_size') || text.includes('settings')) return false;
        return true;
      });

      if (children.length >= 2) {
        speaker = (children[0] as HTMLElement).innerText.trim();
        spoken = children.slice(1).map(c => (c as HTMLElement).innerText.trim()).join(' ');
      } else {
        // Fallback: split by newlines if flat
        const rawText = (row as HTMLElement).innerText || '';
        let cleanedText = rawText.replace(/format_size|Font size|circle|Font color settings|Font color|Open caption settings|settings|language|arrow_downward|jump to bottom/gi, ' ');
        let lines = cleanedText.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length > 0) {
          if (lines.length > 1) {
            speaker = lines[0];
            spoken = lines.slice(1).join(' ');
          } else {
            spoken = lines[0];
          }
        }
      }

      // Settings menu check
      if (
        spoken.includes('Huge Jumbo') || 
        spoken.includes('Cyan Magenta') ||
        spoken.includes('BETA Polish') ||
        spoken.includes('Language settings')
      ) {
        return;
      }

      spoken = spoken.replace(/\s+/g, ' ').trim();
      if (!spoken) return;

      // Prevent exact duplicates in the same polling cycle
      if (seenTexts.has(spoken)) return;
      seenTexts.add(spoken);

      // Ensure each block gets a stable ID for de‑duplication.
      let id = (row as HTMLElement).dataset.oxiqaiId;
      if (!id) {
        id = `seg_${Date.now()}_${idx}`;
        (row as HTMLElement).dataset.oxiqaiId = id;
      }

      const finalSpeaker = speaker || 'Speaker';
      const isLocal = finalSpeaker.toLowerCase() === 'you';

      fullText += spoken + ' ';
      segments.push({
        id,
        text: spoken,
        speaker: finalSpeaker,
        source: finalSpeaker,
        isLocal: isLocal,
        timestampMs: Date.now(),
        timestamp: Date.now(),
        isFinal: true,
      });
    });

    // Emit only when there is new content.
    if (fullText.trim() && fullText !== this.lastSeenText && this.onSegmentsCb) {
      this.lastSeenText = fullText;
      this.onSegmentsCb(segments);
    }
  }

  
  private pollChats() {
    if (!this.onChatCb) return;

    // 1. Ensure the native chat panel is open so messages exist in the DOM
    const chatInput = document.querySelector('textarea[name="chatTextInput"], textarea[aria-label*="Send a message" i]');
    if (!chatInput) {
        const chatBtn = document.querySelector('button[aria-label*="chat" i]:not([disabled]), [data-tooltip*="chat" i]:not([disabled])') as HTMLElement;
        const isPressed = chatBtn?.getAttribute('aria-pressed') === 'true';
        if (chatBtn && !isPressed) {
            chatBtn.click();
        }
        return; // wait for next tick for it to open
    }
    
    // 2. Find all messages in the DOM
    const msgs = Array.from(document.querySelectorAll('[data-message-id]'));
    
    msgs.forEach(msg => {
       const id = msg.getAttribute('data-message-id') || '';
       if (!id || this.seenChats.has(id)) return;
       
       let sender = 'Unknown';
       
       // Walk up to find the group container which holds the sender name
       let parent = msg.parentElement;
       while (parent && parent !== document.body) {
           if (parent.hasAttribute('data-sender-id')) {
               const nameEl = parent.querySelector('[data-sender-name]');
               if (nameEl) sender = (nameEl as HTMLElement).innerText.trim();
               else {
                   const headerLines = (parent as HTMLElement).innerText.split('\n').map(l=>l.trim()).filter(Boolean);
                   if (headerLines.length > 0) sender = headerLines[0];
               }
               break;
           }
           
           // Fallback: look for a structural header (Sender Name then Time)
           const lines = (parent as HTMLElement).innerText.split('\n').map(l=>l.trim()).filter(Boolean);
           const timeIndex = lines.findIndex(l => /^\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?$/i.test(l));
           if (timeIndex === 1 || timeIndex === 2) {
               sender = lines[0];
               break;
           }
           parent = parent.parentElement;
       }
       
       // Clean up UI noise from the message container
       const clone = msg.cloneNode(true) as HTMLElement;
       clone.querySelectorAll('button, [role="button"], [data-tooltip], [jsaction], [jsname="x10s0b"]').forEach(el => el.remove());
       
       let text = clone.innerText.trim();
       text = text.replace(/Pin message|Keep/gi, '').trim();
       
       if (sender.toLowerCase() !== 'you' && sender.toLowerCase() !== 'me' && !sender.includes('Messages will not be saved') && sender !== 'Unknown') {
           this.seenChats.add(id);
           this.onChatCb(sender, text, Date.now());
       } else {
           // Still mark our own messages (or unknown/system messages) as seen
           this.seenChats.add(id);
       }
    });
  }

  private removeBackgroundFromParents(blocks: Element[]) {
    blocks.forEach(block => {
      let parent = block.parentElement;
      let depth = 0;
      // Walk up 6 levels to ensure we hit the background wrapper
      while (parent && depth < 6) {
        // Strip background colors and borders
        parent.style.setProperty('background', 'transparent', 'important');
        parent.style.setProperty('background-color', 'transparent', 'important');
        parent.style.setProperty('box-shadow', 'none', 'important');
        parent.style.setProperty('border', 'none', 'important');
        parent = parent.parentElement;
        depth++;
      }
    });
  }

  private turnOnCaptions() {
    const buttons = document.querySelectorAll('button');
    for (const b of Array.from(buttons)) {
      const aria = (b as HTMLElement).getAttribute('aria-label')?.toLowerCase() || '';
      const tooltip = (b as HTMLElement).getAttribute('data-tooltip')?.toLowerCase() || '';
      if (
        (aria.includes('turn on captions') || tooltip.includes('turn on captions') || aria.includes('captions') || tooltip.includes('captions')) &&
        !aria.includes('turn off') &&
        !tooltip.includes('turn off')
      ) {
        console.log('[OxiqAI] Automatically turning on Google Meet Captions...');
        (b as HTMLElement).click();
        return;
      }
    }
    console.warn('[OxiqAI] Captions toggle button not found – please enable captions manually (or press "c").');
  }

  private injectCssToHideNativeCaptions() {
    const styleId = 'oxiqai-hide-native-captions';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      // We must keep elements in the viewport so Google Meet's IntersectionObserver doesn't pause the scraper.
      // But we must ALSO remove them from the document flow so they don't shrink the video grid (the "empty black space" bug).
      // Solution: position: fixed, 1x1 pixel, opacity: 0.001.
      style.textContent = `
        .a4cQT, .iOzk7, [jsname="dsSSbb"], .MZy1T, .cXy5B, .U6Acd, .KjWwNd, div[jscontroller="eG0sNb"], div[jscontroller="lY7Rme"], div[jsname="j9hZne"] {
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
      `;
      document.head.appendChild(style);
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.lastSeenText = '';
    const style = document.getElementById('oxiqai-hide-native-captions');
    if (style) style.remove();
    console.log('[OxiqAI] DOM Scraper stopped');
  }
}
