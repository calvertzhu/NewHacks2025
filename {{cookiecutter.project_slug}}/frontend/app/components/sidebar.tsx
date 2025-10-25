"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, Plus, TrendingDown, TrendingUp, X, Star } from "lucide-react"
import { createChart, ColorType, IChartApi, ISeriesApi } from "lightweight-charts"
import { cn } from "@/lib/utils"

interface Stock {
  symbol: string
  name: string
  price: number
  changePct: number
  spark: { time: number; value: number }[]
  alert?: boolean
}

interface PortfolioSidebarProps {
  selectedStock: string
  onSelectStock: (symbol: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

const SEED: Stock[] = [
  { symbol: "AAPL", name: "Apple Inc.",     price: 231.45, changePct: 0.79, spark: [221,224,222,228,229,227,231].map((v,i)=>({time:i+1,value:v})) },
  { symbol: "MSFT", name: "Microsoft",      price: 428.12, changePct:-0.49, spark: [431,430,429,432,431,427,428].map((v,i)=>({time:i+1,value:v})) },
  { symbol: "NVDA", name: "NVIDIA",         price: 115.93, changePct: 3.27, spark: [110,112,113,111,116,117,115].map((v,i)=>({time:i+1,value:v})) },
  { symbol: "AMZN", name: "Amazon",         price: 176.08, changePct:-0.35, spark: [178,177,176,177,176,175,176].map((v,i)=>({time:i+1,value:v})) },
  { symbol: "TSLA", name: "Tesla",          price: 253.71, changePct: 3.65, spark: [241,244,245,249,252,254,253].map((v,i)=>({time:i+1,value:v})) },
]

export function PortfolioSidebar({
  selectedStock,
  onSelectStock,
  isCollapsed,
  onToggleCollapse,
}: PortfolioSidebarProps) {
  const [sortBy, setSortBy] = useState<"alphabetical" | "alerts" | "recent">("alphabetical")
  const [stocks, setStocks] = useState<Stock[]>(SEED)
  const [query, setQuery] = useState("")
  const [newSymbol, setNewSymbol] = useState("")

  const filtered = useMemo(() => {
    const list = [...stocks].sort((a, b) =>
      sortBy === "alphabetical" ? a.symbol.localeCompare(b.symbol) : 0,
    )
    if (!query.trim()) return list
    const q = query.toLowerCase()
    return list.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
  }, [stocks, sortBy, query])

  const addStock = () => {
    const s = newSymbol.trim().toUpperCase()
    if (!s || stocks.find(x => x.symbol === s)) return
    setStocks(prev => [
      ...prev,
      { symbol: s, name: `${s} Corp.`, price: 100, changePct: 0, spark: [98,99,99,100,101,100,100].map((v,i)=>({time:i+1,value:v})) },
    ])
    setNewSymbol("")
  }

  const removeStock = (sym: string) => {
    setStocks(prev => prev.filter(s => s.symbol !== sym))
  }

  if (isCollapsed) {
    return (
      <div className="w-16 h-screen bg-zinc-950/30 flex flex-col items-center py-4">
        <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="mb-4">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex flex-col gap-2">
          {filtered.slice(0, 6).map(s => (
            <Button
              key={s.symbol}
              variant={selectedStock === s.symbol ? "default" : "ghost"}
              size="icon"
              onClick={() => onSelectStock(s.symbol)}
              className="relative"
            >
              <span className="text-xs font-mono">{s.symbol.slice(0, 2)}</span>
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <aside className="w-72 h-screen bg-zinc-950/30 border-r border-zinc-800/40 flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-400" /> Watchlist
        </div>
        <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="h-6 w-6">
          <ChevronLeft className="h-3 w-3" />
        </Button>
      </div>

      {/* Controls */}
      <div className="px-3 pb-2 space-y-2">
        <Input
          placeholder="Search symbols…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="h-8 bg-zinc-900/60 border-zinc-800/60"
        />
        <div className="flex gap-2">
          <Input
            placeholder="Add symbol"
            value={newSymbol}
            onChange={e => setNewSymbol(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && addStock()}
            className="h-8 bg-zinc-900/60 border-zinc-800/60"
          />
          <Button onClick={addStock} className="h-8 px-3 rounded-xl">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="h-8 bg-zinc-900/60 border-zinc-800/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
            <SelectItem value="alerts">Alerts</SelectItem>
            <SelectItem value="recent">Recent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2 space-y-1.5">
          {filtered.map(s => (
            <WatchItem
              key={s.symbol}
              stock={s}
              active={selectedStock === s.symbol}
              onClick={() => onSelectStock(s.symbol)}
              onRemove={() => removeStock(s.symbol)}
            />
          ))}
        </div>
      </ScrollArea>
    </aside>
  )
}

// ——— WatchItem with Lightweight-Charts sparkline ———

function WatchItem({
  stock,
  active,
  onClick,
  onRemove,
}: {
  stock: Stock
  active?: boolean
  onClick?: () => void
  onRemove?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = createChart(ref.current, {
      width: 120,
      height: 36,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#a1a1aa" },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { visible: false },
      timeScale: { visible: false, borderVisible: false },
      crosshair: { vertLine: { visible: false }, horzLine: { visible: false } },
    })
    const rising = stock.spark.at(-1)!.value >= stock.spark[0]!.value
    const series = chart.addLineSeries({ color: rising ? "#22c55e" : "#ef4444", lineWidth: 2 })
    series.setData(stock.spark)
    chartRef.current = chart
    seriesRef.current = series
    return () => chart.remove()
  }, [stock.symbol])

  return (
    <Card
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between rounded-xl px-3 py-2 bg-zinc-900/30 border-zinc-800/40 hover:bg-zinc-900/50 transition cursor-pointer",
        active && "bg-zinc-900/60 ring-1 ring-zinc-700/60",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="text-sm font-semibold tracking-wide">{stock.symbol}</div>
        <div className="text-xs text-zinc-400 truncate hidden sm:block">{stock.name}</div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-sm tabular-nums font-mono">${stock.price.toFixed(2)}</div>
        <div
          className={cn(
            "text-xs px-1.5 py-0.5 rounded-md tabular-nums flex items-center gap-1",
            stock.changePct >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400",
          )}
        >
          {stock.changePct >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {stock.changePct.toFixed(2)}%
        </div>
        <div ref={ref} className="w-28 h-9" />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
        >
          <X className="h-3.5 w-3.5 text-zinc-500" />
        </Button>
      </div>
    </Card>
  )
}
