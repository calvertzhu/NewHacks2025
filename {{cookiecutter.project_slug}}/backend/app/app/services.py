"""
External API services for stock data using Polygon.io.
"""
import os
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Polygon.io API configuration
POLYGON_API_KEY = os.getenv("POLYGON_API_KEY")
POLYGON_BASE_URL = "https://api.polygon.io"


async def validate_ticker_with_polygon(ticker: str) -> dict:
    """Validate ticker against Polygon.io API."""
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(
                f"{POLYGON_BASE_URL}/v3/reference/tickers",
                params={
                    "ticker": ticker.upper(),
                    "market": "stocks",
                    "active": "true",
                    "apiKey": POLYGON_API_KEY
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("results") and len(data["results"]) > 0:
                    # Find exact ticker match
                    for stock in data["results"]:
                        if stock.get("ticker", "").upper() == ticker.upper():
                            return {
                                "valid": True,
                                "name": stock.get("name", ""),
                                "symbol": stock.get("ticker", ""),
                                "exchange": stock.get("primary_exchange", ""),
                                "type": stock.get("type", ""),
                                "market": stock.get("market", ""),
                                "locale": stock.get("locale", "")
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


async def search_stocks(query: str, limit: int = 10) -> dict:
    """Search for stocks using Polygon.io API."""
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(
                f"{POLYGON_BASE_URL}/v3/reference/tickers",
                params={
                    "ticker.gte": query.upper(),
                    "market": "stocks",
                    "active": "true",
                    "limit": limit,
                    "apiKey": POLYGON_API_KEY
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "query": query,
                    "results": data.get("results", [])[:limit]
                }
            else:
                return {"error": f"Search failed with status {response.status_code}"}
    except Exception as e:
        return {"error": f"Search error: {str(e)}"}


async def get_ticker_details(ticker: str) -> dict:
    """Get detailed information about a specific ticker from Polygon.io."""
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(
                f"{POLYGON_BASE_URL}/v3/reference/tickers/{ticker.upper()}",
                params={"apiKey": POLYGON_API_KEY},
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("results"):
                    return {"success": True, "details": data["results"]}
                else:
                    return {"success": False, "error": "No ticker details found"}
            else:
                return {"success": False, "error": f"API returned status {response.status_code}"}
    except Exception as e:
        return {"success": False, "error": f"Ticker details error: {str(e)}"}


async def get_current_quote(ticker: str) -> dict:
    """Get current quote data for a ticker from Polygon.io (prev close, high, low, etc)."""
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            # Get previous day's aggregates (for current session data)
            response = await client.get(
                f"{POLYGON_BASE_URL}/v2/aggs/ticker/{ticker.upper()}/prev",
                params={"adjusted": "true", "apiKey": POLYGON_API_KEY},
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("results") and len(data["results"]) > 0:
                    result = data["results"][0]
                    return {
                        "success": True,
                        "quote": {
                            "price": result.get("c"),  # close
                            "change": result.get("c") - result.get("o", result.get("c")),  # close - open
                            "changePercent": ((result.get("c") - result.get("o", result.get("c"))) / result.get("o", 1)) * 100,
                            "dayHigh": result.get("h"),
                            "dayLow": result.get("l"),
                            "week52High": result.get("h"),  # Approximate
                            "week52Low": result.get("l"),  # Approximate
                            "volume": result.get("v"),
                            "marketCap": None,  # Not in aggregates
                            "peRatio": None,  # Need separate call
                            "dividend": None  # Need separate call
                        }
                    }
                else:
                    return {"success": False, "error": "No quote data found"}
            else:
                return {"success": False, "error": f"API returned status {response.status_code}"}
    except Exception as e:
        return {"success": False, "error": f"Quote error: {str(e)}"}


