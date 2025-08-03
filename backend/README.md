# Myntra AI Backend - Developer Guide

## 🔍 Quick Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure API Keys
Edit `api_config.py`:
```python
UNLEASH_NFT_API_KEY = "your_bitscrunch_api_key"
GEMINI_API_KEY = "your_gemini_api_key"
```

### 3. Run Server
```bash
python app.py
```
Server will run on `http://localhost:5000`

## 📁 File Structure

```
backend/
├── app.py              # Main Flask application
├── config.py           # Configuration settings
├── api_config.py       # API keys and endpoints
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

## 🔧 API Endpoints

### Health Check
```
GET /api/health
```
Returns server status

### Set API Keys
```
POST /api/set_api_keys
```
Body: `{"unleash_nft_api_key": "...", "gemini_api_key": "..."}`

### Analyze NFT
```
POST /api/analyze_nft
```
Body: `{"blockchain": "...", "contract_address": "...", "token_id": "..."}`

## 🔑 Required API Keys

### BitsCrunch API
- **Purpose**: NFT data and analytics
- **Get from**: https://bitscrunch.com/
- **Usage**: Metadata, metrics, valuation, price history

### Gemini AI API
- **Purpose**: AI analysis and insights
- **Get from**: https://makersuite.google.com/app/apikey
- **Usage**: Professional analysis reports

## 📊 Data Flow

1. **Receive Request** from extension
2. **Extract NFT Data** (contract, token ID)
3. **Call BitsCrunch APIs**:
   - NFT Metadata
   - Volume & Sales
   - Price History
   - Valuation Data
4. **Send to Gemini AI** for analysis
5. **Return Comprehensive Report** to extension

## 🛠️ Development

### Local Development
```bash
# Run in development mode
export FLASK_ENV=development
python app.py
```

### Production Deployment
```bash
# Use production WSGI server
gunicorn app:app -b 0.0.0.0:5000
```

### Environment Variables
```bash
export UNLEASH_NFT_API_KEY="your_key"
export GEMINI_API_KEY="your_key"
```

## 📈 Monitoring

### Logs
- Check console output for API errors
- Monitor BitsCrunch API rate limits
- Track Gemini AI response times

### Health Checks
- `/api/health` endpoint for monitoring
- Returns server status and API connectivity

## 🔒 Security

### API Key Management
- Store keys in environment variables
- Never commit keys to version control
- Use secure key rotation

### CORS Configuration
- Configure allowed origins for production
- Restrict to specific domains if needed

## 📦 Deployment Options

### Local Development
```bash
python app.py
```

### Docker Deployment
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

### Cloud Deployment
- **Heroku**: Deploy as Python app
- **AWS**: Use EC2 or Lambda
- **Google Cloud**: App Engine or Cloud Run
- **DigitalOcean**: Droplet with Python

## 📝 Configuration

### Update Backend URL
If deploying to different domain, update extension's `background.js`:
```javascript
const BACKEND_URL = 'https://your-domain.com';
```

### CORS Settings
For production, update CORS in `app.py`:
```python
from flask_cors import CORS
CORS(app, origins=['https://your-domain.com'])
```

## 🔧 Troubleshooting

### Common Issues:
1. **API Key Errors**: Verify keys in `api_config.py`
2. **CORS Errors**: Check allowed origins
3. **Rate Limits**: Monitor BitsCrunch API usage
4. **Timeout Errors**: Increase request timeouts

### Debug Mode
```bash
export FLASK_DEBUG=1
python app.py
```

## 📊 Performance

### Optimization Tips:
- Implement caching for repeated requests
- Use connection pooling for API calls
- Monitor response times
- Implement rate limiting if needed

### Monitoring:
- Track API response times
- Monitor error rates
- Check server resource usage

---

**Myntra AI Backend** - Powered by BitsCrunch APIs & Gemini AI 