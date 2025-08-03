# 🚀 Myntra AI Backend

Backend Flask API untuk analisis NFT dengan integrasi AI menggunakan UnleashNFTs dan Gemini APIs.

## 📋 Fitur

- 🔍 **NFT Analysis**: Analisis komprehensif NFT menggunakan UnleashNFTs API
- 🤖 **AI Integration**: Integrasi dengan Gemini AI untuk insights cerdas
- 🔗 **Multi-Blockchain**: Support untuk Ethereum, Polygon, BSC
- 📊 **Market Metrics**: Volume, sales, price history, dan metrics lainnya
- 🎯 **Valuation**: AI-powered price estimation dan market analysis
- 🔒 **Secure**: Environment variables dan proper error handling

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chrome        │    │   Flask         │    │   External      │
│   Extension     │◄──►│   Backend       │◄──►│   APIs          │
│                 │    │                 │    │                 │
│ - Content       │    │ - REST API      │    │ - UnleashNFTs   │
│ - Popup         │    │ - CORS Support  │    │ - Gemini AI     │
│ - Background    │    │ - Error Handling│    │ - Blockchain    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Docker & Docker Compose
- API Keys (UnleashNFTs, Gemini)

### Local Development

1. **Clone Repository**
```bash
git clone <your-repo-url>
cd backend
```

2. **Install Dependencies**
```bash
pip install -r requirements.txt
```

3. **Set Environment Variables**
```bash
# Create .env file
cp .env.example .env

# Edit .env file with your API keys
UNLEASH_NFT_API_KEY=your_unleash_nft_api_key
GEMINI_API_KEY=your_gemini_api_key
SECRET_KEY=your_secret_key_here
FLASK_ENV=development
```

4. **Run Application**
```bash
# Development mode
python app.py

# Or with Docker
docker-compose up
```

5. **Test API**
```bash
# Health check
curl http://localhost:5000/api/health

# Set API keys
curl -X POST http://localhost:5000/api/set_api_keys \
  -H "Content-Type: application/json" \
  -d '{
    "unleash_nft_api_key": "your_key",
    "gemini_api_key": "your_key"
  }'

# Analyze NFT
curl -X POST http://localhost:5000/api/analyze_nft \
  -H "Content-Type: application/json" \
  -d '{
    "blockchain": "ethereum",
    "contract_address": "0x123...",
    "token_id": "123"
  }'
```

## 🚀 Simple Deployment

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp env.example .env
# Edit .env dengan API keys Anda

# Run application
python app.py
```

### Coolify Deployment
1. Push code ke repository
2. Setup di Coolify dashboard dengan Source deployment
3. Set environment variables
4. Deploy dan monitor

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
**Response:**
```json
{
  "status": "success",
  "message": "API keys updated and SDKs initialized"
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
**Response:**
```json
{
  "success": true,
  "data": {
    "blockchain": "ethereum",
    "contract_address": "0x123...",
    "token_id": "123",
    "nft_metadata": {...},
    "nft_metrics": {...},
    "nft_valuation": {...},
    "nft_price_history": {...},
    "nft_traits": {...},
    "nft_transactions": {...},
    "ai_analysis": "Comprehensive AI analysis...",
    "api_status": "Comprehensive BitsCrunch API data + AI analysis retrieved successfully"
  }
}
```

### Supported Blockchains
- `ethereum` / `base`
- `polygon`
- `bsc`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `UNLEASH_NFT_API_KEY` | UnleashNFTs API key | Yes | - |
| `GEMINI_API_KEY` | Gemini AI API key | Yes | - |
| `SECRET_KEY` | Flask secret key | No | Random |
| `FLASK_ENV` | Flask environment | No | `production` |
| `FLASK_DEBUG` | Debug mode | No | `False` |

### Production Configuration

File `production.py` berisi konfigurasi khusus untuk production:
- Security headers
- CORS settings
- Rate limiting
- Performance optimizations
- SSL/TLS settings

## 🚀 Deployment

### Coolify Deployment (Source Code)

1. **Prepare Repository**
   - Push code ke Git repository
   - Ensure all files are committed

2. **Coolify Dashboard Setup**
   - Create new application
   - Select "Source" deployment
   - Configure repository settings
   - Set environment variables
   - Configure resource limits

3. **Deploy**
   - Click "Deploy"
   - Monitor build logs
   - Verify health check

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp env.example .env
# Edit .env dengan API keys Anda

# Run application
python app.py
```

## 🧪 Testing

### Local Testing
```bash
# Test health check
curl http://localhost:5000/api/health

# Test with real API keys
curl -X POST http://localhost:5000/api/set_api_keys \
  -H "Content-Type: application/json" \
  -d '{
    "unleash_nft_api_key": "your_real_key",
    "gemini_api_key": "your_real_key"
  }'
```

### Manual Testing
```bash
# Health check
curl http://localhost:5000/api/health

# Test NFT analysis with real data
curl -X POST http://localhost:5000/api/analyze_nft \
  -H "Content-Type: application/json" \
  -d '{
    "blockchain": "ethereum",
    "contract_address": "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
    "token_id": "1"
  }'
```

## 🔍 Monitoring

### Health Check
- **Endpoint**: `/api/health`
- **Interval**: 30s
- **Timeout**: 10s
- **Retries**: 3

### Logs
- Application logs via Coolify dashboard
- Docker logs: `docker logs myntra-ai-backend`
- Flask logs with proper formatting

### Metrics
- Response time monitoring
- Error rate tracking
- Resource usage monitoring
- API call statistics

## 🛠️ Troubleshooting

### Common Issues

#### 1. Build Fails
```bash
# Check requirements
pip install -r requirements.txt

# Check Python version
python --version
```

#### 2. Application Won't Start
```bash
# Check environment variables
env | grep -E "(UNLEASH|GEMINI|SECRET)"

# Check logs
python app.py
```

#### 3. API Key Issues
- Verify API keys are valid
- Check environment variables
- Restart application after changing env vars

#### 4. CORS Issues
- Check CORS configuration in `config.py`
- Verify extension origin in CORS settings
- Test with different browsers

### Debug Commands

```bash
# Check application logs
python app.py

# Check environment variables
env | grep -E "(UNLEASH|GEMINI|SECRET)"

# Test health endpoint
curl -f http://localhost:5000/api/health

# Check Python version
python --version
```

## 🔒 Security

### Best Practices
- ✅ Use environment variables for API keys
- ✅ Implement proper CORS settings
- ✅ Add security headers
- ✅ Regular dependency updates
- ✅ Input validation and sanitization
- ✅ Rate limiting for API endpoints

### Security Headers
```python
SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
}
```

## 📈 Performance

### Optimization Tips
1. **Caching**: Implement Redis for API responses
2. **Rate Limiting**: Add rate limiting for API endpoints
3. **Compression**: Enable gzip compression
4. **Monitoring**: Set up performance monitoring
5. **Resource Limits**: Configure proper resource limits

### Resource Requirements
- **Memory**: 512M (recommended)
- **CPU**: 0.5 cores (recommended)
- **Storage**: Minimal (stateless application)

## 🔄 Updates & Maintenance

### Deployment Updates
1. Push changes to repository
2. Coolify auto-detects changes
3. Monitor deployment logs
4. Verify health check

### Backup Strategy
- Backup environment variables
- Backup application configuration
- Document deployment changes

### Rollback Plan
1. Use Coolify rollback feature
2. Keep previous working version
3. Test rollback procedure

## 📞 Support

### Documentation
- [Coolify Documentation](https://coolify.io/docs)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Python Documentation](https://docs.python.org/)
- [UnleashNFTs API](https://docs.unleashnfts.com/)
- [Gemini AI API](https://ai.google.dev/docs)

### Community
- Coolify Discord/Slack
- Flask Community
- Python Community

### Emergency Contacts
- Coolify Support
- API Provider Support (UnleashNFTs, Gemini)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 Changelog

### v1.0.0
- Initial release
- Flask backend with NFT analysis
- AI integration with Gemini
- Simple deployment without Docker
- Coolify source deployment configuration 