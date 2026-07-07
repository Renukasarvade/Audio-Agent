// ==========================================================================
// OxiqAI Meeting Room — Main Controller
// Embeds Google Meet / Microsoft Teams inside OxiqAI wrapper via iframe
// (Extension strips X-Frame-Options headers to allow embedding)
// ==========================================================================

import {
    supabaseRequest,
    fetchChatMessages,
    fetchTranscripts,
    fetchFiles,
    supabase,
} from './supabase.js';

import { startTranscription, stopTranscription, renderTranscripts } from './transcription.js';
import { initChat, renderMessages } from './chat.js';
import { initFiles, renderFiles } from './files.js';

function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
}

// ---------- Room Identification ----------
const params   = new URLSearchParams(window.location.search);
const roomId   = params.get('id');

if (!roomId) {
    window.location.href = 'index.html';
}

// ---------- Display Name ----------
let displayName = prompt('Enter your display name for the meeting:') || 'Guest';

// ---------- Export for other modules ----------
export { roomId, displayName };

// ==========================================================================
// DOM Content Loaded
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // ---- Fetch Meeting Details from Supabase ----
    let meetingData = null;
    try {
        const meetings = await supabaseRequest(`/rest/v1/meetings?room_id=eq.${encodeURIComponent(roomId)}&limit=1`);
        if (meetings && meetings.length > 0) {
            meetingData = meetings[0];
        }
    } catch (err) {
        console.error('Failed to fetch meeting details:', err);
    }

    // Set fallback button click handler for users without extension
    const fallbackJoinBtn = document.getElementById('btn-fallback-join');
    if (fallbackJoinBtn && meetingData && meetingData.meeting_link) {
        fallbackJoinBtn.onclick = () => {
            window.open(meetingData.meeting_link, '_blank');
        };
    } else if (fallbackJoinBtn) {
        fallbackJoinBtn.style.display = 'none';
    }

    // ---- Chrome Extension Check ----
    const extensionScreen = document.getElementById('extension-check-screen');
    const hasExtension = document.documentElement.hasAttribute('data-oxiqai-extension-active');
    
    // Wait a brief moment to ensure content scripts had time to inject attribute
    if (!hasExtension) {
        await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    if (!document.documentElement.hasAttribute('data-oxiqai-extension-active')) {
        // Show extension install warning overlay and abort loading
        if (extensionScreen) {
            extensionScreen.style.display = 'flex';
        }
        const loadingEl = document.getElementById('video-loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
        return;
    }

    // ---- Set Meeting Title & Platform (Fallback) ----
    const titleEl = document.getElementById('meeting-title');
    const platformTag = document.getElementById('platform-tag');

    if (meetingData) {
        titleEl.textContent = meetingData.title || roomId;

        if (meetingData.platform === 'microsoft_teams') {
            platformTag.textContent = '💻 Microsoft Teams';
            platformTag.style.background = 'rgba(98, 100, 167, 0.15)';
            platformTag.style.color = '#6264a7';
        } else {
            platformTag.textContent = '📹 Google Meet';
            platformTag.style.background = 'rgba(52, 168, 83, 0.15)';
            platformTag.style.color = '#34a853';
        }
    } else {
        titleEl.textContent = roomId;
    }

    // ================================================================
    // Embed Google Meet / Teams in iframe
    // ================================================================
    const videoContainer = document.getElementById('video-container');
    const videoLoading = document.getElementById('video-loading');

    if (meetingData && meetingData.meeting_link) {
        let iframeSrc = meetingData.meeting_link;
        const extensionActive = document.documentElement.hasAttribute('data-oxiqai-extension-active');

        // FALLBACK: If extension is not active (e.g. TL or client joining without setup),
        // fallback to Jitsi Meet inside the iframe so it connects natively without extension blocks!
        if (!extensionActive) {
            iframeSrc = `https://meet.jit.si/oxiqai-${roomId}`;
            console.log('[OxiqAI] Extension not active. Falling back to Jitsi Meet:', iframeSrc);
        }

        const iframe = document.createElement('iframe');
        iframe.src = iframeSrc;
        iframe.id = 'meeting-iframe';
        iframe.allow = 'camera *; microphone *; display-capture *; autoplay; clipboard-write; encrypted-media';
        iframe.allowFullscreen = true;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '12px';

        let isInitialized = false;
        iframe.addEventListener('load', () => {
            videoLoading.style.display = 'none';

            // Only send the auto-initialize signal if the extension is active
            if (extensionActive) {
                const initInterval = setInterval(() => {
                    if (isInitialized) {
                        clearInterval(initInterval);
                        return;
                    }
                    iframe.contentWindow.postMessage({
                        type: 'OXIQ_INIT_MEETING',
                        roomId: roomId
                    }, '*');
                }, 1000);
            }
        });

        // Listen for handshake from contentScript
        if (extensionActive) {
            window.addEventListener('message', (event) => {
                if (event.data) {
                    if (event.data.type === 'OXIQ_INIT_ACK') {
                        isInitialized = true;
                        console.log('[OxiqAI] Extension successfully acknowledged init.');
                    }
                    if (event.data.type === 'OXIQ_EXTENSION_READY') {
                        console.log('[OxiqAI] Extension ready. Initializing room immediately.');
                        iframe.contentWindow.postMessage({
                            type: 'OXIQ_INIT_MEETING',
                            roomId: roomId
                        }, '*');
                    }
                    if (event.data.type === 'OXIQ_MIC_STATE') {
                        const btn = document.getElementById('cover-btn-mic');
                        if (btn) {
                            const isMuted = event.data.isMuted;
                            btn.classList.toggle('active', isMuted);
                            btn.style.background = isMuted ? '#ef4444' : '#334155';
                        }
                    }
                    if (event.data.type === 'OXIQ_CAM_STATE') {
                        const btn = document.getElementById('cover-btn-cam');
                        if (btn) {
                            const isMuted = event.data.isMuted;
                            btn.classList.toggle('active', isMuted);
                            btn.style.background = isMuted ? '#ef4444' : '#334155';
                        }
                    }
                    if (event.data.type === 'OXIQ_PARTICIPANT_COUNT') {
                        const countEl = document.getElementById('participant-count');
                        if (countEl) {
                            const count = event.data.count;
                            countEl.textContent = `${count} participant${count !== 1 ? 's' : ''}`;
                        }
                    }
                    if (event.data.type === 'OXIQ_PARTICIPANTS_LIST') {
                        const box = document.getElementById('oxiq-participants-box');
                        const badge = document.getElementById('oxiq-user-count-badge');
                        if (box) {
                            const activeUsers = event.data.list || [];
                            if (badge) badge.textContent = activeUsers.length.toString();
                            
                            box.innerHTML = activeUsers.map(name => `
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <div style="width:32px; height:32px; border-radius:50%; background:#1e293b; display:flex; align-items:center; justify-content:center; color:#e2e8f0; font-weight:600; border:1px solid rgba(255,255,255,0.1)">
                                        ${escapeHTML(name.substring(0,2).toUpperCase())}
                                    </div>
                                    <span style="color:#e2e8f0; font-size:13px;">${escapeHTML(name)}</span>
                                </div>
                            `).join('');
                        }
                    }
                    
                    if (event.data.type === 'OXIQ_INTERIM_TRANSCRIPT') {
                        const payload = event.data.segment;
                        const segId = event.data.id;
                        payload.id = segId;
                        
                        const container = document.getElementById('transcript-list');
                        if (container && payload.transcript_text) {
                            const bubbleId = 'transcript-bubble-' + segId;
                            let bubble = document.getElementById(bubbleId);
                            
                            const idx = localTranscripts.findIndex(t => t.id === segId);
                            if (idx !== -1) {
                                localTranscripts[idx] = payload;
                            } else {
                                localTranscripts.push(payload);
                            }

                            if (!bubble) {
                                bubble = document.createElement('div');
                                bubble.id = bubbleId;
                                bubble.className = 'transcript-bubble';
                                bubble.style.cssText = 'margin-bottom:12px; padding:8px 12px; background:rgba(255,255,255,0.02); border-radius:6px; border-left:3px solid #38bdf8;';
                                
                                const liveBox = document.getElementById('oxiq-interim-box');
                                if (liveBox && liveBox.parentNode === container) {
                                    container.insertBefore(bubble, liveBox);
                                } else {
                                    container.appendChild(bubble);
                                }
                                
                                const renderedCount = parseInt(container.dataset.renderedCount || '0', 10);
                                container.dataset.renderedCount = (renderedCount + 1).toString();
                            }
                            
                            bubble.innerHTML = `
                                <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
                                    <b style="color:#60a5fa;">${escapeHTML(payload.speaker || 'Unknown')}</b>
                                    <span style="color:#64748b;">${escapeHTML(payload.timestamp || '')}</span>
                                </div>
                                <div style="font-size:13px; color:#f1f5f9; line-height:1.4;">${escapeHTML(payload.transcript_text || '')}</div>
                            `;
                            
                            container.scrollTop = container.scrollHeight;
                        }
                    }

                    if (event.data.action === 'PORTAL_REDIRECT_HOME') {
                        console.log('[OxiqAI] Timeout redirect home requested.');
                        window.location.href = 'index.html';
                    }
                }
            });
        }

        videoContainer.appendChild(iframe);
    } else {
        videoLoading.innerHTML = `
            <div style="text-align:center; color: #94a3b8;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:12px;">
                    <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"/>
                </svg>
                <p style="font-size:16px; font-weight:600; color:#e2e8f0;">No meeting link found</p>
                <p style="font-size:13px;">Please check with the meeting admin.</p>
            </div>
        `;
    }

    window.toggleCoverMic = function toggleCoverMic() {
        const iframe = document.getElementById('meeting-iframe');
        const btn = document.getElementById('cover-btn-mic');
        if (iframe) {
            iframe.contentWindow.postMessage({ type: 'OXIQ_TOGGLE_MIC' }, '*');
            btn.classList.toggle('active');
            btn.style.background = btn.classList.contains('active') ? '#ef4444' : '#334155';
        }
    };

    window.toggleCoverCam = function toggleCoverCam() {
        const iframe = document.getElementById('meeting-iframe');
        const btn = document.getElementById('cover-btn-cam');
        if (iframe) {
            iframe.contentWindow.postMessage({ type: 'OXIQ_TOGGLE_CAM' }, '*');
            btn.classList.toggle('active');
            btn.style.background = btn.classList.contains('active') ? '#ef4444' : '#334155';
        }
    };

    window.toggleCoverScreen = function toggleCoverScreen() {
        const iframe = document.getElementById('meeting-iframe');
        if (iframe) {
            iframe.contentWindow.postMessage({ type: 'OXIQ_TOGGLE_SCREEN' }, '*');
        }
    };

    window.toggleCoverEmoji = function toggleCoverEmoji() {
        const iframe = document.getElementById('meeting-iframe');
        if (iframe) {
            iframe.contentWindow.postMessage({ type: 'OXIQ_TOGGLE_EMOJI' }, '*');
        }
    };

    window.toggleCoverCc = function toggleCoverCc() {
        const iframe = document.getElementById('meeting-iframe');
        const btn = document.getElementById('cover-btn-cc');
        if (iframe) {
            iframe.contentWindow.postMessage({ type: 'OXIQ_TOGGLE_CC' }, '*');
            btn.classList.toggle('active');
            btn.style.background = btn.classList.contains('active') ? '#ef4444' : '#334155';
        }
    };

    window.toggleCoverHand = function toggleCoverHand() {
        const iframe = document.getElementById('meeting-iframe');
        const btn = document.getElementById('cover-btn-hand');
        if (iframe) {
            iframe.contentWindow.postMessage({ type: 'OXIQ_TOGGLE_HAND' }, '*');
            btn.classList.toggle('active');
            btn.style.background = btn.classList.contains('active') ? '#ef4444' : '#334155';
        }
    };

    window.toggleCoverMore = function toggleCoverMore() {
        const iframe = document.getElementById('meeting-iframe');
        if (iframe) {
            iframe.contentWindow.postMessage({ type: 'OXIQ_TOGGLE_MORE' }, '*');
        }
    };

    window.toggleCoverHost = function toggleCoverHost() {
        const iframe = document.getElementById('meeting-iframe');
        if (iframe) {
            iframe.contentWindow.postMessage({ type: 'OXIQ_TOGGLE_HOST' }, '*');
        }
    };

    // ================================================================
    // Tab Switching
    // ================================================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    function switchTab(name) {
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === name);
        });
        tabPanels.forEach(panel => {
            panel.classList.toggle('active', panel.dataset.panel === name);
        });
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // ================================================================
    // Leave Meeting
    // ================================================================
    const leaveBtn = document.getElementById('leave-btn');
    if (leaveBtn) {
        leaveBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // ================================================================
    // Transcription (Web Speech API)
    // ================================================================
    const transcriptList = document.getElementById('transcript-list');

    // Automatically start transcription when entering the room
    startTranscription(roomId, displayName, () => {
        // Realtime subscription and syncData background interval handle updates
    });

    let localTranscripts = [];
    let localChats = [];
    let localFiles = [];

    // Load initial data
    async function loadInitialData() {
        try {
            const transcripts = await fetchTranscripts(roomId);
            if (transcripts) {
                localTranscripts = transcripts;
                renderTranscripts(localTranscripts, transcriptList);
            }
        } catch (err) {
            console.error('Initial Transcripts fetch error:', err);
        }

        try {
            const messages = await fetchChatMessages(roomId);
            if (messages) {
                localChats = messages;
                renderMessages(localChats, chatList);
            }
        } catch (err) {
            console.error('Initial Chats fetch error:', err);
        }

        try {
            const files = await fetchFiles(roomId);
            if (files) {
                localFiles = files;
                renderFiles(localFiles, filesList);
            }
        } catch (err) {
            console.error('Initial Files fetch error:', err);
        }
    }

    // Background sync fallback to keep all participants instantly updated (in case WebSockets fail/replicate slowly)
    async function syncData() {
        try {
            const transcripts = await fetchTranscripts(roomId);
            if (transcripts && JSON.stringify(transcripts) !== JSON.stringify(localTranscripts)) {
                localTranscripts = transcripts;
                renderTranscripts(localTranscripts, transcriptList);
            }
        } catch (err) {
            console.error('Sync transcripts error:', err);
        }

        try {
            const messages = await fetchChatMessages(roomId);
            if (messages && JSON.stringify(messages) !== JSON.stringify(localChats)) {
                localChats = messages;
                renderMessages(localChats, chatList);
            }
        } catch (err) {
            console.error('Sync messages error:', err);
        }

        try {
            const files = await fetchFiles(roomId);
            if (files && JSON.stringify(files) !== JSON.stringify(localFiles)) {
                localFiles = files;
                renderFiles(localFiles, filesList);
            }
        } catch (err) {
            console.error('Sync files error:', err);
        }
    }

    loadInitialData();
    // Reduced polling frequency from 2s to 30s to fix performance issues. Supabase realtime sockets handle instant sync.
    setInterval(syncData, 30000);

    // ================================================================
    // Chat & Files Setup
    // ================================================================
    initChat(roomId, displayName);
    const chatList = document.getElementById('chat-list');

    const filesList = document.getElementById('files-list');
    initFiles(roomId, displayName, () => {
        // Handled dynamically by realtime channel updates
    });

    // ================================================================
    // Supabase Realtime Subscription Channels (Instant WebSocket Sync)
    // ================================================================
    if (supabase) {
        supabase
            .channel(`room:${roomId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'meeting_transcripts_live',
                filter: `room_id=eq.${roomId}`
            }, (payload) => {
                // Prevent duplicate elements in the local list
                if (!localTranscripts.some(t => t.id === payload.new.id || (t.text === payload.new.text && t.speaker === payload.new.speaker && t.timestamp === payload.new.timestamp))) {
                    localTranscripts.push(payload.new);
                    renderTranscripts(localTranscripts, transcriptList);
                }
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'meeting_chats',
                filter: `room_id=eq.${roomId}`
            }, (payload) => {
                if (!localChats.some(c => c.id === payload.new.id)) {
                    localChats.push(payload.new);
                    renderMessages(localChats, chatList);
                }
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'meeting_files',
                filter: `room_id=eq.${roomId}`
            }, (payload) => {
                if (!localFiles.some(f => f.id === payload.new.id)) {
                    localFiles.push(payload.new);
                    renderFiles(localFiles, filesList);
                }
            })
            .subscribe((status) => {
                console.log(`[OxiqAI Realtime] Subscription status for room ${roomId}:`, status);
            });
    }

    window.copyInviteLink = function copyInviteLink() {
        navigator.clipboard.writeText(window.location.href);
        const btn = document.getElementById('invite-btn');
        if (btn) {
            const origHtml = btn.innerHTML;
            btn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Copied!
            `;
            btn.style.background = '#10b981';
            setTimeout(() => {
                btn.innerHTML = origHtml;
                btn.style.background = '';
            }, 2000);
        }
    };
});
