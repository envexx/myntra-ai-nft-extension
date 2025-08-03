// Background Service Worker for Myntra AI

// Constants
const BACKEND_URL = 'http://localhost:5000';

// Storage for analysis results
let analysisCache = new Map();
let currentAnalysis = null;
let isAnalyzing = false;

// Event listener for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Myntra AI extension installed');
});

// Event listener for extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Myntra AI extension started');
});

// Event listener for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request.action);
  
  if (request.action === 'analyzeNFT') {
    handleNFTAnalysis(request.data, sendResponse);
    return true; // Menunjukkan bahwa respons akan dikirim secara asinkron
  }
  
  if (request.action === 'getAnalysisStatus') {
    sendResponse({ 
      success: true, 
      isAnalyzing: isAnalyzing,
      currentAnalysis: currentAnalysis,
      hasCachedResult: currentAnalysis !== null
    });
    return true;
  }
  
  if (request.action === 'getCachedAnalysis') {
    if (currentAnalysis) {
      sendResponse({ success: true, data: currentAnalysis });
    } else {
      sendResponse({ success: false, error: 'No cached analysis available' });
    }
    return true;
  }
  
  if (request.action === 'clearAnalysisCache') {
    currentAnalysis = null;
    analysisCache.clear();
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'getApiKey') {
    getApiKey(request.apiType)
      .then(apiKey => sendResponse({ success: true, apiKey }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'setApiKey') {
    setApiKey(request.apiType, request.apiKey)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'showCompletionNotification') {
    showBrowserNotification(request.data);
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'showCompletionPopup') {
    showCompletionPopup(request.data);
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'openExtensionPopup') {
    try {
      // Method 1: Coba buka popup extension langsung
      if (chrome.action && chrome.action.openPopup) {
        chrome.action.openPopup();
        console.log('Extension popup opened via chrome.action.openPopup');
        sendResponse({ success: true });
        return true;
      }
      
      // Method 2: Jika tidak bisa, buka dalam tab baru
      chrome.tabs.create({
        url: chrome.runtime.getURL('popup/popup.html')
      }, (tab) => {
        if (chrome.runtime.lastError) {
          console.error('Error opening extension in tab:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('Extension opened in new tab:', tab.id);
          sendResponse({ success: true, openedInTab: true });
        }
      });
      return true;
    } catch (error) {
      console.error('Error in openExtensionPopup:', error);
      sendResponse({ success: false, error: error.message });
      return true;
    }
  }
  
  // If action is not recognized
  console.log('Unknown action:', request.action);
  sendResponse({ success: false, error: 'Unknown action' });
});

// Function to handle NFT analysis with background processing
async function handleNFTAnalysis(nftData, sendResponse) {
  try {
    // Check if we're already analyzing
    if (isAnalyzing) {
      sendResponse({ 
        success: false, 
        error: 'Analysis already in progress. Please wait...',
        isAnalyzing: true 
      });
      return;
    }

    // Check cache first
    const cacheKey = `${nftData.blockchain}_${nftData.contract_address}_${nftData.token_id}`;
    if (analysisCache.has(cacheKey)) {
      console.log('Returning cached analysis');
      currentAnalysis = analysisCache.get(cacheKey);
      sendResponse({ success: true, data: currentAnalysis, fromCache: true });
      return;
    }

    // Start analysis in background
    isAnalyzing = true;
    console.log('Starting NFT analysis in background...');
    
    // Send initial response
    sendResponse({ 
      success: true, 
      message: 'Analysis started in background',
      isAnalyzing: true 
    });

    // Perform analysis
    const result = await analyzeNFT(nftData);
    
    // Store result in cache and current analysis
    currentAnalysis = result;
    analysisCache.set(cacheKey, result);
    
    // Save to persistent storage
    await saveAnalysisToStorage(cacheKey, result);
    
    isAnalyzing = false;
    console.log('Analysis completed and cached');
    
    // Notify all tabs about completion
    notifyAnalysisCompletion(result);
    
    // Trigger completion notification regardless of popup status
    triggerCompletionNotification(result);
    
  } catch (error) {
    console.error('Error in handleNFTAnalysis:', error);
    isAnalyzing = false;
    sendResponse({ success: false, error: error.message });
  }
}

// Function to analyze NFT
async function analyzeNFT(nftData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze_nft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nftData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Backend error: ${errorData.error}`);
    }

    const result = await response.json();
    console.log('Backend response:', result);
    return result.data; // Return data field from response
  } catch (error) {
    console.error('Error analyzing NFT:', error);
    throw error;
  }
}

// Function to save analysis to storage
async function saveAnalysisToStorage(key, data) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ 
      [`analysis_${key}`]: {
        data: data,
        timestamp: Date.now()
      }
    }, () => {
      resolve();
    });
  });
}

// Function to load analysis from storage
async function loadAnalysisFromStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([`analysis_${key}`], (result) => {
      const stored = result[`analysis_${key}`];
      if (stored && (Date.now() - stored.timestamp) < 3600000) { // 1 hour cache
        resolve(stored.data);
      } else {
        resolve(null);
      }
    });
  });
}

// Function to notify completion to all tabs
function notifyAnalysisCompletion(result) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'analysisCompleted',
        data: result
      }).catch(() => {
        // Ignore errors for tabs that don't have content script
      });
    });
  });
}

// Function to get API key from storage
async function getApiKey(apiType) {
  return new Promise((resolve) => {
    chrome.storage.sync.get([`${apiType}_api_key`], (result) => {
      resolve(result[`${apiType}_api_key`] || null);
    });
  });
}

// Function to save API key to storage
async function setApiKey(apiType, apiKey) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [`${apiType}_api_key`]: apiKey }, () => {
      resolve();
    });
  });
}

// Function to show browser notification
function showBrowserNotification(notificationData) {
  // Set badge on extension icon
  chrome.action.setBadgeText({ text: '✓' });
  chrome.action.setBadgeBackgroundColor({ color: '#4ade80' });
  
  // Save notification status
  chrome.storage.local.set({ 
    hasCompletionNotification: true,
    notificationTimestamp: Date.now()
  });
  
  // Request permission for notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: notificationData.icon || 'icons/icon48.png',
    title: notificationData.title || 'Myntra AI',
    message: notificationData.message || 'NFT analysis complete!',
    requireInteraction: true, // Notification will stay until user clicks
    silent: false // Will play default browser sound
  }, (notificationId) => {
    console.log('Notification created:', notificationId);
    
    // Set timeout to remove badge after 30 seconds
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
    }, 30000);
  });
}

// Event listener for notification click
chrome.notifications.onClicked.addListener((notificationId) => {
  console.log('Notification clicked:', notificationId);
  
  // Remove badge
  chrome.action.setBadgeText({ text: '' });
  
  // Remove notification status
  chrome.storage.local.remove(['hasCompletionNotification', 'notificationTimestamp']);
  
  // Open extension popup
  chrome.action.openPopup();
});

// Event listener for when popup is opened
chrome.action.onClicked.addListener(() => {
  // Remove badge when extension is clicked
  chrome.action.setBadgeText({ text: '' });
  
  // Remove notification status
  chrome.storage.local.remove(['hasCompletionNotification', 'notificationTimestamp']);
});

// Event listener for when badge is clicked
chrome.action.onClicked.addListener(() => {
  // Remove badge when badge is clicked
  chrome.action.setBadgeText({ text: '' });
  
  // Remove notification status
  chrome.storage.local.remove(['hasCompletionNotification', 'notificationTimestamp']);
  
  // Open extension popup
  chrome.action.openPopup();
});

// Function to trigger completion notification
function triggerCompletionNotification(result) {
  console.log('Triggering completion notification...');
  
  // Set badge on extension icon
  chrome.action.setBadgeText({ text: '✓' });
  chrome.action.setBadgeBackgroundColor({ color: '#4ade80' });
  
  // Save notification status
  chrome.storage.local.set({ 
    hasCompletionNotification: true,
    notificationTimestamp: Date.now()
  });
  
  // 1. Show browser notification
  showBrowserNotification({
    title: 'Myntra AI Analysis Complete!',
    message: `Analysis completed at ${new Date().toLocaleTimeString()}. Click to view results.`,
    icon: 'icons/icon48.png'
  });
  
  // 2. Create separate popup window with larger size
  chrome.windows.create({
    url: chrome.runtime.getURL('completion_popup.html'),
    type: 'popup',
    width: 600,
    height: 500,
    focused: true,
    left: Math.round((screen.width - 600) / 2),
    top: Math.round((screen.height - 500) / 2)
  }, (window) => {
    if (chrome.runtime.lastError) {
      console.error('Error creating completion popup:', chrome.runtime.lastError);
    } else {
      console.log('Completion popup window created:', window.id);
    }
  });
  
  // 3. Send notification to all active tabs
  chrome.tabs.query({ active: true }, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'showCompletionPopup',
        data: {
          title: 'Myntra AI Analysis Complete!',
          message: `Analysis completed at ${new Date().toLocaleTimeString()}. Click to view results.`,
          icon: 'icons/icon48.png'
        }
      }).catch(() => {
        // Ignore errors for tabs that don't have content script
      });
    });
  });
  
  // 4. Set timeout to remove badge after 30 seconds
  setTimeout(() => {
    chrome.action.setBadgeText({ text: '' });
  }, 30000);
}

// Function to show separate completion popup - DEPRECATED
function showCompletionPopup(popupData) {
  console.log('showCompletionPopup deprecated, using triggerCompletionNotification instead');
  // This function has been replaced with triggerCompletionNotification
  return;
}



