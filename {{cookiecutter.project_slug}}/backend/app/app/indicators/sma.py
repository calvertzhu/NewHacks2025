"""
Simple Moving Average (SMA) indicator using Polygon.io API.
"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

POLYGON_API_KEY = os.getenv("POLYGON_API_KEY")
POLYGON_BASE_URL = "https://api.polygon.io"


async def get_sma(
    ticker: str,
    window: int = 50,
    series_type: str = "close",
    timespan: str = "day",
    timestamp: str = None,
    limit: int = 100
) -> dict:
    """
    Get Simple Moving Average (SMA) from Polygon.io indicators API.
    
    Args:
        ticker: Stock ticker symbol (e.g., "AAPL")
        window: The window size for SMA calculation (default: 50)
        series_type: Price type to use ('close', 'open', 'high', 'low')
        timespan: Aggregation size ('day', 'hour', 'minute', etc.)
        timestamp: Query by specific timestamp
        limit: Number of results to return (default: 100)
    """
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(
                f"{POLYGON_BASE_URL}/v1/indicators/sma/{ticker.upper()}",
                params={
                    "window": window,
                    "series_type": series_type,
                    "timespan": timespan,
                    "limit": limit,
                    "apiKey": POLYGON_API_KEY,
                    **({"timestamp": timestamp} if timestamp else {})
                },
                timeout=15.0
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "ticker": ticker.upper(),
                    "indicator": "SMA",
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
        return {"success": False, "error": f"SMA error: {str(e)}"}
