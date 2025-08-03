#!/bin/bash

# Setup script for Myntra AI Backend

echo "🔧 Setting up Myntra AI Backend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.11+ first."
    exit 1
fi

print_status "Python 3 is installed"

# Check Python version
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
print_info "Python version: $python_version"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    print_error "pip3 is not installed. Please install pip3 first."
    exit 1
fi

print_status "pip3 is installed"

# Create virtual environment
echo "📦 Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_status "Virtual environment created"
else
    print_warning "Virtual environment already exists"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate
print_status "Virtual environment activated"

# Install dependencies
echo "📥 Installing dependencies..."
if pip install -r requirements.txt; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    if [ -f env.example ]; then
        cp env.example .env
        print_status ".env file created from template"
        print_warning "Please update .env file with your actual API keys"
    else
        # Create basic .env file
        cat > .env << EOF
# Myntra AI Backend Environment Variables
UNLEASH_NFT_API_KEY=your_unleash_nft_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_secret_key_here
FLASK_ENV=development
FLASK_DEBUG=True
EOF
        print_status ".env file created"
        print_warning "Please update .env file with your actual API keys"
    fi
else
    print_warning ".env file already exists"
fi

# Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x start.sh healthcheck.sh test-deployment.sh deploy-to-coolify.sh 2>/dev/null
print_status "Scripts made executable"

# Check if Python is properly installed
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
print_info "Python version: $python_version"

# Test Python application
echo "🐍 Testing Python application..."
if python3 -c "import flask, requests" 2>/dev/null; then
    print_status "Python dependencies test successful"
else
    print_warning "Some Python dependencies may be missing"
fi

# Show next steps
echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. 🔑 Configure API Keys:"
echo "   - Edit .env file with your actual API keys"
echo "   - Get UnleashNFTs API key from: https://unleashnfts.com/"
echo "   - Get Gemini API key from: https://makersuite.google.com/app/apikey"
echo ""
echo "2. 🧪 Test Local Development:"
echo "   - Activate virtual environment: source venv/bin/activate"
echo "   - Run application: python app.py"
echo "   - Test health check: curl http://localhost:5000/api/health"
echo ""
echo "3. 🧪 Test Application:"
echo "   - Run: python app.py"
echo "   - Test: curl http://localhost:5000/api/health"
echo ""
echo "4. 🚀 Deploy to Coolify:"
echo "   - Push code to repository"
echo "   - Setup Source deployment in Coolify"
echo "   - Configure environment variables"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Complete documentation"
echo "   - deploy-guide.md - Detailed deployment guide"
echo "   - COOLIFY_DEPLOYMENT.md - Coolify specific guide"
echo ""

print_status "Setup completed! Happy coding! 🚀" 