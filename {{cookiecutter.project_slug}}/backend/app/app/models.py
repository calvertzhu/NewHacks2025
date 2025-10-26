"""
Pydantic models for the API.
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class StockCreate(BaseModel):
    """Model for creating a new stock."""
    ticker: str
    name: Optional[str] = None
    sector: Optional[str] = None


class StockResponse(BaseModel):
    """Model for stock response."""
    id: str
    ticker: str
    symbol: str
    name: Optional[str]
    exchange: Optional[str]
    sector: Optional[str]
    added_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True
        populate_by_name = True


class PriceData(BaseModel):
    """Model for individual price data point."""
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    adjusted_close: Optional[float] = None


class StockPrices(BaseModel):
    """Model for stock price data response."""
    ticker: str
    symbol: str
    name: Optional[str]
    exchange: Optional[str]
    time_range: str
    prices: List[PriceData]
    total_results: int
    success: bool
