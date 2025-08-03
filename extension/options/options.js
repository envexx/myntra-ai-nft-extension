// Options JavaScript untuk AI NFT Analyzer

document.addEventListener('DOMContentLoaded', function() {
  // Set Myntra AI icon
  const myntraIcon = document.getElementById('myntraIcon');
  if (myntraIcon) {
    myntraIcon.src = chrome.runtime.getURL('icons/128.png');
  }

  // Element references
  const unleashNftApiKeyInput = document.getElementById('unleashNftApiKey');
  const geminiApiKeyInput = document.getElementById('geminiApiKey');
  const saveApiKeysBtn = document.getElementById('saveApiKeysBtn');
  const clearApiKeysBtn = document.getElementById('clearApiKeysBtn');
  const autoAnalyzeCheckbox = document.getElementById('autoAnalyze');
  const showRiskWarningsCheckbox = document.getElementById('showRiskWarnings');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const testConnectionBtn = document.getElementById('testConnectionBtn');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const statusMessage = document.getElementById('statusMessage');

  // Load saved settings on page load
  loadSettings();
  checkBackendStatus();

  // Event listeners
  saveApiKeysBtn.addEventListener('click', saveApiKeys);
  clearApiKeysBtn.addEventListener('click', clearApiKeys);
  saveSettingsBtn.addEventListener('click', saveSettings);
  testConnectionBtn.addEventListener('click', checkBackendStatus);

  // Load settings from storage
  async function loadSettings() {
    try {
      // Load API keys
      const apiKeys = await chrome.storage.sync.get(['unleash_nft_api_key', 'gemini_api_key']);
      if (apiKeys.unleash_nft_api_key) {
        unleashNftApiKeyInput.value = apiKeys.unleash_nft_api_key;
      }
      if (apiKeys.gemini_api_key) {
        geminiApiKeyInput.value = apiKeys.gemini_api_key;
      }

      // Load other settings
      const settings = await chrome.storage.sync.get(['auto_analyze', 'show_risk_warnings']);
      autoAnalyzeCheckbox.checked = settings.auto_analyze !== false; // Default to true
      showRiskWarningsCheckbox.checked = settings.show_risk_warnings !== false; // Default to true
    } catch (error) {
      console.error('Error loading settings:', error);
      showStatus('Error loading settings', 'error');
    }
  }

  // Save API keys
  async function saveApiKeys() {
    try {
      const unleashNftKey = unleashNftApiKeyInput.value.trim();
      const geminiKey = geminiApiKeyInput.value.trim();

      if (!unleashNftKey || !geminiKey) {
        showStatus('Please enter both API keys', 'error');
        return;
      }

      // Save to Chrome storage
      await chrome.storage.sync.set({
        'unleash_nft_api_key': unleashNftKey,
        'gemini_api_key': geminiKey
      });

      // Also send to backend
      await sendApiKeysToBackend(unleashNftKey, geminiKey);

      showStatus('API keys saved successfully', 'success');
    } catch (error) {
      console.error('Error saving API keys:', error);
      showStatus('Error saving API keys', 'error');
    }
  }

  // Send API keys to backend
  async function sendApiKeysToBackend(unleashNftKey, geminiKey) {
    try {
      const response = await fetch('http://localhost:5000/api/set_api_keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          unleash_nft_api_key: unleashNftKey,
          gemini_api_key: geminiKey
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send API keys to backend');
      }
    } catch (error) {
      console.warn('Could not send API keys to backend:', error);
      // Don't throw error here as local storage save might still be successful
    }
  }

  // Clear API keys
  async function clearApiKeys() {
    try {
      if (confirm('Are you sure you want to clear all API keys?')) {
        await chrome.storage.sync.remove(['unleash_nft_api_key', 'gemini_api_key']);
        unleashNftApiKeyInput.value = '';
        geminiApiKeyInput.value = '';
        showStatus('API keys cleared', 'success');
      }
    } catch (error) {
      console.error('Error clearing API keys:', error);
      showStatus('Error clearing API keys', 'error');
    }
  }

  // Save general settings
  async function saveSettings() {
    try {
      await chrome.storage.sync.set({
        'auto_analyze': autoAnalyzeCheckbox.checked,
        'show_risk_warnings': showRiskWarningsCheckbox.checked
      });

      showStatus('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showStatus('Error saving settings', 'error');
    }
  }

  // Check backend status
  async function checkBackendStatus() {
    try {
      statusText.textContent = 'Checking connection...';
      statusIndicator.className = 'status-indicator offline';

      const response = await fetch('http://localhost:5000/api/health', {
        method: 'GET',
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();
        statusText.textContent = `Backend online (${data.status})`;
        statusIndicator.className = 'status-indicator online';
      } else {
        throw new Error('Backend responded with error');
      }
    } catch (error) {
      statusText.textContent = 'Backend offline - Please start the Python backend';
      statusIndicator.className = 'status-indicator offline';
    }
  }

  // Show status message
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status ${type}`;
    statusMessage.style.display = 'block';

    // Hide after 3 seconds
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  }
});

