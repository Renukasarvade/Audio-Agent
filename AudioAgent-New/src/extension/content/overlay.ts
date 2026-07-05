import { TranscriptSegment } from '../../types/engine.ts';
import { saveChatMessage, uploadFileToSupabase, fetchChatMessages, fetchFiles } from '../supabaseClient.ts';

const icons = {'Download': '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>', 'Users': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', 'Wifi': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>', 'Upload': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>', 'Paperclip': '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>', 'FileText': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>', 'Image': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>', 'Video': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>', 'VideoOff': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>', 'Mic': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>', 'MicOff': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>', 'PhoneOff': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="23" y1="1" x2="1" y2="23"/></svg>', 'MessageSquare': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', 'Send': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>', 'X': '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>', 'ChevronRight': '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'};

export class OverlayUI {
  private container: HTMLDivElement;
  private shadow: ShadowRoot;
  private transcriptContainer: HTMLDivElement | null = null;
  private chatContainer: HTMLDivElement | null = null;
  private fileInput: HTMLInputElement | null = null;
  private meetingId: string = '';

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'oxiqai-overlay-root';
    
    // Position fixed to overlay on top of Meet COMPLETELY
    this.container.style.position = 'fixed';
    this.container.style.inset = '0';
    this.container.style.zIndex = '999999';
    this.container.style.width = '100vw';
    this.container.style.height = '100vh';
    this.container.style.overflow = 'hidden';

    // Create Shadow DOM to isolate styles
    this.shadow = this.container.attachShadow({ mode: 'open' });
  }

  public setMeetingId(id: string) {
    this.meetingId = id;
  }

  mount() {
    if (!document.getElementById('oxiqai-overlay-root')) {
      document.body.appendChild(this.container);
      this.render();
    }
  }

  unmount() {
    this.container.remove();
  }

  private render() {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      :host {
        font-family: 'Inter', system-ui, sans-serif;
        user-select: none;
        --color-blue-400: #60a5fa;
        --color-blue-500: #3b82f6;
        --color-blue-600: #2563eb;
        --color-blue-700: #1d4ed8;
        --color-blue-800: #1e40af;
        --color-blue-900: #1e3a8a;
        --color-red-400: #f87171;
        --color-red-500: #ef4444;
      }
      
      .wrapper {
        position: relative;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 20%, #a5f3fc 45%, #bfdbfe 70%, #c7d2fe 100%);
        overflow: hidden;
      }
      
      .ambient-blob {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
      }
      .blob-1 { top: -128px; left: -128px; width: 500px; height: 500px; opacity: 0.4; filter: blur(64px); background: radial-gradient(circle, #60a5fa, transparent 70%); }
      .blob-2 { bottom: -96px; right: -96px; width: 400px; height: 400px; opacity: 0.3; filter: blur(64px); background: radial-gradient(circle, #818cf8, transparent 70%); }
      .blob-3 { top: 50%; left: 50%; transform: translate(-50%, -50%); width: 600px; height: 300px; opacity: 0.2; filter: blur(64px); background: radial-gradient(ellipse, #38bdf8, transparent 70%); }
      
      .glass {
        backdrop-filter: blur(40px);
        -webkit-backdrop-filter: blur(40px);
        background: rgba(255, 255, 255, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.4);
        box-shadow: 0 8px 32px rgba(59,130,246,0.12), inset 0 1px 0 rgba(255,255,255,0.6);
      }
      
      .glass-dark {
        backdrop-filter: blur(40px);
        -webkit-backdrop-filter: blur(40px);
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 8px 32px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.4);
      }
      
      .panel-radius {
        border-radius: 28px;
      }
      
      /* Top Bar */
      header {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        z-index: 20;
        margin: 12px 16px;
        padding: 12px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      /* Main Grid */
      main {
        position: absolute;
        inset: 0;
        padding-top: 92px;
        padding-bottom: 88px;
        padding-left: 16px;
        padding-right: 16px;
        display: flex;
        gap: 12px;
      }
      
      .left-panel, .right-panel {
        display: flex;
        flex-direction: column;
        width: 22%;
        min-width: 200px;
        overflow: hidden;
      }
      
      .center-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .upload-zone {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: all 0.2s;
      }
      .upload-zone.dragging {
        transform: scale(1.01);
        box-shadow: 0 0 0 2px rgba(96,165,250,0.7);
      }
      
      .meet-placeholder {
        padding: 12px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      /* Bottom Bar */
      footer {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 20;
        margin: 0 16px 12px 16px;
        padding: 10px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      /* Typography & Helpers */
      .font-semibold { font-weight: 600; }
      .font-bold { font-weight: 700; }
      .text-xs { font-size: 12px; }
      .text-sm { font-size: 14px; }
      
      .flex { display: flex; }
      .items-center { align-items: center; }
      .justify-between { justify-content: space-between; }
      .justify-center { justify-content: center; }
      .flex-col { flex-direction: column; }
      .gap-1 { gap: 4px; }
      .gap-2 { gap: 8px; }
      .gap-3 { gap: 12px; }
      .gap-4 { gap: 16px; }
      
      .pill {
        background: rgba(255,255,255,0.3);
        border: 1px solid rgba(255,255,255,0.5);
        padding: 6px 12px;
        border-radius: 999px;
      }
      
      .scroll-container {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
      }
      .scroll-container::-webkit-scrollbar { width: 6px; }
      .scroll-container::-webkit-scrollbar-track { background: transparent; }
      .scroll-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 4px; }
      
      .btn {
        cursor: pointer;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      .btn:active {
        transform: scale(0.92);
      }
      .btn-primary {
        background: rgba(59,130,246,0.8);
        color: white;
        border-radius: 12px;
        padding: 6px 12px;
        box-shadow: 0 2px 8px rgba(59,130,246,0.4);
      }
      .btn-primary:hover { background: rgba(37,99,235,0.8); }
      
      .btn-leave {
        background: rgba(239,68,68,0.8);
        color: white;
        border: 1px solid rgba(252,165,165,0.3);
        border-radius: 16px;
        padding: 8px 16px;
        box-shadow: 0 4px 16px rgba(239,68,68,0.35);
      }
      .btn-leave:hover { background: rgba(220,38,38,0.8); }
      
      .btn-icon {
        width: 36px;
        height: 36px;
        border-radius: 16px;
        background: rgba(255,255,255,0.3);
        border: 1px solid rgba(255,255,255,0.4);
        color: var(--color-blue-700);
      }
      .btn-icon:hover { background: rgba(255,255,255,0.45); }
      .btn-icon.off {
        background: rgba(248,113,113,0.7);
        border-color: rgba(252,165,165,0.4);
        color: white;
      }
      
      /* Transcripts */
      .segment-wrapper { margin-bottom: 12px; }
      .segment-header { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
      .segment-speaker { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }
      .segment-time { font-size: 9px; color: rgba(29,78,216,0.4); }
      .segment-text { font-size: 12px; color: rgba(30,58,138,0.7); line-height: 1.5; }
      
      /* Chat */
      .chat-msg-wrapper { display: flex; flex-direction: column; margin-bottom: 12px; }
      .chat-msg-wrapper.me { align-items: flex-end; }
      .chat-msg-wrapper.other { align-items: flex-start; }
      .chat-speaker { font-size: 10px; font-weight: 700; color: rgba(29,78,216,0.6); margin-bottom: 2px; margin-left: 4px; }
      .chat-bubble {
        max-width: 85%;
        padding: 8px 12px;
        border-radius: 16px;
        font-size: 12px;
        line-height: 1.5;
      }
      .chat-msg-wrapper.me .chat-bubble {
        background: rgba(59,130,246,0.7);
        color: white;
        border-bottom-right-radius: 4px;
        border: 1px solid rgba(96,165,250,0.3);
      }
      .chat-msg-wrapper.other .chat-bubble {
        background: rgba(255,255,255,0.35);
        color: rgba(30,58,138,0.8);
        border-bottom-left-radius: 4px;
        border: 1px solid rgba(255,255,255,0.4);
      }
      .chat-time { font-size: 9px; color: rgba(29,78,216,0.4); margin-top: 2px; margin-left: 4px; margin-right: 4px; }
      
      .chat-input-wrapper {
        padding: 12px;
        border-top: 1px solid rgba(255,255,255,0.2);
      }
      .chat-input-box {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255,255,255,0.3);
        border: 1px solid rgba(255,255,255,0.4);
        border-radius: 16px;
        padding: 8px 12px;
      }
      .chat-input-box input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        font-size: 12px;
        color: rgba(30,58,138,0.8);
      }
      .chat-input-box input::placeholder { color: rgba(37,99,235,0.4); }
      
      .chat-send-btn {
        width: 28px;
        height: 28px;
        border-radius: 12px;
        background: rgba(59,130,246,0.8);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border: none;
      }
      .chat-send-btn:disabled { opacity: 0.4; cursor: default; }
    `;
    
    this.shadow.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.className = 'wrapper';
    wrapper.innerHTML = `
      <div class="ambient-blob blob-1"></div>
      <div class="ambient-blob blob-2"></div>
      <div class="ambient-blob blob-3"></div>
      
      <header class="glass panel-radius">
        <div class="flex items-center gap-2 pill">
          <span style="width:8px;height:8px;border-radius:50%;background:#34d399;"></span>
          <span id="meeting-timer" class="text-xs font-semibold" style="color:rgba(30,58,138,0.7)">Live • 00:00:00</span>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-sm font-bold" style="color:var(--color-blue-900)">OxiqAI</span>
          <span style="font-size:10px;font-weight:500;letter-spacing:1px;color:rgba(29,78,216,0.6);text-transform:uppercase;">Meeting Assistant</span>
        </div>
        <div class="flex items-center gap-3">
          <span style="color:rgba(30,58,138,0.6)">${icons.Users}</span>
          <span id="participant-count" class="text-xs font-semibold" style="color:rgba(30,58,138,0.6)">Loading participants...</span>
        </div>
      </header>
      
      <main>
        <section class="left-panel glass-dark panel-radius" style="position: relative;">
          <div class="flex items-center gap-2" style="padding:16px 16px 12px;border-bottom:1px solid rgba(255,255,255,0.2);">
            <div style="width:8px;height:8px;border-radius:50%;background:#f87171;"></div>
            <span class="text-sm font-semibold" style="color:rgba(30,58,138,0.8)">Live Transcript</span>
          </div>
          <div class="scroll-container" id="transcript-list">
             <!-- Transcripts go here -->
          </div>
          <button id="btn-download-txt" class="btn btn-primary" style="position: absolute; bottom: 12px; right: 12px; padding: 6px 10px; font-size: 11px; gap: 4px;">
            ${icons.Download} Download .txt
          </button>
        </section>
        
        <section class="center-panel">
          <div class="upload-zone glass panel-radius" id="upload-zone">
            <div class="flex items-center justify-between" style="padding:16px 20px 12px;border-bottom:1px solid rgba(255,255,255,0.25);">
              <div class="flex items-center gap-2">
                <span style="color:rgba(37,99,235,0.7)">${icons.Upload}</span>
                <span class="text-sm font-semibold" style="color:rgba(30,58,138,0.8)">Files & Resources</span>
              </div>
              <button class="btn btn-primary text-xs font-semibold gap-1" id="btn-attach">
                ${icons.Paperclip} Attach
              </button>
              <input type="file" id="file-input" multiple style="display:none;" />
            </div>
            
            <div class="flex flex-col items-center justify-center gap-4" style="flex:1;padding:24px 32px;" id="upload-empty">
              <div class="glass flex items-center justify-center" style="width:80px;height:80px;border-radius:24px;box-shadow:0 4px 24px rgba(59,130,246,0.18);">
                <span style="color:rgba(59,130,246,0.7);transform:scale(2);">${icons.Upload}</span>
              </div>
              <div class="flex flex-col items-center gap-1">
                <p class="text-sm font-semibold" style="color:rgba(30,58,138,0.7);margin:0;">Drop files here</p>
                <p class="text-xs" style="color:rgba(29,78,216,0.5);margin:0;">Share images, docs, links — anything your team needs</p>
              </div>
              <div class="flex gap-3" style="margin-top:4px;">
                <button class="btn glass flex items-center gap-1 panel-radius" style="padding:8px 16px;color:rgba(30,58,138,0.7);font-size:12px;font-weight:600;" id="btn-up-img">
                  ${icons.Image} Image
                </button>
                <button class="btn glass flex items-center gap-1 panel-radius" style="padding:8px 16px;color:rgba(30,58,138,0.7);font-size:12px;font-weight:600;" id="btn-up-doc">
                  ${icons.FileText} Document
                </button>
                <button class="btn glass flex items-center gap-1 panel-radius" style="padding:8px 16px;color:rgba(30,58,138,0.7);font-size:12px;font-weight:600;" id="btn-up-any">
                  ${icons.Paperclip} Any file
                </button>
              </div>
            </div>
            <div id="upload-list" class="scroll-container" style="display:none;align-content:start;gap:12px;padding:16px;"></div>
          </div>
          
          <div class="meet-placeholder glass panel-radius">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center" style="width:40px;height:40px;border-radius:16px;background:linear-gradient(to bottom right, rgba(96,165,250,0.6), rgba(99,102,241,0.6));border:1px solid rgba(255,255,255,0.4);color:white;">
                ${icons.Video}
              </div>
              <div>
                <p class="text-xs font-semibold" style="color:rgba(30,58,138,0.8);margin:0;">Google Meet</p>
                <p style="font-size:10px;color:rgba(29,78,216,0.5);margin:0;">Live • Active Session</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn btn-icon" id="btn-mic">${icons.Mic}</button>
              <button class="btn btn-icon" id="btn-cam">${icons.Video}</button>
              <button class="btn btn-leave" id="btn-leave" style="margin-left:4px;">
                ${icons.PhoneOff} Leave
              </button>
            </div>
          </div>
        </section>
        
        <section class="right-panel glass-dark panel-radius">
          <div class="flex items-center gap-2" style="padding:16px 16px 12px;border-bottom:1px solid rgba(255,255,255,0.2);">
            <span style="color:rgba(37,99,235,0.7)">${icons.MessageSquare}</span>
            <span class="text-sm font-semibold" style="color:rgba(30,58,138,0.8)">Chat Room</span>
          </div>
          <div class="scroll-container" id="chat-list">
             <!-- Chats go here -->
          </div>
          <div class="chat-input-wrapper">
            <div class="chat-input-box">
              <input type="text" id="chat-input" placeholder="Message..." />
              <button class="chat-send-btn" id="btn-send" disabled>${icons.Send}</button>
            </div>
          </div>
        </section>
      </main>
      
      <footer class="glass panel-radius">
        <p class="text-xs font-semibold" style="color:rgba(30,58,138,0.5);margin:0;">Powered by <span style="color:rgba(37,99,235,0.7)">OxiqAI</span></p>
      </footer>
    `;

    this.shadow.appendChild(wrapper);

    this.transcriptContainer = this.shadow.getElementById('transcript-list') as HTMLDivElement;
    this.chatContainer = this.shadow.getElementById('chat-list') as HTMLDivElement;
    
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Try to open native chat first so we can scrape it
    const chatBtn = document.querySelector('button[aria-label*="chat" i], [data-tooltip*="chat" i]') as HTMLElement;
    if (chatBtn) chatBtn.click();

    let micOn: boolean | null = null;
    let camOn: boolean | null = null;
    let micSyncBlockedUntil = 0;
    let camSyncBlockedUntil = 0;

    const getRealMic = () => {
        let el = document.querySelector('button[data-is-muted][aria-label*="micro" i], button[data-is-muted][data-tooltip*="micro" i]') as HTMLElement;
        if (!el) {
            const btns = Array.from(document.querySelectorAll('button[aria-label*="micro" i], [role="button"][aria-label*="micro" i], [data-tooltip*="micro" i]'));
            el = btns.find(b => {
                const aria = (b.getAttribute('aria-label') || b.getAttribute('data-tooltip') || '').toLowerCase();
                return aria.includes('turn') || aria.includes('ctrl') || aria.includes('⌘') || aria.includes('activer') || aria.includes('desactiv');
            }) as HTMLElement || btns[0] as HTMLElement;
        }
        return el;
    };

    const getRealCam = () => {
        let el = document.querySelector('button[data-is-muted][aria-label*="camera" i], button[data-is-muted][data-tooltip*="camera" i]') as HTMLElement;
        if (!el) {
            const btns = Array.from(document.querySelectorAll('button[aria-label*="camera" i], [role="button"][aria-label*="camera" i], [data-tooltip*="camera" i]'));
            el = btns.find(b => {
                const aria = (b.getAttribute('aria-label') || b.getAttribute('data-tooltip') || '').toLowerCase();
                return aria.includes('turn') || aria.includes('ctrl') || aria.includes('⌘') || aria.includes('activer') || aria.includes('desactiv');
            }) as HTMLElement || btns[0] as HTMLElement;
        }
        return el;
    };

    // Timer Logic & Sync & Participant Count
    const timerEl = this.shadow.getElementById('meeting-timer') as HTMLSpanElement;
    const participantEl = this.shadow.getElementById('participant-count') as HTMLSpanElement;
    
    if (timerEl) {
      const startTime = Date.now();
      
      const syncState = () => {
         // Timer
         const diff = Math.floor((Date.now() - startTime) / 1000);
         const h = Math.floor(diff / 3600);
         const m = Math.floor((diff % 3600) / 60);
         const s = diff % 60;
         timerEl.innerText = `Live • ${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
         
         const now = Date.now();
         
         // Sync Mic
         const realMic = getRealMic();
         const btnMic = this.shadow.getElementById('btn-mic') as HTMLButtonElement;
         if (realMic && btnMic && now > micSyncBlockedUntil) {
             const aria = (realMic.getAttribute('aria-label') || realMic.getAttribute('data-tooltip') || '').toLowerCase();
             const isActuallyOn = aria.includes('turn off');
             if (micOn !== isActuallyOn) {
                 micOn = isActuallyOn;
                 btnMic.classList.toggle('off', !micOn);
                 btnMic.innerHTML = micOn ? `${icons['Mic']}` : `${icons['MicOff']}`;
             }
         }
         
         // Sync Cam
         const realCam = getRealCam();
         const btnCam = this.shadow.getElementById('btn-cam') as HTMLButtonElement;
         if (realCam && btnCam && now > camSyncBlockedUntil) {
             const aria = (realCam.getAttribute('aria-label') || realCam.getAttribute('data-tooltip') || '').toLowerCase();
             const isActuallyOn = aria.includes('turn off');
             if (camOn !== isActuallyOn) {
                 camOn = isActuallyOn;
                 btnCam.classList.toggle('off', !camOn);
                 btnCam.innerHTML = camOn ? `${icons['Video']}` : `${icons['VideoOff']}`;
             }
         }
         
         // Participant count scraper
         let pCount = '';
         
         // 1. Primary: Look at all buttons for aria-labels or text containing the number
         const btns = document.querySelectorAll('button, [role="button"]');
         for (let i = 0; i < btns.length; i++) {
             const el = btns[i] as HTMLElement;
             const aria = (el.getAttribute('aria-label') || el.getAttribute('data-tooltip') || '').toLowerCase();
             
             // If the label explicitly has a number in parens, e.g. "Show everyone (3)"
             const ariaMatch = aria.match(/\\((\\d+)\\)/);
             if (ariaMatch) {
                 pCount = ariaMatch[1];
                 break;
             }
             
             // If the button is related to people/participants
             if (/everyone|participant|people|personas|pessoas|personnes|personen/i.test(aria)) {
                 const txt = el.textContent?.trim() || '';
                 const match = txt.match(/\\d+/);
                 if (match) {
                     pCount = match[0];
                     break;
                 }
                 // Or check its parent container (often the badge is a sibling)
                 if (el.parentElement) {
                     const pTxt = el.parentElement.textContent?.replace(/\\s/g, '') || '';
                     const pMatch = pTxt.match(/\\d+/);
                     if (pMatch) {
                         pCount = pMatch[0];
                         break;
                     }
                 }
             }
         }

         // 2. Fallback: Check known dynamic classes if button scan failed
         if (!pCount) {
             const els = document.querySelectorAll('.uGOf1d, .Yi3Cfd .eU809d, .KieQAe .eU809d, [data-participant-count], .MKVSQd');
             for (let i = 0; i < els.length; i++) {
                 // Only check visible elements if possible
                 const el = els[i] as HTMLElement;
                 if (el.offsetParent !== null || el.textContent) {
                     const txt = el.textContent?.trim() || '';
                     const digits = txt.replace(/\\D/g, '');
                     if (digits.length > 0 && digits.length === txt.replace(/\\s/g, '').length) {
                         pCount = digits;
                         break;
                     }
                 }
             }
         }

         // Fallback 2: Heuristically find any small number badge next to an SVG
         if (!pCount) {
             const leafs = document.querySelectorAll('div, span');
             for (let i = 0; i < leafs.length; i++) {
                 const el = leafs[i] as HTMLElement;
                 if (el.children.length === 0) {
                     const txt = el.textContent?.trim() || '';
                     const digits = txt.replace(/\\D/g, '');
                     if (digits.length > 0 && digits.length === txt.replace(/\\s/g, '').length) {
                         const num = parseInt(digits, 10);
                         if (num > 0 && num < 1000 && el.parentElement?.querySelector('svg')) {
                             pCount = digits;
                             // We don't break here, we just hope it's a good guess. 
                             // But actually let's break if we find one that's near the bottom toolbar
                             const rect = el.getBoundingClientRect();
                             if (rect.bottom > window.innerHeight - 100) {
                                 break;
                             }
                         }
                     }
                 }
             }
         }
         if (pCount && participantEl) {
             participantEl.innerText = `${pCount} participants`;
         }
      };
      
      syncState();
      setInterval(syncState, 1000);

      // Start polling for chat messages and files from Supabase
      let lastChatCount = 0;
      let lastFileCount = 0;

      const pollSupabase = async () => {
         if (!this.meetingId) return;

         try {
             // 1. Poll Chat
             const chats = await fetchChatMessages(this.meetingId);
             if (chats && chats.length !== lastChatCount) {
                 this.chatContainer!.innerHTML = '';
                 chats.forEach(c => {
                     this.addChatMessage(c.sender_name, c.message, new Date(c.created_at));
                 });
                 lastChatCount = chats.length;
             }

             // 2. Poll Files
             const files = await fetchFiles(this.meetingId);
             if (files && files.length !== lastFileCount) {
                 const uploadZone = this.shadow.getElementById('upload-zone') as HTMLDivElement;
                 const uploadEmpty = this.shadow.getElementById('upload-empty') as HTMLDivElement;
                 const uploadList = this.shadow.getElementById('upload-list') as HTMLDivElement;

                 if (uploadEmpty) uploadEmpty.style.display = 'none';
                 if (uploadList) {
                     uploadList.innerHTML = '';
                     files.forEach(f => {
                         const fileEl = document.createElement('div');
                         fileEl.className = 'glass flex items-center gap-3 panel-radius';
                         fileEl.style.padding = '12px';
                         const isImage = f.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                         fileEl.innerHTML = `
                           <div style="width:40px;height:40px;border-radius:12px;background:rgba(219,234,254,0.6);display:flex;align-items:center;justify-content:center;color:var(--color-blue-500)">
                             ${isImage ? icons.Image : icons.FileText}
                           </div>
                           <div style="flex:1;min-width:0;">
                             <p class="text-xs font-semibold" style="color:var(--color-blue-900);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${f.file_name}</p>
                             <p style="font-size:10px;color:#10b981;margin:0;">${f.file_size} • ${f.uploader_name}</p>
                           </div>
                         `;
                         uploadList.appendChild(fileEl);
                     });
                 }
                 lastFileCount = files.length;
             }
         } catch (err) {
             console.error('[AudioAgent] Polling Supabase exception:', err);
         }
      };

      setInterval(pollSupabase, 3000);
      pollSupabase();
    }

    // Chat Logic
    const chatInput = this.shadow.getElementById('chat-input') as HTMLInputElement;
    const btnSend = this.shadow.getElementById('btn-send') as HTMLButtonElement;

    const handleSend = async () => {
      const text = chatInput.value.trim();
      if (!text) return;
      chatInput.value = '';
      btnSend.disabled = true;

      // Render locally instantly
      this.addChatMessage('You', text, new Date());
      if (this.meetingId) await saveChatMessage(this.meetingId, 'You', text);

      // Inject into native Google Meet chat using execCommand
      const nativeChatInput = document.querySelector('textarea[aria-label*="Send a message" i], textarea[aria-label*="chat" i], textarea[name="chatTextInput"]') as HTMLTextAreaElement;
      if (nativeChatInput) {
         nativeChatInput.focus();
         document.execCommand('insertText', false, text);
         
         // find the send button next to it
         const nativeSendBtn = document.querySelector('button[aria-label*="Send" i], [data-tooltip*="Send message" i]') as HTMLButtonElement;
         setTimeout(() => {
            if (nativeSendBtn && !nativeSendBtn.disabled) {
               nativeSendBtn.click();
            } else {
               nativeChatInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
            }
         }, 150);
      }
    };

    chatInput.addEventListener('input', () => {
      btnSend.disabled = chatInput.value.trim().length === 0;
    });
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend();
    });
    btnSend.addEventListener('click', handleSend);

    // Meet Controls mapping
    const btnMic = this.shadow.getElementById('btn-mic') as HTMLButtonElement;
    btnMic.addEventListener('click', () => {
       const realMic = getRealMic();
       if (realMic) {
           realMic.click();
           micOn = !micOn; // optimistic update
           btnMic.classList.toggle('off', !micOn);
           btnMic.innerHTML = micOn ? `${icons['Mic']}` : `${icons['MicOff']}`;
           micSyncBlockedUntil = Date.now() + 1000;
       }
    });

    const btnCam = this.shadow.getElementById('btn-cam') as HTMLButtonElement;
    btnCam.addEventListener('click', () => {
       const realCam = getRealCam();
       if (realCam) {
           realCam.click();
           camOn = !camOn; // optimistic update
           btnCam.classList.toggle('off', !camOn);
           btnCam.innerHTML = camOn ? `${icons['Video']}` : `${icons['VideoOff']}`;
           camSyncBlockedUntil = Date.now() + 1000;
       }
    });

    const btnLeave = this.shadow.getElementById('btn-leave') as HTMLButtonElement;
    btnLeave.addEventListener('click', async () => {
       // Upload transcript to Supabase
       const transcriptList = this.shadow.getElementById('transcript-list');
       if (transcriptList && this.meetingId) {
           let text = '';
           const segments = transcriptList.querySelectorAll('.segment-wrapper');
           segments.forEach(seg => {
              const speaker = seg.querySelector('.segment-speaker')?.textContent || 'Unknown';
              const time = seg.querySelector('.segment-time')?.textContent || '';
              const msg = seg.querySelector('.segment-text')?.textContent || '';
              text += `[${time}] ${speaker}: ${msg}\n\n`;
           });
           if (!text) text = transcriptList.innerText;
           
           if (text && text.trim().length > 0) {
               const blob = new Blob([text], { type: 'text/plain' });
               const transcriptName = `Meeting_Transcript_${new Date().toISOString().slice(0,10)}.txt`;
                await uploadFileToSupabase(blob, this.meetingId, 'System', transcriptName);
           }
       }
       
       const realLeave = document.querySelector('button[aria-label*="leave call" i], [role="button"][aria-label*="leave call" i], [data-tooltip*="leave call" i]') as HTMLElement;
       if (realLeave) realLeave.click();
       window.dispatchEvent(new CustomEvent('OXIQ_STOP_ENGINE'));
    });

    const btnDownload = this.shadow.getElementById('btn-download-txt') as HTMLButtonElement;
    if (btnDownload) {
      btnDownload.addEventListener('click', () => {
         const transcriptList = this.shadow.getElementById('transcript-list');
         if (!transcriptList) return;
         
         // Extract text smartly
         let text = '';
         const segments = transcriptList.querySelectorAll('.segment-wrapper');
         segments.forEach(seg => {
            const speaker = seg.querySelector('.segment-speaker')?.textContent || 'Unknown';
            const time = seg.querySelector('.segment-time')?.textContent || '';
            const msg = seg.querySelector('.segment-text')?.textContent || '';
            text += `[${time}] ${speaker}: ${msg}\n\n`;
         });
         
         if (!text) {
             text = transcriptList.innerText || 'No transcripts found.';
         }
         
         const blob = new Blob([text], { type: 'text/plain' });
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `Meeting_Transcript_${new Date().toISOString().slice(0,10)}.txt`;
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
         URL.revokeObjectURL(url);
      });
    }

    // File Upload Logic
    const uploadZone = this.shadow.getElementById('upload-zone') as HTMLDivElement;
    const fileInput = this.shadow.getElementById('file-input') as HTMLInputElement;
    const btnAttach = this.shadow.getElementById('btn-attach') as HTMLButtonElement;
    const uploadEmpty = this.shadow.getElementById('upload-empty') as HTMLDivElement;
    const uploadList = this.shadow.getElementById('upload-list') as HTMLDivElement;
    
    this.fileInput = fileInput;

    btnAttach.addEventListener('click', () => fileInput.click());

    const btnUpImg = this.shadow.getElementById('btn-up-img') as HTMLButtonElement;
    const btnUpDoc = this.shadow.getElementById('btn-up-doc') as HTMLButtonElement;
    const btnUpAny = this.shadow.getElementById('btn-up-any') as HTMLButtonElement;
    
    [btnUpImg, btnUpDoc, btnUpAny, uploadEmpty].forEach(el => {
       if(el) {
           el.addEventListener('click', (e) => {
               e.stopPropagation();
               fileInput.click();
           });
       }
    });

    const handleFiles = async (files: FileList) => {
       if (files.length === 0) return;
       uploadEmpty.style.display = 'none';
       uploadList.style.display = 'flex';
       uploadList.style.flexDirection = 'column';

       for (let i = 0; i < files.length; i++) {
         const file = files[i];
         const isImage = file.type.startsWith('image/');
         
         const fileEl = document.createElement('div');
         fileEl.className = 'glass flex items-center gap-3 panel-radius';
         fileEl.style.padding = '12px';
         
         const size = file.size > 1024*1024 ? (file.size/1024/1024).toFixed(1) + ' MB' : Math.round(file.size/1024) + ' KB';
         fileEl.innerHTML = `
           <div style="width:40px;height:40px;border-radius:12px;background:rgba(219,234,254,0.6);display:flex;align-items:center;justify-content:center;color:var(--color-blue-500)">
             ${isImage ? icons.Image : icons.FileText}
           </div>
           <div style="flex:1;min-width:0;">
             <p class="text-xs font-semibold" style="color:var(--color-blue-900);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${file.name}</p>
             <p style="font-size:10px;color:rgba(29,78,216,0.5);margin:0;">${size} • Uploading...</p>
           </div>
         `;
         uploadList.appendChild(fileEl);

         // Upload
         if (this.meetingId) {
             const success = await uploadFileToSupabase(file, this.meetingId, 'Participant');
            const statusEl = fileEl.querySelector('p:last-child');
            if (statusEl) {
              if (success) {
                statusEl.innerHTML = `${size} • Uploaded`;
                statusEl.style.color = '#10b981';
              } else {
                statusEl.innerHTML = `${size} • Failed`;
                statusEl.style.color = 'var(--color-red-500)';
              }
            }
         }
       }
    };

    fileInput.addEventListener('change', (e) => {
       const files = (e.target as HTMLInputElement).files;
       if (files) handleFiles(files);
    });

    uploadZone.addEventListener('dragover', (e) => {
       e.preventDefault();
       uploadZone.classList.add('dragging');
    });
    uploadZone.addEventListener('dragleave', () => {
       uploadZone.classList.remove('dragging');
    });
    uploadZone.addEventListener('drop', (e) => {
       e.preventDefault();
       uploadZone.classList.remove('dragging');
       if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    });
  }

  public receiveChat(sender: string, text: string, timeMs: number) {
      this.addChatMessage(sender, text, new Date(timeMs));
  }

  private addChatMessage(sender: string, text: string, date: Date) {
    if (!this.chatContainer) return;

    const isMe = sender === 'You';
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    const wrapper = document.createElement('div');
    wrapper.className = `chat-msg-wrapper ${isMe ? 'me' : 'other'}`;
    
    wrapper.innerHTML = `
      ${!isMe ? `<span class="chat-speaker">${sender}</span>` : ''}
      <div class="chat-bubble">${text}</div>
      <span class="chat-time">${timeStr}</span>
    `;

    this.chatContainer.appendChild(wrapper);
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  updateSegments(segments: TranscriptSegment[]) {
    if (!this.transcriptContainer) return;

    const visibleSegments = segments.slice(-20);
    const visibleIds = new Set(visibleSegments.map(s => 'seg-' + s.id));
    
    Array.from(this.transcriptContainer.children).forEach(child => {
      if (child.id && !visibleIds.has(child.id)) {
        child.remove();
      }
    });
    
    for (const seg of visibleSegments) {
      const elId = 'seg-' + seg.id;
      let segEl = this.transcriptContainer.querySelector('#' + elId) as HTMLDivElement;
      
      if (!segEl) {
        segEl = document.createElement('div');
        segEl.id = elId;
        segEl.className = 'segment-wrapper';
        
        const isLocal = seg.source?.toLowerCase() === 'you';
        const speakerColor = isLocal ? 'var(--color-blue-500)' : 'var(--color-blue-800)';
        
        const date = new Date(seg.timestampMs);
        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

        segEl.innerHTML = `
          <div class="segment-header">
            <span class="segment-speaker" style="color:${speakerColor}">${seg.source || 'Speaker'}</span>
            <span class="segment-time">${timeStr}</span>
          </div>
          <div class="segment-text text-content"></div>
        `;
        
        this.transcriptContainer.appendChild(segEl);
      }
      
      const textEl = segEl.querySelector('.text-content') as HTMLDivElement;
      if (textEl) {
        textEl.style.opacity = seg.isFinal ? '1' : '0.6';
        textEl.style.fontStyle = seg.isFinal ? 'normal' : 'italic';
        textEl.textContent = seg.text;
      }
    }
    
    this.transcriptContainer.scrollTop = this.transcriptContainer.scrollHeight;
  }
}
