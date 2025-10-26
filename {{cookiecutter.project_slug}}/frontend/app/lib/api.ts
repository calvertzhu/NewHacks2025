/**
 * API service for connecting to backend FastAPI
 */

const API_BASE_URL = "http://localhost:8000/api/v1"

interface Stock {
  id: string
  ticker: string
  symbol: string
  name?: string
  exchange?: string
  sector?: string
  added_at: string
  is_active: boolean
}

interface StockCreate {
  ticker: string
  name?: string
  sector?: string
}

interface Alert {
  id: string
  ticker: string
  indicator_type: string
  threshold: number
  condition: string
  user_email?: string
  is_active: boolean
  triggered: boolean
}

interface AlertCreate {
  ticker: string
  indicator_type: string
  threshold: number
  condition: string
  user_email?: string
}

/**
 * Add a stock to portfolio using Polygon API
 */
export async function addStockToPortfolio(ticker: string): Promise<Stock> {
  const response = await fetch(`${API_BASE_URL}/stocks/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ticker: ticker.toUpperCase() } as StockCreate),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to add stock")
  }

  return response.json()
}

/**
 * Get all stocks in portfolio
 */
export async function getPortfolio(): Promise<Stock[]> {
  const response = await fetch(`${API_BASE_URL}/stocks/`)
  
  if (!response.ok) {
    throw new Error("Failed to fetch portfolio")
  }

  return response.json()
}

/**
 * Remove stock from portfolio
 */
export async function removeStockFromPortfolio(ticker: string): Promise<void> {
  try {
    console.log(`API: Attempting to delete stock ${ticker.toUpperCase()}`)
    const response = await fetch(`${API_BASE_URL}/stocks/${ticker.toUpperCase()}`, {
      method: "DELETE",
    })
    
    console.log(`API: Response status: ${response.status}`)
    
    if (!response.ok) {
      const error = await response.json()
      console.error(`API: Error response:`, error)
      throw new Error(error.detail || "Failed to remove stock")
    }
    
    console.log(`API: Successfully deleted ${ticker.toUpperCase()}`)
  } catch (error) {
    console.error(`API: Failed to delete ${ticker}:`, error)
    throw error
  }
}

/**
 * Create a new stock alert
 */
export async function createAlert(alert: AlertCreate): Promise<Alert> {
  const response = await fetch(`${API_BASE_URL}/alerts/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(alert),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to create alert")
  }

  return response.json()
}

/**
 * Get all active alerts
 */
export async function getAlerts(ticker?: string): Promise<Alert[]> {
  const url = ticker ? `${API_BASE_URL}/alerts/?ticker=${ticker}` : `${API_BASE_URL}/alerts/`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error("Failed to fetch alerts")
  }

  return response.json()
}

/**
 * Check alerts for a specific ticker
 */
export async function checkAlerts(ticker: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/alerts/check/${ticker}`, {
    method: "POST",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to check alerts")
  }

  return response.json()
}

/**
 * Get current SMA value for a stock
 */
export async function getSMA(ticker: string, period: number = 50): Promise<any> {
  try {
    console.log(`Making request to: ${API_BASE_URL}/prices/${ticker}/indicators/sma?window=${period}`)
    const response = await fetch(`${API_BASE_URL}/prices/${ticker}/indicators/sma?window=${period}`)
    
    console.log(`Response status: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`SMA API error: ${response.status} - ${errorText}`)
      throw new Error(`Failed to fetch SMA data: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    console.log("SMA API response:", data)
    return data
  } catch (error) {
    console.error("SMA API request failed:", error)
    throw error
  }
}

/**
 * Get EMA data for a stock
 */
export async function getEMA(ticker: string, period: number = 50): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/prices/${ticker}/indicators/ema?window=${period}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch EMA data: ${response.status} ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("EMA API request failed:", error)
    throw error
  }
}

/**
 * Get RSI data for a stock
 */
export async function getRSI(ticker: string, period: number = 14): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/prices/${ticker}/indicators/rsi?window=${period}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch RSI data: ${response.status} ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("RSI API request failed:", error)
    throw error
  }
}
