// Popup JavaScript for Myntra AI - Enhanced UI

document.addEventListener('DOMContentLoaded', function() {
  // Set Myntra AI icon
  const myntraIcon = document.getElementById('myntraIcon');
  if (myntraIcon) {
    myntraIcon.src = chrome.runtime.getURL('icons/128.png');
  }

  const analyzeBtn = document.getElementById('analyzeBtn');
  const optionsBtn = document.getElementById('optionsBtn');
  const statusDiv = document.getElementById('status');
  const loadingDiv = document.getElementById('loading');
  const analysisResultDiv = document.getElementById('analysisResult');

  // Event listener for analyze button
  analyzeBtn.addEventListener('click', function() {
    analyzeCurrentNFT();
  });

  // Event listener for options button
  optionsBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });

  // Event listener for clear cache button
  const clearCacheBtn = document.getElementById('clearCacheBtn');
  clearCacheBtn.addEventListener('click', async function() {
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'clearAnalysisCache' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Background script error: ${chrome.runtime.lastError.message}`));
          } else {
            resolve(response);
          }
        });
      });

      if (response.success) {
        updateStatus('Cache cleared successfully', 'success');
        // Clear the analysis result display
        const analysisResultDiv = document.getElementById('analysisResult');
        analysisResultDiv.style.display = 'none';
        analysisResultDiv.innerHTML = '';
      } else {
        updateStatus('Failed to clear cache', 'error');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      updateStatus(`Error: ${error.message}`, 'error');
    }
  });

  // Event listener for auto-analysis toggle
  const autoAnalysisToggle = document.getElementById('autoAnalysisToggle');
  autoAnalysisToggle.addEventListener('change', function() {
    const isEnabled = this.checked;
    chrome.storage.local.set({ autoAnalysisDisabled: !isEnabled }, () => {
      console.log('Auto-analysis setting updated:', isEnabled);
    });
  });

  // Load current auto-analysis setting
  chrome.storage.local.get(['autoAnalysisDisabled'], (result) => {
    autoAnalysisToggle.checked = !result.autoAnalysisDisabled;
  });

  // Function to analyze current NFT
  async function analyzeCurrentNFT() {
    try {
      // Show loading
      showLoading(true);
      updateStatus('Analyzing current NFT...', 'info');

      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('No active tab found');
      }

      // Check if tab is a supported NFT page
      if (!isSupportedNFTPage(tab.url)) {
        throw new Error('This page is not a supported NFT marketplace');
      }

      // Inject content script if not already present
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content_scripts/content.js']
      });

      // Send message to content script to extract NFT info
      const response = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { action: 'extractNFTInfo' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Content script error: ${chrome.runtime.lastError.message}`));
          } else if (response && response.success) {
            resolve(response);
          } else {
            reject(new Error(response?.error || 'Failed to extract NFT information'));
          }
        });
      });

      const nftInfo = response.data;
      
      // Check analysis status first
      const statusResponse = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'getAnalysisStatus' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Background script error: ${chrome.runtime.lastError.message}`));
          } else {
            resolve(response);
          }
        });
      });

      if (statusResponse.success && statusResponse.hasCachedResult) {
        // Load cached result
        const cachedResponse = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ action: 'getCachedAnalysis' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(`Background script error: ${chrome.runtime.lastError.message}`));
            } else {
              resolve(response);
            }
          });
        });

        if (cachedResponse.success) {
          displayAnalysisResult(cachedResponse.data);
          updateStatus('Loaded cached analysis', 'success');
          showLoading(false);
          return;
        }
      }
      
      // Send analysis request to background script
      const analysisResponse = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'analyzeNFT',
          data: nftInfo
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Background script error: ${chrome.runtime.lastError.message}`));
          } else if (response) {
            resolve(response);
          } else {
            reject(new Error('No response from background script'));
          }
        });
      });

      if (!analysisResponse.success) {
        if (analysisResponse.isAnalyzing) {
          showProcessingPopup();
          // Start polling for completion
          pollForAnalysisCompletion();
          return;
        }
        throw new Error(analysisResponse.error);
      }

      if (analysisResponse.isAnalyzing) {
        showProcessingPopup();
        // Start polling for completion
        pollForAnalysisCompletion();
      } else if (analysisResponse.data) {
      displayAnalysisResult(analysisResponse.data);
      updateStatus('Analysis completed successfully', 'success');
        showLoading(false);
      }

    } catch (error) {
      console.error('Error analyzing NFT:', error);
      updateStatus(`Error: ${error.message}`, 'error');
      showLoading(false);
    }
  }

  // Function to show processing popup with countdown
  function showProcessingPopup() {
    const popup = document.createElement('div');
    popup.id = 'processingPopup';
    popup.innerHTML = `
      <div class="processing-overlay">
        <div class="processing-popup">
          <div class="processing-header">
            <h3>Myntra AI</h3>
            <button class="close-btn" onclick="closeProcessingPopup()" title="Close">×</button>
          </div>
          <div class="processing-content">
            <div class="processing-icon">🔍</div>
            <div class="processing-message">Please wait...</div>
            <div class="processing-status">Checking background...</div>
            <div class="countdown-timer">
              <span class="countdown-label">Estimated time:</span>
              <span class="countdown-value" id="countdownValue">--</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
              </div>
            </div>
            <div class="processing-actions">
              <button class="cancel-btn" onclick="cancelAnalysis()">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(popup);
    startCountdown();
  }

  // Function to close processing popup
  function closeProcessingPopup() {
    const popup = document.getElementById('processingPopup');
    if (popup) {
      // Add fade out animation
      popup.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        if (popup.parentNode) {
          popup.remove();
        }
      }, 300);
    }
  }

  // Function to cancel analysis
  function cancelAnalysis() {
    // Clear intervals
    if (window.countdownInterval) {
      clearInterval(window.countdownInterval);
    }
    
    // Close popup
    closeProcessingPopup();
    
    // Update status
    updateStatus('Analysis cancelled', 'info');
    showLoading(false);
  }

  // Function for countdown timer
  function startCountdown() {
    let timeLeft = 300; // 5 minutes in seconds
    const countdownElement = document.getElementById('countdownValue');
    const progressFill = document.getElementById('progressFill');
    
    const countdownInterval = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      countdownElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      // Update progress bar
      const progress = ((300 - timeLeft) / 300) * 100;
      progressFill.style.width = `${progress}%`;
      
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        countdownElement.textContent = 'Timeout';
        showTimeoutMessage();
      }
      
      timeLeft--;
    }, 1000);
    
    // Store interval ID for cleanup
    window.countdownInterval = countdownInterval;
  }

  // Function to show timeout message
  function showTimeoutMessage() {
    const popup = document.getElementById('processingPopup');
    if (popup) {
      popup.innerHTML = `
        <div class="processing-overlay">
          <div class="processing-popup timeout-popup">
            <div class="processing-header">
              <h3>Myntra AI</h3>
              <button class="close-btn" onclick="closeProcessingPopup()">×</button>
            </div>
            <div class="processing-content">
              <div class="processing-icon">⏰</div>
              <div class="processing-message">Process timeout</div>
              <div class="processing-status">Please try again</div>
              <button class="retry-btn" onclick="retryAnalysis()">Try Again</button>
            </div>
          </div>
        </div>
      `;
    }
  }

  // Function to retry analysis
  function retryAnalysis() {
    closeProcessingPopup();
    analyzeCurrentNFT();
  }

  // Function to poll for completion with popup update
  function pollForAnalysisCompletion() {
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ action: 'getAnalysisStatus' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(`Background script error: ${chrome.runtime.lastError.message}`));
            } else {
              resolve(response);
            }
          });
        });

        if (statusResponse.success && !statusResponse.isAnalyzing && statusResponse.currentAnalysis) {
          clearInterval(pollInterval);
          clearInterval(window.countdownInterval);
          closeProcessingPopup();
          displayAnalysisResult(statusResponse.currentAnalysis);
          updateStatus('Analysis completed successfully', 'success');
          showLoading(false);
          // showCompletionPopup(); // Notification handled by background script
        } else if (statusResponse.success && statusResponse.isAnalyzing) {
          // Update status message
          const statusElement = document.querySelector('.processing-status');
          if (statusElement) {
            statusElement.textContent = 'Background is processing...';
          }
        }
      } catch (error) {
        console.error('Error polling for completion:', error);
        clearInterval(pollInterval);
        clearInterval(window.countdownInterval);
        closeProcessingPopup();
        updateStatus('Error checking analysis status', 'error');
        showLoading(false);
      }
    }, 2000); // Poll every 2 seconds

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      clearInterval(window.countdownInterval);
      closeProcessingPopup();
      updateStatus('Analysis timeout - please try again', 'error');
      showLoading(false);
    }, 300000);
  }

  // Function to show completion popup
  function showCompletionPopup() {
    // This function is no longer needed as notification is handled by background script
    console.log('showCompletionPopup called but notification is handled by background script');
  }

  // Function to show completion popup directly (if extension popup is open)
  function showCompletionPopupDirect() {
    const popup = document.createElement('div');
    popup.id = 'completionPopup';
    popup.innerHTML = `
      <div class="processing-overlay">
        <div class="processing-popup completion-popup">
          <div class="processing-header">
            <h3>Myntra AI</h3>
            <button class="close-btn" onclick="closeCompletionPopup()" title="Close">×</button>
          </div>
          <div class="processing-content">
            <div class="processing-icon">✅</div>
            <div class="processing-message">Analysis complete!</div>
            <div class="processing-status">Open extension to view results</div>
            <button class="view-result-btn" onclick="closeCompletionPopup()">View Results</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(popup);
  }

  // Function to close completion popup
  function closeCompletionPopup() {
    const popup = document.getElementById('completionPopup');
    if (popup) {
      popup.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        if (popup.parentNode) {
          popup.remove();
        }
      }, 300);
    }
  }

  // Function to check if page is a supported NFT marketplace
  function isSupportedNFTPage(url) {
    const supportedMarketplaces = [
      'opensea.io',
      'rarible.com',
      'blur.io',
      'looksrare.org',
      'x2y2.io'
    ];
    return supportedMarketplaces.some(marketplace => url.includes(marketplace));
  }

  // Function to show/hide loading
  function showLoading(show) {
    loadingDiv.style.display = show ? 'block' : 'none';
    analyzeBtn.disabled = show;
  }

  // Function to update status
  function updateStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
  }

  // Function to display analysis results
  function displayAnalysisResult(data) {
    console.log('Displaying analysis result:', data);
    console.log('Data type:', typeof data);
    console.log('Data keys:', Object.keys(data || {}));
    
    let html = '';

    // Debug: Tampilkan semua data yang diterima
    console.log('Full data object:', JSON.stringify(data, null, 2));

    // Header dengan informasi NFT
    if (data && data.contract_address) {
      html += `
        <div class="nft-header">
          <div class="nft-header-content">
            <div class="nft-header-icon">🎨</div>
            <div class="nft-header-info">
              <h3 class="nft-title">NFT Analysis Report</h3>
              <div class="nft-contract">
                <span class="contract-label">Contract:</span>
                <code class="contract-address">${data.contract_address}</code>
              </div>
              <div class="nft-details">
                <span class="detail-item">Token ID: <strong>${data.token_id}</strong></span>
                <span class="detail-separator">•</span>
                <span class="detail-item">Blockchain: <strong>${data.blockchain}</strong></span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // API Status dengan styling yang lebih menarik
    if (data && data.api_status) {
      html += `
        <div class="status-card success-status">
          <div class="status-icon">✅</div>
          <div class="status-content">
            <h4 class="status-title">API Connection</h4>
            <p class="status-message">${data.api_status}</p>
          </div>
        </div>
      `;
    }

    // Myntra AI Analysis Section - Enhanced visual display
    if (data && data.ai_analysis) {
      console.log('Myntra AI analysis data:', data.ai_analysis);
      
      // Parse and format the Myntra AI analysis for better display
      let formattedAnalysis = data.ai_analysis
        // Handle headers (## text -> <h4>)
        .replace(/^## (.+)$/gm, '<h4 class="ai-section-header">$1</h4>')
        // Handle bold text (**text** -> <strong>)
        .replace(/\*\*(.*?)\*\*/g, '<strong class="ai-highlight">$1</strong>')
        // Handle italic text (*text* -> <em>)
        .replace(/\*(.*?)\*/g, '<em class="ai-emphasis">$1</em>')
        // Handle bullet points
        .replace(/^\* (.+)$/gm, '<div class="ai-bullet-point">• $1</div>')
        // Handle numbered sections
        .replace(/^(\d+)\. (.+)$/gm, '<div class="ai-numbered-section"><span class="ai-number">$1.</span> $2</div>')
                  // Handle emojis with proper spacing
          .replace(/📊/g, '<span class="emoji chart">📊</span>')
        .replace(/🧐/g, '<span class="emoji thinking">🧐</span>')
        .replace(/🕵️‍♂️/g, '<span class="emoji detective">🕵️‍♂️</span>')
        .replace(/✅/g, '<span class="emoji success">✅</span>')
        .replace(/🚨/g, '<span class="emoji warning">🚨</span>')
        .replace(/🔍/g, '<span class="emoji search">🔍</span>')
        .replace(/💯/g, '<span class="emoji perfect">💯</span>')
        .replace(/🍀/g, '<span class="emoji luck">🍀</span>')
        .replace(/💰/g, '<span class="emoji money">💰</span>')
        .replace(/⚠️/g, '<span class="emoji alert">⚠️</span>')
        .replace(/🎯/g, '<span class="emoji target">🎯</span>')
        .replace(/🧠/g, '<span class="emoji brain">🧠</span>')
        .replace(/💸/g, '<span class="emoji money-fly">💸</span>')
        .replace(/🛑/g, '<span class="emoji stop">🛑</span>')
        .replace(/💧/g, '<span class="emoji water">💧</span>')
        .replace(/🙅/g, '<span class="emoji no">🙅</span>')
        .replace(/🔴/g, '<span class="emoji red-circle">🔴</span>')
        .replace(/⚔️/g, '<span class="emoji swords">⚔️</span>')
        .replace(/🔎/g, '<span class="emoji magnify">🔎</span>')
        .replace(/🐧/g, '<span class="emoji penguin">🐧</span>')
        .replace(/😉/g, '<span class="emoji wink">😉</span>')
        // Handle paragraphs
        .replace(/\n\n/g, '</p><p class="ai-paragraph">')
        .replace(/\n/g, '<br>');
      
      html += `
        <div class="ai-analysis-card">
          <div class="ai-analysis-header">
            <div class="ai-icon">🤖</div>
            <div class="ai-title">
              <h3>Myntra AI Analysis</h3>
              <span class="ai-subtitle">Powered by Gemini AI</span>
            </div>
          </div>
          <div class="ai-analysis-content">
            <div class="ai-text-content">
              <p class="ai-paragraph">${formattedAnalysis}</p>
            </div>
          </div>
        </div>
      `;
    }

    // Summary Section dengan visual yang lebih baik
    let availableDataCount = 0;
    let totalDataCount = 0;
    
    if (data) {
      const dataFields = ['nft_metadata', 'nft_metrics', 'nft_valuation', 'nft_price_history', 'nft_traits', 'nft_transactions'];
      dataFields.forEach(field => {
        if (data[field]) {
          totalDataCount++;
          if (!data[field].error) {
            availableDataCount++;
          }
        }
      });
    }

    // Show enhanced summary if most data is missing
    if (totalDataCount > 0 && availableDataCount < totalDataCount / 2) {
      const completionPercentage = Math.round((availableDataCount / totalDataCount) * 100);
      html += `
        <div class="data-summary-card ${availableDataCount === 0 ? 'error-summary' : 'warning-summary'}">
          <div class="summary-header">
            <div class="summary-icon">${availableDataCount === 0 ? '❌' : '⚠️'}</div>
            <h4 class="summary-title">Data Availability Report</h4>
          </div>
          <div class="summary-content">
            <div class="data-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${completionPercentage}%"></div>
              </div>
              <span class="progress-text">${availableDataCount}/${totalDataCount} endpoints (${completionPercentage}%)</span>
            </div>
            <div class="summary-details">
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value ${availableDataCount === 0 ? 'error' : 'warning'}">
                  ${availableDataCount === 0 ? 'No data available' : 'Limited data available'}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Recommendation:</span>
                <span class="detail-value">Try with a more popular NFT collection</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // NFT Metadata - Enhanced visual display
    if (data && data.nft_metadata) {
      console.log('NFT metadata data:', data.nft_metadata);
      
      if (data.nft_metadata.error) {
        html += `
          <div class="data-card error-card">
            <div class="card-header">
              <div class="card-icon error">❌</div>
              <h4 class="card-title">NFT Metadata</h4>
            </div>
            <div class="error-content">
              <p class="error-message">${data.nft_metadata.error}</p>
            </div>
          </div>
        `;
      } else {
        const metadata = data.nft_metadata;
        html += `
          <div class="data-card metadata-card">
            <div class="card-header">
              <div class="card-icon metadata">📋</div>
              <h4 class="card-title">NFT Metadata</h4>
              <span class="card-subtitle">BitsCrunch API</span>
            </div>
            <div class="metadata-content">
              ${metadata.token_image_url ? `
                <div class="nft-image-container">
                  <img src="${metadata.token_image_url}" class="nft-image" alt="NFT Image">
                </div>
              ` : ''}
              <div class="metadata-grid">
                <div class="metadata-column">
                  <div class="metadata-item">
                    <span class="metadata-label">Name</span>
                    <span class="metadata-value">${metadata.name || 'N/A'}</span>
                  </div>
                  <div class="metadata-item">
                    <span class="metadata-label">Collection</span>
                    <span class="metadata-value">${metadata.collection_name || 'N/A'}</span>
                  </div>
                  <div class="metadata-item">
                    <span class="metadata-label">Token ID</span>
                    <span class="metadata-value">${metadata.token_id || 'N/A'}</span>
                  </div>
                  <div class="metadata-item">
                    <span class="metadata-label">Chain ID</span>
                    <span class="metadata-value">${metadata.chain_id || 'N/A'}</span>
                  </div>
                  <div class="metadata-item">
                    <span class="metadata-label">Mint Date</span>
                    <span class="metadata-value">${metadata.minted_date || 'N/A'}</span>
                  </div>
                </div>
                <div class="metadata-column">
                  <div class="metadata-item">
                    <span class="metadata-label">Current Owner</span>
                    <span class="metadata-value address">${metadata.owned_by || 'N/A'}</span>
                  </div>
                  <div class="metadata-item">
                    <span class="metadata-label">Past Owners</span>
                    <span class="metadata-value">${metadata.past_owner_count || 'N/A'}</span>
                  </div>
                  <div class="metadata-item">
                    <span class="metadata-label">Hold Time</span>
                    <span class="metadata-value">${metadata.hold_time_current || 'N/A'} days</span>
                  </div>
                  <div class="metadata-item">
                    <span class="metadata-label">Fair Price</span>
                    <span class="metadata-value price-positive">${metadata.price_fair_estimate ? `${metadata.price_fair_estimate.value} ${metadata.price_fair_estimate.unit}` : 'N/A'}</span>
                  </div>
                  <div class="metadata-item">
                    <span class="metadata-label">Verified</span>
                    <span class="metadata-value ${metadata.verified ? 'verified-yes' : 'verified-no'}">${metadata.verified ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    }

    // NFT Metrics - Enhanced display
    if (data && data.nft_metrics) {
      console.log('NFT metrics data:', data.nft_metrics);
      
      if (data.nft_metrics.error) {
        html += `
          <div class="data-card error-card">
            <div class="card-header">
              <div class="card-icon error">❌</div>
              <h4 class="card-title">NFT Metrics</h4>
            </div>
            <div class="error-content">
              <p class="error-message">${data.nft_metrics.error}</p>
            </div>
          </div>
        `;
      } else {
        const metrics = data.nft_metrics.metric_values || {};
        const volume = metrics.volume?.value || '0';
        const sales = metrics.sales?.value || '0';
        
        html += `
          <div class="data-card metrics-card">
            <div class="card-header">
              <div class="card-icon metrics">📊</div>
              <h4 class="card-title">Volume & Sales</h4>
              <span class="metrics-period">Last 30 days</span>
            </div>
            <div class="metrics-content">
              <div class="metrics-grid">
                <div class="metric-item volume-metric">
                  <div class="metric-icon">💰</div>
                  <div class="metric-info">
                    <span class="metric-label">Total Volume</span>
                    <span class="metric-value">${formatCurrency(volume, metrics.volume?.unit || 'USD')}</span>
                  </div>
                </div>
                <div class="metric-item sales-metric">
                  <div class="metric-icon">🔄</div>
                  <div class="metric-info">
                    <span class="metric-label">Total Sales</span>
                    <span class="metric-value">${formatNumber(sales)} transactions</span>
                  </div>
                </div>
              </div>
              <div class="metrics-summary">
                <div class="summary-item">
                  <span class="summary-label">Average Sale Price:</span>
                  <span class="summary-value">${calculateAveragePrice(volume, sales)}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Activity Level:</span>
                  <span class="summary-value ${getActivityLevel(sales)}">${getActivityLevelText(sales)}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    }

    // NFT Valuation - Enhanced visual display
    if (data && data.nft_valuation) {
      console.log('NFT valuation data:', data.nft_valuation);
      
      if (data.nft_valuation.error) {
        html += `
          <div class="data-card error-card">
            <div class="card-header">
              <div class="card-icon error">❌</div>
              <h4 class="card-title">NFT Valuation</h4>
            </div>
            <div class="error-content">
              <p class="error-message">${data.nft_valuation.error}</p>
            </div>
          </div>
        `;
      } else {
        const valuation = data.nft_valuation.metric_values || {};
        const priceEstimate = valuation.price_estimate?.value || 'N/A';
        const upperBound = valuation.price_estimate_upper_bound?.value || 'N/A';
        const lowerBound = valuation.price_estimate_lower_bound?.value || 'N/A';
        const percentile = valuation.prediction_percentile?.value || 'N/A';
        
        html += `
          <div class="data-card valuation-card">
            <div class="card-header">
              <div class="card-icon valuation">💰</div>
              <h4 class="card-title">AI Price Estimate</h4>
            </div>
            <div class="valuation-content">
              <div class="price-estimate-main">
                <span class="price-label">AI Estimate</span>
                <span class="price-value main-price">${priceEstimate} ETH</span>
              </div>
              <div class="valuation-grid">
                <div class="valuation-column">
                  <div class="valuation-item">
                    <span class="valuation-label">Upper Bound</span>
                    <span class="valuation-value">${upperBound} ETH</span>
                  </div>
                  <div class="valuation-item">
                    <span class="valuation-label">Lower Bound</span>
                    <span class="valuation-value">${lowerBound} ETH</span>
                  </div>
                </div>
                <div class="valuation-column">
                  <div class="valuation-item">
                    <span class="valuation-label">Percentile</span>
                    <span class="valuation-value percentile">${(parseFloat(percentile) * 100).toFixed(1)}%</span>
                  </div>
                  <div class="valuation-item">
                    <span class="valuation-label">Collection Impact</span>
                    <span class="valuation-value ${parseFloat(valuation.collection_drivers?.value || 0) < 0 ? 'negative' : 'positive'}">${valuation.collection_drivers?.value || 'N/A'} ETH</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    }

    // NFT Price History - Enhanced display
    if (data && data.nft_price_history) {
      console.log('NFT price history data:', data.nft_price_history);
      
      if (data.nft_price_history.error) {
        html += `
          <div class="data-card error-card">
            <div class="card-header">
              <div class="card-icon error">❌</div>
              <h4 class="card-title">Price History</h4>
            </div>
            <div class="error-content">
              <p class="error-message">${data.nft_price_history.error}</p>
            </div>
          </div>
        `;
      } else {
        const priceHistory = data.nft_price_history;
        const chartId = 'price-history-chart-' + Date.now();
        
        html += `
          <div class="data-card history-card">
            <div class="card-header">
              <div class="card-icon history">📈</div>
              <h4 class="card-title">Price History</h4>
            </div>
            <div class="chart-container">
              <canvas id="${chartId}" width="300" height="200"></canvas>
            </div>
            <div class="price-stats">
              <div class="stat-item">
                <span class="stat-label">Latest Price:</span>
                <span class="stat-value">${priceHistory.price_latest?.value || 'N/A'} ${priceHistory.price_latest?.unit || ''}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Starting Price:</span>
                <span class="stat-value">${priceHistory.price_starting?.value || 'N/A'} ${priceHistory.price_starting?.unit || ''}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Min Price:</span>
                <span class="stat-value">${priceHistory.price_min?.value || 'N/A'} ${priceHistory.price_min?.unit || ''}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Max Price:</span>
                <span class="stat-value">${priceHistory.price_max?.value || 'N/A'} ${priceHistory.price_max?.unit || ''}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Fair Price:</span>
                <span class="stat-value price-positive">${priceHistory.price_fair_estimate?.value || 'N/A'} ${priceHistory.price_fair_estimate?.unit || ''}</span>
              </div>
            </div>
          </div>
        `;
        
        // Create chart after DOM is updated
        setTimeout(() => {
          createPriceHistoryChart(chartId, priceHistory);
        }, 100);
      }
    }

    // NFT Traits - Enhanced visual display
    if (data && data.nft_traits) {
      console.log('NFT traits data:', data.nft_traits);
      
      if (data.nft_traits.error) {
        html += `
          <div class="data-card error-card">
            <div class="card-header">
              <div class="card-icon error">❌</div>
              <h4 class="card-title">NFT Traits</h4>
            </div>
            <div class="error-content">
              <p class="error-message">${data.nft_traits.error}</p>
            </div>
          </div>
        `;
      } else {
        const traits = data.nft_traits.traits || [];
        let traitsHtml = '';
        
        if (traits.length > 0) {
          traitsHtml = '<div class="traits-grid">';
          traits.forEach(trait => {
            traitsHtml += `
              <div class="trait-pill">
                <span class="trait-type">${trait.trait_type}</span>
                <span class="trait-value">${trait.value}</span>
              </div>
            `;
          });
          traitsHtml += '</div>';
        }
        
        html += `
          <div class="data-card traits-card">
            <div class="card-header">
              <div class="card-icon traits">🎨</div>
              <h4 class="card-title">NFT Traits</h4>
              <span class="trait-count">${traits.length} traits</span>
            </div>
            <div class="traits-content">
              ${traitsHtml}
            </div>
          </div>
        `;
      }
    }

    // NFT Transactions - Removed from display
    // if (data && data.nft_transactions) {
    //   // Recent Transactions section has been removed
    // }

    // Enhanced no-data message
    if (html === '') {
      html = `
        <div class="no-data-card">
          <div class="no-data-icon">🔍</div>
          <h3 class="no-data-title">No Analysis Data Available</h3>
          <div class="no-data-content">
            <div class="possible-reasons">
              <h4>Possible Reasons:</h4>
              <ul class="reason-list">
                <li>NFT not found in BitsCrunch database</li>
                <li>NFT is too new or not popular enough</li>
                <li>Network/API connection issues</li>
                <li>Try with a more popular NFT (e.g., Bored Ape, CryptoPunk)</li>
              </ul>
            </div>
            <div class="debug-info">
              <h4>Debug Information:</h4>
              <div class="debug-details">
                <span class="debug-item">Data received: <strong>${data ? 'Yes' : 'No'}</strong></span>
                <span class="debug-item">Data type: <strong>${typeof data}</strong></span>
                <span class="debug-item">Data keys: <strong>${data ? Object.keys(data).join(', ') : 'None'}</strong></span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Add CSS styles for enhanced UI
    const styleTag = document.createElement('style');
    styleTag.textContent = `
      /* Enhanced NFT Analyzer Styles */
      
      .nft-header {
        background: linear-gradient(135deg, #627eff 0%, #4dabf7 100%);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        color: white;
        box-shadow: 0 4px 15px rgba(98, 126, 255, 0.3);
      }
      
      .nft-header-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .nft-header-icon {
        font-size: 24px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        padding: 8px;
        backdrop-filter: blur(10px);
      }
      
      .nft-title {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .nft-contract {
        margin-bottom: 8px;
      }
      
      .contract-label {
        font-size: 11px;
        opacity: 0.8;
      }
      
      .contract-address {
        font-family: monospace;
        font-size: 10px;
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 6px;
        border-radius: 4px;
        margin-left: 4px;
      }
      
      .nft-details {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        opacity: 0.9;
      }
      
      .detail-separator {
        opacity: 0.6;
      }
      
      .status-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 12px;
        border: 1px solid;
      }
      
      .success-status {
        background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
        border-color: #28a745;
        color: #155724;
      }
      
      .status-icon {
        font-size: 20px;
      }
      
      .status-title {
        margin: 0 0 2px 0;
        font-size: 14px;
        font-weight: 600;
      }
      
      .status-message {
        margin: 0;
        font-size: 12px;
        opacity: 0.8;
      }
      
      .ai-analysis-card {
        background: linear-gradient(135deg, #627eff 0%, #4dabf7 100%);
        border-radius: 12px;
        padding: 0;
        margin-bottom: 16px;
        color: white;
        box-shadow: 0 8px 25px rgba(98, 126, 255, 0.3);
        overflow: hidden;
      }
      
      .ai-analysis-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
      }
      
      .ai-icon {
        font-size: 24px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        padding: 8px;
      }
      
      .ai-title h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .ai-subtitle {
        font-size: 11px;
        opacity: 0.8;
      }
      
      .ai-analysis-content {
        padding: 20px;
        background: rgba(255, 255, 255, 0.05);
      }
      
      .ai-text-content {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        font-size: 12px;
      }
      
      .ai-paragraph {
        margin: 0 0 12px 0;
      }
      
      .ai-highlight {
        color: #ffd700;
        font-weight: 600;
      }
      
      .ai-emphasis {
        color: #e8f4f8;
      }
      
      .emoji {
        font-size: 14px;
        margin: 0 2px;
      }
      
      .emoji.success {
        color: #28a745;
      }
      
      .emoji.warning {
        color: #ffc107;
      }
      
      .data-summary-card {
        border-radius: 10px;
        padding: 16px;
        margin-bottom: 16px;
        border: 1px solid;
      }
      
      .warning-summary {
        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
        border-color: #ffc107;
        color: #856404;
      }
      
      .error-summary {
        background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
        border-color: #dc3545;
        color: #721c24;
      }
      
      .summary-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      
      .summary-icon {
        font-size: 20px;
      }
      
      .summary-title {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
      }
      
      .data-progress {
        margin-bottom: 12px;
      }
      
      .progress-bar {
        width: 100%;
        height: 8px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 4px;
      }
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #28a745, #20c997);
        border-radius: 4px;
        transition: width 0.3s ease;
      }
      
      .progress-text {
        font-size: 11px;
        font-weight: 500;
      }
      
      .summary-details {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      
      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
      }
      
      .detail-label {
        font-weight: 500;
      }
      
      .detail-value {
        font-weight: 600;
      }
      
      .detail-value.error {
        color: #dc3545;
      }
      
      .detail-value.warning {
        color: #fd7e14;
      }
      
      .data-card {
        background: #ffffff;
        border-radius: 12px;
        margin-bottom: 16px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        border: 1px solid #e9ecef;
        overflow: hidden;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      
      /* Specific styling for Price History, Volume & Sales, and Recent Transactions */
      .history-card,
      .metrics-card,
      .transactions-card {
        background: #ffffff !important;
        color: #000000 !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
        border: 1px solid #e9ecef !important;
      }
      
      .history-card .card-header,
      .metrics-card .card-header,
      .transactions-card .card-header {
        background: #ffffff !important;
        color: #000000 !important;
        border-bottom: 1px solid #e9ecef;
      }
      
      .history-card .card-title,
      .metrics-card .card-title,
      .transactions-card .card-title {
        color: #000000 !important;
        font-weight: 600;
      }
      
      .history-card .card-subtitle,
      .metrics-card .card-subtitle,
      .transactions-card .card-subtitle {
        color: #6c757d !important;
        font-size: 12px;
      }
      
      .metrics-content,
      .transactions-content {
        background: #ffffff !important;
        color: #000000 !important;
      }
      
      .metric-item,
      .transaction-item {
        background: #ffffff !important;
        color: #000000 !important;
        border: 1px solid #f8f9fa;
      }
      
      .metric-label,
      .metric-value,
      .transaction-header,
      .transaction-details,
      .transaction-addresses {
        color: #000000 !important;
      }
      
      .price-stats .stat-item,
      .price-stats .stat-label,
      .price-stats .stat-value {
        color: #000000 !important;
        background: #ffffff !important;
        border: 1px solid #f8f9fa;
      }
      
      .metrics-summary .summary-item,
      .metrics-summary .summary-label,
      .metrics-summary .summary-value {
        color: #000000 !important;
      }
      
      .transactions-list .transaction-item {
        background: #ffffff !important;
        color: #000000 !important;
        border: 1px solid #e9ecef;
      }
      
      .no-transactions {
        background: #ffffff !important;
        color: #000000 !important;
      }
      
      .no-transactions-text h5,
      .no-transactions-text p {
        color: #000000 !important;
      }
      
      /* Price History specific styling */
      .chart-container {
        background: #ffffff !important;
        border: 1px solid #e9ecef !important;
        border-radius: 8px;
        padding: 16px;
        margin: 12px 0;
      }
      
      .price-stats {
        background: #ffffff !important;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 12px;
        margin-top: 8px;
      }
      
      .stat-item {
        background: #ffffff !important;
        border: 1px solid #f8f9fa;
        border-radius: 6px;
        padding: 8px;
        margin-bottom: 4px;
      }
      
      .stat-label {
        color: #6c757d !important;
        font-size: 11px;
        font-weight: 500;
      }
      
      .stat-value {
        color: #000000 !important;
        font-size: 13px;
        font-weight: 600;
      }
      
      .data-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
      }
      
      .card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-bottom: 1px solid #dee2e6;
      }
      
      .card-icon {
        font-size: 18px;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }
      
      .card-icon.metadata {
        background: linear-gradient(135deg, #17a2b8, #138496);
        color: white;
      }
      
      .card-icon.metrics {
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
      }
      
      .card-icon.valuation {
        background: linear-gradient(135deg, #ffc107, #fd7e14);
        color: white;
      }
      
      .card-icon.history {
        background: linear-gradient(135deg, #6f42c1, #e83e8c);
        color: white;
      }
      
      .card-icon.traits {
        background: linear-gradient(135deg, #fd7e14, #e83e8c);
        color: white;
      }
      
      .card-icon.transactions {
        background: linear-gradient(135deg, #6c757d, #495057);
        color: white;
      }
      
      .card-icon.error {
        background: linear-gradient(135deg, #dc3545, #c82333);
        color: white;
      }
      
      .card-title {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #2c3e50;
        flex: 1;
      }
      
      .card-subtitle {
        font-size: 11px;
        color: #6c757d;
        font-weight: 400;
      }
      
      .trait-count {
        background: #6f42c1;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
      }
      
      .error-card {
        border-color: #dc3545;
        background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
      }
      
      .error-content {
        padding: 16px;
      }
      
      .error-message {
        margin: 0;
        color: #721c24;
        font-size: 12px;
        font-weight: 500;
      }
      
      .metadata-content {
        padding: 16px;
      }
      
      .nft-image-container {
        text-align: center;
        margin-bottom: 16px;
      }
      
      .nft-image {
        max-width: 120px;
        max-height: 120px;
        border-radius: 12px;
        border: 3px solid #e9ecef;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      }
      
      .metadata-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      
      .metadata-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px 0;
        border-bottom: 1px solid #f8f9fa;
      }
      
      .metadata-item:last-child {
        border-bottom: none;
      }
      
      .metadata-label {
        font-size: 10px;
        font-weight: 600;
        color: #6c757d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .metadata-value {
        font-size: 12px;
        font-weight: 500;
        color: #2c3e50;
        word-break: break-all;
      }
      
      .metadata-value.address {
        font-family: monospace;
        font-size: 9px;
        background: #f8f9fa;
        padding: 4px 6px;
        border-radius: 4px;
        border: 1px solid #e9ecef;
      }
      
      .metadata-value.price-positive {
        color: #28a745;
        font-weight: 600;
      }
      
      .metadata-value.verified-yes {
        color: #28a745;
        font-weight: 600;
      }
      
      .metadata-value.verified-no {
        color: #dc3545;
        font-weight: 600;
      }
      
      .valuation-content {
        padding: 16px;
      }
      
      .price-estimate-main {
        text-align: center;
        padding: 16px;
        background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
        border-radius: 8px;
        margin-bottom: 16px;
        border: 2px solid #28a745;
      }
      
      .price-label {
        display: block;
        font-size: 11px;
        font-weight: 600;
        color: #155724;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      
      .main-price {
        font-size: 18px;
        font-weight: 700;
        color: #28a745;
        font-family: monospace;
      }
      
      .valuation-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      
      .valuation-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;
      }
      
      .valuation-label {
        font-size: 10px;
        font-weight: 600;
        color: #6c757d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .valuation-value {
        font-size: 12px;
        font-weight: 600;
        color: #2c3e50;
        font-family: monospace;
      }
      
      .valuation-value.percentile {
        color: #17a2b8;
        font-size: 14px;
      }
      
      .valuation-value.positive {
        color: #28a745;
      }
      
      .valuation-value.negative {
        color: #dc3545;
      }
      
      .traits-content {
        padding: 16px;
      }
      
      .traits-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      
      .trait-pill {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 500;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        min-width: 80px;
        transition: transform 0.2s ease;
      }
      
      .trait-pill:hover {
        transform: translateY(-1px);
      }
      
      .trait-type {
        font-size: 9px;
        opacity: 0.8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
      }
      
      .trait-value {
        font-weight: 600;
        font-size: 11px;
      }
      
      .json-content {
        padding: 16px;
        background: #f8f9fa;
      }
      
      .json-display {
        background: #2d3748;
        color: #e2e8f0;
        padding: 12px;
        border-radius: 8px;
        font-size: 10px;
        line-height: 1.4;
        max-height: 300px;
        overflow-y: auto;
        margin: 0;
        border: 1px solid #4a5568;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .no-data-card {
        text-align: center;
        padding: 32px 20px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 12px;
        border: 2px dashed #dee2e6;
      }
      
      .no-data-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.6;
      }
      
      .no-data-title {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: #495057;
      }
      
      .no-data-content {
        text-align: left;
        max-width: 400px;
        margin: 0 auto;
      }
      
      .possible-reasons h4,
      .debug-info h4 {
        margin: 0 0 8px 0;
        font-size: 12px;
        font-weight: 600;
        color: #495057;
      }
      
      .reason-list {
        margin: 0 0 16px 0;
        padding-left: 20px;
        font-size: 11px;
        color: #6c757d;
        line-height: 1.5;
      }
      
      .reason-list li {
        margin-bottom: 4px;
      }
      
      .debug-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .debug-item {
        font-size: 10px;
        color: #6c757d;
        padding: 4px 8px;
        background: #ffffff;
        border-radius: 4px;
        border: 1px solid #e9ecef;
      }
      
      /* Responsive adjustments */
      @media (max-width: 380px) {
        .metadata-grid,
        .valuation-grid {
          grid-template-columns: 1fr;
        }
        
        .nft-details {
          flex-direction: column;
          gap: 4px;
          align-items: flex-start;
        }
        
        .detail-separator {
          display: none;
        }
      }
      
      /* Scrollbar styling for json displays */
      .json-display::-webkit-scrollbar {
        width: 6px;
      }
      
      .json-display::-webkit-scrollbar-track {
        background: #1a202c;
        border-radius: 3px;
      }
      
      .json-display::-webkit-scrollbar-thumb {
        background: #4a5568;
        border-radius: 3px;
      }
      
      .json-display::-webkit-scrollbar-thumb:hover {
        background: #718096;
      }
      
      /* Animation for loading states */
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .data-card {
        animation: fadeIn 0.3s ease-out;
      }

      /* Processing Popup Styles - Following options.html design */
      .processing-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease-out;
      }

      .processing-popup {
        background: #ffffff;
        border: 1px solid #e9ecef;
        border-radius: 16px;
        padding: 0;
        width: 380px;
        max-width: 90vw;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        animation: slideIn 0.3s ease-out;
        position: relative;
      }

      .processing-popup::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, 
          transparent, 
          #627eff 50%, 
          transparent);
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: scale(0.9) translateY(20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      @keyframes fadeOut {
        from {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
        to {
          opacity: 0;
          transform: scale(0.9) translateY(-20px);
        }
      }

      .processing-header {
        background: linear-gradient(135deg, #627eff 0%, #4dabf7 50%, #69db7c 100%);
        color: white;
        padding: 20px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
      }

      .processing-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.3px;
      }

      .close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        z-index: 10001;
        position: relative;
      }

      .close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
      }

      .close-btn:active {
        transform: scale(0.95);
      }

      .processing-content {
        padding: 32px 24px;
        text-align: center;
        color: #000000;
        background: #ffffff;
        border-radius: 0 0 16px 16px;
      }

      .processing-icon {
        font-size: 56px;
        margin-bottom: 20px;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        100% {
          transform: scale(1.1);
          opacity: 0.8;
        }
      }

      .processing-message {
        font-size: 20px;
        font-weight: 600;
        color: #000000;
        margin-bottom: 12px;
      }

      .processing-status {
        font-size: 14px;
        color: #6c757d;
        margin-bottom: 24px;
        font-weight: 500;
      }

      .countdown-timer {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
        padding: 16px;
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 12px;
      }

      .countdown-label {
        font-size: 13px;
        color: #6c757d;
        font-weight: 500;
      }

      .countdown-value {
        font-size: 18px;
        font-weight: 700;
        color: #627eff;
        font-family: monospace;
        background: #ffffff;
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid #e9ecef;
      }

      .progress-bar-container {
        margin-bottom: 20px;
      }

      .progress-bar {
        width: 100%;
        height: 10px;
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #627eff, #4dabf7);
        border-radius: 6px;
        transition: width 0.3s ease;
        width: 0%;
      }

      /* Timeout popup styles */
      .timeout-popup .processing-icon {
        color: #f87171;
        animation: none;
      }

      .timeout-popup .processing-message {
        color: #f87171;
      }

      .retry-btn {
        background: linear-gradient(135deg, #627eff 0%, #4dabf7 100%);
        color: white;
        border: none;
        padding: 14px 28px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 20px;
        box-shadow: 0 4px 12px rgba(98, 126, 255, 0.3);
        position: relative;
        overflow: hidden;
      }

      .retry-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(98, 126, 255, 0.4);
      }

      .retry-btn:active {
        transform: translateY(0);
      }

      /* Processing Actions */
      .processing-actions {
        margin-top: 20px;
        text-align: center;
      }

      .cancel-btn {
        background: rgba(239, 68, 68, 0.1);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.3);
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .cancel-btn:hover {
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.5);
        transform: translateY(-1px);
      }

      .cancel-btn:active {
        transform: translateY(0);
      }

      /* Completion popup styles */
      .completion-popup .processing-icon {
        color: #4ade80;
        animation: none;
      }

      .completion-popup .processing-message {
        color: #4ade80;
      }

      .view-result-btn {
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
        border: none;
        padding: 14px 28px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 20px;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        position: relative;
        overflow: hidden;
      }

      .view-result-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
      }

      .view-result-btn:active {
        transform: translateY(0);
      }

      /* Completion popup styles - removed karena popup terpisah */
      /* .completion-popup .processing-icon {
        color: #4ade80;
        animation: none;
      }

      .completion-popup .processing-message {
        color: #4ade80;
      }

      .view-result-btn {
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
        border: none;
        padding: 14px 28px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 20px;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        position: relative;
        overflow: hidden;
      }

      .view-result-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
      }

      .view-result-btn:active {
        transform: translateY(0);
      } */

      /* Notification Banner Styles - DISABLED */
      /* .notification-banner {
        background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(74, 222, 128, 0.3);
        animation: slideDown 0.3s ease-out;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .notification-icon {
        font-size: 16px;
      }

      .notification-text {
        flex: 1;
        font-size: 13px;
        font-weight: 500;
      }

      .notification-close {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .notification-close:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
      } */
    `;
    
    // Append styles to head if not already present
    if (!document.getElementById('nft-analyzer-styles')) {
      styleTag.id = 'nft-analyzer-styles';
      document.head.appendChild(styleTag);
    }

    analysisResultDiv.innerHTML = html;
    analysisResultDiv.style.display = 'block';
    console.log('Analysis result displayed');
  }

  // Fungsi untuk mendapatkan kelas CSS berdasarkan tingkat risiko
  function getRiskClass(riskAssessment) {
    const risk = riskAssessment.toLowerCase();
    if (risk.includes('low')) return 'risk-low';
    if (risk.includes('high')) return 'risk-high';
    return 'risk-medium';
  }

  // Periksa status backend dan load cached analysis saat popup dibuka
  checkBackendStatus();
  loadCachedAnalysis();
  // checkNotificationStatus(); // DISABLED - notification banner dihilangkan

  async function checkBackendStatus() {
    try {
      const response = await fetch('http://fscgswgcw8g4wooogwo0okk4.31.97.67.141.sslip.io/api/health');
      if (response.ok) {
        updateStatus('Backend connected', 'success');
      } else {
        updateStatus('Backend connection issue', 'error');
      }
    } catch (error) {
      updateStatus('Backend not running', 'error');
    }
  }

  async function loadCachedAnalysis() {
    try {
      const statusResponse = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'getAnalysisStatus' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Background script error: ${chrome.runtime.lastError.message}`));
          } else {
            resolve(response);
          }
        });
      });

      if (statusResponse.success && statusResponse.hasCachedResult) {
        const cachedResponse = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ action: 'getCachedAnalysis' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(`Background script error: ${chrome.runtime.lastError.message}`));
            } else {
              resolve(response);
            }
          });
        });

        if (cachedResponse.success) {
          displayAnalysisResult(cachedResponse.data);
          updateStatus('Loaded cached analysis', 'success');
        }
      }
    } catch (error) {
      console.error('Error loading cached analysis:', error);
    }
  }

  // Fungsi untuk memeriksa status notifikasi - DISABLED
  async function checkNotificationStatus() {
    // Notification banner telah dinonaktifkan
    console.log('Notification banner disabled');
    return;
  }

  // Fungsi untuk menghitung waktu yang lalu - DISABLED
  function getTimeAgo(timestamp) {
    // Function disabled karena notification banner dihilangkan
    return '';
  }

  // Fungsi helper untuk formatting
  function formatCurrency(amount, unit = 'USD') {
    const num = parseFloat(amount);
    if (isNaN(num)) return 'N/A';
    
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  }

  function formatNumber(num) {
    const n = parseInt(num);
    if (isNaN(n)) return '0';
    
    if (n >= 1000000) {
      return `${(n / 1000000).toFixed(1)}M`;
    } else if (n >= 1000) {
      return `${(n / 1000).toFixed(1)}K`;
    } else {
      return n.toString();
    }
  }

  function calculateAveragePrice(volume, sales) {
    const vol = parseFloat(volume);
    const sal = parseInt(sales);
    
    if (isNaN(vol) || isNaN(sal) || sal === 0) return 'N/A';
    
    const avg = vol / sal;
    return formatCurrency(avg);
  }

  function getActivityLevel(sales) {
    const num = parseInt(sales);
    if (isNaN(num)) return 'inactive';
    
    if (num >= 10) return 'high';
    if (num >= 5) return 'medium';
    if (num >= 1) return 'low';
    return 'inactive';
  }

  function getActivityLevelText(sales) {
    const level = getActivityLevel(sales);
    switch (level) {
      case 'high': return 'High Activity';
      case 'medium': return 'Medium Activity';
      case 'low': return 'Low Activity';
      default: return 'No Activity';
    }
  }

  function getTransactionType(transaction) {
    // Determine transaction type based on available data
    if (transaction.type) return transaction.type.toLowerCase();
    if (transaction.event_type) return transaction.event_type.toLowerCase();
    if (transaction.transaction_type) return transaction.transaction_type.toLowerCase();
    if (transaction.method) return transaction.method.toLowerCase();
    return 'unknown';
  }

  function getTransactionTypeText(transaction) {
    const type = getTransactionType(transaction);
    switch (type) {
      case 'sale':
      case 'sold': return 'Sale';
      case 'mint': return 'Mint';
      case 'transfer': return 'Transfer';
      case 'bid': return 'Bid';
      case 'offer': return 'Offer';
      default: return 'Transaction';
    }
  }

  function formatTransactionPrice(transaction) {
    if (transaction.price) {
      return formatCurrency(transaction.price, transaction.currency || 'USD');
    }
    if (transaction.amount) {
      return formatCurrency(transaction.amount, transaction.currency || 'USD');
    }
    if (transaction.value) {
      return formatCurrency(transaction.value, transaction.currency || 'USD');
    }
    if (transaction.price_usd) {
      return formatCurrency(transaction.price_usd, 'USD');
    }
    if (transaction.eth_price) {
      return formatCurrency(transaction.eth_price, 'ETH');
    }
    return 'N/A';
  }

  function formatTransactionDate(transaction) {
    if (transaction.date) {
      return new Date(transaction.date).toLocaleDateString();
    }
    if (transaction.timestamp) {
      return new Date(transaction.timestamp * 1000).toLocaleDateString();
    }
    if (transaction.created_at) {
      return new Date(transaction.created_at).toLocaleDateString();
    }
    if (transaction.block_timestamp) {
      return new Date(transaction.block_timestamp * 1000).toLocaleDateString();
    }
    if (transaction.time) {
      return new Date(transaction.time).toLocaleDateString();
    }
    return 'Unknown';
  }

  function formatAddress(address) {
    if (!address || address === 'Unknown') return 'Unknown';
    if (address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  // Fungsi untuk membuat grafik price history
  function createPriceHistoryChart(chartId, priceHistory) {
    const ctx = document.getElementById(chartId);
    if (!ctx) {
      console.error('Canvas element not found:', chartId);
      return;
    }

    // Prepare data for chart
    const prices = [];
    const labels = [];
    const colors = [];
    const validPrices = [];

    // Add price data points with validation
    if (priceHistory.price_starting?.value && priceHistory.price_starting.value !== 'NA') {
      const value = parseFloat(priceHistory.price_starting.value);
      if (!isNaN(value) && value > 0) {
        prices.push(value);
        labels.push('Starting');
        colors.push('#4dabf7');
        validPrices.push({ label: 'Starting', value: value, color: '#4dabf7' });
      }
    }

    if (priceHistory.price_min?.value && priceHistory.price_min.value !== 'NA') {
      const value = parseFloat(priceHistory.price_min.value);
      if (!isNaN(value) && value > 0) {
        prices.push(value);
        labels.push('Min');
        colors.push('#dc3545');
        validPrices.push({ label: 'Min', value: value, color: '#dc3545' });
      }
    }

    if (priceHistory.price_fair_estimate?.value && priceHistory.price_fair_estimate.value !== 'NA') {
      const value = parseFloat(priceHistory.price_fair_estimate.value);
      if (!isNaN(value) && value > 0) {
        prices.push(value);
        labels.push('Fair Price');
        colors.push('#28a745');
        validPrices.push({ label: 'Fair Price', value: value, color: '#28a745' });
      }
    }

    if (priceHistory.price_max?.value && priceHistory.price_max.value !== 'NA') {
      const value = parseFloat(priceHistory.price_max.value);
      if (!isNaN(value) && value > 0) {
        prices.push(value);
        labels.push('Max');
        colors.push('#fd7e14');
        validPrices.push({ label: 'Max', value: value, color: '#fd7e14' });
      }
    }

    if (priceHistory.price_latest?.value && priceHistory.price_latest.value !== 'NA') {
      const value = parseFloat(priceHistory.price_latest.value);
      if (!isNaN(value) && value > 0) {
        prices.push(value);
        labels.push('Latest');
        colors.push('#6f42c1');
        validPrices.push({ label: 'Latest', value: value, color: '#6f42c1' });
      }
    }

    // If no valid data, show message
    if (prices.length === 0) {
      const context = ctx.getContext('2d');
      context.fillStyle = '#6c757d';
      context.font = '12px Arial';
      context.textAlign = 'center';
      context.fillText('No price data available', ctx.width / 2, ctx.height / 2);
      return;
    }

    // Debug: Log the data for troubleshooting
    console.log('Price History Data:', {
      prices: prices,
      labels: labels,
      validPrices: validPrices,
      priceHistory: priceHistory
    });

    // Sort prices chronologically (if we had time data)
    const sortedPrices = validPrices.sort((a, b) => {
      const order = { 'Starting': 0, 'Min': 1, 'Fair Price': 2, 'Max': 3, 'Latest': 4 };
      return order[a.label] - order[b.label];
    });

    const chartData = {
      labels: sortedPrices.map(p => p.label),
      datasets: [{
        label: 'Price History',
        data: sortedPrices.map(p => p.value),
        borderColor: '#627eff',
        backgroundColor: 'rgba(98, 126, 255, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: sortedPrices.map(p => p.color),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBorderWidth: 3
      }]
    };

    // Create chart with enhanced styling
    new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#627eff',
            borderWidth: 2,
            cornerRadius: 12,
            displayColors: true,
            titleFont: {
              size: 12,
              weight: 'bold'
            },
            bodyFont: {
              size: 11
            },
            callbacks: {
              label: function(context) {
                const value = context.parsed.y;
                const unit = priceHistory.price_latest?.unit || 'USD';
                return `${context.label}: ${value.toFixed(2)} ${unit}`;
              },
              title: function(context) {
                return `Price History`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              drawBorder: false,
              lineWidth: 1
            },
            ticks: {
              color: '#94a3b8',
              font: {
                size: 10,
                weight: '500'
              },
              callback: function(value) {
                const unit = priceHistory.price_latest?.unit || 'USD';
                return `${value.toFixed(2)} ${unit}`;
              },
              padding: 8
            },
            border: {
              color: 'rgba(255, 255, 255, 0.2)',
              width: 1
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              drawBorder: false
            },
            ticks: {
              color: '#94a3b8',
              font: {
                size: 10,
                weight: '500'
              },
              padding: 8
            },
            border: {
              color: 'rgba(255, 255, 255, 0.2)',
              width: 1
            }
          }
        },
        elements: {
          point: {
            hoverBackgroundColor: '#ffffff',
            hoverBorderColor: '#627eff',
            hoverBorderWidth: 3
          },
          line: {
            borderJoinStyle: 'round'
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
      }
    });
  }
});