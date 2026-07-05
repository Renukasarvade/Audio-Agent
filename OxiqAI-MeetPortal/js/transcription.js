// ==========================================================================
// OxiqAI Meeting Room — Transcription Module (Web Speech API)
// ==========================================================================

import { saveTranscript } from './supabase.js';

let recognition = null;
let isActive = false;

/**
 * Format current time as HH:MM:SS
 */
function formatTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

/**
 * Start live transcription using the Web Speech API.
 * @param {string} roomId      - Current room identifier
 * @param {string} displayName - Name of the current speaker
 * @param {function} onTranscriptCallback - Called with {speaker, text, timestamp} for each final result
 */
export function startTranscription(roomId, displayName, onTranscriptCallback) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.warn('SpeechRecognition API not supported in this browser.');
        alert('Live transcription is not supported in your browser. Please use Chrome.');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    isActive = true;

    recognition.onresult = async (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                const text = event.results[i][0].transcript.trim();
                if (!text) continue;

                const timestamp = formatTime();

                // Persist to Supabase
                try {
                    await saveTranscript(roomId, displayName, text, timestamp);
                } catch (err) {
                    console.error('Error saving transcript:', err);
                }

                // Notify caller
                if (typeof onTranscriptCallback === 'function') {
                    onTranscriptCallback({
                        speaker: displayName,
                        text,
                        timestamp
                    });
                }
            }
        }
    };

    recognition.onend = () => {
        // Auto-restart if still active
        if (isActive && recognition) {
            try {
                recognition.start();
            } catch (err) {
                console.warn('Recognition restart failed:', err);
            }
        }
    };

    recognition.onerror = (event) => {
        console.error('SpeechRecognition error:', event.error);
        // Auto-restart on recoverable errors
        if (isActive && event.error !== 'not-allowed' && event.error !== 'service-not-allowed') {
            setTimeout(() => {
                if (isActive && recognition) {
                    try {
                        recognition.start();
                    } catch (err) {
                        console.warn('Recognition restart after error failed:', err);
                    }
                }
            }, 500);
        }
    };

    recognition.start();
}

/**
 * Stop live transcription.
 */
export function stopTranscription() {
    isActive = false;
    if (recognition) {
        try {
            recognition.stop();
        } catch (err) {
            // Ignore if already stopped
        }
        recognition = null;
    }
}

/**
 * Render transcript entries into a container element.
 * @param {Array} transcripts - Array of {speaker, text, timestamp} objects
 * @param {HTMLElement} container - The DOM element to render into
 */
export function renderTranscripts(transcripts, container) {
    if (!container) return;

    // Preserve scroll position — only auto-scroll if user is near bottom
    const wasAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 60;

    container.innerHTML = '';

    if (!transcripts || transcripts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
                <span>No transcripts yet.<br>Click <strong>Start</strong> to begin.</span>
            </div>
        `;
        return;
    }

    transcripts.forEach(t => {
        const bubble = document.createElement('div');
        bubble.className = 'transcript-bubble';
        bubble.innerHTML = `
            <div class="bubble-header">
                <span class="bubble-speaker">${escapeHTML(t.speaker || t.display_name || 'Unknown')}</span>
                <span class="bubble-time">${escapeHTML(t.timestamp || t.time || '')}</span>
            </div>
            <div class="bubble-text">${escapeHTML(t.text || t.content || '')}</div>
        `;
        container.appendChild(bubble);
    });

    // Auto-scroll
    if (wasAtBottom) {
        container.scrollTop = container.scrollHeight;
    }
}

/**
 * Escape HTML special characters to prevent XSS.
 */
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
