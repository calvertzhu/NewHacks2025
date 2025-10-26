"use client"

import { useState } from "react"
import { PortfolioSidebar } from "@/components/portfolio-sidebar"
import { StockChart } from "@/components/stock-chart"

export default function StockTrackerPage() {
  const [selectedStock, setSelectedStock] = useState("AAPL")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  return (
    <div className="flex h-screen bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-100 dark">
      <PortfolioSidebar
        selectedStock={selectedStock}
        onSelectStock={setSelectedStock}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <StockChart stockSymbol={selectedStock} isSidebarCollapsed={isSidebarCollapsed} />
    </div>
  )
}
