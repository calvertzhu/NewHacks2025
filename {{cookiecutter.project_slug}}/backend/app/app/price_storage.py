"""
Price data storage service for MongoDB.
"""
import asyncio
import httpx
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any
from dotenv import load_dotenv
from database import get_collection

# Load environment variables
load_dotenv()

POLYGON_API_KEY = os.getenv("POLYGON_API_KEY")
POLYGON_BASE_URL = "https://api.polygon.io"


async def fetch_stock_prices_from_polygon(ticker: str, months: int = 12) -> Dict[str, Any]:
    """Fetch stock prices from Polygon.io API."""
    try:
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months * 30)  # Approximate months
        
        start_str = start_date.strftime("%Y-%m-%d")
        end_str = end_date.strftime("%Y-%m-%d")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{POLYGON_BASE_URL}/v2/aggs/ticker/{ticker.upper()}/range/1/day/{start_str}/{end_str}",
                params={
                    "adjusted": "true",
                    "sort": "asc",
                    "limit": 500,
                    "apiKey": POLYGON_API_KEY
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("results"):
                    return {
                        "success": True,
                        "ticker": ticker.upper(),
                        "time_range": f"{start_str} to {end_str}",
                        "results": data["results"],
                        "total_results": len(data["results"])
                    }
                else:
                    return {
                        "success": False,
                        "error": f"No price data found for {ticker.upper()}. Status: {data.get('status', 'unknown')}"
                    }
            else:
                return {
                    "success": False,
                    "error": f"API returned status {response.status_code}"
                }
                
    except Exception as e:
        return {"success": False, "error": f"Price fetch error: {str(e)}"}


async def store_stock_prices_in_mongodb(ticker: str, months: int = 12) -> Dict[str, Any]:
    """Fetch and store stock prices in MongoDB."""
    try:
        # Fetch prices from Polygon.io
        price_data = await fetch_stock_prices_from_polygon(ticker, months)
        
        if not price_data["success"]:
            return price_data
        
        # Get MongoDB collection
        collection = await get_collection("StockPrices")
        
        # Prepare price documents for MongoDB
        price_documents = []
        for price_point in price_data["results"]:
            price_doc = {
                "ticker": ticker.upper(),
                "date": datetime.fromtimestamp(price_point["t"] / 1000),
                "open": price_point["o"],
                "high": price_point["h"],
                "low": price_point["l"],
                "close": price_point["c"],
                "volume": price_point["v"],
                "adjusted_close": price_point.get("vw"),  # Volume weighted average
                "timestamp": price_point["t"],
                "created_at": datetime.utcnow()
            }
            price_documents.append(price_doc)
        
        # Store in MongoDB
        if price_documents:
            # Delete existing prices for this ticker and time range
            await collection.delete_many({
                "ticker": ticker.upper(),
                "date": {
                    "$gte": datetime.fromtimestamp(price_data["results"][0]["t"] / 1000),
                    "$lte": datetime.fromtimestamp(price_data["results"][-1]["t"] / 1000)
                }
            })
            
            # Insert new prices
            result = await collection.insert_many(price_documents)
            
            return {
                "success": True,
                "ticker": ticker.upper(),
                "time_range": price_data["time_range"],
                "stored_count": len(result.inserted_ids),
                "message": f"Successfully stored {len(result.inserted_ids)} price records for {ticker.upper()}"
            }
        else:
            return {
                "success": False,
                "error": "No price data to store"
            }
            
    except Exception as e:
        return {"success": False, "error": f"Storage error: {str(e)}"}


async def store_portfolio_prices_in_mongodb(months: int = 12) -> Dict[str, Any]:
    """Fetch and store prices for all stocks in portfolio."""
    try:
        # Get portfolio stocks
        portfolio_collection = await get_collection("Portfolio")
        cursor = portfolio_collection.find({"is_active": True})
        portfolio_stocks = []
        async for stock in cursor:
            portfolio_stocks.append(stock)
        
        if not portfolio_stocks:
            return {
                "success": False,
                "error": "No active stocks in portfolio"
            }
        
        # Store prices for each stock
        results = {}
        errors = []
        
        for stock in portfolio_stocks:
            ticker = stock.get("ticker", stock.get("symbol", ""))
            if ticker:
                result = await store_stock_prices_in_mongodb(ticker, months)
                if result["success"]:
                    results[ticker] = result
                else:
                    errors.append(f"{ticker}: {result['error']}")
        
        return {
            "success": True,
            "portfolio_prices": results,
            "errors": errors,
            "total_stocks": len(portfolio_stocks),
            "successful_stores": len(results)
        }
        
    except Exception as e:
        return {"success": False, "error": f"Portfolio storage error: {str(e)}"}


async def get_stored_prices_from_mongodb(ticker: str, months: int = 12) -> Dict[str, Any]:
    """Get stored prices from MongoDB."""
    try:
        collection = await get_collection("StockPrices")
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months * 30)
        
        # Query MongoDB for stored prices
        cursor = collection.find({
            "ticker": ticker.upper(),
            "date": {
                "$gte": start_date,
                "$lte": end_date
            }
        }).sort("date", 1)
        
        prices = []
        async for price in cursor:
            prices.append({
                "date": price["date"],
                "open": price["open"],
                "high": price["high"],
                "low": price["low"],
                "close": price["close"],
                "volume": price["volume"],
                "adjusted_close": price.get("adjusted_close")
            })
        
        return {
            "success": True,
            "ticker": ticker.upper(),
            "time_range": f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
            "prices": prices,
            "total_results": len(prices),
            "source": "mongodb"
        }
        
    except Exception as e:
        return {"success": False, "error": f"Retrieval error: {str(e)}"}


async def get_portfolio_stored_prices_from_mongodb(months: int = 12) -> Dict[str, Any]:
    """Get stored prices for all portfolio stocks from MongoDB."""
    try:
        # Get portfolio stocks
        portfolio_collection = await get_collection("Portfolio")
        cursor = portfolio_collection.find({"is_active": True})
        portfolio_stocks = []
        async for stock in cursor:
            portfolio_stocks.append(stock)
        
        if not portfolio_stocks:
            return {
                "success": False,
                "error": "No active stocks in portfolio"
            }
        
        # Get stored prices for each stock
        results = {}
        errors = []
        
        for stock in portfolio_stocks:
            ticker = stock.get("ticker", stock.get("symbol", ""))
            if ticker:
                result = await get_stored_prices_from_mongodb(ticker, months)
                if result["success"]:
                    results[ticker] = result
                else:
                    errors.append(f"{ticker}: {result['error']}")
        
        return {
            "success": True,
            "portfolio_prices": results,
            "errors": errors,
            "total_stocks": len(portfolio_stocks),
            "successful_retrievals": len(results),
            "source": "mongodb"
        }
        
    except Exception as e:
        return {"success": False, "error": f"Portfolio retrieval error: {str(e)}"}


# Test function
async def test_price_storage():
    """Test the price storage functionality."""
    print("🧪 Testing Price Storage System")
    print("=" * 50)
    
    # Initialize database connection
    from database import connect_to_mongo
    await connect_to_mongo()
    print("✅ Database connected")
    
    # Test storing TSLA prices
    print("\n1. 📈 Storing TSLA prices...")
    result = await store_stock_prices_in_mongodb("TSLA", 12)
    if result["success"]:
        print(f"✅ TSLA: {result['message']}")
        print(f"   Time range: {result['time_range']}")
        print(f"   Stored count: {result['stored_count']}")
    else:
        print(f"❌ TSLA: {result['error']}")
    
    # Test storing AAPL prices (with delay to avoid rate limiting)
    print("\n2. 🍎 Storing AAPL prices...")
    print("   Waiting 2 seconds to avoid rate limiting...")
    await asyncio.sleep(2)
    result = await store_stock_prices_in_mongodb("AAPL", 12)
    if result["success"]:
        print(f"✅ AAPL: {result['message']}")
        print(f"   Time range: {result['time_range']}")
        print(f"   Stored count: {result['stored_count']}")
    else:
        print(f"❌ AAPL: {result['error']}")
    
    # Test retrieving stored prices
    print("\n3. 📊 Retrieving stored TSLA prices...")
    result = await get_stored_prices_from_mongodb("TSLA", 12)
    if result["success"]:
        print(f"✅ Retrieved {result['total_results']} TSLA prices from MongoDB")
        if result["prices"]:
            latest = result["prices"][-1]
            print(f"   Latest: ${latest['close']} on {latest['date'].strftime('%Y-%m-%d')}")
    else:
        print(f"❌ TSLA retrieval: {result['error']}")
    
    print("\n" + "=" * 50)
    print("🎉 Price storage testing complete!")


if __name__ == "__main__":
    print("Testing price storage system...")
    print()
    
    try:
        asyncio.run(test_price_storage())
    except KeyboardInterrupt:
        print("\n⏹️  Testing interrupted by user")
    except Exception as e:
        print(f"\n❌ Testing failed: {str(e)}")
