"""
RSI condition detection (overbought/oversold).
"""


async def check_rsi_conditions_from_data(rsi_data: list) -> dict:
    """
    Check RSI overbought/oversold conditions from Polygon.io data.
    
    Args:
        rsi_data: List of RSI values from Polygon API
    
    Returns:
        Dictionary with overbought/oversold status
    """
    if not rsi_data:
        return {"value": None, "overbought": False, "oversold": False}
    
    # Get latest RSI value
    latest_rsi = rsi_data[-1].get("value") if rsi_data else None
    
    if latest_rsi is None:
        return {"value": None, "overbought": False, "oversold": False}
    
    return {
        "value": latest_rsi,
        "overbought": latest_rsi > 70,
        "oversold": latest_rsi < 30,
        "signal": "overbought" if latest_rsi > 70 else ("oversold" if latest_rsi < 30 else "neutral")
    }
