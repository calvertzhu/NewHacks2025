"""
Exponential Moving Average (EMA) indicator using Polygon.io API.
"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

POLYGON_API_KEY = os.getenv("POLYGON_API_KEY")
POLYGON_BASE_URL = "https://api.polygon.io"


async def get_ema(
    ticker: str,
    window: int = 50,
    series_type: str = "close",
    timespan: str = "day",
    timestamp: str = None,
    limit: int = 100
) -> dict:
    """
    Get Exponential Moving Average (EMA) from Polygon.io indicators API.
    
    Args:
        ticker: Stock ticker symbol
        window: The window size for EMA calculation
        series_type: Price type to use
        timespan: Aggregation size
        timestamp: Query by specific timestamp
        limit: Number of results to return
    """
    try:
        params = {
            "window": window,
            "limit": limit,
            "apiKey": POLYGON_API_KEY
        }
        
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(
                f"{POLYGON_BASE_URL}/v1/indicators/ema/{ticker.upper()}",
                params=params,
                timeout=15.0
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "ticker": ticker.upper(),
                    "indicator": "EMA",
                    "window": window,
                    "data": data
                }
            else:
                return {
                    "success": False,
                    "error": f"API returned status {response.status_code}: {response.text}"
                }

    except httpx.TimeoutException:
        return {"success": False, "error": "Request timeout"}
    except httpx.RequestError as e:
        return {"success": False, "error": f"Request failed: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"EMA error: {str(e)}"}
