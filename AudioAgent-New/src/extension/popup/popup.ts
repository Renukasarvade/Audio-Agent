document.addEventListener('DOMContentLoaded', async () => {
  const startBtn = document.getElementById('start-btn') as HTMLButtonElement;
  const stopBtn = document.getElementById('stop-btn') as HTMLButtonElement;
  const statusText = document.getElementById('status-text') as HTMLSpanElement;
  const statusDot = document.getElementById('status-dot') as HTMLSpanElement;
  const usernameInput = document.getElementById('username-input') as HTMLInputElement;

  const dbUrlInput = document.getElementById('db-url') as HTMLInputElement;
  const dbKeyInput = document.getElementById('db-key') as HTMLInputElement;
  const saveConfigBtn = document.getElementById('save-config-btn') as HTMLButtonElement;

  const tabControl = document.getElementById('tab-control') as HTMLButtonElement;
  const tabHistory = document.getElementById('tab-history') as HTMLButtonElement;
  const contentControl = document.getElementById('content-control') as HTMLDivElement;
  const contentHistory = document.getElementById('content-history') as HTMLDivElement;

  const meetingList = document.getElementById('meeting-list') as HTMLDivElement;
  const historyListView = document.getElementById('history-list-view') as HTMLDivElement;
  const historyDetailView = document.getElementById('history-detail-view') as HTMLDivElement;
  const detailBackBtn = document.getElementById('detail-back-btn') as HTMLButtonElement;

  const detailPlatform = document.getElementById('detail-platform') as HTMLSpanElement;
  const detailDatetime = document.getElementById('detail-datetime') as HTMLDivElement;
  const detailPreview = document.getElementById('detail-preview') as HTMLDivElement;

  const exportCsvBtn = document.getElementById('export-csv-btn') as HTMLButtonElement;
  const exportTxtBtn = document.getElementById('export-txt-btn') as HTMLButtonElement;

  let selectedMeetingId = '';
  let selectedMeetingSegments: any[] = [];

  // --- Tab Switching ---
  tabControl.addEventListener('click', () => {
    tabControl.classList.add('active');
    tabHistory.classList.remove('active');
    contentControl.classList.add('active');
    contentHistory.classList.remove('active');
  });

  tabHistory.addEventListener('click', () => {
    tabHistory.classList.add('active');
    tabControl.classList.remove('active');
    contentHistory.classList.add('active');
    contentControl.classList.remove('active');
    loadHistoryList();
  });

  // --- Load saved username ---
  chrome.storage.local.get(['localUserName'], (result) => {
    if (result.localUserName) {
      usernameInput.value = result.localUserName;
    }
  });

  // Save username on change
  usernameInput.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    chrome.storage.local.set({ localUserName: val.trim() });
  });

  // --- Load Supabase config ---
  chrome.storage.local.get(['supabaseUrl', 'supabaseKey'], (result) => {
    if (result.supabaseUrl) dbUrlInput.value = result.supabaseUrl;
    if (result.supabaseKey) dbKeyInput.value = result.supabaseKey;
  });

  // Save Supabase config
  saveConfigBtn.addEventListener('click', () => {
    const url = dbUrlInput.value.trim();
    const key = dbKeyInput.value.trim();
    chrome.storage.local.set({ supabaseUrl: url, supabaseKey: key }, () => {
      alert('Database configuration saved successfully!');
    });
  });

  // --- Engine Status ---
  function updateEngineUi(running: boolean) {
    if (running) {
      statusText.innerText = 'Engine Running';
      statusDot.className = 'status-dot running';
      startBtn.style.display = 'none';
      stopBtn.style.display = 'block';
    } else {
      statusText.innerText = 'Ready to connect';
      statusDot.className = 'status-dot';
      startBtn.style.display = 'block';
      stopBtn.style.display = 'none';
    }
  }

  // Check initial state
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'PING_ENGINE' }, (res) => {
        if (!chrome.runtime.lastError && res?.isRunning) {
          updateEngineUi(true);
        }
      });
    }
  } catch (e) {}

  // Start
  startBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id || !(tab.url?.includes('meet.google.com') || tab.url?.includes('teams.microsoft.com') || tab.url?.includes('teams.live.com'))) {
        statusText.innerText = 'Please open Google Meet or MS Teams';
        return;
      }

      statusText.innerText = 'Initializing...';
      startBtn.disabled = true;

      chrome.tabs.sendMessage(tab.id, { action: 'START_ENGINE' }, (response) => {
        startBtn.disabled = false;
        if (chrome.runtime.lastError) {
          statusText.innerText = 'Error: Refresh Meet page';
        } else if (response?.success) {
          updateEngineUi(true);
        } else {
          statusText.innerText = 'Error: ' + response?.error;
        }
      });
    } catch (err) {
      statusText.innerText = 'Error starting engine';
      startBtn.disabled = false;
    }
  });

  // Stop
  stopBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      statusText.innerText = 'Stopping...';
      stopBtn.disabled = true;

      chrome.tabs.sendMessage(tab.id, { action: 'STOP_ENGINE' }, () => {
        stopBtn.disabled = false;
        updateEngineUi(false);
      });
    } catch (err) {}
  });

  // --- History ---
  function loadHistoryList() {
    chrome.storage.local.get(['meetingIndex'], (result) => {
      const index = result.meetingIndex || [];
      meetingList.innerHTML = '';

      if (index.length === 0) {
        meetingList.innerHTML = '<div class="empty-state">No recorded meetings found.</div>';
        return;
      }

      const sortedIndex = [...index].reverse();

      sortedIndex.forEach((meeting: any) => {
        const item = document.createElement('div');
        item.className = 'meeting-item';
        item.innerHTML = `
          <div class="meeting-meta">
            <span>${meeting.platform}</span>
            <span>${meeting.date}</span>
          </div>
          <div class="meeting-title">${meeting.day}, ${meeting.startTime}</div>
        `;
        item.addEventListener('click', () => showMeetingDetails(meeting));
        meetingList.appendChild(item);
      });
    });
  }

  function showMeetingDetails(meeting: any) {
    selectedMeetingId = meeting.id;
    chrome.storage.local.get([meeting.id], (result) => {
      selectedMeetingSegments = result[meeting.id] || [];

      detailPlatform.innerText = meeting.platform;
      detailDatetime.innerText = `${meeting.day}, ${meeting.date} at ${meeting.startTime}`;

      detailPreview.innerHTML = '';
      if (selectedMeetingSegments.length === 0) {
        detailPreview.innerHTML = '<div class="empty-state">No text logged in this session.</div>';
      } else {
        selectedMeetingSegments.forEach((seg: any) => {
          const line = document.createElement('div');
          line.className = 'preview-line';
          line.innerHTML = `[${seg.timestamp}] <b>${seg.speaker}:</b> ${seg.transcript_text}`;
          detailPreview.appendChild(line);
        });
      }

      historyListView.style.display = 'none';
      historyDetailView.style.display = 'flex';
    });
  }

  detailBackBtn.addEventListener('click', () => {
    historyListView.style.display = 'block';
    historyDetailView.style.display = 'none';
  });

  // --- Export ---
  exportCsvBtn.addEventListener('click', () => {
    if (!selectedMeetingSegments || selectedMeetingSegments.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Date,Day,Timestamp,Speaker,Platform,Text\n';

    selectedMeetingSegments.forEach((seg: any) => {
      const escapedText = (seg.transcript_text || '').replace(/"/g, '""');
      const escapedSpeaker = (seg.speaker || '').replace(/"/g, '""');
      csvContent += `"${seg.meeting_date}","${seg.meeting_day}","${seg.timestamp}","${escapedSpeaker}","${seg.platform}","${escapedText}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transcript_${selectedMeetingId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  exportTxtBtn.addEventListener('click', () => {
    if (!selectedMeetingSegments || selectedMeetingSegments.length === 0) return;

    let txtContent = '';
    selectedMeetingSegments.forEach((seg: any) => {
      txtContent += `[${seg.timestamp}] ${seg.speaker}: ${seg.transcript_text}\n`;
    });

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transcript_${selectedMeetingId}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
});
