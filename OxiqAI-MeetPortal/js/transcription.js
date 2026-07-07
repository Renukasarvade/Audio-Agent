// ==========================================================================
// OxiqAI Meeting Room — Transcription Isolated Hardware Engine
// ==========================================================================
import { saveTranscript } from './supabase.js';

let recognition = null;
let isActive = false;

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function formatTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export function startTranscription(roomId, displayName, onTranscriptCallback) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.warn('[OxiqAI Voice] Target browser lacks Speech API framework integration.');
        return;
    }

    // FIX: Set audio capturing constraints explicitly. Video MUST be false to avoid webcam resource blocks
    navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
    }).then(() => {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        isActive = true;

        recognition.onresult = async (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const chunk = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    const text = chunk.trim();
                    if (!text) continue;
                    const timestamp = formatTime();

                    const liveBox = document.getElementById('oxiq-interim-box');
                    if (liveBox) liveBox.remove();

                    try {
                        await saveTranscript(roomId, displayName, text, timestamp);
                    } catch (err) {
                        console.error('Error writing transcript segment:', err);
                    }

                    if (typeof onTranscriptCallback === 'function') {
                        onTranscriptCallback({ speaker: displayName, text, timestamp });
                    }
                } else {
                    interimTranscript += chunk;
                }
            }

            const container = document.getElementById('transcripts-list');
            if (container && interimTranscript.trim()) {
                let liveBox = document.getElementById('oxiq-interim-box');
                if (!liveBox) {
                    liveBox = document.createElement('div');
                    liveBox.id = 'oxiq-interim-box';
                    liveBox.style.cssText = 'padding: 8px; font-style: italic; color: #64748b; font-size: 13px;';
                    container.appendChild(liveBox);
                }
                liveBox.innerHTML = `<b>${escapeHTML(displayName)} (Typing...):</b> ${escapeHTML(interimTranscript)}`;
                container.scrollTop = container.scrollHeight;
            }
        };

        recognition.onend = () => {
            if (isActive && recognition) {
                try { recognition.start(); } catch (_) {}
            }
        };

        recognition.start();
        console.log('[OxiqAI Voice] Hardware isolated microphone engine active.');
    }).catch(err => {
        console.error('[OxiqAI Voice] Microphone permission tracking failed:', err);
    });
}

export function stopTranscription() {
    isActive = false;
    if (recognition) {
        try { recognition.stop(); } catch (_) {}
        recognition = null;
    }
}

export function renderTranscripts(transcripts, container) {
    if (!container) return;
    const wasAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 60;
    const liveBox = document.getElementById('oxiq-interim-box');

    if (!transcripts || transcripts.length === 0) {
        container.innerHTML = `<div class="empty-state" style="padding:24px; color:#64748b; text-align:center; font-size:13px;">Streaming transcripts live...</div>`;
        container.dataset.renderedCount = '0';
        return;
    }

    const renderedCount = parseInt(container.dataset.renderedCount || '0', 10);
    if (renderedCount === 0 || container.querySelector('.empty-state')) {
        container.innerHTML = '';
        if (liveBox) container.appendChild(liveBox); // keep live box at bottom if it was there
    }

    for (let i = renderedCount; i < transcripts.length; i++) {
        const t = transcripts[i];
        const bubble = document.createElement('div');
        if (t.id) {
            bubble.id = 'transcript-bubble-' + t.id;
        }
        bubble.className = 'transcript-bubble';
        bubble.style.cssText = 'margin-bottom:12px; padding:8px 12px; background:rgba(255,255,255,0.02); border-radius:6px; border-left:3px solid #38bdf8;';
        bubble.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
                <b style="color:#60a5fa;">${escapeHTML(t.speaker || t.display_name || 'Unknown')}</b>
                <span style="color:#64748b;">${escapeHTML(t.timestamp || t.time || '')}</span>
            </div>
            <div style="font-size:13px; color:#f1f5f9; line-height:1.4;">${escapeHTML(t.text || t.content || '')}</div>
        `;
        
        // Insert before liveBox if it exists, otherwise append
        if (liveBox && liveBox.parentNode === container) {
            container.insertBefore(bubble, liveBox);
        } else {
            container.appendChild(bubble);
        }
    }

    container.dataset.renderedCount = transcripts.length;

    if (wasAtBottom) container.scrollTop = container.scrollHeight;
}
