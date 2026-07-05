/* ═══════════════════════════════════════════════════════════
   OxiqAI Meeting Portal — Dashboard Logic (dashboard.js)
   ═══════════════════════════════════════════════════════════ */

import { createMeeting as apiCreateMeeting, fetchMeetings } from './supabase.js';

// ── DOM References ──────────────────────────────────────────
const modalOverlay     = document.getElementById('modal-overlay');
const titleInput       = document.getElementById('meeting-title-input');
const meetingLinkInput = document.getElementById('meeting-link-input');
const formHint         = document.getElementById('form-hint');
const roomLinkBox      = document.getElementById('room-link-box');
const roomLinkOutput   = document.getElementById('room-link-output');
const meetingsTbody    = document.getElementById('meetings-tbody');
const emptyState       = document.getElementById('empty-state');
const meetingsTable    = document.getElementById('meetings-table');
const statTotal        = document.getElementById('stat-total-value');
const statGoogle       = document.getElementById('stat-google-value');
const statTeams        = document.getElementById('stat-teams-value');
const modalBadge       = document.getElementById('modal-platform-badge');
const modalPlatformIcon= document.getElementById('modal-platform-icon');
const modalPlatformName= document.getElementById('modal-platform-name');

let selectedPlatform = 'google_meet';

// ── Helpers ─────────────────────────────────────────────────
function generateRoomId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `oxiqai-${id}`;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getPlatformLabel(platform) {
  if (platform === 'google_meet') return 'Google Meet';
  if (platform === 'microsoft_teams') return 'Microsoft Teams';
  return platform;
}

function getPlatformColor(platform) {
  if (platform === 'google_meet') return '#34a853';
  if (platform === 'microsoft_teams') return '#6264a7';
  return '#0ea5e9';
}

// ── Modal Controls ──────────────────────────────────────────
window.openModal = function openModal(platform) {
  selectedPlatform = platform || 'google_meet';
  modalOverlay.classList.add('active');
  roomLinkBox.style.display = 'none';
  titleInput.value = '';
  meetingLinkInput.value = '';
  formHint.textContent = '';

  // Update modal badge
  if (selectedPlatform === 'google_meet') {
    modalPlatformIcon.textContent = '📹';
    modalPlatformName.textContent = 'Google Meet';
    modalBadge.style.background = 'rgba(52, 168, 83, 0.15)';
    modalBadge.style.borderColor = 'rgba(52, 168, 83, 0.3)';
    modalPlatformName.style.color = '#34a853';
    meetingLinkInput.placeholder = 'https://meet.google.com/abc-defg-hij';
    formHint.textContent = '💡 Go to meet.google.com → "New meeting" → copy link and paste here';
  } else {
    modalPlatformIcon.textContent = '💻';
    modalPlatformName.textContent = 'Microsoft Teams';
    modalBadge.style.background = 'rgba(98, 100, 167, 0.15)';
    modalBadge.style.borderColor = 'rgba(98, 100, 167, 0.3)';
    modalPlatformName.style.color = '#6264a7';
    meetingLinkInput.placeholder = 'https://teams.microsoft.com/l/meetup-join/...';
    formHint.textContent = '💡 Go to Teams → Schedule a meeting → copy link and paste here';
  }
  setTimeout(() => titleInput.focus(), 100);
};

window.generateMeetingLink = function generateMeetingLink() {
  const btn = document.getElementById('btn-generate-meet-link');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '⚡ Generating...';

  function generateFallbackLink() {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const randStr = (len) => {
      let s = '';
      for (let i = 0; i < len; i++) s += letters.charAt(Math.floor(Math.random() * letters.length));
      return s;
    };
    if (selectedPlatform === 'google_meet') {
      meetingLinkInput.value = `https://meet.google.com/${randStr(3)}-${randStr(4)}-${randStr(3)}`;
    } else {
      meetingLinkInput.value = `https://teams.live.com/meet/${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    }
    btn.disabled = false;
    btn.innerHTML = originalText;
  }

  // Silently fall back to a generated link after 5s if extension doesn't reply
  let fallbackTimeout = setTimeout(() => {
    window.removeEventListener('OXIQ_AUTO_MEET_SUCCESS', successHandler);
    window.removeEventListener('OXIQ_AUTO_MEET_FAILED', errorHandler);
    generateFallbackLink();
  }, 5000);

  const successHandler = (e) => {
    clearTimeout(fallbackTimeout);
    window.removeEventListener('OXIQ_AUTO_MEET_SUCCESS', successHandler);
    window.removeEventListener('OXIQ_AUTO_MEET_FAILED', errorHandler);
    btn.disabled = false;
    btn.innerHTML = originalText;
    if (e.detail?.link) {
      meetingLinkInput.value = e.detail.link;
    }
  };

  const errorHandler = () => {
    clearTimeout(fallbackTimeout);
    window.removeEventListener('OXIQ_AUTO_MEET_SUCCESS', successHandler);
    window.removeEventListener('OXIQ_AUTO_MEET_FAILED', errorHandler);
    generateFallbackLink();
  };

  window.addEventListener('OXIQ_AUTO_MEET_SUCCESS', successHandler);
  window.addEventListener('OXIQ_AUTO_MEET_FAILED', errorHandler);

  window.dispatchEvent(new CustomEvent('OXIQ_TRIGGER_AUTO_MEET', { detail: { platform: selectedPlatform } }));
};

// ── Create Meeting ──────────────────────────────────────────
window.createMeeting = async function createMeeting() {
  const title = titleInput.value.trim();
  const meetingLink = meetingLinkInput.value.trim();

  if (!title) {
    titleInput.style.borderColor = '#ef4444';
    titleInput.focus();
    setTimeout(() => (titleInput.style.borderColor = ''), 1500);
    return;
  }

  if (!meetingLink) {
    meetingLinkInput.style.borderColor = '#ef4444';
    meetingLinkInput.focus();
    formHint.textContent = '⚠️ Please paste your Google Meet or Teams meeting link';
    formHint.style.color = '#ef4444';
    setTimeout(() => {
      meetingLinkInput.style.borderColor = '';
      formHint.style.color = '';
    }, 2000);
    return;
  }

  const btnCreate = document.getElementById('btn-create-room');
  const originalText = btnCreate.innerHTML;
  btnCreate.disabled = true;
  btnCreate.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-icon"><circle cx="12" cy="12" r="10"/></svg>
    Creating…`;

  try {
    const roomId = generateRoomId();
    await apiCreateMeeting(roomId, title, 'admin', selectedPlatform, meetingLink);

    // Show OxiqAI room link
    const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
    const roomLink = `${baseUrl}room.html?id=${roomId}`;
    roomLinkOutput.value = roomLink;
    roomLinkBox.style.display = 'block';

    // Refresh table
    await loadMeetings();
  } catch (err) {
    console.error('Failed to create meeting:', err);
    alert('Failed to create meeting. Check console for details.');
  } finally {
    btnCreate.disabled = false;
    btnCreate.innerHTML = originalText;
  }
};

// ── Copy Room Link ──────────────────────────────────────────
window.copyRoomLink = function copyRoomLink() {
  const link = roomLinkOutput.value;
  navigator.clipboard.writeText(link).then(() => {
    const btn = document.getElementById('btn-copy-link');
    const original = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.color = '#10b981';
    setTimeout(() => {
      btn.textContent = original;
      btn.style.color = '';
    }, 2000);
  });
};

// ── Render Meetings ─────────────────────────────────────────
function renderMeetings(meetings) {
  if (!meetings || meetings.length === 0) {
    meetingsTable.style.display = 'none';
    emptyState.style.display = 'block';
    statTotal.textContent = '0';
    statGoogle.textContent = '0';
    statTeams.textContent = '0';
    return;
  }

  meetingsTable.style.display = '';
  emptyState.style.display = 'none';

  // Update stats
  statTotal.textContent = meetings.length;
  statGoogle.textContent = meetings.filter(m => m.platform === 'google_meet').length;
  statTeams.textContent = meetings.filter(m => m.platform === 'microsoft_teams').length;

  // Build rows
  meetingsTbody.innerHTML = meetings
    .map(
      (m) => `
    <tr>
      <td>${escapeHtml(m.title || 'Untitled')}</td>
      <td>
        <span class="platform-badge" style="color: ${getPlatformColor(m.platform)}; background: ${getPlatformColor(m.platform)}15; border: 1px solid ${getPlatformColor(m.platform)}30;">
          ${m.platform === 'google_meet' ? '📹' : '💻'} ${getPlatformLabel(m.platform)}
        </span>
      </td>
      <td><span class="room-id-text">${escapeHtml(m.room_id)}</span></td>
      <td><span class="date-text">${formatDate(m.created_at)}</span></td>
      <td>
        <span class="status-badge status-badge--${m.status === 'active' ? 'active' : 'ended'}">
          <span class="status-badge__dot"></span>
          ${m.status === 'active' ? 'Active' : 'Ended'}
        </span>
      </td>
      <td>
        <a href="room.html?id=${encodeURIComponent(m.room_id)}" class="btn-join">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Join
        </a>
      </td>
    </tr>`
    )
    .join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Load Meetings ───────────────────────────────────────────
async function loadMeetings() {
  try {
    const meetings = await fetchMeetings();
    renderMeetings(meetings);
  } catch (err) {
    console.error('Failed to fetch meetings:', err);
    renderMeetings([]);
  }
}

// ── Spin animation for loading button ───────────────────────
const spinStyle = document.createElement('style');
spinStyle.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin-icon { animation: spin 0.8s linear infinite; }
`;
document.head.appendChild(spinStyle);

window.closeModal = function closeModal() {
  modalOverlay.classList.remove('active');
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.closeModal();
});

// ── Init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadMeetings();
});
