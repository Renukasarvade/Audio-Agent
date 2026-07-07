// ==========================================================================
// OxiqAI Meeting Room — File Sharing Module
// ==========================================================================

import {
    saveFileRecord,
    uploadFileToStorage,
    getFileDownloadUrl
} from './supabase.js';

/**
 * Convert bytes to a human-readable file size string.
 */
function humanFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
    return `${size} ${units[i]}`;
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
 * Handle uploading a single file.
 */
async function handleFileUpload(file, roomId, displayName, onUploadSuccess) {
    if (!file) return;

    const size = humanFileSize(file.size);

    try {
        // Upload file to Supabase Storage
        const result = await uploadFileToStorage(file, roomId);
        const filePath = result.filePath;

        // Save file metadata record
        await saveFileRecord(roomId, displayName, file.name, filePath, size);

        console.log(`File uploaded: ${file.name} (${size})`);
        
        // Execute instant refresh callback
        if (typeof onUploadSuccess === 'function') {
            onUploadSuccess();
        }
    } catch (err) {
        console.error('File upload error:', err);
        alert(`Failed to upload "${file.name}". Please try again.`);
    }
}

/**
 * Initialize the file sharing panel — drag-and-drop & file input.
 * @param {string} roomId
 * @param {string} displayName
 * @param {function} onUploadSuccess
 */
export function initFiles(roomId, displayName, onUploadSuccess) {
    const uploadArea = document.getElementById('upload-area');
    const fileInput  = document.getElementById('file-input');

    if (!uploadArea || !fileInput) return;

    // Click to browse
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (!files) return;
        for (const file of files) {
            handleFileUpload(file, roomId, displayName, onUploadSuccess);
        }
        // Reset so same file can be re-uploaded
        fileInput.value = '';
    });

    // Drag & Drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragover');
    });

    // Drag Leave
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
    });

    // Drop
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (!files) return;
        for (const file of files) {
            handleFileUpload(file, roomId, displayName, onUploadSuccess);
        }
    });
}

/**
 * Render file items into the container.
 * @param {Array} files - Array of file record objects
 * @param {HTMLElement} container - The #files-list element
 */
export function renderFiles(files, container) {
    if (!container) return;

    if (!files || files.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <span>No files shared yet.<br>Drag &amp; drop to upload.</span>
            </div>
        `;
        container.dataset.renderedCount = '0';
        return;
    }

    const renderedCount = parseInt(container.dataset.renderedCount || '0', 10);
    if (renderedCount === 0 || container.querySelector('.empty-state')) {
        container.innerHTML = '';
    }

    for (let i = renderedCount; i < files.length; i++) {
        const f = files[i];
        const item = document.createElement('div');
        item.className = 'file-item';
        item.style.display = 'flex';
        item.style.alignItems = 'center';

        const fileName  = f.file_name || f.name || 'Untitled';
        const fileSize  = f.file_size || f.size || '';
        const uploader  = f.uploader_name || f.uploader || f.display_name || '';
        const filePath  = f.file_path || f.path || '';

        const isImage = fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        const imageUrl = isImage ? getFileDownloadUrl(filePath) : '';

        item.innerHTML = `
            ${isImage ? `<img src="${imageUrl}" class="file-preview-thumbnail" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover; border: 1px solid rgba(255,255,255,0.08); margin-right: 12px; flex-shrink: 0;" alt="Preview" />` : ''}
            <div class="file-info" style="flex: 1; min-width: 0; display: flex; flex-direction: column;">
                <span class="file-name" title="${escapeHTML(fileName)}" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; font-weight: 600; color: #fff; font-size: 13px;">${escapeHTML(fileName)}</span>
                <span class="file-meta" style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${escapeHTML(fileSize)}${uploader ? ' · ' + escapeHTML(uploader) : ''}</span>
            </div>
            <button class="download-btn" data-path="${escapeHTML(filePath)}" data-name="${escapeHTML(fileName)}" style="flex-shrink: 0; margin-left: 8px;">Download</button>
        `;

        // Wire up download button
        const dlBtn = item.querySelector('.download-btn');
        dlBtn.addEventListener('click', () => {
            const path = dlBtn.dataset.path;
            const name = dlBtn.dataset.name;

            if (!path) {
                alert('File path unavailable.');
                return;
            }

            const url = getFileDownloadUrl(path);
            const a   = document.createElement('a');
            a.href     = url;
            a.download = name || 'download';
            a.target   = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });

        container.appendChild(item);
    }
    
    container.dataset.renderedCount = files.length;
}
