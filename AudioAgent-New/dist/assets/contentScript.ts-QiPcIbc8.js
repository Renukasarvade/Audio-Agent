import{i as e,n as t,r as n,t as r}from"./overlay-G-dbucQs.js";var i=class{constructor(){e(this,`platformName`,`meet`),e(this,`observer`,null),e(this,`chatTimer`,null),e(this,`initTimer`,null),e(this,`onChatCb`,void 0),e(this,`seenChats`,new Set),e(this,`onSegmentsCb`,void 0),e(this,`lastSeenText`,``),e(this,`lastSpeaker`,`Speaker`)}isCaptionsAvailable(){return!!document.querySelector(`[role="region"][aria-label*="caption" i], [aria-label*="caption" i] [jsname="dsSSbb"]`)}start(e,t){this.onChatCb=t,this.onSegmentsCb=e,this.turnOnCaptions(),this.injectCssToHideNativeCaptions(),this.initTimer=setInterval(()=>{let e=document.querySelector(`[role="region"][aria-label*="caption" i], [aria-label*="caption" i] [jsname="dsSSbb"]`);e&&!this.observer?(console.log(`[OxiqAI] Captions container detected. Attaching MutationObserver...`),this.observer=new MutationObserver(()=>{this.pollCaptions()}),this.observer.observe(e,{childList:!0,subtree:!0,characterData:!0}),this.pollCaptions()):!e&&this.observer&&(console.log(`[OxiqAI] Captions container lost. Disconnecting MutationObserver.`),this.observer.disconnect(),this.observer=null)},1500),this.chatTimer=setInterval(()=>{this.pollChats()},1e3),console.log(`[OxiqAI] DOM Watcher initialized (Meet)`)}pollCaptions(){let e=document.querySelector(`[role="region"][aria-label*="caption" i], [aria-label*="caption" i] [jsname="dsSSbb"]`);if(!e){let t=Array.from(document.querySelectorAll(`div`)).filter(e=>!(!/\b\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?\b/.test(e.innerText||``)||e.children.length>10));t.sort((e,t)=>(t.innerText||``).length-(e.innerText||``).length),e=t[t.length-1]}if(!e)return;let t=Array.from(e.children).filter(e=>e.innerText?.trim());if(t.length===0)return;let n=``,r=[],i=new Set;t.forEach((e,t)=>{if((e.innerText||``).replace(/format_size|Font size|circle|Font color settings|Font color|Open caption settings|settings|language|arrow_downward|jump to bottom|English|Spanish|French|German/gi,` `).split(`
`).map(e=>e.trim()).filter(e=>e).length===0)return;let a=this.lastSpeaker,o=``,s=Array.from(e.children).filter(e=>{let t=e.innerText?.trim()||``;return!(e.tagName===`IMG`||t.includes(`format_size`)||t.includes(`settings`))});if(s.length>=2)a=s[0].innerText.trim(),o=s.slice(1).map(e=>e.innerText.trim()).join(` `);else{let t=(e.innerText||``).replace(/format_size|Font size|circle|Font color settings|Font color|Open caption settings|settings|language|arrow_downward|jump to bottom/gi,` `).split(`
`).map(e=>e.trim()).filter(e=>e);t.length>0&&(t.length>1?(a=t[0],o=t.slice(1).join(` `)):o=t[0])}if(o.includes(`Huge Jumbo`)||o.includes(`Cyan Magenta`)||o.includes(`BETA Polish`)||o.includes(`Language settings`)||(o=o.replace(/\s+/g,` `).trim(),!o)||i.has(o))return;i.add(o);let c=e.dataset.oxiqaiId;c||(c=`seg_${Date.now()}_${t}`,e.dataset.oxiqaiId=c);let l=a||`Speaker`,u=l.toLowerCase()===`you`;n+=o+` `,r.push({id:c,text:o,speaker:l,source:l,isLocal:u,timestampMs:Date.now(),timestamp:Date.now(),isFinal:!0})}),n.trim()&&n!==this.lastSeenText&&this.onSegmentsCb&&(this.lastSeenText=n,this.onSegmentsCb(r))}pollChats(){if(this.onChatCb){if(!document.querySelector(`textarea[name="chatTextInput"], textarea[aria-label*="Send a message" i]`)){let e=document.querySelector(`button[aria-label*="chat" i]:not([disabled]), [data-tooltip*="chat" i]:not([disabled])`),t=e?.getAttribute(`aria-pressed`)===`true`;e&&!t&&e.click();return}Array.from(document.querySelectorAll(`[data-message-id]`)).forEach(e=>{let t=e.getAttribute(`data-message-id`)||``;if(!t||this.seenChats.has(t))return;let n=`Unknown`,r=e.parentElement;for(;r&&r!==document.body;){if(r.hasAttribute(`data-sender-id`)){let e=r.querySelector(`[data-sender-name]`);if(e)n=e.innerText.trim();else{let e=r.innerText.split(`
`).map(e=>e.trim()).filter(Boolean);e.length>0&&(n=e[0])}break}let e=r.innerText.split(`
`).map(e=>e.trim()).filter(Boolean),t=e.findIndex(e=>/^\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?$/i.test(e));if(t===1||t===2){n=e[0];break}r=r.parentElement}let i=e.cloneNode(!0);i.querySelectorAll(`button, [role="button"], [data-tooltip], [jsaction], [jsname="x10s0b"]`).forEach(e=>e.remove());let a=i.innerText.trim();a=a.replace(/Pin message|Keep/gi,``).trim(),n.toLowerCase()!==`you`&&n.toLowerCase()!==`me`&&!n.includes(`Messages will not be saved`)&&n!==`Unknown`?(this.seenChats.add(t),this.onChatCb(n,a,Date.now())):this.seenChats.add(t)})}}removeBackgroundFromParents(e){e.forEach(e=>{let t=e.parentElement,n=0;for(;t&&n<6;)t.style.setProperty(`background`,`transparent`,`important`),t.style.setProperty(`background-color`,`transparent`,`important`),t.style.setProperty(`box-shadow`,`none`,`important`),t.style.setProperty(`border`,`none`,`important`),t=t.parentElement,n++})}turnOnCaptions(){let e=document.querySelectorAll(`button`);for(let t of Array.from(e)){let e=t.getAttribute(`aria-label`)?.toLowerCase()||``,n=t.getAttribute(`data-tooltip`)?.toLowerCase()||``;if((e.includes(`turn on captions`)||n.includes(`turn on captions`)||e.includes(`captions`)||n.includes(`captions`))&&!e.includes(`turn off`)&&!n.includes(`turn off`)){console.log(`[OxiqAI] Automatically turning on Google Meet Captions...`),t.click();return}}console.log(`[OxiqAI] Captions toggle button not found – please enable captions manually (or press "c").`)}injectCssToHideNativeCaptions(){let e=`oxiqai-hide-native-captions`;if(!document.getElementById(e)){let t=document.createElement(`style`);t.id=e,t.textContent=`
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
      `,document.head.appendChild(t)}}stop(){this.initTimer&&(clearInterval(this.initTimer),this.initTimer=null),this.chatTimer&&(clearInterval(this.chatTimer),this.chatTimer=null),this.observer&&(this.observer.disconnect(),this.observer=null),this.lastSeenText=``;let e=document.getElementById(`oxiqai-hide-native-captions`);e&&e.remove(),console.log(`[OxiqAI] DOM Scraper stopped`)}},a=!1,o=null,s=null,c=[`Sunday`,`Monday`,`Tuesday`,`Wednesday`,`Thursday`,`Friday`,`Saturday`],l=``,u=``,d=``,f=new Map,p=new Set;function m(e){let t=new Date(e);return`${t.getHours().toString().padStart(2,`0`)}:${t.getMinutes().toString().padStart(2,`0`)}:${t.getSeconds().toString().padStart(2,`0`)}`}function h(e){if(!l)return;let n=new Set(e.map(e=>e.id));p.forEach(e=>{if(!n.has(e)){let n=f.get(e);n&&n.transcript_text&&(console.log(`[OxiqAI] Live segment finalized, sending to Supabase:`,n),t(l,n.speaker,n.transcript_text,n.timestamp))}}),e.forEach(e=>{let t=e.source||`Speaker`,n=e.text||``;if(t.toLowerCase()===`speaker`&&n.startsWith(`You `)&&(t=`You`,n=n.substring(4)),!n.trim())return;let r=m(e.timestampMs),i={meeting_id:l,platform:`Google Meet`,meeting_day:u,meeting_date:d,speaker:t,transcript_text:n.trim(),timestamp:r};f.set(e.id,i)}),p=n}function g(){let e=`oxiqai-hide-branding-style`;if(document.getElementById(e))return;let t=document.createElement(`style`);t.id=e,t.textContent=`
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
  `,(document.head||document.documentElement).appendChild(t)}function _(){if(document.getElementById(`oxiqai-top-mask-wrapper`))return;let e=document.createElement(`div`);e.id=`oxiqai-top-mask-wrapper`,e.style.cssText=`
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
  `,e.innerHTML=`
    <div style="display:flex; align-items:center; gap:12px;">
      <div style="width:32px; height:32px; background:linear-gradient(135deg, #0ea5e9, #6366f1); border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:800; color:#fff; font-size:16px; box-shadow:0 0 15px rgba(14,165,233,0.4);">O</div>
      <span style="color:#fff; font-weight:700; font-size:16px; letter-spacing:-0.3px;">OxiqAI <span style="font-weight:400; color:#94a3b8; font-size:13px;">Studio</span></span>
    </div>
    <div style="display:flex; align-items:center; gap:14px;">
      <span style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.25); color:#34d399; font-size:11px; font-weight:700; padding:4px 12px; border-radius:99px; letter-spacing:0.5px;">● SECURE AUDIO AGENT CONNECTED</span>
    </div>
  `;let t=document.createElement(`div`);t.id=`oxiqai-bottom-label`,t.style.cssText=`
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
  `,t.textContent=`OxiqAI Workspace Environment`,document.body.appendChild(e),document.body.appendChild(t)}function v(){[`div[data-meeting-title]`,`div[jsname="V676U"]`,`.NzbeBe`,`.jv7QQ`,`.NzPR9b`,`.NZPR9b`,`.cM3h5e`,`.GOH7ee`,`div[jsname="pZ99L"]`,`.wY1v9c`,`.R36Sre`,`.m9992c`,`div[aria-label*="Meeting details" i]`,`.t7654b`,`.rG0ehe`,`.Q86pBc`,`div[jscontroller="s370ud"]`,`div[jsname="x13uXb"]`].forEach(e=>{try{document.querySelectorAll(e).forEach(e=>{let t=e;t.style.display!==`none`&&(t.style.setProperty(`display`,`none`,`important`),t.style.setProperty(`opacity`,`0`,`important`),t.style.setProperty(`visibility`,`hidden`,`important`))})}catch{}})}function y(){try{let e=document.querySelectorAll(`div, span, button`),t=/\b[a-z]{3}-[a-z]{4}-[a-z]{3}\b/;e.forEach(e=>{if(e.closest(`#oxiqai-top-mask-wrapper`)||e.closest(`#oxiqai-bottom-label`)||e.closest(`#oxiqai-overlay-root`))return;let n=e.textContent||``;if(n.length<50&&(n.includes(`|`)||t.test(n))){let t=e;t.style.display!==`none`&&(t.style.setProperty(`display`,`none`,`important`),t.style.setProperty(`opacity`,`0`,`important`),t.style.setProperty(`visibility`,`hidden`,`important`))}})}catch{}}var b=document.createElement(`style`);b.textContent=`
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
`,document.documentElement.appendChild(b),chrome.runtime.onMessage.addListener((e,t,p)=>{if(e.action===`PING_ENGINE`){p({isRunning:a});return}if(e.action===`START_ENGINE`){if(a){p({success:!0,message:`Already running`});return}a=!0;let e=new Date;l=`session_googlemeet_${e.getTime()}`,u=c[e.getDay()],d=e.toISOString().split(`T`)[0],f.clear(),chrome.storage.local.get([`meetingIndex`],t=>{let n=t.meetingIndex||[];n.push({id:l,platform:`Google Meet`,day:u,date:d,startTime:m(e.getTime())}),chrome.storage.local.set({meetingIndex:n})}),s=new r,s.setMeetingId(l),s.mount(),o=new i,o.start(e=>{s?.updateSegments(e),h(e)},(e,t,n)=>{s?.receiveChat(e,t,n)}),p({success:!0});return}if(e.action===`STOP_ENGINE`){let e=Array.from(f.values());e.length>0&&(console.log(`[AudioAgent] Syncing final meeting transcript (${e.length} segments) to Supabase...`),n(e)),a=!1,l=``,f.clear(),s&&(s.unmount(),s=null),o&&(o.stop(),o=null),p({success:!0});return}}),window.addEventListener(`OXIQ_STOP_ENGINE`,()=>{let e=Array.from(f.values());e.length>0&&(console.log(`[AudioAgent] Syncing final meeting transcript (${e.length} segments) to Supabase...`),n(e)),a=!1,l=``,f.clear(),s&&(s.unmount(),s=null),o&&(o.stop(),o=null);try{chrome.runtime.sendMessage({action:`ENGINE_STOPPED`})}catch{}}),window.addEventListener(`message`,e=>{if(!(!e.data||!e.data.type)){if(e.data.type===`OXIQ_INIT_MEETING`){let t=e.data.roomId;if(console.log(`[OxiqAI] Auto-initializing room engine for ID:`,t),window.parent.postMessage({type:`OXIQ_INIT_ACK`},`*`),!a){a=!0;let e=new Date;l=t,u=c[e.getDay()],d=e.toISOString().split(`T`)[0],f.clear(),g(),v(),o=new i,o.start(e=>{h(e)},(e,t,n)=>{});let n=setInterval(()=>{let e=Array.from(document.querySelectorAll(`button, [role="button"]`)).find(e=>{let t=(e.textContent||``).trim().toLowerCase();return t===`join now`||t===`ask to join`||t===`participar`||t===`reunirse ahora`});e&&(e.click(),clearInterval(n))},1e3),r=setInterval(()=>{if(!a){clearInterval(r);return}Array.from(document.querySelectorAll(`button, [role="button"]`)).filter(e=>{let t=(e.textContent||``).trim().toLowerCase();return t.includes(`admit`)||t.includes(`admit all`)||t.includes(`admitir`)||t.includes(`admitir a todos`)}).forEach(e=>{console.log(`[OxiqAI] Automatically admitting guest participant.`),e.click()})},1e3)}}if(e.data.type===`OXIQ_TOGGLE_MIC`){console.log(`[OxiqAI] Remote toggle mic triggered.`);let e=document.querySelector(`[data-is-muted][aria-label*="micro" i], button[aria-label*="micro" i], [role="button"][aria-label*="micro" i]`);e&&e.click()}if(e.data.type===`OXIQ_TOGGLE_CAM`){console.log(`[OxiqAI] Remote toggle camera triggered.`);let e=document.querySelector(`[data-is-muted][aria-label*="camera" i], [data-is-muted][aria-label*="video" i], button[aria-label*="camera" i], [role="button"][aria-label*="camera" i]`);e&&e.click()}if(e.data.type===`OXIQ_TOGGLE_SCREEN`){console.log(`[OxiqAI] Remote toggle screen share triggered.`);let e=Array.from(document.querySelectorAll(`button, [role="button"]`)).find(e=>{let t=(e.getAttribute(`aria-label`)||e.getAttribute(`data-tooltip`)||``).toLowerCase();return t.includes(`present`)||t.includes(`screen`)||t.includes(`compartir`)||t.includes(`presentar`)});e&&e.click()}if(e.data.type===`OXIQ_TOGGLE_CC`){console.log(`[OxiqAI] Remote toggle captions triggered.`);let e=Array.from(document.querySelectorAll(`button, [role="button"]`)).find(e=>{let t=(e.getAttribute(`aria-label`)||e.getAttribute(`data-tooltip`)||``).toLowerCase();return t.includes(`captions`)||t.includes(`cc`)||t.includes(`subtítulo`)||t.includes(`sous-titre`)});e&&e.click()}if(e.data.type===`OXIQ_TOGGLE_HAND`){console.log(`[OxiqAI] Remote toggle hand raise triggered.`);let e=Array.from(document.querySelectorAll(`button, [role="button"]`)).find(e=>{let t=(e.getAttribute(`aria-label`)||e.getAttribute(`data-tooltip`)||``).toLowerCase();return t.includes(`hand`)||t.includes(`mano`)||t.includes(`main`)});e&&e.click()}if(e.data.type===`OXIQ_TOGGLE_EMOJI`){console.log(`[OxiqAI] Remote toggle emoji panel triggered.`);let e=Array.from(document.querySelectorAll(`button, [role="button"]`)).find(e=>{let t=(e.getAttribute(`aria-label`)||e.getAttribute(`data-tooltip`)||``).toLowerCase();return t.includes(`reaction`)||t.includes(`emoji`)||t.includes(`reacción`)});e&&e.click()}if(e.data.type===`OXIQ_TOGGLE_MORE`||e.data.type===`OXIQ_TOGGLE_DOTS`){console.log(`[OxiqAI] Remote toggle more options triggered.`);let e=Array.from(document.querySelectorAll(`button, [role="button"]`)).find(e=>{let t=(e.getAttribute(`aria-label`)||e.getAttribute(`data-tooltip`)||``).toLowerCase();return t.includes(`more options`)||t.includes(`más opciones`)||t.includes(`autres options`)||t.includes(`options`)});e&&e.click()}if(e.data.type===`OXIQ_TOGGLE_HOST`){console.log(`[OxiqAI] Remote toggle host controls triggered.`);let e=Array.from(document.querySelectorAll(`button, [role="button"]`)).find(e=>{let t=(e.getAttribute(`aria-label`)||e.getAttribute(`data-tooltip`)||``).toLowerCase();return t.includes(`host control`)||t.includes(`moderador`)||t.includes(`organisateur`)});e&&e.click()}}});try{console.log(`[OxiqAI] Extension content script active. Dispatching OXIQ_EXTENSION_READY.`),window.parent.postMessage({type:`OXIQ_EXTENSION_READY`},`*`)}catch(e){console.error(`[OxiqAI] Failed to dispatch readiness handshake:`,e)}function x(){let e=window.location.pathname;(e===`/`||e.includes(`/landing`)||e.includes(`/about`))&&!document.getElementById(`oxiqai-gateway-prompt`)&&(console.log(`[OxiqAI Engine] Guest landing trap caught. Injecting branded gateway overlay...`),S())}function S(){let e=document.querySelector(`[jsname="OW330d"]`);e&&e.style.setProperty(`display`,`none`,`important`);let t=document.createElement(`div`);t.id=`oxiqai-gateway-prompt`,t.style.cssText=`
    position: fixed; inset: 0;
    background: radial-gradient(circle at center, #0f172a 0%, #090d16 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    z-index: 2147483647; font-family: 'Inter', sans-serif; color: #f8fafc;
  `,t.innerHTML=`
    <div style="max-width: 420px; width: 90%; padding: 36px 28px; background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; text-align: center; backdrop-filter: blur(16px); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
      <div style="width: 52px; height: 52px; background: linear-gradient(135deg, #0ea5e9, #6366f1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; color: #fff; margin: 0 auto 16px auto; box-shadow: 0 0 20px rgba(14, 165, 233, 0.35);">O</div>
      <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.3px;">Secure Portal Authentication</h2>
      <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(14, 165, 233, 0.1); border: 1px solid rgba(14, 165, 233, 0.25); color: #38bdf8; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 600; margin-bottom: 20px;">🛡️ SECURITY GATEWAY</div>
      <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px 0;">To connect to this OxiqAI workspace streaming channel, your browser profile requires an active Google account initialization. Please sign in briefly to link your video pipelines.</p>
      <button id="btn-google-signin" style="width: 100%; background: linear-gradient(135deg, #0ea5e9, #6366f1); border: none; padding: 12px; border-radius: 8px; color: #fff; font-weight: 600; font-size: 14px; cursor: pointer; box-shadow: 0 4px 12px rgba(14,165,233,0.25);">Initialize Google Sync Account</button>
      <button id="btn-refresh-sync" style="background:none; border:none; color:#64748b; font-size:12px; margin-top:14px; cursor:pointer; font-weight:500; font-family:inherit;">🔄 Click here to refresh after signing in</button>
    </div>
  `,document.body.appendChild(t);let n=t.querySelector(`#btn-google-signin`);n&&n.addEventListener(`click`,()=>{window.open(`https://accounts.google.com/ServiceLogin?service=meetings`,`_blank`,`width=500,height=600`)});let r=t.querySelector(`#btn-refresh-sync`);r&&r.addEventListener(`click`,()=>{window.location.reload()})}function C(){let e=Array.from(document.querySelectorAll(`button, span, div`)).find(e=>{let t=e.textContent?.toLowerCase()||``;return t===`admit`||t===`admit all`||t.includes(`admit entry`)||t===`admitir`||t===`admitir a todos`});e&&(console.log(`[OxiqAI Engine] Incoming participant detected. Executing auto-admit click event...`),e.click())}function w(){let e=window.location.pathname===`/_meet/disconnected`||window.location.href.includes(`google.com/meet/disconnected`),t=Array.from(document.querySelectorAll(`h1, h2`)).some(e=>{let t=e.textContent?.toLowerCase()||``;return t.includes(`left the meeting`)||t.includes(`left the call`)||t.includes(`has ended`)||t.includes(`reunión ha terminado`)||t.includes(`ended for everyone`)}),n=Array.from(document.querySelectorAll(`button`)).some(e=>{let t=e.textContent?.toLowerCase()||``;return t.includes(`rejoin`)||t.includes(`unirse de nuevo`)||t.includes(`volver a unirse`)});(e||t)&&!n&&!document.getElementById(`oxiqai-end-overlay`)&&(console.log(`[OxiqAI] Detected Google Meet meeting concluding / disconnecting. Injecting Conclude Splash UI...`),T())}function T(){document.body.innerHTML=``;let e=document.createElement(`div`);e.id=`oxiqai-end-overlay`,e.style.cssText=`
    position: fixed; inset: 0;
    background: radial-gradient(circle at center, #0f172a 0%, #090d16 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    z-index: 2147483647; font-family: 'Inter', sans-serif; color: #f8fafc;
  `,e.innerHTML=`
    <div style="max-width: 400px; width: 90%; padding: 32px; background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; text-align: center; backdrop-filter: blur(16px); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
      <div style="width: 52px; height: 52px; background: linear-gradient(135deg, #0ea5e9, #6366f1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; color: #fff; margin: 0 auto 16px auto; box-shadow: 0 0 20px rgba(14, 165, 233, 0.35);">O</div>
      <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">Session Concluded</h2>
      <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.25); color: #f59e0b; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 600; margin-bottom: 16px;">⚠️ TIMEOUT PROTECT</div>
      <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px 0;">This secure meeting room has been closed automatically due to inactivity layout limits. Your transcription metrics logs have been safely batched to Supabase.</p>
      <button id="btn-return-home" style="width: 100%; background: #0ea5e9; border: none; padding: 12px; border-radius: 8px; color: #fff; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s;">Return to Dashboard</button>
    </div>
  `,document.body.appendChild(e);let t=e.querySelector(`#btn-return-home`);t&&t.addEventListener(`click`,()=>{console.log(`[OxiqAI] Dispatching PORTAL_REDIRECT_HOME postMessage...`),window.parent.postMessage({action:`PORTAL_REDIRECT_HOME`},`*`)})}window.self!==window.top&&(console.log(`[OxiqAI] Detected iframe execution. Initializing dynamic layout MutationObserver...`),g(),_(),v(),x(),w(),C(),autoBypassGreenRoom(),y(),setInterval(y,1500),new MutationObserver(()=>{g(),_(),v(),x(),w(),C(),autoBypassGreenRoom()}).observe(document.documentElement,{childList:!0,subtree:!0}));