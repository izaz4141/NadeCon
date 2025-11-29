// content.js - This script is injected into web pages and handles both media detection and stacking popups

// Load external CSS file for popup styling
const cssLink = document.createElement('link');
cssLink.rel = 'stylesheet';
cssLink.href = browser.runtime.getURL('popup/media-popup.css');
document.head.appendChild(cssLink);

// Ensure the popup container exists and is added to the DOM
let popupContainer = document.getElementById('media-detector-popup-container');
if (!popupContainer) {
    popupContainer = document.createElement('div');
    popupContainer.id = 'media-detector-popup-container';
    document.body.appendChild(popupContainer);
}

// A Set to keep track of URLs for which popups are currently active
const activePopupUrls = new Set();
const processedUrls = new Set();

// Track showPopup setting
let shouldShowPopup = false;

// Initialize setting from storage (returns a promise so we can wait for it)
async function initializeSettings() {
    const result = await browser.storage.local.get('showPopup');
    console.debug(`[Content Script] Raw showPopup value from storage:`, result.showPopup, `(type: ${typeof result.showPopup})`);
    // Handle both boolean true and string 'true'
    shouldShowPopup = result.showPopup === true || result.showPopup === 'true';
    console.debug(`[Content Script] showPopup setting initialized to: ${shouldShowPopup}`);
}


// Listen for storage changes
browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.showPopup) {
        console.debug(`[Content Script] showPopup changed - old:`, changes.showPopup.oldValue, `new:`, changes.showPopup.newValue, `(type: ${typeof changes.showPopup.newValue})`);
        // Handle both boolean true and string 'true'
        shouldShowPopup = changes.showPopup.newValue === true || changes.showPopup.newValue === 'true';
        console.debug(`[Content Script] showPopup setting changed to: ${shouldShowPopup}`);
        if (!shouldShowPopup) {
            // Close all popups if setting is disabled
            const allPopups = document.querySelectorAll('.media-detector-popup-item');
            allPopups.forEach(popup => popup.remove());
            activePopupUrls.clear();
        }
    }
});

/**
 * Handles errors during the download process.
 */
function handleDownloadError(downloadButton, popupElement, url, filename) {
    downloadButton.textContent = '✗ Failed!';
    downloadButton.style.background = '#ff0039';

    setTimeout(() => {
        if (popupElement.isConnected) {
            downloadButton.textContent = 'Download';
            downloadButton.style.background = 'rgba(255, 255, 255, 0.1)';
            downloadButton.disabled = false;
        }
    }, 3000);
}

/**
 * Initiates download for a specific item
 */
function initiateDownload(url, filename, button, popup) {
    button.disabled = true;
    button.textContent = 'Sending...';

    browser.runtime.sendMessage({
        type: 'initiateSmartDownload',
        url: url,
        filename: filename
    }).then(response => {
        if (response && response.success) {
            button.textContent = '✓ Sent!';
            button.style.background = '#30e60b';
            setTimeout(() => {
                if (popup.isConnected) popup.remove();
                activePopupUrls.delete(url);
            }, 1500);
        } else {
            handleDownloadError(button, popup, url, filename);
        }
    }).catch(error => {
        handleDownloadError(button, popup, url, filename);
    });
}

/**
 * Displays an individual media download popup or a menu for multiple items.
 * @param {object|Array} mediaItem - The media item object ({url, filename}) or array of items.
 */
function showMediaDownloadPopup(mediaItem) {
    // If it's an array, it's a menu (YouTube)
    const isMenu = Array.isArray(mediaItem);
    const mainItem = isMenu ? mediaItem[0] : mediaItem;
    const { url, filename } = mainItem;

    // Unique key for the popup (use video ID for menu, or URL for single)
    const popupKey = isMenu ? (mainItem.videoId || url) : url;

    if (activePopupUrls.has(popupKey)) return;
    if (!shouldShowPopup) {
        console.debug(`[Content Script] Popup blocked by showPopup setting for: ${filename}`);
        return; // Respect user setting
    }

    const popup = document.createElement('div');
    popup.className = 'media-detector-popup-item';

    let icon = '🎬';
    let titleText = isMenu ? 'Select Quality' : (filename.length > 20 ? filename.substring(0, 20) + '...' : filename);
    let buttonText = isMenu ? 'Options ▾' : 'Download';

    popup.innerHTML = `
        <div class="popup-icon">${icon}</div>
        <div class="popup-content">
            <p title="${isMenu ? 'Multiple formats available' : filename}">${titleText}</p>
            <button class="download-btn">${buttonText}</button>
        </div>
        <button class="close-btn">✕</button>
    `;

    if (isMenu) {
        const menu = document.createElement('div');
        menu.className = 'media-detector-menu';

        mediaItem.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'media-detector-menu-item';

            let quality = item.quality || 'Unknown';
            let extraInfo = '';
            if (item.isAudio) {
                quality = 'Audio';
                extraInfo = item.ext || 'm4a';
            } else if (item.isVideoOnly) {
                extraInfo = 'Video Only';
            } else {
                extraInfo = item.ext || 'mp4';
            }

            menuItem.innerHTML = `
                <span>${item.filename}</span>
                <div style="display:flex; align-items:center;">
                    <span class="format-info">${extraInfo}</span>
                    <span class="quality-tag" style="margin-left:6px;">${quality}</span>
                </div>
            `;

            menuItem.addEventListener('click', (e) => {
                e.stopPropagation();
                initiateDownload(item.url, item.filename, popup.querySelector('.download-btn'), popup);
            });

            menu.appendChild(menuItem);
        });

        popup.appendChild(menu);

        const btn = popup.querySelector('.download-btn');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('show');
            btn.textContent = menu.classList.contains('show') ? 'Close ▴' : 'Options ▾';
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!popup.contains(e.target)) {
                menu.classList.remove('show');
                btn.textContent = 'Options ▾';
            }
        });

    } else {
        const downloadButton = popup.querySelector('.download-btn');
        downloadButton.addEventListener('click', () => {
            initiateDownload(url, filename, downloadButton, popup);
        });
    }

    popupContainer.appendChild(popup);
    activePopupUrls.add(popupKey);

    setTimeout(() => {
        if (popup.isConnected) popup.classList.add('show');
    }, 50);

    popup.querySelector('.close-btn').addEventListener('click', () => {
        popup.remove();
        activePopupUrls.delete(popupKey);
    });
}

//=============================================================
//=================={Media Detector}===========================
//=============================================================

// Injected script to intercept XHR/Fetch
const interceptionScript = `
(function() {
    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;
    const fetch = window.fetch;

    // Intercept XMLHttpRequest
    XHR.open = function(method, url) {
        this._url = url;
        return open.apply(this, arguments);
    };

    XHR.send = function(body) {
        this.addEventListener('load', function() {
            if (this._url && (this._url.includes('/player') || this._url.includes('videoplayback'))) {
                try {
                    const data = JSON.parse(this.responseText);
                    window.postMessage({
                        type: 'IDM_INTERCEPT_YOUTUBE',
                        data: data,
                        url: this._url
                    }, '*');
                } catch (e) {}
            }
        });
        return send.apply(this, arguments);
    };

    // Intercept Fetch
    window.fetch = async function(...args) {
        const response = await fetch.apply(this, args);
        const clone = response.clone();
        const url = response.url;
        
        if (url && (url.includes('/player') || url.includes('videoplayback'))) {
            clone.json().then(data => {
                window.postMessage({
                    type: 'IDM_INTERCEPT_YOUTUBE',
                    data: data,
                    url: url
                }, '*');
            }).catch(() => {});
        }
        
        return response;
    };
})();
`;

class MediaDetector {
    constructor() {
        this.processedUrls = new Set();
        this.siteType = this.detectSiteType();
        this.detectedYouTubeVideos = new Set(); // Track detected video IDs

        // Regex for detecting media URLs in text/scripts
        this.mediaUrlRegex = /\b\w+:\/\/(?:[%T]*(?::[%T]*)?@)?[%H.]+\.[%H]+(?::\d+)?(?:\/(?:(?: +(?!\\w+:))?[%T/~;])*)?(?:\?[%Q]*)?(?:#[%T]*)?/gi;
        // Simplified version for common media extensions
        this.commonMediaExtRegex = /\.(mp4|webm|m4v|flv|f4v|ogv|3gp|mkv|mov|avi|wmv|mpg|mpeg|m4a|mp3|wav|aac|flac|ogg|opus|m3u8|mpd|f4m|ism|isml)(?:\?|$)/i;

        console.debug(`[MediaDetector] Initializing for site type: ${this.siteType}`);
        this.init();
    }

    detectSiteType() {
        const hostname = window.location.hostname;
        if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube';
        if (hostname.includes('instagram.com')) return 'instagram';
        if (hostname.includes('vimeo.com')) return 'vimeo';
        return 'generic';
    }

    init() {
        this.injectInterceptionScript();
        this.scan();

        const observer = new MutationObserver((mutations) => {
            let shouldScan = false;
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) shouldScan = true;
            }
            if (shouldScan) this.scan();
        });

        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        }

        // Periodic scan for dynamic sites
        setInterval(() => this.scan(), 3000);

        // Listen for intercepted messages
        window.addEventListener('message', (event) => {
            if (event.source !== window) return;
            if (event.data.type === 'IDM_INTERCEPT_YOUTUBE') {
                this.processYouTubeResponse(event.data.data);
            }
        });
    }

    injectInterceptionScript() {
        const script = document.createElement('script');
        script.textContent = interceptionScript;
        (document.head || document.documentElement).appendChild(script);
        script.remove();
    }

    scan() {
        if (this.siteType === 'youtube') {
            this.scanYouTube();
        } else if (this.siteType === 'instagram') {
            this.scanInstagram();
        }

        // Always run generic scan as fallback/supplement
        this.scanGeneric();
        this.scanLinks();
        this.scanImages();
        this.scanIframes();
    }

    /**
     * Checks if an element is visible and large enough to be relevant.
     */
    isValidMedia(element) {
        if (!element) return false;

        // Check if element is in DOM
        if (!document.contains(element)) return false;

        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
        }

        const rect = element.getBoundingClientRect();
        if (rect.width < 10 || rect.height < 10) {
            // Too small, likely a tracking pixel or hidden control
            return false;
        }

        return true;
    }

    scanYouTube() {
        // Static scan for initial load data
        const scripts = document.getElementsByTagName('script');
        for (let script of scripts) {
            if (script.textContent) {
                const match = script.textContent.match(/var\s+ytInitialPlayerResponse\s*=\s*({.+?});/);
                if (match && match[1]) {
                    try {
                        const data = JSON.parse(match[1]);
                        this.processYouTubeResponse(data);
                    } catch (e) { }
                }
            }
        }
    }

    processYouTubeResponse(data) {
        if (!data || !data.streamingData) return;

        const videoDetails = data.videoDetails || {};
        const videoId = videoDetails.videoId;

        if (this.detectedYouTubeVideos.has(videoId)) return;

        const title = videoDetails.title || 'YouTube Video';
        const formats = data.streamingData.formats || [];
        const adaptiveFormats = data.streamingData.adaptiveFormats || [];
        const allFormats = [...formats, ...adaptiveFormats];

        const detectedItems = [];

        for (const format of allFormats) {
            if (format.url) {
                let quality = format.qualityLabel || format.quality;
                if (!quality && format.height) quality = `${format.height}p`;
                if (!quality) quality = 'Unknown';

                const mime = format.mimeType || '';
                let ext = 'mp4';
                let isAudio = false;
                let isVideoOnly = false;

                if (mime.includes('webm')) ext = 'webm';
                if (mime.includes('audio')) {
                    ext = 'm4a';
                    isAudio = true;
                    if (mime.includes('webm')) ext = 'weba';
                } else if (!mime.includes('audio') && adaptiveFormats.includes(format)) {
                    // Adaptive video formats usually don't have audio
                    isVideoOnly = true;
                }

                const filename = `${title} [${quality}].${ext}`.replace(/[\/\\:*?"<>|]/g, '_');

                detectedItems.push({
                    url: format.url,
                    filename: filename,
                    quality: quality,
                    ext: ext,
                    isAudio: isAudio,
                    isVideoOnly: isVideoOnly,
                    videoId: videoId
                });

                // Notify background about this URL
                this.notifyBackground(format.url, filename);
            }
        }

        if (detectedItems.length > 0) {
            // Sort items: Video+Audio first, then Video Only (descending quality), then Audio
            detectedItems.sort((a, b) => {
                if (a.isAudio && !b.isAudio) return 1;
                if (!a.isAudio && b.isAudio) return -1;

                if (a.isVideoOnly && !b.isVideoOnly) return 1;
                if (!a.isVideoOnly && b.isVideoOnly) return -1;

                // Parse quality (e.g. 1080p -> 1080)
                const qA = parseInt(a.quality) || 0;
                const qB = parseInt(b.quality) || 0;
                return qB - qA;
            });

            this.detectedYouTubeVideos.add(videoId);
            showMediaDownloadPopup(detectedItems);
        }
    }

    scanInstagram() {
        const videos = document.querySelectorAll('video');
        for (let video of videos) {
            if (video.src && this.isValidMedia(video)) {
                this.processUrl(video.src, 'Instagram Video.mp4');
            }
        }
    }

    scanGeneric() {
        // Scan video and audio tags
        const elements = document.querySelectorAll('video, audio, object, embed');
        for (let el of elements) {
            if (this.isValidMedia(el)) {
                if (el.src) {
                    let filename = el.src.split('/').pop().split('?')[0];
                    if (!filename) filename = 'media';
                    this.processUrl(el.src, filename);
                }
                // Check child source tags
                const sources = el.querySelectorAll('source');
                for (let source of sources) {
                    if (source.src) {
                        let filename = source.src.split('/').pop().split('?')[0];
                        if (!filename) filename = 'media';
                        this.processUrl(source.src, filename);
                    }
                }
            }
        }
    }

    scanLinks() {
        const links = document.getElementsByTagName('a');
        for (let link of links) {
            if (link.href && this.commonMediaExtRegex.test(link.href)) {
                // Only process if it looks like a direct media link
                let filename = link.download || link.innerText.trim() || link.href.split('/').pop().split('?')[0];
                this.processUrl(link.href, filename);
            }
        }
    }

    scanImages() {
        // Sometimes high-res images or specific image types are desirable
        const images = document.getElementsByTagName('img');
        for (let img of images) {
            // Only interested in very large images or specific types if needed
            // For now, let's just check for direct media links disguised as images? 
            // Or maybe just large images.
            // Reference implementation scans images too.
            if (img.src && this.commonMediaExtRegex.test(img.src)) {
                let filename = img.alt || img.src.split('/').pop().split('?')[0];
                this.processUrl(img.src, filename);
            }
        }
    }

    scanIframes() {
        const iframes = document.getElementsByTagName('iframe');
        for (let iframe of iframes) {
            try {
                if (iframe.src && this.commonMediaExtRegex.test(iframe.src)) {
                    let filename = iframe.src.split('/').pop().split('?')[0];
                    this.processUrl(iframe.src, filename);
                }
            } catch (e) { }
        }
    }

    processUrl(url, filename) {
        if (!url || url.startsWith('blob:') || url.startsWith('data:')) return;

        // Basic validation to ensure it looks like a URL
        if (!url.startsWith('http')) return;

        if (this.processedUrls.has(url)) return;
        this.processedUrls.add(url);

        // Clean filename
        filename = filename.replace(/[<>:"/\\|?*]/g, '_').trim();
        if (!filename) filename = 'media_file';

        showMediaDownloadPopup({ url, filename });
        this.notifyBackground(url, filename);
    }

    notifyBackground(url, filename) {
        browser.runtime.sendMessage({
            type: "mediaUrlDetected",
            url: url,
            filename: filename
        }).catch(e => { });
    }
}

// Initialize Detector after settings are loaded
async function initializeMediaDetector() {
    // Wait for settings to load first
    await initializeSettings();

    console.debug("[Content Script] Settings loaded, initializing Media Detector...");

    if (document.body) {
        new MediaDetector();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            new MediaDetector();
        });
    }

    console.debug("[Content Script] Advanced Media Detector loaded.");
}

// Start initialization
initializeMediaDetector();


// Listen for messages from background
browser.runtime.onMessage.addListener((message) => {
    if (message.type === "showMediaPopup" && message.mediaItem) {
        showMediaDownloadPopup(message.mediaItem);
    }
    if (message.type === "closeAllPopups") {
        const allPopups = document.querySelectorAll('.media-detector-popup-item');
        allPopups.forEach(popup => popup.remove());
        activePopupUrls.clear();
    }
});
