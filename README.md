# Myntra AI - NFT Analysis Extension

> **🏆 Built for bitsCrunch x AI Builders Hack 2025**  
> An intelligent Chrome extension that combines BitsCrunch APIs with Gemini AI to provide comprehensive NFT analysis and insights.

## 🎯 Project Overview

Myntra AI is an AI-powered Chrome extension that provides real-time NFT analysis using BitsCrunch APIs and Gemini AI. It offers professional insights, risk assessment, and actionable recommendations for NFT traders and investors.

### 🚀 Key Features
- **Real-time NFT Analysis** using BitsCrunch APIs
- **AI-powered Insights** via Gemini AI with expert analyst persona
- **Multi-marketplace Support** (OpenSea, Rarible, Blur, LooksRare, X2Y2)
- **Professional Analysis Reports** with actionable recommendations
- **Risk Assessment** and valuation predictions
- **Caching System** for faster repeated analysis

### 🏆 Hackathon Tracks
- ✅ **Chatbots & Copilots** - Chrome AI Copilot for NFT analysis
- ✅ **LLM Tools & Agentic Systems** - AI analyst with real-time market insights
- ✅ **NFT Analytics Dashboards** - Visual interface for NFT risk assessment
- ✅ **AI Risk Engines & Forensics** - Predictive models for NFT valuation

## 📁 Project Structure

```
Myntra AI/
├── extension/           # Chrome Extension Files (User Download)
│   ├── manifest.json
│   ├── background.js
│   ├── popup/
│   │   ├── popup.html
│   │   └── popup.js
│   ├── content_scripts/
│   │   └── content.js
│   ├── options/
│   │   ├── options.html
│   │   └── options.js
│   ├── icons/
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   ├── completion_popup.html
│   ├── mock_nft_page.html    # Test page for extension
│   └── README.md             # User Guide
│
├── backend/            # Python Backend (Server Deployment)
│   ├── app.py
│   ├── config.py
│   ├── api_config.py
│   ├── Nft.py              # BitsCrunch API wrapper
│   ├── requirements.txt
│   └── README.md           # Developer Guide
│
├── README.md           # Main Project Documentation
└── .gitignore         # Git ignore rules
```

## 🔍 Quick Start

### 1. Backend Setup (Server)
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Backend will run on `http://localhost:5000`

### 2. Extension Setup (User)
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder

## 📋 Requirements

### Backend Dependencies
- Python 3.7+
- Flask
- Requests
- BitsCrunch API Key
- Gemini API Key

### Extension Requirements
- Google Chrome
- Backend server running

## 🔧 Configuration

### API Keys Setup
Edit `backend/api_config.py`:
```python
UNLEASH_NFT_API_KEY = "your_bitscrunch_api_key"
GEMINI_API_KEY = "your_gemini_api_key"
```

## 🎯 Features

- **Real-time NFT Analysis** using BitsCrunch APIs
- **AI-powered Insights** via Gemini AI
- **Multi-marketplace Support** (OpenSea, Rarible, Blur, etc.)
- **Professional Analysis Reports** with actionable recommendations
- **Caching System** for faster repeated analysis

## 📊 Supported Marketplaces

- ✅ OpenSea
- ✅ Rarible  
- ✅ Blur
- ✅ LooksRare
- ✅ X2Y2

## 🔄 Workflow

1. **User** → Opens NFT page on supported marketplace
2. **Extension** → Extracts NFT data (contract, token ID)
3. **Backend** → Calls BitsCrunch APIs for comprehensive data
4. **Backend** → Sends data to Gemini AI for analysis
5. **Extension** → Displays professional analysis report

## 📝 Usage

1. Install extension in Chrome
2. Navigate to any NFT on supported marketplaces
3. Click extension icon
4. Click "Analyze Current NFT"
5. View comprehensive analysis results

## 🛠️ Development

### Backend Development
```bash
cd backend
python app.py
```

### Extension Development
- Edit files in `extension/` folder
- Reload extension in Chrome after changes

## 📦 Deployment

### Backend Deployment
- Deploy `backend/` folder to your server
- Update extension's backend URL in `background.js`

### Extension Distribution
- Package `extension/` folder for Chrome Web Store
- Or distribute as unpacked extension

## 🔒 Security Notes

- API keys are stored in backend only
- Extension communicates via HTTPS
- No sensitive data stored in browser

## 📞 Support

For issues or questions:
- Check backend logs for API errors
- Verify API keys are correctly set
- Ensure backend is running on correct port

---

**Myntra AI** - NFT insights . Powered by bitsCrunch APIs. 