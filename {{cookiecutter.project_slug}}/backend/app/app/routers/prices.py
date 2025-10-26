"""
Stock price data API endpoints.
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime

from models import StockPrices, PriceData
from database import get_collection
from price_service import get_stock_prices
from indicators import (
    get_sma,
    get_rsi,
    get_technical_indicators,
    detect_crossovers_from_sma,
    check_rsi_conditions_from_data
)

router = APIRouter(prefix="/api/v1/prices", tags=["prices"])


@router.get("/{ticker}")
async def get_stock_prices_endpoint(ticker: str, months: int = 12):
    """Get historical price data for a specific stock."""
    # Check if stock exists in portfolio
    collection = await get_collection()
    stock = await collection.find_one({"ticker": ticker.upper()})
    
    if not stock:
        raise HTTPException(
            status_code=404,
            detail=f"Stock with ticker {ticker.upper()} not found in portfolio"
        )
    
    # Get price data
    result = await get_stock_prices(ticker.upper(), months)
    
    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=result["error"]
        )
    
    # Convert raw price data to PriceData models
    price_data = []
    for price_point in result["results"]:
        price_data.append(PriceData(
            timestamp=datetime.fromtimestamp(price_point["t"] / 1000),  # Convert ms to seconds
            open=price_point["o"],
            high=price_point["h"],
            low=price_point["l"],
            close=price_point["c"],
            volume=price_point["v"],
            adjusted_close=price_point.get("vw")  # Volume weighted average price
        ))
    
    return StockPrices(
        ticker=ticker.upper(),
        symbol=stock.get("symbol", ticker.upper()),
        name=stock.get("name"),
        exchange=stock.get("exchange"),
        time_range=result["time_range"],
        prices=price_data,
        total_results=result["total_results"],
        success=True
    )


# ==========================================
# TECHNICAL INDICATORS ENDPOINTS
# ==========================================

@router.get("/{ticker}/indicators/sma")
async def get_sma_endpoint(ticker: str, window: int = 50, limit: int = 100):
    """
    Get Simple Moving Average (SMA) for a stock using Polygon.io API.
    
    Args:
        ticker: Stock ticker symbol
        window: The window size for SMA calculation (default: 50)
        limit: Number of results to return (default: 100)
    """
    # Check if stock exists in portfolio
    collection = await get_collection()
    stock = await collection.find_one({"ticker": ticker.upper()})
    
    if not stock:
        raise HTTPException(
            status_code=404,
            detail=f"Stock with ticker {ticker.upper()} not found in portfolio"
        )
    
    result = await get_sma(ticker.upper(), window=window, limit=limit)
    
    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=result["error"]
        )
    
    return result


@router.get("/{ticker}/indicators/ema")
async def get_ema_endpoint(ticker: str, window: int = 50, limit: int = 100):
    """
    Get EMA (Exponential Moving Average) data for a stock
    """
    try:
        from indicators.ema import get_ema
        
        result = await get_ema(ticker, window, limit)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch EMA data: {str(e)}")

@router.get("/{ticker}/indicators/rsi")
async def get_rsi_endpoint(ticker: str, window: int = 14, limit: int = 100):
    """
    Get Relative Strength Index (RSI) for a stock using Polygon.io API.
    
    Args:
        ticker: Stock ticker symbol
        window: The window size for RSI calculation (default: 14)
        limit: Number of results to return (default: 100)
    """
    # Check if stock exists in portfolio
    collection = await get_collection()
    stock = await collection.find_one({"ticker": ticker.upper()})
    
    if not stock:
        raise HTTPException(
            status_code=404,
            detail=f"Stock with ticker {ticker.upper()} not found in portfolio"
        )
    
    result = await get_rsi(ticker.upper(), window=window, limit=limit)
    
    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=result["error"]
        )
    
    return result


@router.get("/{ticker}/indicators/all")
async def get_all_indicators_endpoint(
    ticker: str,
    sma_short: int = 50,
    sma_long: int = 200,
    rsi: int = 14,
    limit: int = 100
):
    """
    Get all technical indicators (SMA 50/200, RSI) for a stock.
    Returns crossovers and RSI conditions.
    
    Args:
        ticker: Stock ticker symbol
        sma_short: Short SMA window (default: 50)
        sma_long: Long SMA window (default: 200)
        rsi: RSI window (default: 14)
        limit: Number of results to return (default: 100)
    """
    # Check if stock exists in portfolio
    collection = await get_collection()
    stock = await collection.find_one({"ticker": ticker.upper()})
    
    if not stock:
        raise HTTPException(
            status_code=404,
            detail=f"Stock with ticker {ticker.upper()} not found in portfolio"
        )
    
    # Get all indicators
    result = await get_technical_indicators(
        ticker.upper(),
        windows={"sma_short": sma_short, "sma_long": sma_long, "rsi": rsi},
        limit=limit
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=result["error"]
        )
    
    # Extract data for crossover detection
    indicators = result.get("indicators", {})
    sma_short_data = indicators.get("sma_short", {}).get("data", {}).get("results", {}).get("values", [])
    sma_long_data = indicators.get("sma_long", {}).get("data", {}).get("results", {}).get("values", [])
    rsi_data = indicators.get("rsi", {}).get("data", {}).get("results", {}).get("values", [])
    
    # Detect crossovers
    crossovers = await detect_crossovers_from_sma(sma_short_data, sma_long_data)
    
    # Check RSI conditions
    rsi_conditions = await check_rsi_conditions_from_data(rsi_data)
    
    return {
        "success": True,
        "ticker": ticker.upper(),
        "indicators": indicators,
        "crossovers": crossovers,
        "rsi_conditions": rsi_conditions
    }
