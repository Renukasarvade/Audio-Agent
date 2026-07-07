function e(t){"@babel/helpers - typeof";return e=typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`?function(e){return typeof e}:function(e){return e&&typeof Symbol==`function`&&e.constructor===Symbol&&e!==Symbol.prototype?`symbol`:typeof e},e(t)}function t(t,n){if(e(t)!=`object`||!t)return t;var r=t[Symbol.toPrimitive];if(r!==void 0){var i=r.call(t,n||`default`);if(e(i)!=`object`)return i;throw TypeError(`@@toPrimitive must return a primitive value.`)}return(n===`string`?String:Number)(t)}function n(n){var r=t(n,`string`);return e(r)==`symbol`?r:r+``}function r(e,t,r){return(t=n(t))in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}var i=``,a=``;async function o(){return i&&a?!0:new Promise(e=>{chrome.storage.local.get([`supabaseUrl`,`supabaseKey`],t=>{if(i=t.supabaseUrl||``,a=t.supabaseKey||``,!i||!a){console.warn(`[AudioAgent] Supabase URL or Key is not configured. Please open the extension popup to set them.`),e(!1);return}e(!0)})})}async function s(e){if(e.length===0)return!0;if(!await o())return!1;try{console.log(`[AudioAgent] Sending batch of ${e.length} segments to Supabase...`);let t=await fetch(`${i}/rest/v1/meeting_transcripts`,{method:`POST`,headers:{"Content-Type":`application/json`,apikey:a,Authorization:`Bearer ${a}`,Prefer:`return=minimal`},body:JSON.stringify(e)});if(!t.ok){let e=await t.text();return console.error(`[AudioAgent] Supabase batch insert error:`,t.status,e),!1}return console.log(`[AudioAgent] Batch insert successful.`),!0}catch(e){return console.error(`[AudioAgent] Exception while batch inserting to Supabase:`,e),!1}}async function c(e,t,n,r){if(!await o())return!1;try{return(await fetch(`${i}/rest/v1/meeting_transcripts_live`,{method:`POST`,headers:{"Content-Type":`application/json`,apikey:a,Authorization:`Bearer ${a}`,Prefer:`return=minimal`},body:JSON.stringify({room_id:e,speaker:t,text:n,timestamp:r})})).ok}catch(e){return console.error(`[AudioAgent] Exception while saving live segment:`,e),!1}}async function l(e,t,n){if(!await o())return!1;try{return(await fetch(`${i}/rest/v1/meeting_chats`,{method:`POST`,headers:{"Content-Type":`application/json`,apikey:a,Authorization:`Bearer ${a}`,Prefer:`return=minimal`},body:JSON.stringify({room_id:e,sender_name:t,message:n})})).ok}catch(e){return console.error(`[AudioAgent] Exception while saving chat message:`,e),!1}}async function u(e){if(!await o())return[];try{let t=await fetch(`${i}/rest/v1/meeting_chats?room_id=eq.${encodeURIComponent(e)}&order=created_at.asc`,{headers:{apikey:a,Authorization:`Bearer ${a}`}});return t.ok?await t.json():[]}catch(e){return console.error(`[AudioAgent] Fetch chats exception:`,e),[]}}async function d(e){if(!await o())return!1;try{return(await fetch(`${i}/rest/v1/meeting_files`,{method:`POST`,headers:{"Content-Type":`application/json`,apikey:a,Authorization:`Bearer ${a}`,Prefer:`return=minimal`},body:JSON.stringify(e)})).ok}catch(e){return console.error(`[AudioAgent] Exception while saving file record:`,e),!1}}async function f(e){if(!await o())return[];try{let t=await fetch(`${i}/rest/v1/meeting_files?room_id=eq.${encodeURIComponent(e)}&order=created_at.asc`,{headers:{apikey:a,Authorization:`Bearer ${a}`}});return t.ok?await t.json():[]}catch(e){return console.error(`[AudioAgent] Fetch files exception:`,e),[]}}async function p(e,t,n,r){if(!await o())return!1;try{let o=r||`${Date.now()}_${e.name?.replace(/[^a-zA-Z0-9.\\-_]/g,``)||`file.txt`}`,s=`${t}/${o}`,c=await fetch(`${i}/storage/v1/object/meeting-resources/${s}`,{method:`POST`,headers:{apikey:a,Authorization:`Bearer ${a}`,"Content-Type":e.type||`application/octet-stream`},body:e});if(!c.ok)return console.error(`[AudioAgent] Storage upload failed`,await c.text()),!1;let l=e.size?`${Math.round(e.size/1024)} KB`:`0 KB`;return await d({room_id:t,uploader_name:n,file_name:e.name||o,file_path:s,file_size:l}),!0}catch(e){return console.error(`[AudioAgent] Exception while uploading file:`,e),!1}}var m={Download:`<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,Users:`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,Wifi:`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,Upload:`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,Paperclip:`<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`,FileText:`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,Image:`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,Video:`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,VideoOff:`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,Mic:`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,MicOff:`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,PhoneOff:`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="23" y1="1" x2="1" y2="23"/></svg>`,MessageSquare:`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,Send:`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,X:`<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,ChevronRight:`<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`},h=class{constructor(){r(this,`container`,void 0),r(this,`shadow`,void 0),r(this,`transcriptContainer`,null),r(this,`chatContainer`,null),r(this,`fileInput`,null),r(this,`meetingId`,``),this.container=document.createElement(`div`),this.container.id=`oxiqai-overlay-root`,this.container.style.position=`fixed`,this.container.style.inset=`0`,this.container.style.zIndex=`999999`,this.container.style.width=`100vw`,this.container.style.height=`100vh`,this.container.style.overflow=`hidden`,this.shadow=this.container.attachShadow({mode:`open`})}setMeetingId(e){this.meetingId=e}mount(){document.getElementById(`oxiqai-overlay-root`)||(document.body.appendChild(this.container),this.render())}unmount(){this.container.remove()}render(){let e=document.createElement(`style`);e.textContent=`
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
    `,this.shadow.appendChild(e);let t=document.createElement(`div`);t.className=`wrapper`,t.innerHTML=`
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
          <span style="color:rgba(30,58,138,0.6)">${m.Users}</span>
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
            ${m.Download} Download .txt
          </button>
        </section>
        
        <section class="center-panel">
          <div class="upload-zone glass panel-radius" id="upload-zone">
            <div class="flex items-center justify-between" style="padding:16px 20px 12px;border-bottom:1px solid rgba(255,255,255,0.25);">
              <div class="flex items-center gap-2">
                <span style="color:rgba(37,99,235,0.7)">${m.Upload}</span>
                <span class="text-sm font-semibold" style="color:rgba(30,58,138,0.8)">Files & Resources</span>
              </div>
              <button class="btn btn-primary text-xs font-semibold gap-1" id="btn-attach">
                ${m.Paperclip} Attach
              </button>
              <input type="file" id="file-input" multiple style="display:none;" />
            </div>
            
            <div class="flex flex-col items-center justify-center gap-4" style="flex:1;padding:24px 32px;" id="upload-empty">
              <div class="glass flex items-center justify-center" style="width:80px;height:80px;border-radius:24px;box-shadow:0 4px 24px rgba(59,130,246,0.18);">
                <span style="color:rgba(59,130,246,0.7);transform:scale(2);">${m.Upload}</span>
              </div>
              <div class="flex flex-col items-center gap-1">
                <p class="text-sm font-semibold" style="color:rgba(30,58,138,0.7);margin:0;">Drop files here</p>
                <p class="text-xs" style="color:rgba(29,78,216,0.5);margin:0;">Share images, docs, links — anything your team needs</p>
              </div>
              <div class="flex gap-3" style="margin-top:4px;">
                <button class="btn glass flex items-center gap-1 panel-radius" style="padding:8px 16px;color:rgba(30,58,138,0.7);font-size:12px;font-weight:600;" id="btn-up-img">
                  ${m.Image} Image
                </button>
                <button class="btn glass flex items-center gap-1 panel-radius" style="padding:8px 16px;color:rgba(30,58,138,0.7);font-size:12px;font-weight:600;" id="btn-up-doc">
                  ${m.FileText} Document
                </button>
                <button class="btn glass flex items-center gap-1 panel-radius" style="padding:8px 16px;color:rgba(30,58,138,0.7);font-size:12px;font-weight:600;" id="btn-up-any">
                  ${m.Paperclip} Any file
                </button>
              </div>
            </div>
            <div id="upload-list" class="scroll-container" style="display:none;align-content:start;gap:12px;padding:16px;"></div>
          </div>
          
          <div class="meet-placeholder glass panel-radius">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center" style="width:40px;height:40px;border-radius:16px;background:linear-gradient(to bottom right, rgba(96,165,250,0.6), rgba(99,102,241,0.6));border:1px solid rgba(255,255,255,0.4);color:white;">
                ${m.Video}
              </div>
              <div>
                <p class="text-xs font-semibold" style="color:rgba(30,58,138,0.8);margin:0;">Google Meet</p>
                <p style="font-size:10px;color:rgba(29,78,216,0.5);margin:0;">Live • Active Session</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn btn-icon" id="btn-mic">${m.Mic}</button>
              <button class="btn btn-icon" id="btn-cam">${m.Video}</button>
              <button class="btn btn-leave" id="btn-leave" style="margin-left:4px;">
                ${m.PhoneOff} Leave
              </button>
            </div>
          </div>
        </section>
        
        <section class="right-panel glass-dark panel-radius" style="display:flex; flex-direction:column;">
          <div class="flex items-center justify-between" style="padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.2);">
            <button id="btn-tab-chat" style="background:none; border:none; color:rgba(30,58,138,0.8); font-size:13px; font-weight:600; cursor:pointer; padding:6px 12px; border-radius:6px; font-family:inherit;">💬 Chat</button>
            <button id="btn-tab-parts" style="background:none; border:none; color:rgba(30,58,138,0.5); font-size:13px; font-weight:600; cursor:pointer; padding:6px 12px; border-radius:6px; font-family:inherit;">👥 Contributors</button>
          </div>
          
          <!-- Chat Panel Content -->
          <div id="panel-chat-content" style="display:flex; flex-direction:column; flex:1; overflow:hidden;">
            <div class="scroll-container" id="chat-list" style="flex:1;">
               <!-- Chats go here -->
            </div>
            <div class="chat-input-wrapper">
              <div class="chat-input-box">
                <input type="text" id="chat-input" placeholder="Message..." />
                <button class="chat-send-btn" id="btn-send" disabled>${m.Send}</button>
              </div>
            </div>
          </div>

          <!-- Participants Panel Content -->
          <div id="panel-parts-content" style="display:none; flex-direction:column; flex:1; overflow:hidden; padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <span style="font-size:11px; font-weight:600; text-transform:uppercase; color:rgba(30,58,138,0.5); letter-spacing:0.5px;">Active Session Users</span>
                <span id="oxiq-user-count-badge" style="background:rgba(56,189,248,0.1); color:#38bdf8; font-size:11px; font-weight:700; padding:2px 8px; border-radius:4px;">1</span>
            </div>
            <div id="oxiq-participants-box" class="scroll-container" style="display:flex; flex-direction:column; gap:8px; flex:1; overflow-y:auto;">
              <!-- Participants go here -->
            </div>
          </div>
        </section>
      </main>
      
      <footer class="glass panel-radius">
        <p class="text-xs font-semibold" style="color:rgba(30,58,138,0.5);margin:0;">Powered by <span style="color:rgba(37,99,235,0.7)">OxiqAI</span></p>
      </footer>
    `,this.shadow.appendChild(t),this.transcriptContainer=this.shadow.getElementById(`transcript-list`),this.chatContainer=this.shadow.getElementById(`chat-list`),this.setupEventListeners()}setupEventListeners(){let e=document.querySelector(`button[aria-label*="chat" i], [data-tooltip*="chat" i]`);e&&e.click();let t=this.shadow.getElementById(`btn-tab-chat`),n=this.shadow.getElementById(`btn-tab-parts`),r=this.shadow.getElementById(`panel-chat-content`),i=this.shadow.getElementById(`panel-parts-content`);t&&n&&r&&i&&(t.addEventListener(`click`,()=>{t.style.color=`rgba(30,58,138,0.8)`,n.style.color=`rgba(30,58,138,0.5)`,r.style.display=`flex`,i.style.display=`none`}),n.addEventListener(`click`,()=>{t.style.color=`rgba(30,58,138,0.5)`,n.style.color=`rgba(30,58,138,0.8)`,r.style.display=`none`,i.style.display=`flex`,this.refreshParticipantsList()}));let a=null,o=null,s=0,c=0,d=()=>{let e=document.querySelector(`button[data-is-muted][aria-label*="micro" i], button[data-is-muted][data-tooltip*="micro" i]`);if(!e){let t=Array.from(document.querySelectorAll(`button[aria-label*="micro" i], [role="button"][aria-label*="micro" i], [data-tooltip*="micro" i]`));e=t.find(e=>{let t=(e.getAttribute(`aria-label`)||e.getAttribute(`data-tooltip`)||``).toLowerCase();return t.includes(`turn`)||t.includes(`ctrl`)||t.includes(`⌘`)||t.includes(`activer`)||t.includes(`desactiv`)})||t[0]}return e},h=()=>{let e=document.querySelector(`button[data-is-muted][aria-label*="camera" i], button[data-is-muted][data-tooltip*="camera" i]`);if(!e){let t=Array.from(document.querySelectorAll(`button[aria-label*="camera" i], [role="button"][aria-label*="camera" i], [data-tooltip*="camera" i]`));e=t.find(e=>{let t=(e.getAttribute(`aria-label`)||e.getAttribute(`data-tooltip`)||``).toLowerCase();return t.includes(`turn`)||t.includes(`ctrl`)||t.includes(`⌘`)||t.includes(`activer`)||t.includes(`desactiv`)})||t[0]}return e},g=this.shadow.getElementById(`meeting-timer`),_=this.shadow.getElementById(`participant-count`);if(g){let e=Date.now(),t=()=>{let t=Math.floor((Date.now()-e)/1e3),n=Math.floor(t/3600),r=Math.floor(t%3600/60),i=t%60;g.innerText=`Live • ${n>0?n.toString().padStart(2,`0`)+`:`:``}${r.toString().padStart(2,`0`)}:${i.toString().padStart(2,`0`)}`;let l=Date.now(),u=d(),f=this.shadow.getElementById(`btn-mic`);if(u&&f&&l>s){let e=(u.getAttribute(`aria-label`)||u.getAttribute(`data-tooltip`)||``).toLowerCase().includes(`turn off`);a!==e&&(a=e,f.classList.toggle(`off`,!a),f.innerHTML=a?`${m.Mic}`:`${m.MicOff}`)}let p=h(),v=this.shadow.getElementById(`btn-cam`);if(p&&v&&l>c){let e=(p.getAttribute(`aria-label`)||p.getAttribute(`data-tooltip`)||``).toLowerCase().includes(`turn off`);o!==e&&(o=e,v.classList.toggle(`off`,!o),v.innerHTML=o?`${m.Video}`:`${m.VideoOff}`)}let y=``,b=document.querySelectorAll(`button, [role="button"]`);for(let e=0;e<b.length;e++){let t=b[e],n=(t.getAttribute(`aria-label`)||t.getAttribute(`data-tooltip`)||``).toLowerCase(),r=n.match(/\\((\\d+)\\)/);if(r){y=r[1];break}if(/everyone|participant|people|personas|pessoas|personnes|personen/i.test(n)){let e=(t.textContent?.trim()||``).match(/\\d+/);if(e){y=e[0];break}if(t.parentElement){let e=(t.parentElement.textContent?.replace(/\\s/g,``)||``).match(/\\d+/);if(e){y=e[0];break}}}}if(!y){let e=document.querySelectorAll(`.uGOf1d, .Yi3Cfd .eU809d, .KieQAe .eU809d, [data-participant-count], .MKVSQd`);for(let t=0;t<e.length;t++){let n=e[t];if(n.offsetParent!==null||n.textContent){let e=n.textContent?.trim()||``,t=e.replace(/\\D/g,``);if(t.length>0&&t.length===e.replace(/\\s/g,``).length){y=t;break}}}}if(!y){let e=document.querySelectorAll(`div, span`);for(let t=0;t<e.length;t++){let n=e[t];if(n.children.length===0){let e=n.textContent?.trim()||``,t=e.replace(/\\D/g,``);if(t.length>0&&t.length===e.replace(/\\s/g,``).length){let e=parseInt(t,10);if(e>0&&e<1e3&&n.parentElement?.querySelector(`svg`)&&(y=t,n.getBoundingClientRect().bottom>window.innerHeight-100))break}}}}y&&_&&(_.innerText=`${y} participants`)};t(),setInterval(t,1e3);let n=0,r=0,i=async()=>{if(this.meetingId)try{let e=await u(this.meetingId);e&&e.length!==n&&(this.chatContainer.innerHTML=``,e.forEach(e=>{this.addChatMessage(e.sender_name,e.message,new Date(e.created_at))}),n=e.length);let t=await f(this.meetingId);if(t&&t.length!==r){this.shadow.getElementById(`upload-zone`);let e=this.shadow.getElementById(`upload-empty`),n=this.shadow.getElementById(`upload-list`);e&&(e.style.display=`none`),n&&(n.innerHTML=``,t.forEach(e=>{let t=document.createElement(`div`);t.className=`glass flex items-center gap-3 panel-radius`,t.style.padding=`12px`,t.innerHTML=`
                           <div style="width:40px;height:40px;border-radius:12px;background:rgba(219,234,254,0.6);display:flex;align-items:center;justify-content:center;color:var(--color-blue-500)">
                             ${e.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i)?m.Image:m.FileText}
                           </div>
                           <div style="flex:1;min-width:0;">
                             <p class="text-xs font-semibold" style="color:var(--color-blue-900);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${e.file_name}</p>
                             <p style="font-size:10px;color:#10b981;margin:0;">${e.file_size} • ${e.uploader_name}</p>
                           </div>
                         `,n.appendChild(t)})),r=t.length}}catch(e){console.error(`[AudioAgent] Polling Supabase exception:`,e)}};setInterval(()=>{i(),this.refreshParticipantsList()},3e3),i(),this.refreshParticipantsList()}let v=this.shadow.getElementById(`chat-input`),y=this.shadow.getElementById(`btn-send`),b=async()=>{let e=v.value.trim();if(!e)return;v.value=``,y.disabled=!0,this.addChatMessage(`You`,e,new Date),this.meetingId&&await l(this.meetingId,`You`,e);let t=document.querySelector(`textarea[aria-label*="Send a message" i], textarea[aria-label*="chat" i], textarea[name="chatTextInput"]`);if(t){t.focus(),document.execCommand(`insertText`,!1,e);let n=document.querySelector(`button[aria-label*="Send" i], [data-tooltip*="Send message" i]`);setTimeout(()=>{n&&!n.disabled?n.click():t.dispatchEvent(new KeyboardEvent(`keydown`,{key:`Enter`,code:`Enter`,keyCode:13,which:13,bubbles:!0}))},150)}};v.addEventListener(`input`,()=>{y.disabled=v.value.trim().length===0}),v.addEventListener(`keydown`,e=>{e.key===`Enter`&&b()}),y.addEventListener(`click`,b);let x=this.shadow.getElementById(`btn-mic`);x.addEventListener(`click`,()=>{let e=d();e&&(e.click(),a=!a,x.classList.toggle(`off`,!a),x.innerHTML=a?`${m.Mic}`:`${m.MicOff}`,s=Date.now()+1e3)});let S=this.shadow.getElementById(`btn-cam`);S.addEventListener(`click`,()=>{let e=h();e&&(e.click(),o=!o,S.classList.toggle(`off`,!o),S.innerHTML=o?`${m.Video}`:`${m.VideoOff}`,c=Date.now()+1e3)}),this.shadow.getElementById(`btn-leave`).addEventListener(`click`,async()=>{let e=this.shadow.getElementById(`transcript-list`);if(e&&this.meetingId){let t=``;if(e.querySelectorAll(`.segment-wrapper`).forEach(e=>{let n=e.querySelector(`.segment-speaker`)?.textContent||`Unknown`,r=e.querySelector(`.segment-time`)?.textContent||``,i=e.querySelector(`.segment-text`)?.textContent||``;t+=`[${r}] ${n}: ${i}\n\n`}),t||(t=e.innerText),t&&t.trim().length>0){let e=new Blob([t],{type:`text/plain`}),n=`Meeting_Transcript_${new Date().toISOString().slice(0,10)}.txt`;await p(e,this.meetingId,`System`,n)}}let t=document.querySelector(`button[aria-label*="leave call" i], [role="button"][aria-label*="leave call" i], [data-tooltip*="leave call" i]`);t&&t.click(),window.dispatchEvent(new CustomEvent(`OXIQ_STOP_ENGINE`))});let C=this.shadow.getElementById(`btn-download-txt`);C&&C.addEventListener(`click`,()=>{let e=this.shadow.getElementById(`transcript-list`);if(!e)return;let t=``;e.querySelectorAll(`.segment-wrapper`).forEach(e=>{let n=e.querySelector(`.segment-speaker`)?.textContent||`Unknown`,r=e.querySelector(`.segment-time`)?.textContent||``,i=e.querySelector(`.segment-text`)?.textContent||``;t+=`[${r}] ${n}: ${i}\n\n`}),t||(t=e.innerText||`No transcripts found.`);let n=new Blob([t],{type:`text/plain`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=`Meeting_Transcript_${new Date().toISOString().slice(0,10)}.txt`,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(r)});let w=this.shadow.getElementById(`upload-zone`),T=this.shadow.getElementById(`file-input`),E=this.shadow.getElementById(`btn-attach`),D=this.shadow.getElementById(`upload-empty`),O=this.shadow.getElementById(`upload-list`);this.fileInput=T,E.addEventListener(`click`,()=>T.click()),[this.shadow.getElementById(`btn-up-img`),this.shadow.getElementById(`btn-up-doc`),this.shadow.getElementById(`btn-up-any`),D].forEach(e=>{e&&e.addEventListener(`click`,e=>{e.stopPropagation(),T.click()})});let k=async e=>{if(e.length!==0){D.style.display=`none`,O.style.display=`flex`,O.style.flexDirection=`column`;for(let t=0;t<e.length;t++){let n=e[t],r=n.type.startsWith(`image/`),i=document.createElement(`div`);i.className=`glass flex items-center gap-3 panel-radius`,i.style.padding=`12px`;let a=n.size>1024*1024?(n.size/1024/1024).toFixed(1)+` MB`:Math.round(n.size/1024)+` KB`;if(i.innerHTML=`
           <div style="width:40px;height:40px;border-radius:12px;background:rgba(219,234,254,0.6);display:flex;align-items:center;justify-content:center;color:var(--color-blue-500)">
             ${r?m.Image:m.FileText}
           </div>
           <div style="flex:1;min-width:0;">
             <p class="text-xs font-semibold" style="color:var(--color-blue-900);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${n.name}</p>
             <p style="font-size:10px;color:rgba(29,78,216,0.5);margin:0;">${a} • Uploading...</p>
           </div>
         `,O.appendChild(i),this.meetingId){let e=await p(n,this.meetingId,`Participant`),t=i.querySelector(`p:last-child`);t&&(e?(t.innerHTML=`${a} • Uploaded`,t.style.color=`#10b981`):(t.innerHTML=`${a} • Failed`,t.style.color=`var(--color-red-500)`))}}}};T.addEventListener(`change`,e=>{let t=e.target.files;t&&k(t)}),w.addEventListener(`dragover`,e=>{e.preventDefault(),w.classList.add(`dragging`)}),w.addEventListener(`dragleave`,()=>{w.classList.remove(`dragging`)}),w.addEventListener(`drop`,e=>{e.preventDefault(),w.classList.remove(`dragging`),e.dataTransfer&&e.dataTransfer.files&&k(e.dataTransfer.files)})}receiveChat(e,t,n){this.addChatMessage(e,t,new Date(n))}addChatMessage(e,t,n){if(!this.chatContainer)return;let r=e===`You`,i=`${n.getHours().toString().padStart(2,`0`)}:${n.getMinutes().toString().padStart(2,`0`)}`,a=document.createElement(`div`);a.className=`chat-msg-wrapper ${r?`me`:`other`}`,a.innerHTML=`
      ${r?``:`<span class="chat-speaker">${e}</span>`}
      <div class="chat-bubble">${t}</div>
      <span class="chat-time">${i}</span>
    `,this.chatContainer.appendChild(a),this.chatContainer.scrollTop=this.chatContainer.scrollHeight}updateSegments(e){if(!this.transcriptContainer)return;let t=e.slice(-20),n=new Set(t.map(e=>`seg-`+e.id));Array.from(this.transcriptContainer.children).forEach(e=>{e.id&&!n.has(e.id)&&e.remove()});for(let e of t){let t=`seg-`+e.id,n=this.transcriptContainer.querySelector(`#`+t);if(!n){n=document.createElement(`div`),n.id=t,n.className=`segment-wrapper`;let r=e.source?.toLowerCase()===`you`?`var(--color-blue-500)`:`var(--color-blue-800)`,i=new Date(e.timestampMs),a=`${i.getHours().toString().padStart(2,`0`)}:${i.getMinutes().toString().padStart(2,`0`)}`;n.innerHTML=`
          <div class="segment-header">
            <span class="segment-speaker" style="color:${r}">${e.source||`Speaker`}</span>
            <span class="segment-time">${a}</span>
          </div>
          <div class="segment-text text-content"></div>
        `,this.transcriptContainer.appendChild(n)}let r=n.querySelector(`.text-content`);r&&(r.style.opacity=e.isFinal?`1`:`0.6`,r.style.fontStyle=e.isFinal?`normal`:`italic`,r.textContent=e.text)}this.transcriptContainer.scrollTop=this.transcriptContainer.scrollHeight}refreshParticipantsList(){let e=this.shadow?.getElementById(`oxiq-participants-box`),t=this.shadow?.getElementById(`oxiq-user-count-badge`);if(!e)return;let n=Array.from(document.querySelectorAll(`[data-self-name], [jsname="Z7uXbe"]`)).map(e=>e.textContent?.trim()).filter((e,t,n)=>e&&n.indexOf(e)===t),r=n.length>0?n:[`Renuka Sarvade (You)`];t&&(t.textContent=r.length.toString()),e.innerHTML=r.map(e=>`
        <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:26px; height:26px; background:linear-gradient(135deg, #38bdf8, #6366f1); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; color:#fff;">
                    ${(e||`P`).charAt(0).toUpperCase()}
                </div>
                <span style="font-size:13px; font-weight:500; color:#e2e8f0; font-family: 'Inter', sans-serif;">${e}</span>
            </div>
            <span style="font-size:10px; color:#10b981; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; font-family: 'Inter', sans-serif;">Online</span>
        </div>
    `).join(``)}};export{r as i,c as n,s as r,h as t};