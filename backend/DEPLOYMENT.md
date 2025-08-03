# 🚀 Myntra AI Backend Deployment

## 📋 File yang Diperlukan

```
backend/
├── app.py              # Main Flask application
├── config.py           # Configuration settings
├── requirements.txt    # Python dependencies
├── Procfile           # Start command
├── runtime.txt        # Python version
├── api_config.py      # API keys (untuk localhost)
└── README.md          # Documentation
```

## 🎯 Deployment di Coolify

### 1. **Source Code Deployment**

#### A. Setup di Coolify Dashboard
1. Login ke Coolify dashboard
2. Klik "New Application"
3. Pilih "Source"
4. Connect repository GitHub/GitLab

#### B. Konfigurasi Repository
- **Repository URL**: `https://github.com/envexx/myntra-ai-nft-extension`
- **Branch**: `main`
- **Root Directory**: `backend/`

#### C. Build Configuration
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python app.py`
- **Port**: `5000`

#### D. Environment Variables
```
UNLEASH_NFT_API_KEY=a18b2d19a5d1439aa5e029da8a786328
GEMINI_API_KEY=AIzaSyBY2o7XvjPLagIBOksRxNIn_drirPeS7jQ
SECRET_KEY=your_secret_key_here
FLASK_ENV=production
```

## 🧪 Testing

### Health Check
```bash
curl http://your-domain:5000/api/health
```

### API Test
```bash
# Set API keys
curl -X POST http://your-domain:5000/api/set_api_keys \
  -H "Content-Type: application/json" \
  -d '{
    "unleash_nft_api_key": "a18b2d19a5d1439aa5e029da8a786328",
    "gemini_api_key": "AIzaSyBY2o7XvjPLagIBOksRxNIn_drirPeS7jQ"
  }'

# Test NFT analysis
curl -X POST http://your-domain:5000/api/analyze_nft \
  -H "Content-Type: application/json" \
  -d '{
    "blockchain": "ethereum",
    "contract_address": "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
    "token_id": "1"
  }'
```

## 🔧 Local Development

### Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Run application (localhost untuk penjurian)
python app.py
```

### Test Local
```bash
# Health check
curl http://localhost:5000/api/health

# Test API
curl -X POST http://localhost:5000/api/set_api_keys \
  -H "Content-Type: application/json" \
  -d '{
    "unleash_nft_api_key": "a18b2d19a5d1439aa5e029da8a786328",
    "gemini_api_key": "AIzaSyBY2o7XvjPLagIBOksRxNIn_drirPeS7jQ"
  }'
```

## 📚 API Endpoints

### 1. Health Check
```
GET /api/health
```
**Response:**
```json
{
  "status": "ok",
  "message": "Backend is running"
}
```

### 2. Set API Keys
```
POST /api/set_api_keys
```
**Request:**
```json
{
  "unleash_nft_api_key": "your_unleash_nft_api_key",
  "gemini_api_key": "your_gemini_api_key"
}
```

### 3. Analyze NFT
```
POST /api/analyze_nft
```
**Request:**
```json
{
  "blockchain": "ethereum",
  "contract_address": "0x1234567890abcdef...",
  "token_id": "123"
}
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Build Fails
- Check `requirements.txt` syntax
- Verify Python version compatibility
- Check for missing dependencies

#### 2. Application Won't Start
- Check environment variables
- Verify port 5000 is available
- Check application logs

#### 3. API Key Issues
- Verify API keys are valid
- Check environment variables
- Restart application after changing env vars

### Debug Commands

```bash
# Check Python version
python --version

# Check installed packages
pip list

# Test application locally
python app.py

# Check environment variables
env | grep -E "(UNLEASH|GEMINI|SECRET)"
```

## 📈 Monitoring

### Health Check
- **Endpoint**: `/api/health`
- **Expected Response**: `{"status": "ok", "message": "Backend is running"}`

### Logs
- Monitor application logs via Coolify dashboard
- Check for errors and warnings

### Performance
- Monitor response times
- Track API call statistics
- Check resource usage

## 🔒 Security

### Best Practices
- ✅ Use environment variables for API keys
- ✅ Implement proper CORS settings
- ✅ Add security headers
- ✅ Regular dependency updates
- ✅ Input validation and sanitization

### Environment Variables
```bash
# Required
UNLEASH_NFT_API_KEY=a18b2d19a5d1439aa5e029da8a786328
GEMINI_API_KEY=AIzaSyBY2o7XvjPLagIBOksRxNIn_drirPeS7jQ

# Optional
SECRET_KEY=your_secret
FLASK_ENV=production
FLASK_DEBUG=False
```

## 📝 Checklist Deployment

### Sebelum Deploy
- [x] Repository sudah siap
- [x] requirements.txt lengkap
- [x] app.py berfungsi
- [x] Environment variables siap
- [x] API keys valid

### Setelah Deploy
- [x] Health check berhasil
- [x] API endpoints berfungsi
- [x] Logs tidak ada error
- [x] Performance normal

## 🎯 Keuntungan Optimasi

### ✅ **Lebih Ringan**
- Menghapus logging berlebihan
- Mengurangi import yang tidak diperlukan
- Optimasi error handling

### ✅ **Lebih Cepat**
- Response time lebih cepat
- Memory usage lebih rendah
- Startup time lebih cepat

### ✅ **Lebih Stabil**
- Error handling yang lebih baik
- Logging yang lebih fokus
- Code yang lebih bersih

---

**Myntra AI Backend** - Optimized for production! 🚀 