import { TeamsDomWatcher } from './teamsDomWatcher.ts';
import { OverlayUI } from './overlay.ts';
import { saveTranscriptSegmentsBatch, saveLiveTranscriptSegment, SupabaseSegmentData } from '../supabaseClient.ts';

let isRunning = false;
let watcher: TeamsDomWatcher | null = null;
let overlay: OverlayUI | null = null;

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let meetingId = '';
let meetingDay = '';
let meetingDate = '';

// Keeps track of the latest version of each segment ID
let transcriptMap = new Map<string, SupabaseSegmentData>();
let lastActiveSegmentIds = new Set<string>();

function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

function handleSegmentsUpdate(segments: any[]) {
  if (!meetingId) return;

  const currentActiveIds = new Set(segments.map(s => s.id));

  // 1. Any segment that was active in the previous cycle but is NOT active now is finalized!
  lastActiveSegmentIds.forEach(prevId => {
    if (!currentActiveIds.has(prevId)) {
      const finalSeg = transcriptMap.get(prevId);
      if (finalSeg && finalSeg.transcript_text) {
        console.log('[OxiqAI] Live Teams segment finalized, sending to Supabase:', finalSeg);
        saveLiveTranscriptSegment(meetingId, finalSeg.speaker, finalSeg.transcript_text, finalSeg.timestamp);
      }
    }
  });

  // 2. Update map with latest interim text
  segments.forEach((seg) => {
    let speaker = seg.source || 'Speaker';
    let text = seg.text || '';

    if (!text.trim()) return;

    const timeStr = formatTime(seg.timestampMs);
    const data: SupabaseSegmentData = {
      meeting_id: meetingId,
      platform: 'Microsoft Teams',
      meeting_day: meetingDay,
      meeting_date: meetingDate,
      speaker: speaker,
      transcript_text: text.trim(),
      timestamp: timeStr,
    };

    transcriptMap.set(seg.id, data);
  });

  lastActiveSegmentIds = currentActiveIds;
}

// Sync to Supabase in one batch
async function syncToSupabase() {
  const list = Array.from(transcriptMap.values());
  if (list.length > 0) {
    console.log(`[AudioAgent] Syncing final meeting transcript (${list.length} segments) to Supabase...`);
    await saveTranscriptSegmentsBatch(list);
  }
}

function checkCaptionsAvailability() {
  if (!watcher) return;
  if (!watcher.isCaptionsAvailable()) {
    if (!document.getElementById('oxiqai-teams-caption-banner')) {
      const banner = document.createElement('div');
      banner.id = 'oxiqai-teams-caption-banner';
      banner.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #eab308; color: #000; padding: 12px; text-align: center; font-weight: bold; z-index: 999999;';
      banner.innerHTML = 'OxiqAI: Teams captions not detected — check that Live Captions are turned on, or Teams may have updated its UI.<button style="margin-left:16px;cursor:pointer;" onclick="this.parentElement.remove()">Dismiss</button>';
      document.body.appendChild(banner);
    }
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'PING_ENGINE') {
    sendResponse({ isRunning });
    return;
  }

  if (request.action === 'START_ENGINE') {
    if (isRunning) {
      sendResponse({ success: true, message: 'Already running' });
      return;
    }

    isRunning = true;

    const now = new Date();
    meetingId = `session_microsoftteams_${now.getTime()}`;
    meetingDay = DAYS[now.getDay()];
    meetingDate = now.toISOString().split('T')[0];
    transcriptMap.clear();

    chrome.storage.local.get(['meetingIndex'], (result) => {
      const index = result.meetingIndex || [];
      index.push({ id: meetingId, platform: 'Microsoft Teams', day: meetingDay, date: meetingDate, startTime: formatTime(now.getTime()) });
      chrome.storage.local.set({ meetingIndex: index });
    });

    overlay = new OverlayUI();
    overlay.mount();

    watcher = new TeamsDomWatcher();
    watcher.start((segments) => {
      overlay?.updateSegments(segments);
      handleSegmentsUpdate(segments);
    });

    sendResponse({ success: true });
    return;
  }

  if (request.action === 'STOP_ENGINE') {
    const finalList = Array.from(transcriptMap.values());
    if (finalList.length > 0) {
      console.log(`[AudioAgent] Syncing final meeting transcript (${finalList.length} segments) to Supabase...`);
      saveTranscriptSegmentsBatch(finalList);
    }

    isRunning = false;
    meetingId = '';
    transcriptMap.clear();

    if (overlay) {
      overlay.unmount();
      overlay = null;
    }
    if (watcher) {
      watcher.stop();
      watcher = null;
    }
    const banner = document.getElementById('oxiqai-teams-caption-banner');
    if (banner) banner.remove();

    sendResponse({ success: true });
    return;
  }
});
