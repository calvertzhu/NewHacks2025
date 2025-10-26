"""
Crossover detection for moving averages.
"""
from datetime import datetime


async def detect_crossovers_from_sma(sma_short_data: list, sma_long_data: list) -> list:
    """
    Detect crossover points between two SMA series from Polygon.io data.
    
    Args:
        sma_short_data: List of SMA short values from Polygon API
        sma_long_data: List of SMA long values from Polygon API
    
    Returns:
        List of crossover events
    """
    crossovers = []
    
    if not sma_short_data or not sma_long_data:
        return crossovers
    
    # Align the data by timestamp (assume they're both sorted by timestamp)
    short_dict = {item.get("timestamp"): item.get("value") for item in sma_short_data}
    long_dict = {item.get("timestamp"): item.get("value") for item in sma_long_data}
    
    # Get common timestamps
    common_timestamps = sorted(set(short_dict.keys()) & set(long_dict.keys()))
    
    if len(common_timestamps) < 2:
        return crossovers
    
    # Detect crossovers
    for i in range(1, len(common_timestamps)):
        prev_timestamp = common_timestamps[i - 1]
        curr_timestamp = common_timestamps[i]
        
        prev_short = short_dict[prev_timestamp]
        prev_long = long_dict[prev_timestamp]
        curr_short = short_dict[curr_timestamp]
        curr_long = long_dict[curr_timestamp]
        
        # Golden cross: short crosses above long
        if prev_short <= prev_long and curr_short > curr_long:
            crossovers.append({
                "type": "golden_cross",
                "timestamp": curr_timestamp,
                "short_sma": curr_short,
                "long_sma": curr_long,
                "date": datetime.fromtimestamp(curr_timestamp / 1000).isoformat() if curr_timestamp else None
            })
        
        # Death cross: short crosses below long
        elif prev_short >= prev_long and curr_short < curr_long:
            crossovers.append({
                "type": "death_cross",
                "timestamp": curr_timestamp,
                "short_sma": curr_short,
                "long_sma": curr_long,
                "date": datetime.fromtimestamp(curr_timestamp / 1000).isoformat() if curr_timestamp else None
            })
    
    return crossovers
