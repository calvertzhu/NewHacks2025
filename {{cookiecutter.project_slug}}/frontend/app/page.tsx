"use client"

import { useEffect, useState } from "react"
import { PortfolioSidebar } from "@/components/sidebar"
import { StockChart } from "@/components/chart"

export default function StockTrackerPage() {
  const [selectedStock, setSelectedStock] = useState("AAPL")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [backendStatus, setBackendStatus] = useState("Checking backend...")

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    fetch(`${apiUrl}/`)
      .then(res => res.json())
      .then(data => setBackendStatus(`${data.status}, MongoDB: ${data.mongodb}`))
      .catch(() => setBackendStatus("Could not connect to FastAPI backend"))
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-100">
      <div className="p-2 text-sm text-zinc-400">{backendStatus}</div>

      <div className="flex flex-1">
        <PortfolioSidebar
          selectedStock={selectedStock}
          onSelectStock={setSelectedStock}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <StockChart stockSymbol={selectedStock} isSidebarCollapsed={isSidebarCollapsed} />
      </div>
    </div>
  )
}
