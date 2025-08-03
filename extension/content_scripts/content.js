// Content Script for Myntra AI

// Function to extract NFT information from page
function extractNFTInfo() {
  const url = window.location.href;
  console.log('Extracting NFT info from URL:', url);
  
  let nftInfo = null;

  // Extraction for OpenSea
  if (url.includes('opensea.io')) {
    console.log('Detected OpenSea marketplace');
    nftInfo = extractOpenSeaNFTInfo();
  }
  // Extraction for Rarible
  else if (url.includes('rarible.com')) {
    console.log('Detected Rarible marketplace');
    nftInfo = extractRaribleNFTInfo();
  }
  // Extraction for other marketplaces (Blur, LooksRare, etc.)
  else if (url.includes('blur.io')) {
    console.log('Detected Blur marketplace');
    nftInfo = extractBlurNFTInfo();
  }
  else if (url.includes('looksrare.org')) {
    console.log('Detected LooksRare marketplace');
    nftInfo = extractLooksRareNFTInfo();
  }
  else if (url.includes('x2y2.io')) {
    console.log('Detected X2Y2 marketplace');
    nftInfo = extractX2Y2NFTInfo();
  }
  else {
    console.log('No supported marketplace detected');
  }

  console.log('Extracted NFT info:', nftInfo);
  return nftInfo;
}

// Special function to extract NFT info from OpenSea
function extractOpenSeaNFTInfo() {
  try {
    const urlParts = window.location.pathname.split('/');
    console.log('OpenSea URL parts:', urlParts);
    
    // Format 1: /assets/blockchain/contractAddress/tokenId
    const assetsIndex = urlParts.indexOf('assets');
    if (assetsIndex !== -1 && urlParts.length > assetsIndex + 3) {
      const blockchain = urlParts[assetsIndex + 1];
      const contractAddress = urlParts[assetsIndex + 2];
      const tokenId = urlParts[assetsIndex + 3];
      
      console.log('Extracted from /assets/ format:', { blockchain, contractAddress, tokenId });
      
      return {
        blockchain: blockchain,
        contract_address: contractAddress,
        token_id: tokenId,
        marketplace: 'opensea'
      };
    }
    
    // Format 2: /item/blockchain/contractAddress/tokenId
    const itemIndex = urlParts.indexOf('item');
    if (itemIndex !== -1 && urlParts.length > itemIndex + 3) {
      const blockchain = urlParts[itemIndex + 1];
      const contractAddress = urlParts[itemIndex + 2];
      const tokenId = urlParts[itemIndex + 3];
      
      console.log('Extracted from /item/ format:', { blockchain, contractAddress, tokenId });
      
      return {
        blockchain: blockchain,
        contract_address: contractAddress,
        token_id: tokenId,
        marketplace: 'opensea'
      };
    }
    
    console.log('No valid OpenSea NFT URL format found');
  } catch (error) {
    console.error('Error extracting OpenSea NFT info:', error);
  }
  return null;
}

// Special function to extract NFT info from Rarible
function extractRaribleNFTInfo() {
  try {
    // Extract from Rarible URL (format: /token/blockchain:contractAddress:tokenId)
    const urlParts = window.location.pathname.split('/');
    const tokenIndex = urlParts.indexOf('token');
    
    if (tokenIndex !== -1 && urlParts.length > tokenIndex + 1) {
      const tokenPart = urlParts[tokenIndex + 1];
      const [blockchain, contractAddress, tokenId] = tokenPart.split(':');
      
      return {
        blockchain: blockchain,
        contract_address: contractAddress,
        token_id: tokenId,
        marketplace: 'rarible'
      };
    }
  } catch (error) {
    console.error('Error extracting Rarible NFT info:', error);
  }
  return null;
}

// Special function to extract NFT info from Blur
function extractBlurNFTInfo() {
  try {
    // Extract from Blur URL (format: /collection/contractAddress/tokenId)
    const urlParts = window.location.pathname.split('/');
    const collectionIndex = urlParts.indexOf('collection');
    
    if (collectionIndex !== -1 && urlParts.length > collectionIndex + 2) {
      const contractAddress = urlParts[collectionIndex + 1];
      const tokenId = urlParts[collectionIndex + 2];
      
      return {
        blockchain: 'ethereum', // Blur primarily on Ethereum
        contract_address: contractAddress,
        token_id: tokenId,
        marketplace: 'blur'
      };
    }
  } catch (error) {
    console.error('Error extracting Blur NFT info:', error);
  }
  return null;
}

// Special function to extract NFT info from LooksRare
function extractLooksRareNFTInfo() {
  try {
    // Extract from LooksRare URL (format: /collections/contractAddress/tokenId)
    const urlParts = window.location.pathname.split('/');
    const collectionsIndex = urlParts.indexOf('collections');
    
    if (collectionsIndex !== -1 && urlParts.length > collectionsIndex + 2) {
      const contractAddress = urlParts[collectionsIndex + 1];
      const tokenId = urlParts[collectionsIndex + 2];
      
      return {
        blockchain: 'ethereum', // LooksRare primarily on Ethereum
        contract_address: contractAddress,
        token_id: tokenId,
        marketplace: 'looksrare'
      };
    }
  } catch (error) {
    console.error('Error extracting LooksRare NFT info:', error);
  }
  return null;
}

// Special function to extract NFT info from X2Y2
function extractX2Y2NFTInfo() {
  try {
    // Extract from X2Y2 URL (format: /item/contractAddress/tokenId)
    const urlParts = window.location.pathname.split('/');
    const itemIndex = urlParts.indexOf('item');
    
    if (itemIndex !== -1 && urlParts.length > itemIndex + 2) {
      const contractAddress = urlParts[itemIndex + 1];
      const tokenId = urlParts[itemIndex + 2];
    
      return {
        blockchain: 'ethereum', // X2Y2 primarily on Ethereum
        contract_address: contractAddress,
        token_id: tokenId,
        marketplace: 'x2y2'
      };
    }
  } catch (error) {
    console.error('Error extracting X2Y2 NFT info:', error);
  }
  return null;
}

// Fungsi untuk membuat dan menampilkan UI analisis - DISABLED
function createAnalysisUI(analysisData) {
  // Popup UI analisis telah dinonaktifkan
  console.log('Analysis UI popup disabled');
  return;
}

// Fungsi untuk meminta analisis dari background script
function requestNFTAnalysis(nftInfo) {
  console.log('Sending NFT analysis request:', nftInfo);
  
  try {
    chrome.runtime.sendMessage(
      { action: 'analyzeNFT', data: nftInfo },
      (response) => {
        console.log('Received response from background:', response);
        
        if (chrome.runtime.lastError) {
          console.error('Runtime error:', chrome.runtime.lastError);
          createAnalysisUI({
            success: false,
            error: `Connection error: ${chrome.runtime.lastError.message}`
          });
          return;
        }
        
        if (response) {
          createAnalysisUI(response);
        } else {
          createAnalysisUI({
            success: false,
            error: 'No response from background script'
          });
        }
      }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    createAnalysisUI({
      success: false,
      error: `Failed to send message: ${error.message}`
    });
  }
}

// Fungsi utama yang dijalankan saat halaman dimuat - DISABLED
function initializeNFTAnalyzer() {
  // Auto-analysis telah dinonaktifkan
  console.log('Auto-analysis disabled');
  return;
}

// Fungsi untuk menampilkan pesan marketplace tidak didukung - DISABLED
function showUnsupportedMarketplaceMessage() {
  // Popup pemberitahuan telah dinonaktifkan
  console.log('Marketplace notification disabled');
  return;
}

// Jalankan analyzer saat halaman dimuat
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNFTAnalyzer);
} else {
  initializeNFTAnalyzer();
}

// Juga jalankan saat URL berubah (untuk SPA)
let currentUrl = window.location.href;
setInterval(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    initializeNFTAnalyzer();
  }
}, 1000);

// Listener untuk pesan dari popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'extractNFTInfo') {
    try {
      const nftInfo = extractNFTInfo();
      console.log('Extracted NFT info:', nftInfo);
      
      if (nftInfo) {
        sendResponse({ success: true, data: nftInfo });
      } else {
        sendResponse({ success: false, error: 'No NFT detected on this page' });
      }
    } catch (error) {
      console.error('Error extracting NFT info:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true; // Menunjukkan bahwa respons akan dikirim secara asinkron
  }
  
  if (request.action === 'showCompletionPopup') {
    // Tampilkan popup completion di halaman web
    showCompletionPopupOnPage(request.data);
    sendResponse({ success: true });
    return true;
  }
});

// Fungsi untuk menampilkan popup completion di halaman web
function showCompletionPopupOnPage(popupData) {
  // Hapus popup yang sudah ada jika ada
  const existingPopup = document.getElementById('completion-popup-web');
  if (existingPopup) {
    existingPopup.remove();
  }

  // Tambahkan CSS animation jika belum ada
  if (!document.getElementById('completion-popup-styles')) {
    const style = document.createElement('style');
    style.id = 'completion-popup-styles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  // Buat popup completion
  const popup = document.createElement('div');
  popup.id = 'completion-popup-web';
  popup.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 350px;
    background: white;
    border: 2px solid #28a745;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    animation: fadeIn 0.3s ease-out;
  `;

  popup.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
      <h3 style="margin: 0; color: #28a745;">✅ Analisis Selesai!</h3>
      <button onclick="this.parentElement.parentElement.remove()" style="background: #dc3545; border: none; font-size: 16px; cursor: pointer; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">×</button>
    </div>
    <div style="color: #333; margin-bottom: 15px;">
              <p style="margin: 0 0 10px 0;">NFT analysis has been successfully completed.</p>
              <p style="margin: 0; font-size: 12px; color: #666;">Click the extension icon to view complete results.</p>
    </div>
          <button onclick="this.parentElement.remove()" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px;">Close</button>
  `;

  document.body.appendChild(popup);

  // Auto remove setelah 10 detik
  setTimeout(() => {
    if (popup.parentNode) {
      popup.remove();
    }
  }, 10000);
}

