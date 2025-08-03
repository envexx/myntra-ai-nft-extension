# 🚀 Deployment Sederhana Myntra AI Backend

## 📋 File yang Diperlukan

```
backend/
├── app.py              # Main Flask application
├── config.py           # Configuration settings
├── requirements.txt    # Python dependencies
├── Procfile           # Start command
├── runtime.txt        # Python version
├── env.example        # Environment template
└── README.md          # Documentation
```

## 🎯 Deployment di Coolify (Tanpa Docker)

### 1. **Source Code Deployment**

#### A. Setup di Coolify Dashboard
1. Login ke Coolify dashboard
2. Klik "New Application"
3. Pilih "Source"
4. Connect repository GitHub/GitLab

#### B. Konfigurasi Repository
- **Repository URL**: URL repository Anda
- **Branch**: `main` atau `master`
- **Root Directory**: `backend/`

#### C. Build Configuration
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python app.py`
- **Port**: `5000`

#### D. Environment Variables
```
UNLEASH_NFT_API_KEY=your_unleash_nft_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_secret_key_here
FLASK_ENV=production
```

#### E. Resource Limits (Opsional)
- **Memory**: 512M
- **CPU**: 0.5 cores

### 2. **Deploy**
1. Klik "Deploy"
2. Monitor build logs
3. Verify health check

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
    "unleash_nft_api_key": "your_key",
    "gemini_api_key": "your_key"
  }'

# Test NFT analysis
curl -X POST http://your-domain:5000/api/analyze_nft \
  -H "Content-Type: application/json" \
  -d '{
    "blockchain": "ethereum",
    "contract_address": "0x123...",
    "token_id": "123"
  }'
```

## 🔧 Local Development

### Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp env.example .env
# Edit .env dengan API keys Anda

# Run application
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
    "unleash_nft_api_key": "your_key",
    "gemini_api_key": "your_key"
  }'
```

## 📚 API Documentation

### Endpoints

#### 1. Health Check
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

#### 2. Set API Keys
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

#### 3. Analyze NFT
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
UNLEASH_NFT_API_KEY=your_key
GEMINI_API_KEY=your_key

# Optional
SECRET_KEY=your_secret
FLASK_ENV=production
FLASK_DEBUG=False
```

## 📝 Checklist Deployment

### Sebelum Deploy
- [ ] Repository sudah siap
- [ ] requirements.txt lengkap
- [ ] app.py berfungsi
- [ ] Environment variables siap
- [ ] API keys valid

### Setelah Deploy
- [ ] Health check berhasil
- [ ] API endpoints berfungsi
- [ ] Logs tidak ada error
- [ ] Performance normal

## 🎯 Keuntungan Tanpa Docker

### ✅ **Lebih Sederhana**
- Tidak perlu Dockerfile
- Tidak perlu container management
- Setup lebih cepat

### ✅ **Lebih Ringan**
- Tidak ada overhead container
- Resource usage lebih rendah
- Startup lebih cepat

### ✅ **Lebih Mudah Debug**
- Logs lebih straightforward
- Error handling lebih mudah
- Development lebih natural

## 📞 Support

### Documentation
- [Coolify Documentation](https://coolify.io/docs)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Python Documentation](https://docs.python.org/)

### Community
- Coolify Discord/Slack
- Flask Community
- Python Community

---

**Myntra AI Backend** - Simple deployment without Docker! 🚀 