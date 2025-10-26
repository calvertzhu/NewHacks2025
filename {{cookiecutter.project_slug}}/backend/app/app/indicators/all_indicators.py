"""
Fetch multiple technical indicators in parallel.
"""
import asyncio
from typing import Dict

from .sma import get_sma
from .rsi import get_rsi


async def get_technical_indicators(
    ticker: str,
    windows: Dict[str, int] = {"sma_short": 50, "sma_long": 200, "rsi": 14},
    series_type: str = "close",
    timespan: str = "day",
    limit: int = 100
) -> dict:
    """
    Get multiple technical indicators for a stock in parallel.
    
    Args:
        ticker: Stock ticker symbol
        windows: Dictionary with indicator names and window sizes
        series_type: Price type to use
        timespan: Aggregation size
        limit: Number of results to return
    """
    try:
        # Fetch indicators in parallel
        tasks = []
        task_map = {}  # Map to track which task corresponds to which indicator
        
        # Fetch SMAs
        if "sma_short" in windows:
            task = get_sma(ticker, windows["sma_short"], series_type, timespan, None, limit)
            tasks.append(task)
            task_map[id(task)] = ("sma_short", windows["sma_short"])
        
        if "sma_long" in windows:
            task = get_sma(ticker, windows["sma_long"], series_type, timespan, None, limit)
            tasks.append(task)
            task_map[id(task)] = ("sma_long", windows["sma_long"])
        
        # Fetch RSI
        if "rsi" in windows:
            task = get_rsi(ticker, windows["rsi"], series_type, timespan, None, limit)
            tasks.append(task)
            task_map[id(task)] = ("rsi", windows["rsi"])
        
        # Execute all requests in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        indicators = {}
        errors = []
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                errors.append(f"Task {i} failed: {str(result)}")
            elif result.get("success"):
                # Use the task map to get the correct key
                indicator_type = result["indicator"].lower()
                if indicator_type == "sma":
                    # Use the key from task_map
                    key = task_map.get(id(tasks[i]))[0]
                    indicators[key] = result
                else:
                    indicators[indicator_type] = result
            else:
                errors.append(f"{result.get('indicator', 'Unknown')} failed: {result.get('error')}")
        
        return {
            "success": len(errors) == 0,
            "ticker": ticker.upper(),
            "indicators": indicators,
            "errors": errors
        }
        
    except Exception as e:
        return {"success": False, "error": f"Technical indicators error: {str(e)}"}
