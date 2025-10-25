from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import httpx
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Pydantic models
class StockCreate(BaseModel):
    ticker: str
    name: Optional[str] = None
    sector: Optional[str] = None

class StockResponse(BaseModel):
    id: str
    ticker: str
    symbol: str
    name: Optional[str]
    exchange: Optional[str]
    sector: Optional[str]
    added_at: datetime
    is_active: bool

# In-memory storage
stocks_db = []

# Financial Modeling Prep API configuration
FMP_API_KEY = os.getenv("FMP_API_KEY", "5XksjHauuOMm49xi64b5Aewa8P7mBTRR")  # Get from environment or use provided key
FMP_BASE_URL = "https://site.financialmodelingprep.com/api"

async def validate_ticker_with_fmp(ticker: str) -> dict:
    """Validate ticker against Financial Modeling Prep API"""
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            # Use the working endpoint from your Postman test
            response = await client.get(
                "https://financialmodelingprep.com/stable/search-symbol",
                params={"query": ticker.upper(), "apikey": FMP_API_KEY},
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    # Find exact ticker match
                    for stock in data:
                        if stock.get("symbol", "").upper() == ticker.upper():
                            return {
                                "valid": True,
                                "name": stock.get("name", ""),
                                "symbol": stock.get("symbol", ""),
                                "exchange": stock.get("exchange", ""),
                                "currency": stock.get("currency", ""),
                                "exchangeFullName": stock.get("exchangeFullName", "")
                            }
                    return {"valid": False, "error": f"Ticker {ticker.upper()} not found in search results"}
                else:
                    return {"valid": False, "error": "No search results found"}
            else:
                return {"valid": False, "error": f"API returned status {response.status_code}"}
                
    except httpx.TimeoutException:
        return {"valid": False, "error": "Request timeout - please try again"}
    except httpx.RequestError as e:
        return {"valid": False, "error": f"Request failed: {str(e)}"}
    except Exception as e:
        return {"valid": False, "error": f"Validation error: {str(e)}"}

# Create router
router = APIRouter(prefix="/api/v1/stocks", tags=["stocks"])

@router.post("/", response_model=StockResponse)
async def add_stock(stock_data: StockCreate):
    """Add a new stock to track"""
    ticker = stock_data.ticker.upper()
    
    # Check portfolio limit (max 10 stocks)
    if len(stocks_db) >= 10:
        raise HTTPException(
            status_code=400,
            detail="Portfolio limit reached. Maximum 10 stocks allowed. Remove a stock before adding a new one."
        )
    
    # Check if stock already exists in our database
    existing_stock = next((s for s in stocks_db if s["ticker"] == ticker), None)
    if existing_stock:
        raise HTTPException(
            status_code=400,
            detail=f"Stock with ticker {ticker} already exists in your portfolio"
        )
    
    # Validate ticker with Financial Modeling Prep API
    validation_result = await validate_ticker_with_fmp(ticker)
    
    if not validation_result["valid"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid ticker '{ticker}': {validation_result['error']}. Please check the ticker symbol and try again."
        )
    
    # Create new stock with validated data from FMP API
    stock = {
        "id": f"stock_{len(stocks_db) + 1}",
        "ticker": ticker,
        "symbol": validation_result["symbol"],
        "name": validation_result["name"] or stock_data.name,
        "exchange": validation_result["exchange"],
        "sector": stock_data.sector,  # FMP doesn't provide sector in search-symbol
        "added_at": datetime.utcnow(),
        "is_active": True
    }
    
    # Save to in-memory storage
    stocks_db.append(stock)
    
    return StockResponse(**stock)

@router.get("/", response_model=List[StockResponse])
async def get_stocks(active_only: bool = True):
    """Get all stocks, optionally filter by active status"""
    if active_only:
        filtered_stocks = [s for s in stocks_db if s["is_active"]]
    else:
        filtered_stocks = stocks_db
    
    return [StockResponse(**stock) for stock in filtered_stocks]

@router.get("/{ticker}", response_model=StockResponse)
async def get_stock(ticker: str):
    """Get a specific stock by ticker"""
    stock = next((s for s in stocks_db if s["ticker"] == ticker.upper()), None)
    if not stock:
        raise HTTPException(
            status_code=404,
            detail=f"Stock with ticker {ticker.upper()} not found"
        )
    
    return StockResponse(**stock)

@router.delete("/{ticker}")
async def remove_stock(ticker: str):
    """Remove a stock from tracking (soft delete)"""
    stock = next((s for s in stocks_db if s["ticker"] == ticker.upper()), None)
    if not stock:
        raise HTTPException(
            status_code=404,
            detail=f"Stock with ticker {ticker.upper()} not found"
        )
    
    # Soft delete by setting is_active to False
    stock["is_active"] = False
    
    return {"message": f"Stock {ticker.upper()} has been removed from tracking"}

@router.patch("/{ticker}/activate")
async def activate_stock(ticker: str):
    """Reactivate a stock for tracking"""
    stock = next((s for s in stocks_db if s["ticker"] == ticker.upper()), None)
    if not stock:
        raise HTTPException(
            status_code=404,
            detail=f"Stock with ticker {ticker.upper()} not found"
        )
    
    stock["is_active"] = True
    
    return {"message": f"Stock {ticker.upper()} has been reactivated for tracking"}

@router.get("/validate/{ticker}")
async def validate_ticker(ticker: str):
    """Validate a ticker symbol without adding it to the portfolio"""
    validation_result = await validate_ticker_with_fmp(ticker.upper())
    
    if validation_result["valid"]:
        return {
            "ticker": ticker.upper(),
            "valid": True,
            "symbol": validation_result["symbol"],
            "company_name": validation_result["name"],
            "exchange": validation_result["exchange"],
            "sector": validation_result["sector"],
            "industry": validation_result["industry"]
        }
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid ticker '{ticker.upper()}': {validation_result['error']}"
        )

@router.get("/search/{query}")
async def search_stocks(query: str):
    """Search for stocks by name or symbol (autocomplete)"""
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(
                f"{FMP_BASE_URL}/stable/search-symbol",
                params={"query": query, "apikey": FMP_API_KEY},
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "query": query,
                    "results": data[:10]  # Limit to 10 results for autocomplete
                }
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Search failed with status {response.status_code}"
                )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Search error: {str(e)}"
        )

@router.get("/symbols")
async def get_company_symbols():
    """Get company symbols list for offline search"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{FMP_BASE_URL}/stable/company-symbols-list",
                params={"apikey": FMP_API_KEY},
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "total_symbols": len(data),
                    "symbols": data[:100]  # Return first 100 for demo
                }
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to get symbols list with status {response.status_code}"
                )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Symbols list error: {str(e)}"
        )

# Create FastAPI app
app = FastAPI(
    title="Stock Tracker API",
    description="A stock tracking API for monitoring stock indicators and trading rules",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add routes
app.include_router(router)

@app.get("/")
async def root():
    return {"message": "Welcome to Stock Tracker API!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/v1/")
async def api_root():
    return {"message": "API is running", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)