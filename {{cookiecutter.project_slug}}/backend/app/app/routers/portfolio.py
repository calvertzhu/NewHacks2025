"""
Portfolio management API endpoints.
"""
from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime

from models import StockCreate, StockResponse
from database import get_collection, get_database
from services import validate_ticker_with_polygon, search_stocks, get_ticker_details, get_current_quote

router = APIRouter(prefix="/api/v1/stocks", tags=["portfolio"])


@router.post("/", response_model=StockResponse)
async def add_stock(stock_data: StockCreate):
    """Add a new stock to portfolio."""
    ticker = stock_data.ticker.upper()
    collection = await get_collection()
    
    # Check portfolio limit (max 10 stocks)
    portfolio_count = await collection.count_documents({})
    if portfolio_count >= 10:
        raise HTTPException(
            status_code=400,
            detail="Portfolio limit reached. Maximum 10 stocks allowed. Remove a stock before adding a new one."
        )
    
    # Check if stock already exists in our database
    existing_stock = await collection.find_one({"ticker": ticker})
    if existing_stock:
        raise HTTPException(
            status_code=400,
            detail=f"Stock with ticker {ticker} already exists in your portfolio"
        )
    
    # Validate ticker with Polygon.io API
    validation_result = await validate_ticker_with_polygon(ticker)
    
    if not validation_result["valid"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid ticker '{ticker}': {validation_result['error']}. Please check the ticker symbol and try again."
        )
    
    # Create new stock with validated data from FMP API
    stock_doc = {
        "ticker": ticker,
        "symbol": validation_result["symbol"],
        "name": validation_result["name"] or stock_data.name,
        "exchange": validation_result["exchange"],
        "sector": stock_data.sector,  # FMP doesn't provide sector in search-symbol
        "added_at": datetime.utcnow(),
        "is_active": True
    }
    
    # Save to MongoDB
    result = await collection.insert_one(stock_doc)
    
    # Fetch the inserted document with the _id
    inserted_stock = await collection.find_one({"_id": result.inserted_id})
    inserted_stock["id"] = str(inserted_stock["_id"])
    
    return StockResponse(**inserted_stock)


@router.get("/", response_model=List[StockResponse])
async def get_stocks(active_only: bool = True):
    """Get all stocks, optionally filter by active status."""
    collection = await get_collection()
    
    if active_only:
        cursor = collection.find({"is_active": True})
    else:
        cursor = collection.find({})
    
    stocks = []
    async for stock in cursor:
        stock["id"] = str(stock["_id"])
        stocks.append(StockResponse(**stock))
    
    return stocks


@router.get("/{ticker}", response_model=StockResponse)
async def get_stock(ticker: str):
    """Get a specific stock by ticker."""
    collection = await get_collection()
    stock = await collection.find_one({"ticker": ticker.upper()})
    
    if not stock:
        raise HTTPException(
            status_code=404,
            detail=f"Stock with ticker {ticker.upper()} not found"
        )
    
    stock["id"] = str(stock["_id"])
    return StockResponse(**stock)


@router.delete("/{ticker}")
async def remove_stock(ticker: str):
    """Remove a stock from tracking (soft delete)."""
    collection = await get_collection()
    stock = await collection.find_one({"ticker": ticker.upper()})
    
    if not stock:
        raise HTTPException(
            status_code=404,
            detail=f"Stock with ticker {ticker.upper()} not found"
        )
    
    # Soft delete by setting is_active to False
    await collection.update_one(
        {"ticker": ticker.upper()},
        {"$set": {"is_active": False}}
    )
    
    return {"message": f"Stock {ticker.upper()} has been removed from tracking"}


@router.patch("/{ticker}/activate")
async def activate_stock(ticker: str):
    """Reactivate a stock for tracking."""
    collection = await get_collection()
    stock = await collection.find_one({"ticker": ticker.upper()})
    
    if not stock:
        raise HTTPException(
            status_code=404,
            detail=f"Stock with ticker {ticker.upper()} not found"
        )
    
    # Reactivate by setting is_active to True
    await collection.update_one(
        {"ticker": ticker.upper()},
        {"$set": {"is_active": True}}
    )
    
    return {"message": f"Stock {ticker.upper()} has been reactivated for tracking"}


@router.get("/validate/{ticker}")
async def validate_ticker(ticker: str):
    """Validate a ticker symbol without adding it to the portfolio."""
    validation_result = await validate_ticker_with_polygon(ticker.upper())
    
    if validation_result["valid"]:
        return {
            "ticker": ticker.upper(),
            "valid": True,
            "symbol": validation_result["symbol"],
            "company_name": validation_result["name"],
            "exchange": validation_result["exchange"],
            "type": validation_result.get("type"),
            "market": validation_result.get("market")
        }
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid ticker '{ticker.upper()}': {validation_result['error']}"
        )


@router.get("/search/{query}")
async def search_stocks_endpoint(query: str):
    """Search for stocks by name or symbol (autocomplete)."""
    result = await search_stocks(query, limit=10)
    
    if "error" in result:
        raise HTTPException(
            status_code=400,
            detail=result["error"]
        )
    
    return result


@router.get("/details/{ticker}")
async def get_ticker_details_endpoint(ticker: str):
    """Get detailed information about a specific ticker."""
    result = await get_ticker_details(ticker.upper())
    
    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get("error", "Failed to get ticker details")
        )
    
    return result["details"]


@router.get("/quote/{ticker}")
async def get_quote_endpoint(ticker: str):
    """Get current quote data for a ticker (price, high, low, volume, etc)."""
    result = await get_current_quote(ticker.upper())
    
    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get("error", "Failed to get quote")
        )
    
    return result["quote"]





