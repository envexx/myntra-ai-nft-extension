from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import requests

# Import SDKs UnleashNFTs
from bitscrunch_unleashnftV2_sdk import NFT_Market_Insights, NFT_Price_Estimate, NFT_Transactions, NFTAPI

app = Flask(__name__)
CORS(app) # Mengaktifkan CORS untuk komunikasi dengan ekstensi browser

# Muat kunci API dari variabel lingkungan atau konfigurasi
UNLEASH_NFT_API_KEY = os.getenv("UNLEASH_NFT_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Jika tidak ada di environment, coba muat dari api_config.py
if not UNLEASH_NFT_API_KEY or not GEMINI_API_KEY:
    try:
        from api_config import UNLEASH_NFT_API_KEY as config_unleash, GEMINI_API_KEY as config_gemini
        if not UNLEASH_NFT_API_KEY:
            UNLEASH_NFT_API_KEY = config_unleash
        if not GEMINI_API_KEY:
            GEMINI_API_KEY = config_gemini
    except ImportError:
        pass

# Inisialisasi SDK UnleashNFTs
market_insights_sdk = None
price_estimate_sdk = None
nft_transactions_sdk = None
nft_sdk = None

# Inisialisasi Gemini API key (akan diatur oleh initialize_sdks)

def initialize_sdks(unleash_key, gemini_key):
    global market_insights_sdk, price_estimate_sdk, nft_transactions_sdk, nft_sdk, GEMINI_API_KEY
    
    if unleash_key:
        market_insights_sdk = NFT_Market_Insights(unleash_key)
        price_estimate_sdk = NFT_Price_Estimate(unleash_key)
        nft_transactions_sdk = NFT_Transactions(unleash_key)
        nft_sdk = NFTAPI(unleash_key)
    
    if gemini_key:
        GEMINI_API_KEY = gemini_key

# Inisialisasi SDK saat startup jika kunci API sudah ada di lingkungan
initialize_sdks(UNLEASH_NFT_API_KEY, GEMINI_API_KEY)

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "message": "Backend is running"}), 200

@app.route("/api/set_api_keys", methods=["POST"])
def set_api_keys():
    data = request.get_json()
    unleash_key = data.get("unleash_nft_api_key")
    gemini_key = data.get("gemini_api_key")

    if not unleash_key or not gemini_key:
        return jsonify({"error": "Both UnleashNFTs and Gemini API keys are required"}), 400

    # Simpan kunci API ke variabel lingkungan untuk sesi ini
    os.environ["UNLEASH_NFT_API_KEY"] = unleash_key
    os.environ["GEMINI_API_KEY"] = gemini_key
    
    initialize_sdks(unleash_key, gemini_key)

    return jsonify({"status": "success", "message": "API keys updated and SDKs initialized"}), 200

@app.route("/api/analyze_nft", methods=["POST"])
def analyze_nft():
    if not market_insights_sdk:
        return jsonify({"error": "API keys not set. Please configure them in the extension options."}), 400

    data = request.get_json()
    blockchain = data.get("blockchain")
    contract_address = data.get("contract_address")
    token_id = data.get("token_id")

    if not all([blockchain, contract_address, token_id]):
        return jsonify({"error": "Missing NFT information (blockchain, contract_address, token_id)"}), 400

    # Mapping blockchain untuk kompatibilitas dengan API (menggunakan integer)
    blockchain_mapping = {
        "base": 1,  # Ethereum
        "ethereum": 1,
        "polygon": 137,
        "bsc": 56
    }
    
    api_blockchain = blockchain_mapping.get(blockchain.lower(), 1)  # Default ke Ethereum

    try:
        # 1. Dapatkan NFT metadata menggunakan REST API langsung
        try:
            import requests
            
            # Endpoint NFT metadata
            url = f"https://api.unleashnfts.com/api/v1/nft/{api_blockchain}/{contract_address}/{token_id}"
            params = {
                "currency": "usd",
                "include_washtrade": "true"
            }
            headers = {
                "accept": "application/json",
                "X-API-KEY": UNLEASH_NFT_API_KEY
            }
            
            response = requests.get(url, headers=headers, params=params)
            
            if response.status_code == 200:
                nft_metadata_data = response.json()
            else:
                nft_metadata_data = {
                    "error": f"API Error: {response.status_code} - {response.text}",
                    "data": None
                }
                
        except Exception as metadata_error:
            nft_metadata_data = {
                "error": str(metadata_error),
                "data": None
            }

        # 2. Dapatkan NFT metrics (volume, sales, dll)
        try:
            metrics_url = f"https://api.unleashnfts.com/api/v1/nft/{api_blockchain}/{contract_address}/{token_id}/metrics"
            metrics_params = {
                "currency": "usd",
                "metrics": ["volume", "sales"],
                "time_range": "30d",
                "include_washtrade": "true"
            }
            
            metrics_response = requests.get(metrics_url, headers=headers, params=metrics_params)
            
            if metrics_response.status_code == 200:
                nft_metrics_data = metrics_response.json()
            else:
                nft_metrics_data = {
                    "error": f"API Error: {metrics_response.status_code} - {metrics_response.text}",
                    "data": None
                }
                
        except Exception as metrics_error:
            nft_metrics_data = {
                "error": str(metrics_error),
                "data": None
            }

        # 3. Dapatkan NFT valuation (price estimate)
        try:
            valuation_url = f"https://api.unleashnfts.com/api/v1/nft/{api_blockchain}/{contract_address}/{token_id}/price-estimate"
            valuation_params = {}  # Tidak ada query parameters untuk endpoint ini
            
            valuation_response = requests.get(valuation_url, headers=headers, params=valuation_params)
            
            if valuation_response.status_code == 200:
                nft_valuation_data = valuation_response.json()
            else:
                nft_valuation_data = {
                    "error": f"API Error: {valuation_response.status_code} - {valuation_response.text}",
                    "data": None
                }
                
        except Exception as valuation_error:
            nft_valuation_data = {
                "error": str(valuation_error),
                "data": None
            }

        # 4. Dapatkan NFT price history
        try:
            price_history_url = f"https://api.unleashnfts.com/api/v1/nft/{api_blockchain}/{contract_address}/{token_id}/price-history"
            price_history_params = {
                "currency": "usd",
                "include_washtrade": "true"
            }
            
            price_history_response = requests.get(price_history_url, headers=headers, params=price_history_params)
            
            if price_history_response.status_code == 200:
                nft_price_history_data = price_history_response.json()
            else:
                nft_price_history_data = {
                    "error": f"API Error: {price_history_response.status_code} - {price_history_response.text}",
                    "data": None
                }
                app.logger.error(f"NFT price history API failed: {price_history_response.status_code} - {price_history_response.text}")
                
        except Exception as price_history_error:
            app.logger.error(f"NFT price history failed: {price_history_error}")
            nft_price_history_data = {
                "error": str(price_history_error),
                "data": None
            }

        # 5. Dapatkan NFT traits
        try:
            traits_url = f"https://api.unleashnfts.com/api/v1/nft/{api_blockchain}/{contract_address}/{token_id}/traits"
            traits_params = {
                "currency": "usd"
            }
            
            traits_response = requests.get(traits_url, headers=headers, params=traits_params)
            
            if traits_response.status_code == 200:
                nft_traits_data = traits_response.json()
            else:
                nft_traits_data = {
                    "error": f"API Error: {traits_response.status_code} - {traits_response.text}",
                    "data": None
                }
                app.logger.error(f"NFT traits API failed: {traits_response.status_code} - {traits_response.text}")
                
        except Exception as traits_error:
            app.logger.error(f"NFT traits failed: {traits_error}")
            nft_traits_data = {
                "error": str(traits_error),
                "data": None
            }

        # 6. Dapatkan NFT transactions
        try:
            transactions_url = f"https://api.unleashnfts.com/api/v1/nft/{api_blockchain}/{contract_address}/{token_id}/transactions"
            transactions_params = {
                "sort_by": "transaction_date",
                "sort_order": "desc",
                "limit": 10,
                "time_range": "30d"
            }
            
            transactions_response = requests.get(transactions_url, headers=headers, params=transactions_params)
            
            if transactions_response.status_code == 200:
                nft_transactions_data = transactions_response.json()
            else:
                nft_transactions_data = {
                    "error": f"API Error: {transactions_response.status_code} - {transactions_response.text}",
                    "data": None
                }
                app.logger.error(f"NFT transactions API failed: {transactions_response.status_code} - {transactions_response.text}")
                
        except Exception as transactions_error:
            app.logger.error(f"NFT transactions failed: {transactions_error}")
            nft_transactions_data = {
                "error": str(transactions_error),
                "data": None
            }



        # Data dari BitsCrunch API siap untuk analisis

        # 7. Analisis AI menggunakan Gemini REST API
        try:
            if GEMINI_API_KEY:
                # Siapkan data untuk analisis AI
                analysis_data = {
                    "nft_info": {
                        "contract_address": contract_address,
                        "token_id": token_id,
                        "blockchain": blockchain,
                        "collection": nft_metadata_data.get("collection_name", "Unknown") if not nft_metadata_data.get("error") else "Unknown",
                        "name": nft_metadata_data.get("name", "Unknown") if not nft_metadata_data.get("error") else "Unknown",
                        "current_owner": nft_metadata_data.get("owned_by", "Unknown") if not nft_metadata_data.get("error") else "Unknown",
                        "past_owners": nft_metadata_data.get("past_owner_count", 0) if not nft_metadata_data.get("error") else 0,
                        "hold_time": nft_metadata_data.get("hold_time_current", 0) if not nft_metadata_data.get("error") else 0,
                        "mint_date": nft_metadata_data.get("minted_date", "Unknown") if not nft_metadata_data.get("error") else "Unknown"
                    },
                    "pricing": {
                        "latest_price": nft_metadata_data.get("price_latest", {}).get("value", "N/A") if not nft_metadata_data.get("error") else "N/A",
                        "fair_price": nft_metadata_data.get("price_fair_estimate", {}).get("value", "N/A") if not nft_metadata_data.get("error") else "N/A",
                        "ai_estimate": nft_valuation_data.get("metric_values", {}).get("price_estimate", {}).get("value", "N/A") if not nft_valuation_data.get("error") else "N/A",
                        "price_range": {
                            "min": nft_price_history_data.get("price_min", {}).get("value", "N/A") if not nft_price_history_data.get("error") else "N/A",
                            "max": nft_price_history_data.get("price_max", {}).get("value", "N/A") if not nft_price_history_data.get("error") else "N/A"
                        }
                    },
                    "market_metrics": {
                        "volume": nft_metrics_data.get("metric_values", {}).get("volume", {}).get("value", "0") if not nft_metrics_data.get("error") else "0",
                        "sales": nft_metrics_data.get("metric_values", {}).get("sales", {}).get("value", 0) if not nft_metrics_data.get("error") else 0,
                        "percentile": nft_valuation_data.get("metric_values", {}).get("prediction_percentile", {}).get("value", "N/A") if not nft_valuation_data.get("error") else "N/A"
                    },
                    "traits": nft_traits_data.get("traits", []) if not nft_traits_data.get("error") else [],
                    "transactions": nft_transactions_data.get("transactions", []) if not nft_transactions_data.get("error") else [],
                    "ai_valuation": nft_valuation_data.get("metric_values", {}) if not nft_valuation_data.get("error") else {}
                }

                # Prompt untuk Gemini AI
                prompt = f"""
You are an expert NFT analyst with 10+ years of experience in blockchain, DeFi, and digital asset markets. You specialize in NFT valuation, market analysis, and investment strategies. Your insights are highly sought after by institutional investors and top-tier NFT traders.

Analyze the following NFT data and provide a comprehensive, professional analysis with definitive conclusions and actionable insights:

NFT DATA:
{json.dumps(analysis_data, indent=2)}

Provide a structured analysis in the following format:

1. EXECUTIVE SUMMARY DASHBOARD
- DEFINE the current valuation status (OVERVALUED/UNDERVALUED/FAIR VALUE) with confidence level
- ASSESS Risk Level (LOW/MEDIUM/HIGH) with specific reasoning
- EVALUATE liquidity with concrete metrics
- PROVIDE a clear, actionable recommendation

2. PRICE ANALYSIS SECTION
- ANALYZE current valuation with market context
- IDENTIFY price trends and patterns
- DETERMINE market position relative to collection

3. RISK ASSESSMENT MATRIX
- IDENTIFY specific high-risk indicators
- QUANTIFY medium-risk factors
- HIGHLIGHT positive factors and opportunities

4. TRADING INTELLIGENCE
- ANALYZE market behavior patterns
- PREDICT price movements with confidence levels
- PROVIDE entry/exit strategies

5. ACTIONABLE RECOMMENDATIONS
- SPECIFIC actions for current holders
- CLEAR guidance for potential buyers
- DEFINITIVE strategies for traders

6. MONITORING ALERTS
- CRITICAL watchpoints with specific thresholds
- TECHNICAL indicators to monitor

7. COMPARATIVE ANALYSIS
- COMPARE with similar NFTs
- BENCHMARK against collection standards

8. TRANSPARENCY METRICS
- ASSESS data reliability with specific scores

Use professional language, definitive statements, and concrete recommendations. Avoid vague language - be specific and actionable. Use emojis strategically to enhance readability. Respond in English with confidence and authority.
"""

                # Analisis menggunakan Gemini REST API
                url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
                headers = {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': GEMINI_API_KEY
                }
                data = {
                    "contents": [
                        {
                            "parts": [
                                {
                                    "text": prompt
                                }
                            ]
                        }
                    ]
                }
                
                response = requests.post(url, headers=headers, json=data)
                
                if response.status_code == 200:
                    result = response.json()
                    ai_analysis = result['candidates'][0]['content']['parts'][0]['text']
                else:
                    ai_analysis = "AI analysis temporarily unavailable. Please check the raw data below."
            else:
                ai_analysis = "AI analysis temporarily unavailable. Please check the raw data below."
            
        except Exception as ai_error:
            ai_analysis = "AI analysis temporarily unavailable. Please check the raw data below."

        # Return data komprehensif dari semua endpoint BitsCrunch API + AI analysis
        return jsonify({
            "success": True,
            "data": {
                "blockchain": blockchain,
                "contract_address": contract_address,
                "token_id": token_id,
                "nft_metadata": nft_metadata_data,
                "nft_metrics": nft_metrics_data,
                "nft_valuation": nft_valuation_data,
                "nft_price_history": nft_price_history_data,
                "nft_traits": nft_traits_data,
                "nft_transactions": nft_transactions_data,
                "ai_analysis": ai_analysis,
                "api_status": "Comprehensive BitsCrunch API data + AI analysis retrieved successfully"
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


