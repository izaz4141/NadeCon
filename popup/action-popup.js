// window/main.js

const urlListDiv = document.getElementById('urlList');
const noUrlsMessage = document.getElementById('noUrlsMessage');
const messageBox = document.getElementById('messageBox');
const clearUrlsBtn = document.getElementById('clearUrlsBtn');
const serverStatusText = document.getElementById('serverStatusText');
const serverStatusReloadBtn = document.getElementById('serverStatusReloadBtn');
const configBtn = document.getElementById('configBtn');

let currentTabId = null;

/**
 * Displays a temporary message in the message box.
 * @param {string} message - The message to display.
 * @param {string} type - 'success', 'error', 'info' (optional, for styling)
 */
function showMessageBox(message, type = 'info') {
    messageBox.textContent = message;
    messageBox.className = `fixed bottom-4 left-1/2 -translate-x-1/2 p-2 text-sm rounded-lg shadow-lg transition-opacity duration-300 ease-out opacity-0 border border-gray-700`;

    if (type === 'success') {
        messageBox.classList.add('bg-green-700', 'text-white');
    } else if (type === 'error') {
        messageBox.classList.add('bg-red-700', 'text-white');
    } else {
        messageBox.classList.add('bg-gray-900', 'text-white');
    }

    messageBox.classList.remove('hidden');
    void messageBox.offsetWidth;
    messageBox.classList.remove('opacity-0');
    messageBox.classList.add('opacity-100');

    setTimeout(() => {
        messageBox.classList.remove('opacity-100');
        messageBox.classList.add('opacity-0');
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 300);
    }, 2000);
}

/**
 * Creates and appends a media item (filename + buttons) to the list in the popup.
 * @param {{url: string, filename: string}} mediaItem - The media item object to display.
 */
function addUrlToPopup(mediaItem) {
    const { url, filename } = mediaItem;
    console.debug(`[Popup] Attempting to add media item to UI: ${filename} (${url})`);
    noUrlsMessage.classList.add('hidden');

    const existingUrlElements = urlListDiv.querySelectorAll('.url-item-text');
    for (const span of existingUrlElements) {
        if (span.dataset.originalUrl === url) {
            console.debug(`[Popup] URL already displayed: ${url}. Skipping.`);
            return;
        }
    }

    /**
     * Returns an SVG icon string based on the filename extension.
     * @param {string} filename - The filename to check.
     * @returns {string} - The SVG icon string.
     */
    function getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();

        // Video
        if (['mp4', 'mkv', 'webm', 'avi', 'mov', 'flv', 'wmv', 'm4v', '3gp', 'ts', 'm3u8', 'mpd'].includes(ext)) {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400 flex-shrink-0 mr-1"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>`;
        }

        // Audio
        if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'].includes(ext)) {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-400 flex-shrink-0 mr-1"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
        }

        // Image
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff'].includes(ext)) {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-400 flex-shrink-0 mr-1"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;
        }

        // Archive
        if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'iso'].includes(ext)) {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-400 flex-shrink-0 mr-1"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>`;
        }

        // Default File
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 flex-shrink-0 mr-1"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    }

    const urlItem = document.createElement('div');
    urlItem.className = 'bg-gray-700 p-1 rounded-lg shadow-sm flex items-center justify-between text-xs break-all text-gray-200 border border-gray-600';
    urlItem.innerHTML = `
        <div class="flex-grow pr-2 flex items-center">
            ${getFileIcon(filename)}
            <span title="${filename}"
            class="url-item-text block line-clamp-2" data-original-url="${url}">
                ${filename}
            </span>
        </div>
        <div class="flex-shrink-0 flex space-x-2">
            <button title="Copy URL"
            class="copy-btn bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded-md transition duration-150 ease-in-out">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" 
                viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE -->
                    <path fill="currentColor" 
                    d="M9 18q-.825 0-1.412-.587T7 16V4q0-.825.588-1.412T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.587 1.413T18 18zm-4 4q-.825 0-1.412-.587T3 20V6h2v14h11v2z"/>
                </svg>
            </button>
            <button title="Download"
            class="download-btn bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-2 rounded-md transition duration-150 ease-in-out">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" 
                viewBox="0 0 24 24"><!-- Icon from Material Line Icons by Vjacheslav Trushkin - https://github.com/cyberalien/line-md/blob/master/license.txt -->
                    <mask id="SVGlr8ECcZP">
                        <g fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                            <path stroke-dasharray="64" stroke-dashoffset="64" d="M7 19h11c2.21 0 4 -1.79 4 -4c0 -2.21 -1.79 -4 -4 -4h-1v-1c0 -2.76 -2.24 -5 -5 -5c-2.42 0 -4.44 1.72 -4.9 4h-0.1c-2.76 0 -5 2.24 -5 5c0 2.76 2.24 5 5 5Z">
                                <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.6s" values="64;0"/>
                                <set fill="freeze" attributeName="opacity" begin="0.7s" to="0"/>
                            </path>
                            <g fill="#fff" stroke="none" opacity="0">
                                <circle cx="12" cy="10" r="6"/><rect width="9" height="8" x="8" y="12"/>
                                <rect width="15" height="12" x="1" y="8" rx="6"/>
                                <rect width="13" height="10" x="10" y="10" rx="5"/>
                                <set fill="freeze" attributeName="opacity" begin="0.7s" to="1"/>
                            </g>
                            <g fill="#000" fill-opacity="0" stroke="none">
                                <circle cx="12" cy="10" r="4"/><rect width="9" height="6" x="8" y="12"/>
                                <rect width="11" height="8" x="3" y="10" rx="4"/>
                                <rect width="9" height="6" x="12" y="12" rx="3"/>
                                <set fill="freeze" attributeName="fill-opacity" begin="0.7s" to="1"/>
                                <animate fill="freeze" attributeName="opacity" begin="0.7s" dur="0.15s" values="1;0.7"/>
                            </g>
                            <g fill="#fff" stroke="none">
                                <path d="M10.5 10h3v0h-3z"><animate fill="freeze" attributeName="d" begin="0.95s" dur="0.2s" values="M10.5 10h3v0h-3z;M10.5 10h3v4h-3z"/>
                                </path>
                                <path d="M8 13h8l-4 0z">
                                    <animate fill="freeze" attributeName="d" begin="1.15s" dur="0.1s" values="M8 13h8l-4 0z;M8 13h8l-4 4z"/>
                                </path>
                            </g>
                        </g>
                    </mask>
                    <rect width="24" height="24" fill="currentColor" mask="url(#SVGlr8ECcZP)"/>
                </svg>
            </button>
        </div>
    `;

    urlItem.querySelector('.copy-btn').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(url);
            showMessageBox('URL copied to clipboard!', 'success');
            console.debug(`[Popup] Copied URL to clipboard: ${url}`);
        } catch (err) {
            showMessageBox('Failed to copy URL.', 'error');
            console.error(`[Popup] Error copying to clipboard: ${err}`);
        }
    });

    urlItem.querySelector('.download-btn').addEventListener('click', () => {
        console.debug(`[Popup] Sending initiateSmartDownload request for URL: ${url}, Filename: ${filename}`);
        browser.runtime.sendMessage({ type: "initiateSmartDownload", url: url, filename: filename, tabId: currentTabId })
            .then(response => {
                if (response.success) {
                    showMessageBox('Download initiated!', 'success');
                } else {
                    showMessageBox(`Download failed: ${response.error || 'Unknown error'}`, 'error');
                }
            })
            .catch(error => showMessageBox(`Error initiating smart download: ${error.message}`, 'error'));
    });

    urlListDiv.appendChild(urlItem);
    console.debug(`[Popup] Successfully added media item to UI: ${filename}`);
}

/**
 * Function to refresh the URL list in the popup.
 * @param {{url: string, filename: string}[]} mediaItems - Array of media item objects.
 */
function refreshUrlList(mediaItems) {
    console.debug(`[Popup] Refreshing URL list with ${mediaItems.length} media items.`);
    urlListDiv.innerHTML = '';
    if (mediaItems && mediaItems.length > 0) {
        mediaItems.forEach(item => addUrlToPopup(item));
        noUrlsMessage.classList.add('hidden');
        console.debug("[Popup] Hiding 'No URLs found' message.");
    } else {
        noUrlsMessage.classList.remove('hidden');
        console.debug("[Popup] Showing 'No URLs found' message.");
    }
}

/**
 * Updates the server status indicator text and color.
 * @param {boolean | null} isAlive - true if alive, false if not, null if checking.
 */
function updateServerStatusIndicator(isAlive) {
    serverStatusText.classList.remove('text-green-600', 'text-red-600', 'text-gray-600', 'text-green-400', 'text-red-400', 'text-gray-400');
    if (isAlive === true) {
        serverStatusText.textContent = 'Nadeko Connection: Alive';
        serverStatusText.classList.add('text-green-400');
        console.debug("[Popup] Server status: Alive.");
    } else if (isAlive === false) {
        serverStatusText.textContent = 'Nadeko Connection: Not Alive';
        serverStatusText.classList.add('text-red-400');
        console.debug("[Popup] Server status: Not Alive.");
    } else {
        serverStatusText.textContent = 'Checking connection status...';
        serverStatusText.classList.add('text-gray-400');
        console.debug("[Popup] Server status: Checking...");
    }
}

/**
 * Initiates a check for the Nadeko server's liveness.
 */
async function checkServerStatus() {
    updateServerStatusIndicator(null);
    try {
        const response = await browser.runtime.sendMessage({ type: "checkLocalhostStatus" });
        if (response && typeof response.isAlive === 'boolean') {
            updateServerStatusIndicator(response.isAlive);
        } else {
            updateServerStatusIndicator(false);
            console.warn("[Popup] Malformed response from checkLocalhostStatus:", response);
        }
    } catch (error) {
        updateServerStatusIndicator(false);
        console.error("[Popup] Error checking server status:", error);
    }
}


// --- Event Listeners ---

browser.runtime.onMessage.addListener((message) => {
    console.debug(`[Popup] Message received from background:`, message);
    if (message.type === "urlAdded" && message.tabId === currentTabId && message.mediaItem) {
        addUrlToPopup(message.mediaItem);
        console.debug(`[Popup] New media item received and added: ${message.mediaItem.filename}`);
    } else if (message.type === "clearUrlsDisplay" && message.tabId === currentTabId) {
        refreshUrlList([]);
        console.debug(`[Popup] Display cleared for tab ${currentTabId}`);
    } else if (message.type === "downloadHandledByNadeko" && message.tabId === currentTabId) {
        showMessageBox(`Sent ${message.filename} to Nadeko!`, 'success');
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    console.debug("[Popup] DOMContentLoaded event fired. Initializing popup.");
    try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
            currentTabId = tabs[0].id;
            console.debug(`[Popup] Current active tab ID: ${currentTabId}`);
            console.debug(`[Popup] Requesting media items for tab ID: ${currentTabId}...`);

            const response = await browser.runtime.sendMessage({ type: "getMediaUrls", tabId: currentTabId });
            console.debug("[Popup] Response from getMediaUrls:", response);

            if (response && response.mediaItems) {
                refreshUrlList(response.mediaItems);
            } else {
                noUrlsMessage.classList.remove('hidden');
                console.warn("[Popup] No media items received or response was malformed. Showing 'No URLs found' message.");
            }

            checkServerStatus(); // Initial check for server status

        } else {
            console.warn("[Popup] No active tab found. Showing 'No URLs found' message.");
            noUrlsMessage.textContent = "Please ensure a tab is active. No media URLs found yet.";
            noUrlsMessage.classList.remove('hidden');
        }
    } catch (error) {
        console.error("[Popup] Error initializing popup:", error);
        noUrlsMessage.textContent = `Error loading URLs: ${error.message}`;
        noUrlsMessage.classList.remove('hidden');
        console.debug("[Popup] Showing 'No URLs found' message due to initialization error.");
    }
});

clearUrlsBtn.addEventListener('click', async () => {
    console.debug(`[Popup] Clear URLs button clicked. currentTabId: ${currentTabId}`);
    if (currentTabId) {
        try {
            const response = await browser.runtime.sendMessage({ type: "clearUrls", tabId: currentTabId });
            if (response && response.success) {
                refreshUrlList([]);
                showMessageBox('URLs cleared for this tab.', 'info');
                console.debug(`[Popup] Sent clearUrls message for tab ${currentTabId}.`);
            } else {
                showMessageBox(`Failed to clear URLs: ${response?.error || 'Unknown error'}`, 'error');
                console.error(`[Popup] Failed to clear URLs for tab ${currentTabId}:`, response);
            }
        } catch (error) {
            showMessageBox(`Error clearing URLs: ${error.message}`, 'error');
            console.error(`[Popup] Error sending clearUrls message for tab ${currentTabId}:`, error);
        }
    } else {
        showMessageBox('No active tab to clear URLs for.', 'info');
    }
});

serverStatusReloadBtn.addEventListener('click', checkServerStatus);

// New: Listener for the configuration button to open a new popup window
configBtn.addEventListener('click', () => {
    browser.windows.create({
        url: browser.runtime.getURL("config/config.html"),
        type: "popup", // Opens as a small, floating window
        width: 350, // Adjust size as needed
        height: 450,
        left: window.screen.availWidth - 350,
        top: 10
    }).catch(error => {
        console.error("[Popup] Failed to open config window:", error);
        showMessageBox("Failed to open configuration window.", "error");
    });
});
