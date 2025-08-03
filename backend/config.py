# Configuration file for AI NFT Analyzer Backend

import os

class Config:
    # Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    # API Keys
    UNLEASH_NFT_API_KEY = os.environ.get('UNLEASH_NFT_API_KEY')
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
    
    # CORS settings
    CORS_ORIGINS = ['chrome-extension://*', 'moz-extension://*']
    
    # Backend settings
    HOST = '0.0.0.0'
    PORT = 5000
    
    # Supported blockchains
    SUPPORTED_BLOCKCHAINS = ['ethereum', 'polygon', 'bsc']
    
    # Supported marketplaces
    SUPPORTED_MARKETPLACES = ['opensea', 'rarible']
    
    # Time ranges for analysis
    TIME_RANGES = ['7d', '30d', '90d', '1y']
    
    # Default analysis settings
    DEFAULT_TIME_RANGE = '30d'
    DEFAULT_BLOCKCHAIN = 'ethereum'

