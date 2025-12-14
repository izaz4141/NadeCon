// config/config.js

const bindAddressInput = document.getElementById('bindAddress');
const serverPortInput = document.getElementById('serverPort');
const apiKeyInput = document.getElementById('apiKey');
const showPopupCheckbox = document.getElementById('showPopup');

const saveBtn = document.getElementById('saveBtn');
const statusMessage = document.getElementById('statusMessage');
const portError = document.getElementById('portError');

const DEFAULT_BIND_ADDRESS = 'localhost';
const DEFAULT_PORT = 8080;
const DEFAULT_SHOW = false;
const DEFAULT_API_KEY = "";

/**
 * Displays a temporary status message to the user.
 * @param {string} message - The message to display.
 * @param {string} type - 'success' or 'error'.
 */
function showStatusMessage(message, type) {
    statusMessage.textContent = message;
    statusMessage.classList.remove('hidden', 'bg-green-900', 'text-green-200', 'bg-red-900', 'text-red-200');
    if (type === 'success') {
        statusMessage.classList.add('bg-green-900', 'text-green-200');
    } else {
        statusMessage.classList.add('bg-red-900', 'text-red-200');
    }
    statusMessage.classList.remove('opacity-0');
    statusMessage.classList.add('opacity-100');

    setTimeout(() => {
        statusMessage.classList.remove('opacity-100');
        statusMessage.classList.add('opacity-0');
        setTimeout(() => {
            statusMessage.classList.add('hidden');
        }, 300);
    }, 2000);
}

/**
 * Loads the saved port from storage and populates the input field.
 */
async function loadOptions() {
    try {
        const result = await browser.storage.local.get(['nadekoPort', 'showPopup', 'apiKey', 'bindAddress']);
        bindAddressInput.value = result.bindAddress || DEFAULT_BIND_ADDRESS;
        serverPortInput.value = result.nadekoPort || DEFAULT_PORT;
        apiKeyInput.value = result.apiKey || DEFAULT_API_KEY;
        showPopupCheckbox.checked = result.showPopup === 'true' ? true : (result.showPopup === 'false' ? false : DEFAULT_SHOW);
    } catch (error) {
        console.error('[Config] Error loading options:', error);
        serverPortInput.value = DEFAULT_PORT;
        showStatusMessage('Error loading settings.', 'error');
    }
}

/**
 * Saves the port from the input field to storage.
 */
async function saveOptions() {
    portError.classList.add('hidden');
    const bindAddress = bindAddressInput.value.trim() || DEFAULT_BIND_ADDRESS;
    const port = parseInt(serverPortInput.value, 10);
    const apiKey = apiKeyInput.value.trim();
    const doPopup = showPopupCheckbox.checked.toString();

    if (isNaN(port) || port < 1 || port > 65535) {
        portError.classList.remove('hidden');
        showStatusMessage('Invalid port number.', 'error');
        return;
    }

    try {
        await browser.storage.local.set({ nadekoPort: port, apiKey: apiKey, showPopup: doPopup, bindAddress: bindAddress });

        console.debug(`[Config] Successfully set bind address to ${bindAddress}, port to ${port}, API Key, and show to ${doPopup}`);
        showStatusMessage('Settings saved successfully!', 'success');

        // Notify background script of configuration change to refresh cache immediately
        browser.runtime.sendMessage({
            type: "configChanged",
            newPort: port,
            newApiKey: apiKey,
            showChecked: doPopup,
            newBindAddress: bindAddress
        }).catch(e => {
            console.warn("[Config] Could not notify background script of config change:", e);
        });

    } catch (error) {
        console.error('[Config] Error saving options:', error);
        showStatusMessage('Error saving settings.', 'error');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', loadOptions);
saveBtn.addEventListener('click', saveOptions);

// Real-time validation feedback (optional)
serverPortInput.addEventListener('input', () => {
    const port = parseInt(serverPortInput.value, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
        portError.classList.remove('hidden');
    } else {
        portError.classList.add('hidden');
    }
});
