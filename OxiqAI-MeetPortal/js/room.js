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
} from './supabase.js';

import { startTranscription, stopTranscription, renderTranscripts } from './transcription.js';
import { initChat, renderMessages } from './chat.js';
import { initFiles, renderFiles } from './files.js';

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
    leaveBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // ================================================================
    // Transcription (Web Speech API)
    // ================================================================
    const transcriptToggle = document.getElementById('transcript-toggle');
    const transcriptStatus = document.getElementById('transcript-status');
    const transcriptList   = document.getElementById('transcript-list');
    let transcribing = false;

    transcriptToggle.addEventListener('click', () => {
        if (!transcribing) {
            startTranscription(roomId, displayName, () => {
                pollTranscripts();
            });
            transcribing = true;
            transcriptToggle.classList.add('active');
            transcriptStatus.textContent = 'Stop';
        } else {
            stopTranscription();
            transcribing = false;
            transcriptToggle.classList.remove('active');
            transcriptStatus.textContent = 'Start';
        }
    });

    async function pollTranscripts() {
        try {
            const transcripts = await fetchTranscripts(roomId);
            if (transcripts) {
                renderTranscripts(transcripts, transcriptList);
            }
        } catch (err) {
            console.error('Transcript poll error:', err);
        }
    }

    setInterval(pollTranscripts, 3000);
    pollTranscripts();

    // ================================================================
    // Chat
    // ================================================================
    initChat(roomId, displayName);

    const chatList = document.getElementById('chat-list');

    async function pollChat() {
        try {
            const messages = await fetchChatMessages(roomId);
            if (messages) {
                renderMessages(messages, chatList);
            }
        } catch (err) {
            console.error('Chat poll error:', err);
        }
    }

    setInterval(pollChat, 3000);
    pollChat();

    // ================================================================
    // Files
    // ================================================================
    const filesList = document.getElementById('files-list');

    async function pollFiles() {
        try {
            const files = await fetchFiles(roomId);
            if (files) {
                renderFiles(files, filesList);
            }
        } catch (err) {
            console.error('Files poll error:', err);
        }
    }

    initFiles(roomId, displayName, () => {
        pollFiles();
    });

    setInterval(pollFiles, 3000);
    pollFiles();

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
