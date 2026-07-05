let supabaseUrl = '';
let supabaseKey = '';

async function loadConfig(): Promise<boolean> {
  if (supabaseUrl && supabaseKey) return true;

  return new Promise((resolve) => {
    chrome.storage.local.get(['supabaseUrl', 'supabaseKey'], (config) => {
      supabaseUrl = config.supabaseUrl || '';
      supabaseKey = config.supabaseKey || '';

      if (!supabaseUrl || !supabaseKey) {
        console.warn('[AudioAgent] Supabase URL or Key is not configured. Please open the extension popup to set them.');
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}

export interface SupabaseSegmentData {
  meeting_id: string;
  platform: string;
  meeting_day: string;
  meeting_date: string;
  speaker: string;
  transcript_text: string;
  timestamp: string;
}

export async function saveTranscriptSegmentsBatch(dataArray: SupabaseSegmentData[]): Promise<boolean> {
  if (dataArray.length === 0) return true;
  
  const ready = await loadConfig();
  if (!ready) return false;

  try {
    console.log(`[AudioAgent] Sending batch of ${dataArray.length} segments to Supabase...`);
    const response = await fetch(`${supabaseUrl}/rest/v1/meeting_transcripts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(dataArray)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AudioAgent] Supabase batch insert error:', response.status, errText);
      return false;
    }

    console.log('[AudioAgent] Batch insert successful.');
    return true;
  } catch (err) {
    console.error('[AudioAgent] Exception while batch inserting to Supabase:', err);
    return false;
  }
}

export async function saveLiveTranscriptSegment(roomId: string, speaker: string, text: string, timestamp: string): Promise<boolean> {
  const ready = await loadConfig();
  if (!ready) return false;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/meeting_transcripts_live`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        room_id: roomId,
        speaker: speaker,
        text: text,
        timestamp: timestamp
      })
    });
    return response.ok;
  } catch (err) {
    console.error('[AudioAgent] Exception while saving live segment:', err);
    return false;
  }
}

export async function saveChatMessage(roomId: string, senderName: string, message: string): Promise<boolean> {
  const ready = await loadConfig();
  if (!ready) return false;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/meeting_chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        room_id: roomId,
        sender_name: senderName,
        message: message
      })
    });
    return response.ok;
  } catch (err) {
    console.error('[AudioAgent] Exception while saving chat message:', err);
    return false;
  }
}

export async function fetchChatMessages(roomId: string): Promise<any[]> {
  const ready = await loadConfig();
  if (!ready) return [];

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/meeting_chats?room_id=eq.${encodeURIComponent(roomId)}&order=created_at.asc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (err) {
    console.error('[AudioAgent] Fetch chats exception:', err);
    return [];
  }
}

export interface SupabaseFileData {
  room_id: string;
  uploader_name: string;
  file_name: string;
  file_path: string;
  file_size: string;
}

export async function saveFileRecord(data: SupabaseFileData): Promise<boolean> {
  const ready = await loadConfig();
  if (!ready) return false;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/meeting_files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    });
    return response.ok;
  } catch (err) {
    console.error('[AudioAgent] Exception while saving file record:', err);
    return false;
  }
}

export async function fetchFiles(roomId: string): Promise<any[]> {
  const ready = await loadConfig();
  if (!ready) return [];

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/meeting_files?room_id=eq.${encodeURIComponent(roomId)}&order=created_at.asc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (err) {
    console.error('[AudioAgent] Fetch files exception:', err);
    return [];
  }
}

export async function fetchTranscripts(roomId: string): Promise<any[]> {
  const ready = await loadConfig();
  if (!ready) return [];

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/meeting_transcripts_live?room_id=eq.${encodeURIComponent(roomId)}&order=created_at.asc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (err) {
    console.error('[AudioAgent] Fetch transcripts exception:', err);
    return [];
  }
}

export async function uploadFileToSupabase(file: File | Blob, roomId: string, uploaderName: string, customName?: string): Promise<boolean> {
  const ready = await loadConfig();
  if (!ready) return false;

  try {
    const fileName = customName || `${Date.now()}_${(file as File).name?.replace(/[^a-zA-Z0-9.\\-_]/g, '') || 'file.txt'}`;
    const filePath = `${roomId}/${fileName}`;
    const bucketName = 'meeting-resources';
    
    const storageResponse = await fetch(`${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: file
    });

    if (!storageResponse.ok) {
      console.error('[AudioAgent] Storage upload failed', await storageResponse.text());
      return false;
    }
    
    // Save record to DB
    const fileSizeStr = (file as File).size ? `${Math.round((file as File).size / 1024)} KB` : '0 KB';
    await saveFileRecord({
      room_id: roomId,
      uploader_name: uploaderName,
      file_name: (file as File).name || fileName,
      file_path: filePath,
      file_size: fileSizeStr
    });
    
    return true;
  } catch (err) {
    console.error('[AudioAgent] Exception while uploading file:', err);
    return false;
  }
}
