/* ═══════════════════════════════════════════════════════════
   OxiqAI Meeting Portal — Supabase Client (supabase.js)
   ═══════════════════════════════════════════════════════════ */

// ── Constants ────────────────────────────────────────────────
export const SUPABASE_URL = 'https://cbbkquksmgkfvezqspul.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_LUQNefdS-HV_TNSam2TNkg_nyd48iJ6';

export const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;


// ── Generic Request Helper ──────────────────────────────────
export async function supabaseRequest(endpoint, method = 'GET', body = null) {
  const url = `${SUPABASE_URL}${endpoint}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'return=representation' : undefined,
  };

  // Remove undefined headers
  Object.keys(headers).forEach((k) => {
    if (headers[k] === undefined) delete headers[k];
  });

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase ${method} ${endpoint} failed (${response.status}): ${errorText}`);
  }

  // Some endpoints (204) may return no body
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// ── Meetings ────────────────────────────────────────────────
export async function createMeeting(roomId, title, createdBy = 'admin', platform = 'google_meet', meetingLink = '') {
  return supabaseRequest('/rest/v1/meetings', 'POST', {
    room_id: roomId,
    title,
    created_by: createdBy,
    platform,
    meeting_link: meetingLink,
  });
}

export async function fetchMeetings() {
  return supabaseRequest('/rest/v1/meetings?order=created_at.desc');
}

// ── Chat Messages ───────────────────────────────────────────
export async function saveChatMessage(roomId, senderName, message) {
  return supabaseRequest('/rest/v1/meeting_chats', 'POST', {
    room_id: roomId,
    sender_name: senderName,
    message,
  });
}

export async function fetchChatMessages(roomId) {
  return supabaseRequest(
    `/rest/v1/meeting_chats?room_id=eq.${encodeURIComponent(roomId)}&order=created_at.asc`
  );
}

// ── Live Transcripts ────────────────────────────────────────
export async function saveTranscript(roomId, speaker, text, timestamp) {
  return supabaseRequest('/rest/v1/meeting_transcripts_live', 'POST', {
    room_id: roomId,
    speaker,
    text,
    timestamp,
  });
}

export async function fetchTranscripts(roomId) {
  return supabaseRequest(
    `/rest/v1/meeting_transcripts_live?room_id=eq.${encodeURIComponent(roomId)}&order=created_at.asc`
  );
}

// ── File Records ────────────────────────────────────────────
export async function saveFileRecord(roomId, uploaderName, fileName, filePath, fileSize) {
  return supabaseRequest('/rest/v1/meeting_files', 'POST', {
    room_id: roomId,
    uploader_name: uploaderName,
    file_name: fileName,
    file_path: filePath,
    file_size: fileSize,
  });
}

export async function fetchFiles(roomId) {
  return supabaseRequest(
    `/rest/v1/meeting_files?room_id=eq.${encodeURIComponent(roomId)}&order=created_at.asc`
  );
}

// ── Storage ─────────────────────────────────────────────────
export async function uploadFileToStorage(file, roomId) {
  const filePath = `${roomId}/${file.name}`;
  const url = `${SUPABASE_URL}/storage/v1/object/meeting-resources/${filePath}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Storage upload failed (${response.status}): ${errorText}`);
  }

  return { filePath };
}

export function getFileDownloadUrl(filePath) {
  return `${SUPABASE_URL}/storage/v1/object/public/meeting-resources/${filePath}`;
}
