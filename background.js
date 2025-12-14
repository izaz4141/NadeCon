// background.js

//=============================================================
//=================={Nadeko APP Module}========================
//=============================================================

let nadekoServerPort = 8080;
let nadekoBindAddress = "localhost";
let nadekoApiKey = "";
let showPopup = false;

const CONTENT_TYPE_EXTENSIONS = {
  "text/html": "HTML|HTM",
  "text/css": "CSS",
  "text/javascript": "JS|JSON",
  "text/mspg-legacyinfo": "MSI|MSP",
  "text/plain": "TXT|VTT|SRT|M3U|PLS|M3U8|MPD|F4M|TORRENT|BTT",
  "text/srt": "SRT",
  "text/vtt": "VTT|SRT",
  "text/xml": "XML|MPD|F4M|TTML|TTML2",
  "text/x-javascript": "JS|JSON",
  "text/x-json": "JSON",
  "application/dash+xml": "MPD",
  "application/f4m+xml": "F4M|MPD",
  "application/gzip": "GZ",
  "application/javascript": "JS",
  "application/json": "JSON",
  "application/json+protobuf": "JSON",
  "application/msword": "DOC|DOCX|DOT|DOTX",
  "application/ocsp-response": "OCSP",
  "application/octet-stream-m3u8": "M3U8",
  "application/pdf": "PDF",
  "application/pkix-crl": "CRL",
  "application/torrent": "TORRENT|BTT",
  "application/ttaf+xml": "DFXP",
  "application/ttml+xml": "TTML|TTML2",
  "application/vnd.apple.mpegurl": "M3U8",
  "application/vnd.yt-ump": "UMP",
  "application/zip": "ZIP",
  "application/x-7z-compressed": "7Z",
  "application/x-aim": "PLJ",
  "application/x-bittorrent": "TORRENT|BTT",
  "application/x-chrome-extension": "CRX",
  "application/x-compress": "Z",
  "application/x-compress-7z": "7Z",
  "application/x-compressed": "ARJ",
  "application/x-dosexec": "EXE",
  "application/x-gtar": "TAR",
  "application/x-gzip": "GZ",
  "application/x-gzip-compressed": "GZ",
  "application/x-javascript": "JS",
  "application/x-mpegurl": "M3U8",
  "application/x-msdos-program": "EXE|DLL",
  "application/x-msi": "MSI",
  "application/x-msp": "MSP",
  "application/x-ole-storage": "MSI|MSP",
  "application/x-rar": "RAR",
  "application/x-rar-compressed": "RAR",
  "application/x-sdlc": "EXE|SDLC",
  "application/x-shockwave-flash": "SWF",
  "application/x-silverlight-app": "XAP",
  "application/x-subrip": "SRT",
  "application/x-tar": "TAR",
  "application/x-zip": "ZIP",
  "application/x-zip-compressed": "ZIP",
  "video/3gpp": "3GP|3GPP",
  "video/3gpp2": "3GP|3GPP",
  "video/avi": "AVI",
  "video/f4f": "F4F",
  "video/f4m": "F4M",
  "video/flv": "FLV",
  "video/mp2t": "TS|TSV|M3U8",
  "video/mp4": "MP4|M4V|M4S",
  "video/mpeg": "MPG|MPEG",
  "video/mpegurl": "M3U|M3U8",
  "video/mpg4": "MP4|M4V",
  "video/msvideo": "AVI",
  "video/quicktime": "MOV|QT",
  "video/vnd.mpeg.dash.mpd": "MPD",
  "video/webm": "WEBM",
  "video/x-flash-video": "FLV",
  "video/x-flv": "FLV",
  "video/x-mp4": "MP4|M4V",
  "video/x-mpegurl": "M3U|M3U8",
  "video/x-mpg4": "MP4|M4V",
  "video/x-ms-asf": "ASF",
  "video/x-ms-wmv": "WMV",
  "video/x-msvideo": "AVI",
  "audio/3gpp": "3GP|3GPP",
  "audio/3gpp2": "3GP|3GPP",
  "audio/mp2t": "TS|TSA|M3U8",
  "audio/mp3": "MP3",
  "audio/mp4": "M4A|MP4|M4S",
  "audio/mp4a-latm": "M4A|MP4",
  "audio/mpeg": "MP3",
  "audio/mpeg4-generic": "M4A|MP4",
  "audio/mpegurl": "M3U|M3U8",
  "audio/webm": "WEBM",
  "audio/wav": "WAV",
  "audio/x-mpeg": "MP3",
  "audio/x-mpegurl": "M3U|M3U8",
  "audio/x-ms-wma": "WMA",
  "audio/x-wav": "WAV",
  "ilm/tm": "MP3",
  "image/avif": "AVIF",
  "image/gif": "GIF|GFA",
  "image/icon": "ICO|CUR",
  "image/jpg": "JPG|JPEG",
  "image/jpeg": "JPG|JPEG",
  "image/png": "PNG|APNG",
  "image/tiff": "TIF|TIFF",
  "image/vnd.microsoft.icon": "ICO|CUR",
  "image/webp": "WEBP",
  "image/x-icon": "ICO|CUR",
  "flv-application/octet-stream": "FLV",
};

/**
 * WebSocket Client for communicating with Nadeko App
 */
class WebSocketClient {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectInterval = 5000;
    this.reconnectTimer = null;
    this.pingInterval = null;
    this.updateBadge();
  }

  updateBadge() {
    if (this.isConnected) {
      browser.browserAction.setBadgeText({ text: "" });
    } else {
      browser.browserAction.setBadgeText({ text: "X" });
      browser.browserAction.setBadgeBackgroundColor({ color: "#606060" });
    }
  }

  connect() {
    if (this.ws) {
      this.ws.close();
    }

    if (!nadekoApiKey) {
      console.warn("[WebSocket] No API Key configured. Cannot connect.");
      this.updateBadge();
      return;
    }

    const url = `ws://${nadekoBindAddress}:${nadekoServerPort}/ws?key=${encodeURIComponent(
      nadekoApiKey
    )}`;
    console.debug(`[WebSocket] Connecting to ${url}...`);

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.debug("[WebSocket] Connected");
      this.isConnected = true;
      this.stopReconnect();
      this.startPing();
      this.updateBadge();
    };

    this.ws.onclose = () => {
      console.debug("[WebSocket] Disconnected");
      this.isConnected = false;
      this.stopPing();
      this.startReconnect();
      this.updateBadge();
    };

    this.ws.onerror = (error) => {
      console.error("[WebSocket] Error:", error);
      this.ws.close();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch (e) {
        console.error("[WebSocket] Failed to parse message:", e);
      }
    };
  }

  handleMessage(msg) {
    if (msg.type === "pong") {
      // Pong received
    } else if (msg.type === "event") {
      console.debug(`[WebSocket] Event received: ${msg.event}`, msg);
    } else if (msg.type === "error") {
      console.error(`[WebSocket] Server error: ${msg.message}`);
    } else if (msg.type === "success") {
      console.debug(`[WebSocket] Success: ${msg.id}`);
    }
  }

  send(data) {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  startReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, this.reconnectInterval);
    }
  }

  stopReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      this.send({ type: "ping" });
    }, 30000);
  }

  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

const wsClient = new WebSocketClient();

/**
 * Initializes the Nadeko server port and API key from storage.
 */
async function initConfig() {
  try {
    const result = await browser.storage.local.get([
      "nadekoPort",
      "showPopup",
      "apiKey",
      "bindAddress",
    ]);
    nadekoServerPort = result.nadekoPort || 12345;
    nadekoBindAddress = result.bindAddress || "localhost";
    nadekoApiKey = result.apiKey || "";
    showPopup = result.showPopup === true || result.showPopup === "true";
    console.debug(
      `[Background Script] Config initialized - showPopup: ${showPopup} (raw value: ${result.showPopup
      }, type: ${typeof result.showPopup})`
    );

    if (nadekoApiKey) {
      wsClient.connect();
    }
  } catch (error) {
    console.error("[Background Script] Error initializing config:", error);
  }
}

// Call initialization immediately
initConfig();

/**
 * Sends a given URL and an optional filename to the local Nadeko Downloader application via WebSocket.
 */
async function sendUrlToApp(url, filename = null) {
  if (!wsClient.isConnected) {
    // Try to connect if not connected
    await initConfig();
    if (!wsClient.isConnected) {
      throw new Error("Not connected to Nadeko App");
    }
  }

  console.debug(
    `[Background Script] Sending URL to Nadeko App: ${url} (Filename: ${filename})`
  );

  const success = wsClient.send({
    type: "download",
    url: url,
    filename: filename,
    user_agent: navigator.userAgent,
  });

  if (!success) {
    throw new Error("Failed to send message via WebSocket");
  }
}

/**
 * Checks if the local application is alive (connected via WebSocket).
 */
async function isLocalhostAlive(forceCheck = false) {
  return wsClient.isConnected;
}

// Create a context menu item for "Send to Nadeko"
browser.contextMenus.create({
  id: "send-to-nadeko",
  title: "Send to Nadeko",
  contexts: ["page", "link", "video", "audio"],
});

// Listener for context menu clicks
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "send-to-nadeko") {
    const urlToSend = info.linkUrl || info.srcUrl || info.pageUrl;
    if (urlToSend) {
      console.debug(
        `[Background Script] Context menu clicked. Sending URL: ${urlToSend}`
      );
      sendUrlToApp(urlToSend).catch((error) => {
        console.error(
          `[Background Script] Failed to send URL ${urlToSend} via context menu:`,
          error
        );
      });
    } else {
      console.warn(
        "[Background Script] No valid URL found to send via context menu."
      );
    }
  }
});

//=============================================================
//==================={Url Info Sraper}=========================
//=============================================================
/**
 * Performs a HEAD request to get Content-Type, Content-Disposition, and Content-Length headers.
 * @param {string} url - The URL to check.
 * @returns {Promise<{valid: boolean, contentType: string | null, contentDisposition: string | null, contentLength: number | null}>}
 */
async function fetchMediaHeaders(url) {
  if (mediaDetailsCache.has(url)) {
    return mediaDetailsCache.get(url);
  }

  const promise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2-second timeout for HEAD request

      const response = await fetch(url, {
        method: "HEAD",
        mode: "no-cors",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // For 'no-cors' requests, response.ok is always false if it's cross-origin,
      // so we primarily rely on response.type === 'opaque'.
      // If the request itself failed (e.g., network error, DNS, or CORS/CORP block),
      // it will throw an error or be of type 'error'.
      if (response.type === "error") {
        // Explicitly check for 'error' type
        console.warn(
          `[Background Script] HEAD request for ${url} resulted in a network error.`
        );
        return {
          valid: false,
          contentType: null,
          contentDisposition: null,
          contentLength: null,
        };
      }

      const contentType = response.headers.get("Content-Type");
      const contentDisposition = response.headers.get("Content-Disposition");
      const contentLengthHeader = response.headers.get("Content-Length");
      const contentLength = contentLengthHeader
        ? parseInt(contentLengthHeader, 10)
        : null;

      // Explicitly check for known media and streaming types
      const isMedia =
        contentType &&
        (contentType.startsWith("video/") ||
          contentType.startsWith("audio/") ||
          contentType.startsWith("image/gif") ||
          contentType.includes("mpegurl") || // HLS
          contentType.includes("dash+xml") || // DASH
          contentType.includes("application/octet-stream")); // Generic binary, might be media

      return { valid: isMedia, contentType, contentDisposition, contentLength };
    } catch (error) {
      // This catch block handles actual fetch API errors (e.g., AbortError from timeout, network issues)
      console.warn(
        `[Background Script] Failed to fetch headers for ${url} (caught error): ${error.message}`
      );
      return {
        valid: false,
        contentType: null,
        contentDisposition: null,
        contentLength: null,
      };
    }
  })();

  mediaDetailsCache.set(url, promise);
  return promise;
}

/**
 * Sanitizes a string to be a valid filename.
 * @param {string} filename - The original filename.
 * @returns {string} - The sanitized filename.
 */
function sanitizeFilenameCharacters(filename) {
  const lastDotIndex = filename.lastIndexOf(".");
  let namePart = filename;
  let extPart = "";

  if (lastDotIndex > 0) {
    namePart = filename.substring(0, lastDotIndex);
    extPart = filename.substring(lastDotIndex);
  }

  namePart = namePart.replace(/[/?%*:|"<>\\/]/g, "_");
  namePart = namePart.replace(/^\.+|\.+$/g, "").trim();

  let cleanedFilename = namePart + extPart;

  const MAX_LENGTH = 200;
  if (cleanedFilename.length > MAX_LENGTH) {
    if (lastDotIndex > 0) {
      const originalNameLength = namePart.length;
      const originalExtLength = extPart.length;
      const availableNameLength = MAX_LENGTH - originalExtLength;

      if (availableNameLength > 0) {
        cleanedFilename = namePart.substring(0, availableNameLength) + extPart;
      } else {
        cleanedFilename = extPart.substring(0, MAX_LENGTH);
      }
    } else {
      cleanedFilename = cleanedFilename.substring(0, MAX_LENGTH);
    }
  }

  if (cleanedFilename.length === 0) {
    return "downloaded_file";
  }

  return cleanedFilename;
}

/**
 * Derives a suitable filename from a URL, Content-Type, and Content-Disposition.
 * @param {string} url - The original URL.
 * @param {string | null} contentType - The Content-Type header.
 * @param {string | null} contentDisposition - The Content-Disposition header.
 * @returns {string} - The derived filename.
 */
function deriveFilename(url, contentType, contentDisposition) {
  let filename = "";

  if (contentDisposition) {
    const match = /filename\*?=['"]?(?:UTF-8''|)(.*?)(?:['"]|$|;|\s)/i.exec(
      contentDisposition
    );
    if (match && match[1]) {
      try {
        filename = decodeURIComponent(match[1].trim());
        return filename;
      } catch (e) {
        console.warn(
          `[Background Script] Failed to decode Content-Disposition filename: ${match[1]}`
        );
        filename = match[1].trim();
      }
    }
  }

  if (!filename) {
    try {
      const urlObj = new URL(url);
      filename = urlObj.pathname.split("/").pop() || "unknown";
      filename = filename.split("?")[0].split("#")[0];
    } catch (e) {
      console.warn(
        `[Background Script] Failed to parse URL for filename: ${url}`,
        e
      );
      filename = "unknown_file";
    }
  }

  const currentExt = filename.includes(".") ? filename.split(".").pop() : "";
  let fileExtension = "";

  if (contentType) {
    const extensions = CONTENT_TYPE_EXTENSIONS[contentType.toLowerCase()];
    if (extensions) {
      // Take the first extension if multiple are listed (e.g., "JPG|JPEG" -> "jpg")
      fileExtension = extensions.split("|")[0].toLowerCase();
    } else {
      // Fallback for types not in the map
      const typeParts = contentType.split("/");
      if (typeParts.length > 1) {
        fileExtension = typeParts[1].toLowerCase().split(";")[0];
        if (
          fileExtension === "octet-stream" &&
          (url.includes(".bin") || url.includes(".dat"))
        )
          fileExtension = "bin";
        if (fileExtension === "octet-stream" && url.includes(".ts"))
          fileExtension = "ts";
      }
    }
  }

  if (!currentExt && fileExtension) {
    filename = `${filename}.${fileExtension}`;
  }

  filename = sanitizeFilenameCharacters(filename);

  return filename;
}

/**
 * Modifies a given URL to remove 'bytestart' and 'byteend' query parameters,
 * and then sorts the remaining query parameters alphabetically.
 * This can be used to request the full file instead of a partial one,
 * and to get a canonical URL for comparison.
 *
 * @param {string} originalUrl The original URL string which might contain byte range parameters.
 * @returns {string} The modified URL string with 'bytestart' and 'byteend' parameters removed
 * and the remaining query parameters sorted.
 */
function modifyParams(originalUrl) {
  try {
    const url = new URL(originalUrl);

    // Delete the 'bytestart' parameter if it exists
    if (url.searchParams.has("bytestart")) {
      url.searchParams.delete("bytestart");
    }
    // Delete the 'byteend' parameter if it exists
    if (url.searchParams.has("byteend")) {
      url.searchParams.delete("byteend");
    }

    if (url.searchParams.has("_nc_cat")) {
      url.searchParams.delete("_nc_cat");
    }

    // Get all remaining parameters as an array of [key, value] pairs
    const params = Array.from(url.searchParams.entries());

    // Sort the parameters alphabetically by key.
    // If keys are identical, sort by value to ensure stable sorting.
    params.sort((a, b) => {
      // Compare keys first
      const keyComparison = a[0].localeCompare(b[0]);
      if (keyComparison !== 0) {
        return keyComparison;
      }
      // If keys are the same, compare values
      return a[1].localeCompare(b[1]);
    });

    // Clear existing search parameters to replace with sorted ones
    url.search = ""; // This effectively clears all parameters and the '?'

    // Append the sorted parameters back to the URL's searchParams
    for (const [key, value] of params) {
      url.searchParams.append(key, value);
    }

    // Return the reconstructed URL with sorted parameters
    return url.toString();
  } catch (error) {
    // Log an error if the URL is invalid and return the original URL
    console.error("Error parsing or modifying URL:", error);
    return originalUrl;
  }
}

//==============================================================
//================={Download Intercept Module}=================
//==============================================================

/**
 * Request tracking for download intercept
 * Structure: Map<requestId, RequestInfo>
 */
class RequestInfo {
  constructor(details) {
    this.requestId = details.requestId;
    this.url = details.url;
    this.method = details.method || "GET";
    this.tabId = details.tabId;
    this.frameId = details.frameId || 0;
    this.type = details.type;
    this.timeStamp = details.timeStamp;
    this.requestHeaders = null;
    this.requestBody = details.requestBody || null;
    this.statusCode = null;
    this.statusLine = null;
    this.responseHeaders = null;
    this.contentType = null;
    this.contentDisposition = null;
    this.contentLength = null;
    this.redirectUrl = null;
    this.redirectChain = [];
    this.intercepted = false;
    this.ip = null;
  }

  getFinalUrl() {
    return this.redirectChain.length > 0
      ? this.redirectChain[this.redirectChain.length - 1]
      : this.url;
  }
}

// Map of active download requests being tracked
const downloadRequests = new Map();

// Deduplication cache: url -> timestamp
const recentDownloads = new Map();
const DEDUP_WINDOW_MS = 5000; // 5 seconds

// Cleanup interval for stale requests
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 60000; // 60 seconds

  // Clean up old requests
  for (const [requestId, request] of downloadRequests.entries()) {
    if (now - request.timeStamp > staleThreshold) {
      downloadRequests.delete(requestId);
    }
  }

  // Clean up deduplication cache
  for (const [url, timestamp] of recentDownloads.entries()) {
    if (now - timestamp > DEDUP_WINDOW_MS) {
      recentDownloads.delete(url);
    }
  }
}, 30000); // Run every 30 seconds

/**
 * Checks if a URL was recently downloaded (for deduplication)
 * @param {string} url - The URL to check
 * @returns {boolean} - True if recently downloaded
 */
function isRecentDownload(url) {
  const timestamp = recentDownloads.get(url);
  if (!timestamp) return false;

  const age = Date.now() - timestamp;
  if (age > DEDUP_WINDOW_MS) {
    recentDownloads.delete(url);
    return false;
  }
  return true;
}

/**
 * Marks a URL as recently downloaded
 * @param {string} url - The URL to mark
 */
function markAsRecentDownload(url) {
  recentDownloads.set(url, Date.now());
}

/**
 * Parses Content-Disposition header to extract filename
 * @param {string} contentDisposition - The Content-Disposition header value
 * @returns {string|null} - The extracted filename or null
 */
function parseContentDispositionFilename(contentDisposition) {
  if (!contentDisposition) return null;

  // Try filename*= first (RFC 5987)
  let match = /filename\*\s*=\s*(?:UTF-8''|)([^;\s]+)/i.exec(
    contentDisposition
  );
  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1].replace(/['"]/g, ""));
    } catch (e) {
      console.warn(
        "[Download Intercept] Failed to decode RFC 5987 filename:",
        match[1]
      );
    }
  }

  // Try filename= (quoted or unquoted)
  match = /filename\s*=\s*"([^"]+)"/i.exec(contentDisposition);
  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch (e) {
      return match[1];
    }
  }

  match = /filename\s*=\s*([^;\s]+)/i.exec(contentDisposition);
  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1].replace(/['"]/g, ""));
    } catch (e) {
      return match[1].replace(/['"]/g, "");
    }
  }

  return null;
}

/**
 * Checks if Content-Disposition indicates a download
 * @param {string} contentDisposition - The Content-Disposition header value
 * @returns {boolean} - True if it's a download
 */
function isDownloadDisposition(contentDisposition) {
  if (!contentDisposition) return false;
  const lower = contentDisposition.toLowerCase();
  // Check for attachment or if there's a filename parameter (even with inline)
  return (
    lower.includes("attachment") || /filename[*]?\s*=/i.test(contentDisposition)
  );
}

//==============================================================
//================={Media Scraper Module}=======================
//==============================================================

// Using a Map to store unique media URLs found across all tabs
// Structure: Map<tabId, Map<url, {url, filename, validMedia, isManifest}>>
const scrapedMediaUrls = new Map();

// Cache for fetchMediaHeaders results.
const mediaDetailsCache = new Map();

/**
 * Gets full media details (validity, content type, derived filename, isManifest flag for a given URL.
 * @param {string} url - The URL of the potential media.
 * @param {object} [details] - Optional pre-fetched details (contentType, contentDisposition, contentLength).
 * @returns {Promise<{url: string, filename: string, validMedia: boolean, isManifest: boolean}>}
 */
async function getMediaDetails(url, details = null) {
  url = modifyParams(url);
  let valid, contentType, contentDisposition, contentLength;

  if (details) {
    // Use provided details if available
    ({ valid, contentType, contentDisposition, contentLength } = details);
    if (valid === undefined) {
      // Re-evaluate validity based on content type if not explicitly provided
      valid =
        contentType &&
        (contentType.startsWith("video/") ||
          contentType.startsWith("audio/") ||
          contentType.startsWith("image/gif") ||
          contentType.includes("mpegurl") || // HLS
          contentType.includes("dash+xml") || // DASH
          contentType.includes("application/octet-stream")); // Generic binary
    }
  } else {
    // Fallback to fetching headers
    ({ valid, contentType, contentDisposition, contentLength } =
      await fetchMediaHeaders(url));
  }

  const filename = deriveFilename(url, contentType, contentDisposition);
  const isManifest =
    contentType &&
    (contentType.includes("mpegurl") || contentType.includes("dash+xml"));

  return { url, filename, validMedia: valid, isManifest: isManifest };
}

/**
 * Adds a URL (along with its derived filename and manifest status) to the scrapedMediaUrls set for a specific tab.
 * This function also sends the `showMediaPopup` message to the content script.
 * @param {number} tabId - The ID of the tab where the URL was found.
 * @param {string} url - The raw URL of the media.
 * @param {string} source - 'webRequest' or 'contentScript' to indicate where the URL came from.
 * @param {object} [overrides] - Optional overrides or details.
 */
async function addMediaUrl(tabId, url, source, overrides = {}) {
  let mediaItem;

  if (overrides.forceValid) {
    mediaItem = {
      url: url,
      filename: overrides.filename || "media",
      validMedia: true,
      isManifest: false, // Default to false for content script detected items unless specified
    };
  } else {
    // Pass overrides as details to getMediaDetails
    mediaItem = await getMediaDetails(url, overrides);
  }

  if (!mediaItem.validMedia) {
    return;
  }

  if (!scrapedMediaUrls.has(tabId)) {
    scrapedMediaUrls.set(tabId, new Map()); // Use a Map for media items per tab, keyed by URL
  }
  const urlsForTab = scrapedMediaUrls.get(tabId);

  // Check if exact URL already exists to prevent true duplicates
  if (urlsForTab.has(mediaItem.url)) {
    console.debug(
      `[Background Script] URL ${mediaItem.url} already exists for tab ${tabId}. Skipping.`
    );
    return;
  }

  // Add the new media item to the tab's map
  urlsForTab.set(mediaItem.url, mediaItem);

  let logMessage = `[Background Script] Added media item for tab ${tabId} (${source}): ${mediaItem.filename} (${mediaItem.url})`;
  if (mediaItem.isManifest) {
    logMessage += " (Type: Manifest)";
  } else {
    logMessage += " (Type: General Media)"; // Will only be 'General Media' for full files
  }
  console.debug(logMessage);

  // Notify the main browser action popup to update its list
  browser.runtime
    .sendMessage({ type: "urlAdded", mediaItem: mediaItem, tabId: tabId })
    .catch((error) => {
      // This is fine if the popup isn't open
    });

  // Only send message to content script if tabId is valid (>= 0)
  // AND if it didn't come from the content script itself (to avoid loops/double popups)
  if (tabId >= 0 && showPopup && source !== "contentScript") {
    // Send message to content script for popup display
    browser.tabs
      .sendMessage(tabId, {
        type: "showMediaPopup",
        mediaItem: mediaItem,
      })
      .catch((error) => {
        console.debug(
          `[Background Script] Could not send showMediaPopup to tab ${tabId}: ${error.message}`
        );
      });
  } else {
    console.debug(
      `[Background Script] Skipping showMediaPopup for tabId: ${tabId} (Source: ${source}).`
    );
  }
}

/**
 * Checks response headers to determine if the request should be intercepted as a download or media.
 * Ported from reference implementation (nc).
 * @param {object} details - The onHeadersReceived details.
 * @returns {object} - { action: 'download' | 'ignore' | 'detect', filename: string | null }
 */
/**
 * Checks response headers to determine if the request should be intercepted as a download or media.
 * Ported from reference implementation (nc).
 * @param {object} details - The onHeadersReceived details.
 * @returns {object} - { action: 'download' | 'ignore' | 'detect', filename: string | null }
 */
function checkResponseHeaders(details) {
  const { statusCode, responseHeaders, url, type } = details;

  // Ref: if (200 != c && 206 != c && 304 != c) return 1;
  if (statusCode !== 200 && statusCode !== 206 && statusCode !== 304) {
    return { action: "ignore" };
  }

  const headers = {};
  for (const h of responseHeaders) {
    headers[h.name.toLowerCase()] = h.value;
  }

  const contentType = (headers["content-type"] || "")
    .toLowerCase()
    .split(";")[0]
    .trim();
  const contentDisposition = headers["content-disposition"] || "";
  const contentLength = parseInt(headers["content-length"] || "0", 10);

  const isAttachment = contentDisposition.toLowerCase().includes("attachment");

  // If it's an XHR, Media, or Object request, we should generally NOT intercept it as a download
  // because it breaks page functionality (playback, scripts, etc.).
  // Instead, we 'detect' it if it's media, so it appears in the popup.
  if (type === "xmlhttprequest" || type === "media" || type === "object") {
    if (
      contentType.startsWith("video/") ||
      contentType.startsWith("audio/") ||
      contentType.includes("mpegurl") ||
      contentType.includes("dash+xml") ||
      contentType.includes("octet-stream-m3u8") ||
      contentType === "application/x-mpegurl" ||
      contentType === "application/vnd.apple.mpegurl"
    ) {
      return { action: "detect" };
    }
    // Check for specific binary types that might be media segments
    if (contentType === "application/octet-stream") {
      if (
        url.includes(".ts") ||
        url.includes(".m4s") ||
        url.includes("segment")
      ) {
        return { action: "detect" };
      }
    }
    return { action: "ignore" };
  }

  // For Main Frame and Sub Frame (Navigation)

  // Ignore HTML unless it's an explicit attachment
  if (
    !isAttachment &&
    (contentType === "text/html" || contentType === "application/xhtml+xml")
  ) {
    return { action: "ignore" };
  }

  // If attachment, download.
  if (isAttachment) {
    return { action: "download" };
  }

  // Check filename/extension
  let filename = parseContentDispositionFilename(contentDisposition);
  if (!filename) {
    try {
      const urlObj = new URL(url);
      filename = urlObj.pathname.split("/").pop();
    } catch (e) { }
  }

  let ext = filename ? filename.split(".").pop().toLowerCase() : "";
  let knownExts = CONTENT_TYPE_EXTENSIONS[contentType];
  let isKnown = false;

  if (knownExts) {
    const exts = knownExts.split("|").map((e) => e.toLowerCase());
    if (exts.includes(ext)) isKnown = true;
  }

  // Ref logic: !A && y && (g && h ? A = !0 : d ? A = w = !0 : M || Qa(y) || (A = w = !0))
  // If not known yet, but has extension...
  if (!isKnown && ext) {
    // Fallback checks
    if (contentType === "application/octet-stream") isKnown = true;

    // Check if extension is a known media/download extension even if content-type didn't match
    const downloadExtensions = [
      "exe",
      "msi",
      "dmg",
      "pkg",
      "deb",
      "rpm",
      "zip",
      "rar",
      "7z",
      "tar",
      "gz",
      "bz2",
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "apk",
      "ipa",
      "iso",
      "img",
      "mp4",
      "mkv",
      "webm",
      "avi",
      "mov",
      "wmv",
      "flv",
      "mp3",
      "wav",
      "flac",
      "aac",
      "ogg",
      "m4a",
      "opus",
    ];
    if (downloadExtensions.includes(ext)) isKnown = true;
  }

  if (isKnown) {
    // Filter out images/scripts/css/json/html unless it's an explicit attachment
    if (
      contentType.startsWith("image/") ||
      contentType.includes("javascript") ||
      contentType === "text/css" ||
      contentType === "application/json" ||
      contentType === "text/html" ||
      contentType === "text/plain" // Be careful with text/plain
    ) {
      // Special case: text/plain might be a playlist (m3u8)
      if (contentType === "text/plain" && (ext === "m3u8" || ext === "m3u")) {
        return { action: "detect" };
      }
      return { action: "ignore" };
    }
    return { action: "download" };
  }

  // Specific check for media types that might not have matched extension
  if (
    contentType.startsWith("video/") ||
    contentType.startsWith("audio/") ||
    contentType.includes("mpegurl") ||
    contentType.includes("dash+xml")
  ) {
    return { action: "download" };
  }

  return { action: "ignore" };
}

/**
 * Checks request details to determine if it should be monitored or intercepted.
 * Ported from reference implementation (mc).
 * @param {object} details - The onBeforeRequest details.
 * @returns {object} - { action: 'monitor' | 'ignore' }
 */
function checkRequest(details) {
  const { url, method, type } = details;
  const lowerUrl = url.toLowerCase();

  // Ref: if (b.G && c) return 3;

  // Explicit exclusions (from original code, kept for safety)
  if (lowerUrl.includes("facebook.com") || lowerUrl.includes("fbcdn.net")) {
    if (
      lowerUrl.includes("/ajax/") ||
      lowerUrl.includes("bootloader-endpoint") ||
      lowerUrl.includes("graphql")
    ) {
      return { action: "ignore" };
    }
  }

  // Check for media extensions in URL
  const mediaExtensions =
    /\.(m3u8|mpd|ts|mp4|webm|m4s|mp4a|fmp4|aac|mp3|ogg|flac|wav|mov|avi|wmv|flv|vtt|srt|ass|scc|opus|ogv|mkv)(\?.*)?$/i;
  if (mediaExtensions.test(lowerUrl)) return { action: "monitor" };

  // Check for streaming keywords
  const streamingPatterns =
    /(chunk|segment|playlist|manifest|stream|video|audio|hls|dash|drm|playable_url|video_play|stream_src|media|file=|\?src=|\?url=|\?video=|\?audio=|\.m3u8|\.mpd|\.ism|\.isml)/i;
  if (streamingPatterns.test(lowerUrl)) return { action: "monitor" };

  // Check for known media domains (broad check)
  const knownMediaDomains =
    /(youtube\.com|googlevideo\.com|vimeo\.com|twitch\.tv|dailymotion\.com|soundcloud\.com|spotifycdn\.com|netflix\.com|disneyplus\.com|hbomax\.com)/i;
  if (knownMediaDomains.test(lowerUrl)) return { action: "monitor" };

  return { action: "ignore" };
}

// --- WebRequest Listener for initializing request tracking ---
browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    // Track all requests that might become downloads
    const relevantTypes = [
      "main_frame",
      "sub_frame",
      "other",
      "xmlhttprequest",
      "media",
      "object",
    ];
    if (relevantTypes.includes(details.type)) {
      const requestId = details.requestId;

      // Create or update request info
      if (!downloadRequests.has(requestId)) {
        const request = new RequestInfo(details);
        downloadRequests.set(requestId, request);
      }

      // Check if we should monitor this request for media
      const check = checkRequest(details);
      if (check.action === "monitor") {
        // If it's XHR or media, we might want to add it to media list immediately if it looks very promising
        if (
          details.type === "xmlhttprequest" ||
          details.type === "media" ||
          details.type === "object"
        ) {
          addMediaUrl(details.tabId, details.url, "webRequest").catch(
            (e) => { }
          );
        }
      }
    }
  },
  {
    urls: ["<all_urls>"],
    types: [
      "main_frame",
      "sub_frame",
      "other",
      "xmlhttprequest",
      "media",
      "object",
    ],
  },
  ["requestBody"]
);

// --- WebRequest Listener for tracking redirects ---
browser.webRequest.onBeforeRedirect.addListener(
  (details) => {
    const requestId = details.requestId;
    const request = downloadRequests.get(requestId);

    if (request) {
      request.redirectUrl = details.redirectUrl;
      request.redirectChain.push(details.redirectUrl);
      console.debug(
        `[Download Intercept] Redirect detected: ${request.url} -> ${details.redirectUrl}`
      );
    }
  },
  {
    urls: ["<all_urls>"],
    types: [
      "main_frame",
      "sub_frame",
      "other",
      "xmlhttprequest",
      "media",
      "object",
    ],
  }
);

// --- WebRequest Listener for intercepting downloads (Headers Received) ---
browser.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (!wsClient.isConnected) return { cancel: false };
    const requestId = details.requestId;
    let request = downloadRequests.get(requestId);
    if (!request) {
      request = new RequestInfo(details);
      downloadRequests.set(requestId, request);
    }

    request.statusCode = details.statusCode;
    request.statusLine = details.statusLine;
    request.responseHeaders = details.responseHeaders;
    request.ip = details.ip;

    const check = checkResponseHeaders(details);

    if (check.action === "download") {
      const finalUrl = request.getFinalUrl();

      // Deduplication
      if (isRecentDownload(finalUrl)) {
        return { cancel: false };
      }

      console.debug(`[Download Intercept] Intercepting download: ${finalUrl}`);
      markAsRecentDownload(finalUrl);
      request.intercepted = true;

      // Extract headers for filename derivation
      const headers = {};
      for (const h of details.responseHeaders)
        headers[h.name.toLowerCase()] = h.value;
      const contentType = headers["content-type"];
      const contentDisposition = headers["content-disposition"];

      setTimeout(
        () =>
          handleInterceptedDownload(
            finalUrl,
            contentType,
            contentDisposition,
            details.tabId,
            request.method,
            request.requestBody
          ),
        0
      );

      return { cancel: true };
    } else if (check.action === "detect") {
      // Just add to popup, do not intercept
      // Extract headers to pass to addMediaUrl
      const headers = {};
      for (const h of details.responseHeaders)
        headers[h.name.toLowerCase()] = h.value;
      const contentType = headers["content-type"];
      const contentDisposition = headers["content-disposition"];
      const contentLength = headers["content-length"];

      addMediaUrl(details.tabId, details.url, "webRequest", {
        contentType,
        contentDisposition,
        contentLength,
      }).catch((e) => { });
    }

    return { cancel: false };
  },
  {
    urls: ["<all_urls>"],
    types: [
      "main_frame",
      "sub_frame",
      "other",
      "xmlhttprequest",
      "media",
      "object",
    ],
  },
  ["blocking", "responseHeaders"]
);

/**
 * Handles an intercepted download request.
 * Checks localhost status and either sends to Nadeko or re-initiates browser download.
 * @param {string} url - The URL to download.
 * @param {string} contentType - The Content-Type header.
 * @param {string} contentDisposition - The Content-Disposition header.
 * @param {number} tabId - The ID of the tab where the download originated.
 * @param {string} method - The HTTP method (GET/POST).
 * @param {object} requestBody - The request body for POST requests.
 * @param {number} retryCount - Current retry attempt (internal use).
 */
async function handleInterceptedDownload(
  url,
  contentType,
  contentDisposition,
  tabId,
  method = "GET",
  requestBody = null,
  retryCount = 0
) {
  console.debug(`[Download Intercept] Handling intercepted download: ${url}`);
  const isAlive = await isLocalhostAlive();
  const filename = deriveFilename(url, contentType, contentDisposition);

  if (isAlive) {
    console.debug(
      `[Download Intercept] Nadeko App is connected. Sending to Nadeko: ${url} as ${filename}`
    );

    try {
      // Prepare download metadata
      const downloadData = {
        url: url,
        filename: filename,
        method: method,
      };

      // Include POST data if available
      if (method === "POST" && requestBody) {
        if (requestBody.formData) {
          downloadData.formData = requestBody.formData;
        } else if (requestBody.raw) {
          // Convert raw data to base64 if needed
          console.debug(
            "[Download Intercept] POST request with raw data detected"
          );
        }
      }

      await sendUrlToApp(url, filename);

      // Notify popup/UI of successful interception
      browser.runtime
        .sendMessage({
          type: "downloadHandledByNadeko",
          url: url,
          filename: filename,
          tabId: tabId,
        })
        .catch((e) => {
          /* Popup might not be open */
        });
    } catch (error) {
      console.error(`[Download Intercept] Error sending to Nadeko:`, error);

      // Retry logic with exponential backoff
      if (retryCount < 2) {
        const retryDelay = Math.pow(2, retryCount) * 500; // 500ms, 1s
        console.debug(
          `[Download Intercept] Retrying in ${retryDelay}ms... (attempt ${retryCount + 1
          }/2)`
        );

        setTimeout(() => {
          handleInterceptedDownload(
            url,
            contentType,
            contentDisposition,
            tabId,
            method,
            requestBody,
            retryCount + 1
          );
        }, retryDelay);
        return;
      }

      // After retries exhausted, fall back to browser download
      console.error(
        `[Download Intercept] Failed after ${retryCount} retries. Falling back to browser download: ${url}`
      );
      fallbackToBrowserDownload(url, filename);
    }
  } else {
    console.debug(
      `[Download Intercept] Nadeko App is not connected. Using browser download for: ${url}`
    );
    fallbackToBrowserDownload(url, filename);
  }
}

/**
 * Falls back to standard browser download when Nadeko App is unavailable
 * @param {string} url - The URL to download
 * @param {string} filename - The suggested filename
 */
function fallbackToBrowserDownload(url, filename) {
  browser.downloads
    .download({
      url: url,
      filename: filename,
      conflictAction: "uniquify",
      saveAs: false,
    })
    .catch((error) => {
      console.error(
        `[Download Intercept] Browser download also failed: ${url}`,
        error
      );
      // As last resort, try with saveAs prompt
      browser.downloads
        .download({
          url: url,
          filename: filename,
          conflictAction: "uniquify",
          saveAs: true,
        })
        .catch((finalError) => {
          console.error(
            `[Download Intercept] All download methods failed: ${url}`,
            finalError
          );
        });
    });
}

// --- Message Listener from Content Scripts and Popup ---
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getMediaUrls" && message.tabId !== undefined) {
    // Convert Map values to an Array for the popup
    const mediaItems = Array.from(
      scrapedMediaUrls.get(message.tabId)?.values() || []
    );
    console.debug(
      `[Background Script] Sending media items to popup for tab ${message.tabId}:`,
      mediaItems
    );
    sendResponse({ mediaItems: mediaItems });
    return true;
  } else if (message.type === "mediaUrlDetected" && sender.tab) {
    addMediaUrl(sender.tab.id, message.url, "contentScript", {
      forceValid: true,
      filename: message.filename,
    }).catch((error) => {
      console.error(
        `[Background Script] Error adding URL from content script: ${message.url}`,
        error
      );
    });
  } else if (message.type === "initiateSmartDownload") {
    const { url, filename, tabId } = message;
    console.debug(
      `[Background Script] Received initiateSmartDownload request for: ${url} as ${filename} (TabId: ${tabId})`
    );
    // When initiateSmartDownload is triggered, it's explicitly by user intent
    // so we assume it's a valid target and send it.
    handleInterceptedDownload(
      url,
      "application/octet-stream",
      `attachment; filename="${filename}"`,
      tabId
    )
      .then(() => {
        sendResponse({
          success: true,
          message: "Download initiated via smart routing.",
        });
      })
      .catch((error) => {
        sendResponse({
          success: false,
          error: error.message,
          message: "Failed to initiate smart download.",
        });
      });
    return true;
  } else if (message.type === "checkLocalhostStatus") {
    console.debug("[Background Script] Received checkLocalhostStatus request.");
    isLocalhostAlive(true)
      .then((alive) => {
        sendResponse({ isAlive: alive });
      })
      .catch((error) => {
        console.error(
          "[Background Script] Error during checkLocalhostStatus:",
          error
        );
        sendResponse({ isAlive: false, error: error.message });
      });
    return true;
  } else if (message.type === "configChanged") {
    nadekoServerPort = message.newPort;
    nadekoBindAddress = message.newBindAddress || "localhost";
    nadekoApiKey = message.newApiKey;
    showPopup = message.showChecked === true || message.showChecked === "true";
    console.debug(
      `[Background Script] showPopup updated via configChanged: ${showPopup}`
    );

    // Reconnect WebSocket with new settings
    wsClient.connect();

    sendResponse({ success: true });
    return true;
  } else if (message.type === "copyUrl") {
    console.debug(
      `[Background Script] Received copyUrl message. Clipboard operation is handled in popup.`
    );
    sendResponse({ success: true, message: "Copy initiated by popup." });
    return true;
  } else if (message.type === "clearUrls") {
    // Clear specific tab URLs or all URLs
    if (message.tabId) {
      scrapedMediaUrls.delete(message.tabId); // Clear map for this tab
      console.debug(`Cleared URLs for tab ${message.tabId}`);
      browser.tabs
        .sendMessage(message.tabId, { type: "closeAllPopups" })
        .catch((error) => {
          console.warn(
            `[Background Script] Could not send closeAllPopups to tab ${message.tabId}:`,
            error
          );
        });
      sendResponse({ success: true });
    } else {
      console.warn(
        "[Background Script] ClearUrls message received without tabId. Clearing all URLs across all tabs."
      );
      scrapedMediaUrls.clear(); // Clear all tabs' URLs
      mediaDetailsCache.clear(); // Clear global cache for all URLs

      // Send message to all active content scripts to close popups
      browser.tabs.query({}).then((tabs) => {
        tabs.forEach((tab) => {
          if (tab.id !== undefined) {
            browser.tabs
              .sendMessage(tab.id, { type: "closeAllPopups" })
              .catch((error) => {
                console.warn(
                  `[Background Script] Could not send closeAllPopups to tab ${tab.id}:`,
                  error
                );
              });
          }
        });
      });
      sendResponse({
        success: false,
        error: "No tabId provided, all URLs and popups cleared.",
      });
    }
    return true;
  }
});

// --- Tab Listener to clean up URLs when a tab is closed or navigated away ---
browser.tabs.onRemoved.addListener((tabId) => {
  scrapedMediaUrls.delete(tabId); // Remove entries for the closed tab
  console.debug(`Removed URLs for closed tab ${tabId}`);
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Clear URLs for a tab if it navigates to a new main URL
  if (changeInfo.url && scrapedMediaUrls.has(tabId)) {
    scrapedMediaUrls.delete(tabId);
    console.debug(`Cleared URLs for tab ${tabId} due to navigation.`);
  }
});
