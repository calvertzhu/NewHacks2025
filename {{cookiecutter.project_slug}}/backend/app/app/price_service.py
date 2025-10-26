"""
Stock price data services using Polygon.io aggregates API.
"""
import os
import httpx
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Polygon.io API configuration
POLYGON_API_KEY = os.getenv("POLYGON_API_KEY")
POLYGON_BASE_URL = "https://api.polygon.io"


async def get_stock_prices(ticker: str, months: int = 12) -> dict:
    """Get stock price data for the last N months using Polygon.io aggregates API."""
    try:
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months * 30)  # Approximate months
        
        # Format dates for API
        start_str = start_date.strftime("%Y-%m-%d")
        end_str = end_date.strftime("%Y-%m-%d")
        
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(
                f"{POLYGON_BASE_URL}/v2/aggs/ticker/{ticker.upper()}/range/1/day/{start_str}/{end_str}",
                params={
                    "adjusted": "true",
                    "sort": "asc",
                    "limit": 500,  # Max limit for daily data
                    "apiKey": POLYGON_API_KEY
                },
                timeout=15.0
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "OK" and data.get("results"):
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
                        "error": f"No price data found for {ticker.upper()}"
                    }
            else:
                return {
                    "success": False, 
                    "error": f"API returned status {response.status_code}"
                }
                
    except httpx.TimeoutException:
        return {"success": False, "error": "Request timeout - please try again"}
    except httpx.RequestError as e:
        return {"success": False, "error": f"Request failed: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Price data error: {str(e)}"}
