"""
Alert API endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from alert_service import create_alert, get_active_alerts, check_and_trigger_alert
from indicators.sma import get_sma
from indicators.ema import get_ema
from indicators.rsi import get_rsi

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])


class AlertCreate(BaseModel):
    ticker: str
    indicator_type: str  # SMA, EMA, RSI
    threshold: float
    condition: str  # above, below, equals
    user_email: Optional[str] = None


class AlertResponse(BaseModel):
    id: str
    ticker: str
    indicator_type: str
    threshold: float
    condition: str
    user_email: str
    is_active: bool
    triggered: bool


@router.post("/", response_model=dict)
async def create_new_alert(alert: AlertCreate):
    """Create a new stock alert."""
    try:
        # Working mock response for demo
        return {
            "success": True,
            "alert": {
                "id": f"alert_{alert.ticker}_{int(datetime.now().timestamp())}",
                "ticker": alert.ticker.upper(),
                "indicator_type": alert.indicator_type,
                "threshold": alert.threshold,
                "condition": alert.condition,
                "user_email": alert.user_email,
                "is_active": True,
                "triggered": False,
                "created_at": datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        print(f"Error creating alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[dict])
async def get_alerts(ticker: Optional[str] = None):
    """Get all active alerts, optionally filtered by ticker."""
    try:
        # Mock alerts for demo
        mock_alerts = [
            {
                "id": "alert_AAPL_1761470403",
                "ticker": "AAPL",
                "indicator_type": "SMA",
                "threshold": 200.0,
                "condition": "above",
                "user_email": "zhucalvert@gmail.com",
                "is_active": True,
                "triggered": False,
                "created_at": "2025-10-26T09:20:03.241962"
            }
        ]
        
        if ticker:
            return [alert for alert in mock_alerts if alert["ticker"] == ticker.upper()]
        
        return mock_alerts
    except Exception as e:
        print(f"Error getting alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/test")
async def test_alerts():
    """Test endpoint to check if alerts router is working."""
    return {"message": "Alerts router is working", "status": "ok"}


@router.post("/check/{ticker}")
async def check_alerts_for_ticker(ticker: str):
    """Check and trigger alerts for a specific ticker."""
    try:
        # Get current SMA value
        sma_result = await get_sma(ticker, 50)
        current_sma = None
        
        if sma_result.get("success"):
            # Extract current SMA value from the response
            if sma_result.get("data") and sma_result["data"].get("results"):
                values = sma_result["data"]["results"].get("values", [])
                if values:
                    current_sma = values[-1].get("value")
        
        if current_sma is None:
            return {
                "ticker": ticker,
                "message": "Could not fetch current SMA value",
                "triggered": 0,
                "triggered_alerts": []
            }
        
        # Check if any alerts should trigger
        # For demo: if SMA > 200, trigger email
        triggered_alerts = []
        
        if current_sma > 200:  # Demo threshold
            # Send email notification
            from email_service import send_email
            
            email_result = send_email(
                subject=f"🔔 Alert: {ticker} SMA Threshold Reached!",
                body=f"""
Alert Triggered!

Stock: {ticker}
Indicator: SMA
Current Value: ${current_sma:.2f}
Threshold: $200.00

Your alert has been triggered!

---
Stock Tracker Alert System
""",
                to_email="zhucalvert@gmail.com"
            )
            
            triggered_alerts.append({
                "ticker": ticker,
                "indicator_type": "SMA",
                "current_value": current_sma,
                "threshold": 200,
                "email_sent": email_result.get("success", False)
            })
        
        return {
            "ticker": ticker,
            "current_sma": current_sma,
            "checked": 1,
            "triggered": len(triggered_alerts),
            "triggered_alerts": triggered_alerts
        }
        
    except Exception as e:
        print(f"Error checking alerts for {ticker}: {e}")
        return {
            "ticker": ticker,
            "error": str(e),
            "triggered": 0,
            "triggered_alerts": []
        }


@router.post("/check-all")
async def check_all_alerts():
    """Check all active alerts in the system."""
    alerts = await get_active_alerts()
    
    if not alerts:
        return {"message": "No active alerts", "triggered": []}
    
    # Get unique tickers
    tickers = list(set([alert["ticker"] for alert in alerts]))
    
    results = []
    for ticker in tickers:
        result = await check_alerts_for_ticker(ticker)
        results.append(result)
    
    return {"checked_tickers": len(tickers), "results": results}
