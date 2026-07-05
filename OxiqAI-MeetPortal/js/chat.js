// ==========================================================================
// OxiqAI Meeting Room — Chat Module
// ==========================================================================

import { saveChatMessage } from './supabase.js';

/**
 * Format current time as HH:MM
 */
function formatTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

/**
 * Escape HTML to prevent XSS.
 */
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Send a chat message.
 */
async function sendChatMessage(roomId, displayName) {
    const input = document.getElementById('chat-input');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    try {
        await saveChatMessage(roomId, displayName, text);
    } catch (err) {
        console.error('Error sending chat message:', err);
    }

    input.value = '';
    input.focus();
}

/**
 * Initialize the chat panel — wire up send button and Enter key.
 * @param {string} roomId
 * @param {string} displayName
 */
export function initChat(roomId, displayName) {
    const sendBtn  = document.getElementById('chat-send-btn');
    const chatInput = document.getElementById('chat-input');

    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            sendChatMessage(roomId, displayName);
        });
    }

    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage(roomId, displayName);
            }
        });
    }
}

/**
 * Render chat messages into the container.
 * @param {Array} messages - Array of message objects {sender/display_name, text/content, timestamp/created_at}
 * @param {HTMLElement} container - The #chat-list element
 */
export function renderMessages(messages, container) {
    if (!container) return;

    // Auto-scroll only if user is near the bottom
    const wasAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 60;

    container.innerHTML = '';

    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>No messages yet.<br>Start the conversation!</span>
            </div>
        `;
        return;
    }

    messages.forEach(msg => {
        const card = document.createElement('div');
        card.className = 'chat-msg';

        const sender    = msg.sender_name || msg.sender || msg.display_name || 'Unknown';
        const text      = msg.message || msg.text || msg.content || '';
        const timestamp = msg.timestamp || msg.created_at || '';

        // Format timestamp if it's an ISO string
        let displayTime = timestamp;
        if (timestamp && timestamp.includes('T')) {
            try {
                const d = new Date(timestamp);
                displayTime = d.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            } catch (_) {
                // keep original
            }
        }

        card.innerHTML = `
            <div class="chat-header">
                <span class="chat-sender">${escapeHTML(sender)}</span>
                <span class="chat-time">${escapeHTML(displayTime)}</span>
            </div>
            <div class="chat-text">${escapeHTML(text)}</div>
        `;
        container.appendChild(card);
    });

    if (wasAtBottom) {
        container.scrollTop = container.scrollHeight;
    }
}
