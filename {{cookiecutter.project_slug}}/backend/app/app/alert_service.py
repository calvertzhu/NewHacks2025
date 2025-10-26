"""
Alert service for stock portfolio monitoring
"""
from typing import Optional
from datetime import datetime
from database import get_collection, connect_to_mongo
from email_service import send_email
import json


async def create_alert(
    ticker: str,
    indicator_type: str,
    threshold: float,
    condition: str,
    user_email: Optional[str] = None
) -> dict:
    """
    Create a new alert for a stock.
    
    Args:
        ticker: Stock ticker symbol
        indicator_type: Type of indicator (SMA, EMA, RSI, etc.)
        threshold: The threshold value to monitor
        condition: Condition type ('above', 'below', 'equals')
        user_email: Email to send alerts to
    
    Returns:
        dict with success status and alert info
    """
    collection = await get_collection("Alerts")
    
    alert = {
        "ticker": ticker.upper(),
        "indicator_type": indicator_type,
        "threshold": threshold,
        "condition": condition,
        "user_email": user_email,
        "is_active": True,
        "triggered": False,
        "created_at": datetime.utcnow(),
        "last_checked": None,
        "triggered_at": None
    }
    
    result = await collection.insert_one(alert)
    alert["id"] = str(result.inserted_id)
    
    return {"success": True, "alert": alert}


async def get_active_alerts(ticker: Optional[str] = None) -> list:
    """Get all active alerts, optionally filtered by ticker."""
    collection = await get_collection("Alerts")
    
    query = {"is_active": True, "triggered": False}
    if ticker:
        query["ticker"] = ticker.upper()
    
    alerts = []
    async for alert in collection.find(query):
        alert["id"] = str(alert["_id"])
        alerts.append(alert)
    
    return alerts


async def check_and_trigger_alert(alert: dict, current_value: float) -> bool:
    """
    Check if an alert should be triggered and send email if so.
    
    Args:
        alert: Alert configuration
        current_value: Current indicator value
    
    Returns:
        True if alert was triggered, False otherwise
    """
    threshold = alert["threshold"]
    condition = alert["condition"]
    
    should_trigger = False
    
    if condition == "above" and current_value > threshold:
        should_trigger = True
    elif condition == "below" and current_value < threshold:
        should_trigger = True
    elif condition == "equals" and abs(current_value - threshold) < 0.01:
        should_trigger = True
    
    if should_trigger:
        # Mark alert as triggered
        await connect_to_mongo()
        collection = await get_collection("Alerts")
        await collection.update_one(
            {"_id": alert["_id"]},
            {
                "$set": {
                    "triggered": True,
                    "triggered_at": datetime.utcnow(),
                    "triggered_value": current_value
                }
            }
        )
        
        # Send email notification
        await send_alert_email(alert, current_value)
        
        return True
    
    # Update last checked time
    await connect_to_mongo()
    collection = await get_collection("Alerts")
    await collection.update_one(
        {"_id": alert["_id"]},
        {"$set": {"last_checked": datetime.utcnow()}}
    )
    
    return False


async def send_alert_email(alert: dict, current_value: float):
    """Send email notification when alert is triggered."""
    user_email = alert.get("user_email") or "zhucalvert@gmail.com"
    
    subject = f"🔔 Alert: {alert['ticker']} {alert['indicator_type']} Threshold Reached!"
    
    body = f"""
Alert Triggered!

Stock: {alert['ticker']}
Indicator: {alert['indicator_type']}
Condition: {alert['condition']} {alert['threshold']}
Current Value: {current_value:.2f}

Your alert has been triggered!

---
Stock Tracker Alert System
"""
    
    result = send_email(
        subject=subject,
        body=body,
        to_email=user_email
    )
    
    return result
