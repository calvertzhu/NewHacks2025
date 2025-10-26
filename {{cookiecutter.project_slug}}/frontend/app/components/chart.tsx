"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Settings2, TrendingUp, TrendingDown } from "lucide-react"

interface StockChartProps {
  stockSymbol: string
  isSidebarCollapsed: boolean
}

interface IndicatorSettings {
  type: "SMA" | "EMA" | "RSI" | null
  period: number
  condition?: ">" | "<"
  value?: number
}

const stockData: Record<
  string,
  {
    name: string
    exchange: string
    price: number
    change: number
    dayLow: number
    dayHigh: number
    week52Low: number
    week52High: number
    volume: string
    marketCap: string
    peRatio: number
    dividend: string
  }
> = {
  AAPL: {
    name: "Apple Inc.",
    exchange: "NASDAQ",
    price: 262.81,
    change: 2.55,
    dayLow: 258.32,
    dayHigh: 264.15,
    week52Low: 164.08,
    week52High: 264.15,
    volume: "41.8M",
    marketCap: "3.98T",
    peRatio: 42.18,
    dividend: "0.96 (0.37%)",
  },
  TSLA: {
    name: "Tesla Inc.",
    exchange: "NASDAQ",
    price: 336.12,
    change: -2.39,
    dayLow: 332.45,
    dayHigh: 341.23,
    week52Low: 138.8,
    week52High: 488.54,
    volume: "98.2M",
    marketCap: "1.07T",
    peRatio: 98.45,
    dividend: "N/A",
  },
  MSFT: {
    name: "Microsoft Corp.",
    exchange: "NASDAQ",
    price: 428.5,
    change: 2.96,
    dayLow: 423.12,
    dayHigh: 430.87,
    week52Low: 362.9,
    week52High: 468.35,
    volume: "18.5M",
    marketCap: "3.19T",
    peRatio: 37.92,
    dividend: "3.00 (0.70%)",
  },
  GOOGL: {
    name: "Alphabet Inc.",
    exchange: "NASDAQ",
    price: 178.92,
    change: 1.83,
    dayLow: 176.45,
    dayHigh: 180.23,
    week52Low: 129.4,
    week52High: 193.31,
    volume: "22.1M",
    marketCap: "2.21T",
    peRatio: 26.84,
    dividend: "N/A",
  },
  AMZN: {
    name: "Amazon.com Inc.",
    exchange: "NASDAQ",
    price: 215.67,
    change: -2.07,
    dayLow: 213.12,
    dayHigh: 219.45,
    week52Low: 139.52,
    week52High: 231.2,
    volume: "35.7M",
    marketCap: "2.26T",
    peRatio: 51.23,
    dividend: "N/A",
  },
}

export function StockChart({ stockSymbol, isSidebarCollapsed }: StockChartProps) {
  const [indicator, setIndicator] = useState<IndicatorSettings>({
    type: null,
    period: 14,
  })
  const chartContainerRef = useRef<HTMLDivElement>(null)

  const stock = stockData[stockSymbol] || stockData.AAPL

  useEffect(() => {
    if (!chartContainerRef.current) return

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/tv.js"
    script.async = true
    script.onload = () => {
      if (typeof window.TradingView !== "undefined") {
        new window.TradingView.widget({
          autosize: true,
          symbol: `NASDAQ:${stockSymbol}`,
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#18181b",
          enable_publishing: false,
          hide_side_toolbar: true,
          allow_symbol_change: false,
          overrides: {
            "paneProperties.legendProperties.showInterval": false,
          },
          disabled_features: [
            "header_symbol_search", //  no
            "header_compare", // no
            "header_undo_redo", // no
            "header_screenshot", // no
            "header_chart_type",
            "header_settings",
            "header_indicators",
            "header_fullscreen_button",
            "timeframes_toolbar",
            "control_bar",
            // "left_toolbar",
            // "context_menus",
            // "edit_buttons_in_legend",
            // "border_around_the_chart",
            "display_market_status",
            "remove_library_container_border",
            "chart_property_page_style",
            "property_pages",
            "show_chart_property_page",
            // "source_selection_markers",
            // "chart_crosshair_menu",
          ],
          enabled_features: ["hide_left_toolbar_by_default"],
          disabled_features_mobile: ["left_toolbar", "header_widget", "timeframes_toolbar"],
          //overrides: {
           // "mainSeriesProperties.showCountdown": false,
          //  "paneProperties.legendProperties.showLegend": false,
          //},
          container_id: "tradingview_chart",
          backgroundColor: "#09090b",
          gridColor: "rgba(39, 39, 42, 0.3)",
          studies: indicator.type
            ? [
                indicator.type === "SMA"
                  ? `MA@tv-basicstudies`
                  : indicator.type === "EMA"
                    ? `EMA@tv-basicstudies`
                    : `RSI@tv-basicstudies`,
              ]
            : [],
        })
      }
    }

    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [stockSymbol, indicator.type])

  return (
    <div className="flex-1 flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800/50">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-1">{stock.name}</h1>
            <div className="flex items-center gap-3 text-zinc-400 text-sm">
              <span className="font-mono tracking-wide">{stockSymbol}</span>
              <span>•</span>
              <span>{stock.exchange}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold font-mono tabular-nums">${stock.price.toFixed(2)}</div>
            <div
              className={`text-sm font-medium flex items-center gap-1 justify-end tabular-nums px-2 py-0.5 rounded-md ${
                stock.change >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
              }`}
            >
              {stock.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {stock.change >= 0 ? "+" : ""}
              {stock.change.toFixed(2)}% today
            </div>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 p-6">
        <Card className="h-full p-0 flex flex-col bg-zinc-950/30 border-zinc-800/50 overflow-hidden">
          <div ref={chartContainerRef} id="tradingview_chart" className="flex-1 min-h-[400px]" />
        </Card>
      </div>

      <div className="px-6 pb-6 flex gap-4">
        {/* Stats Box - Inline Format */}
        <Card className="flex-1 p-3 bg-zinc-950/30 border-zinc-800/50">
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Day Range</span>
              <span className="font-semibold font-mono tabular-nums">
                {stock.dayLow.toFixed(2)}-{stock.dayHigh.toFixed(2)}
              </span>
            </div>
            <span className="text-zinc-600">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">52W Range</span>
              <span className="font-semibold font-mono tabular-nums">
                {stock.week52Low.toFixed(2)}-{stock.week52High.toFixed(2)}
              </span>
            </div>
            <span className="text-zinc-600">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Volume</span>
              <span className="font-semibold tabular-nums">{stock.volume}</span>
            </div>
            <span className="text-zinc-600">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Market Cap</span>
              <span className="font-semibold tabular-nums">{stock.marketCap}</span>
            </div>
          </div>
        </Card>

        {/* Indicator Controls */}
        <Card className="w-80 p-4 bg-zinc-950/30 border-zinc-800/50">
          <div className="space-y-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full gap-2 bg-zinc-900 border-zinc-800 rounded-xl">
                  <Settings2 className="h-4 w-4" />
                  {indicator.type ? `${indicator.type} (${indicator.period})` : "Add Indicator"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-zinc-900 border-zinc-800" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs">Indicator Type</Label>
                    <Select
                      value={indicator.type || ""}
                      onValueChange={(v: any) => setIndicator({ ...indicator, type: v })}
                    >
                      <SelectTrigger className="bg-zinc-950 border-zinc-800">
                        <SelectValue placeholder="Select indicator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SMA">SMA (Simple Moving Average)</SelectItem>
                        <SelectItem value="EMA">EMA (Exponential Moving Average)</SelectItem>
                        <SelectItem value="RSI">RSI (Relative Strength Index)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {indicator.type && (
                    <div className="space-y-2">
                      <Label className="text-zinc-400 text-xs">Period (Days)</Label>
                      <Input
                        type="number"
                        value={indicator.period}
                        onChange={(e) => setIndicator({ ...indicator, period: Number.parseInt(e.target.value) || 14 })}
                        min="1"
                        max="200"
                        className="bg-zinc-950 border-zinc-800"
                      />
                    </div>
                  )}

                  {(indicator.type === "SMA" || indicator.type === "EMA") && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-zinc-400 text-xs">Condition (Optional)</Label>
                        <Select
                          value={indicator.condition || ""}
                          onValueChange={(v: any) => setIndicator({ ...indicator, condition: v })}
                        >
                          <SelectTrigger className="bg-zinc-950 border-zinc-800">
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=">">Greater than (&gt;)</SelectItem>
                            <SelectItem value="<">Less than (&lt;)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {indicator.condition && (
                        <div className="space-y-2">
                          <Label className="text-zinc-400 text-xs">Value</Label>
                          <Input
                            type="number"
                            value={indicator.value || ""}
                            onChange={(e) => setIndicator({ ...indicator, value: Number.parseFloat(e.target.value) })}
                            placeholder="Enter value"
                            className="bg-zinc-950 border-zinc-800"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {indicator.type === "RSI" && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-zinc-400 text-xs">Condition (Optional)</Label>
                        <Select
                          value={indicator.condition || ""}
                          onValueChange={(v: any) => setIndicator({ ...indicator, condition: v })}
                        >
                          <SelectTrigger className="bg-zinc-950 border-zinc-800">
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=">">Greater than (&gt;)</SelectItem>
                            <SelectItem value="<">Less than (&lt;)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {indicator.condition && (
                        <div className="space-y-2">
                          <Label className="text-zinc-400 text-xs">Value (0-100)</Label>
                          <Input
                            type="number"
                            value={indicator.value || ""}
                            onChange={(e) => setIndicator({ ...indicator, value: Number.parseFloat(e.target.value) })}
                            placeholder="Enter value (0-100)"
                            min="0"
                            max="100"
                            className="bg-zinc-950 border-zinc-800"
                          />
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 bg-zinc-950 border-zinc-800 rounded-xl"
                      onClick={() => setIndicator({ type: null, period: 14 })}
                    >
                      Clear
                    </Button>
                    <Button className="flex-1 rounded-xl">Apply</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {indicator.type && (
              <div className="text-xs text-zinc-400 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-300">{indicator.type}</span>
                  <span>•</span>
                  <span>Period: {indicator.period} days</span>
                </div>
                {indicator.condition && indicator.value && (
                  <div className="flex items-center gap-2">
                    <span>
                      Condition: {indicator.condition} {indicator.value}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

declare global {
  interface Window {
    TradingView: any
  }
}
