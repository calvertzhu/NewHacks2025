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
  const response = await fetch(`${API_BASE_URL}/stocks/${ticker.toUpperCase()}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to remove stock")
  }
}
