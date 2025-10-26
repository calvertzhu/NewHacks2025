"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Settings2, TrendingUp, TrendingDown, Sparkles, X, Bell } from "lucide-react"
import { AlertDemo } from "./alert-demo"

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

interface SelectedIndicator {
  id: string
  type: "SMA" | "EMA" | "RSI"
  period: number
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
    exchange: " ",
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
  const [selectedIndicators, setSelectedIndicators] = useState<SelectedIndicator[]>([])
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [showAlertDemo, setShowAlertDemo] = useState(false)
  const [stock, setStock] = useState(stockData[stockSymbol] || stockData.AAPL)
  const [isLoadingStock, setIsLoadingStock] = useState(true)
  const [exchange, setExchange] = useState("NASDAQ")
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const tradingViewWidgetRef = useRef<any>(null)

  // Fetch real stock data from backend
  useEffect(() => {
    const fetchStockData = async () => {
      setIsLoadingStock(true)
      try {
        // First, get stock from portfolio (to get company name from DB)
        const portfolioResponse = await fetch(`http://localhost:8000/api/v1/stocks/${stockSymbol}`)
        let companyName = stockSymbol
        let stockExchange = "NASDAQ"
        if (portfolioResponse.ok) {
          const portfolioData = await portfolioResponse.json()
          companyName = portfolioData.name || stockSymbol
          stockExchange = portfolioData.exchange || "NASDAQ"
          setExchange(stockExchange)
        }

        // Then fetch quote data for price/volume
        const quoteResponse = await fetch(`http://localhost:8000/api/v1/stocks/quote/${stockSymbol}`)
        let quote: any = {}
        if (quoteResponse.ok) {
          quote = await quoteResponse.json()
        }

        setStock({
          name: companyName,
          exchange: stockExchange,
          price: quote.price || 0,
          change: quote.changePercent || 0,
          dayLow: quote.dayLow || 0,
          dayHigh: quote.dayHigh || 0,
          week52Low: quote.week52Low || 0,
          week52High: quote.week52High || 0,
          volume: quote.volume ? `${(quote.volume / 1000000).toFixed(1)}M` : "N/A",
          marketCap: quote.marketCap || "N/A",
          peRatio: quote.peRatio || 0,
          dividend: quote.dividend || "N/A",
        })
      } catch (err) {
        console.error("Failed to fetch stock data:", err)
      } finally {
        setIsLoadingStock(false)
      }
    }
    fetchStockData()
  }, [stockSymbol])

  useEffect(() => {
    if (!chartContainerRef.current) return

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/tv.js"
    script.async = true
    script.onload = () => {
      if (typeof window.TradingView !== "undefined") {
        // Map exchange codes to TradingView format
        const exchangeMapping: Record<string, string> = {
          "XNAS": "NASDAQ",
          "XNYS": "NYSE",
          "XASE": "AMEX",
          "ARCX": "ARCA",
          "IEXG": "IEXG",
        }
        
        const tvExchange = exchangeMapping[exchange] || exchange
        
        tradingViewWidgetRef.current = new window.TradingView.widget({
          autosize: true,
          symbol: `${tvExchange}:${stockSymbol}`,
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#18181b",
          enable_publishing: false,
          hide_side_toolbar: false,  // Enable sidebar for indicator access
          allow_symbol_change: false,

          disabled_features: [
            "header_symbol_search", //  no
            "header_compare", // no
            "header_undo_redo", // no
            "header_screenshot", // no
            "header_chart_type",
            "header_settings",
            "header_indicators",  // Enable TradingView's indicator button
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
        })
      }
    }

    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [stockSymbol, selectedIndicators, exchange])

  // Effect to dynamically inject indicators into TradingView iframe
  useEffect(() => {
    if (!tradingViewWidgetRef.current || selectedIndicators.length === 0) return

    // Find the iframe element
    setTimeout(() => {
      const iframe = document.querySelector('#tradingview_chart iframe')
      if (iframe) {
        try {
          const iframeWindow = (iframe as HTMLIFrameElement).contentWindow
          if (iframeWindow) {
            // Inject script to add indicators
            selectedIndicators.forEach((ind) => {
              iframeWindow.postMessage({
                event: 'add_study',
                indicator: ind.type === "SMA" ? "Moving Average" : ind.type === "EMA" ? "Exponential Moving Average" : "RSI",
                length: ind.period
              }, '*')
            })
          }
        } catch (e) {
          console.log("Cross-origin restriction (expected)")
        }
      }
    }, 3000)
  }, [selectedIndicators])

  const handleAddIndicator = () => {
    if (indicator.type) {
      const newIndicator: SelectedIndicator = {
        id: Date.now().toString(),
        type: indicator.type,
        period: indicator.period
      }
      setSelectedIndicators([...selectedIndicators, newIndicator])
      setIndicator({ type: null, period: 14 })
    }
  }

  const handleRemoveIndicator = (id: string) => {
    setSelectedIndicators(selectedIndicators.filter(ind => ind.id !== id))
  }

  const fetchAiAnalysis = async () => {
    setLoadingAnalysis(true)
    try {
      // Build indicator context from all selected indicators
      const smaIndicators = selectedIndicators.filter(ind => ind.type === "SMA")
      const emaIndicators = selectedIndicators.filter(ind => ind.type === "EMA")
      const rsiIndicators = selectedIndicators.filter(ind => ind.type === "RSI")
      
      const response = await fetch("http://localhost:8000/rag/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_history: [],
          indicator_context: {
            symbol: stockSymbol,
            sma: smaIndicators.length > 0 ? smaIndicators.map(ind => `${ind.period} days`).join(", ") : null,
            ema: emaIndicators.length > 0 ? emaIndicators.map(ind => `${ind.period} days`).join(", ") : null,
            rsi: rsiIndicators.length > 0 ? rsiIndicators.map(ind => `${ind.period} period`).join(", ") : null,
            criteria_text: `Analyzing ${selectedIndicators.length} indicators: ${selectedIndicators.map(ind => `${ind.type}-${ind.period}`).join(", ")}`
          },
          top_k: 4
        })
      })
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text()
        console.error("AI analysis failed:", errorText)
        setAiAnalysis("Error: AI analysis is not available. Gemini API key is not configured.")
        return
      }
      
      const data = await response.json()
      if (data && data.reply) {
        setAiAnalysis(data.reply)
        setShowAiModal(true)  // Open modal when analysis is ready
      } else {
        setAiAnalysis("No analysis available from AI service.")
        setShowAiModal(true)
      }
    } catch (err) {
      console.error("AI analysis failed:", err)
      setAiAnalysis("Error: Could not generate analysis. Please ensure the backend is running.")
    } finally {
      setLoadingAnalysis(false)
    }
  }

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

      {/* Chart Area or Alert Demo */}
      <div className="flex-1 p-6">
        {showAlertDemo ? (
          <AlertDemo stockSymbol={stockSymbol} />
        ) : (
          <Card className="h-full p-0 flex flex-col bg-zinc-950/30 border-zinc-800/50 overflow-hidden">
            <div ref={chartContainerRef} id="tradingview_chart" className="flex-1 min-h-[400px]" />
          </Card>
        )}
      </div>

      <div className="px-6 pb-6 flex gap-3">
        {/* Stats Box - Inline Format */}
        <Card className="flex-[0.7] p-3 bg-zinc-950/30 border-zinc-800/50">
          <div className="flex items-center gap-4 text-xs flex-wrap">
            {/* Year High*/}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Year High</span>
              <span className="font-semibold tabular-nums">{stock.week52High}</span>
            </div>
            {/* Year Low */}
            <span className="text-zinc-600">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Year Low</span>
              <span className="font-semibold tabular-nums">{stock.week52Low}</span>
            </div>
            {/* Volume*/}
            <span className="text-zinc-600">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Volume</span>
              <span className="font-semibold tabular-nums">{stock.volume}</span>
            </div>

            <div className="basis-full h-0" />

            {/* Day High*/}
            <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Day High</span>
            <span className="font-semibold tabular-nums">{stock.dayHigh}</span>
            </div>
            {/* Day Low Price*/}
            <span className="text-zinc-600">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Day Low</span>
              <span className="font-semibold tabular-nums">{stock.dayLow}</span>
            </div>
            {/* Market Cap*/}
            <span className="text-zinc-600">•</span>
            <div className="flex it ems-center gap-1.5">
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
                    <Button className="flex-1 rounded-xl" onClick={handleAddIndicator}>Add Indicator</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Display Selected Indicators */}
            {selectedIndicators.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-zinc-400 font-medium">Selected Indicators ({selectedIndicators.length}):</div>
                {selectedIndicators.map((ind) => (
                  <div key={ind.id} className="flex items-center justify-between p-2 bg-zinc-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        ind.type === "SMA" ? "bg-blue-500" : ind.type === "EMA" ? "bg-purple-500" : "bg-orange-500"
                      }`} />
                      <span className="text-xs text-zinc-300 font-medium">{ind.type}</span>
                      <span className="text-xs text-zinc-500">•</span>
                      <span className="text-xs text-zinc-400">{ind.period} days</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-zinc-500 hover:text-red-400"
                      onClick={() => handleRemoveIndicator(ind.id)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Alert Demo Toggle */}
            <Button
              onClick={() => setShowAlertDemo(!showAlertDemo)}
              className="w-full gap-2 bg-orange-600 hover:bg-orange-700 rounded-xl"
            >
              <Bell className="h-4 w-4" />
              {showAlertDemo ? "Show Chart" : "Alert Demo"}
            </Button>

            {/* AI Analysis Button */}
            <Button
              onClick={fetchAiAnalysis}
              disabled={loadingAnalysis}
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700 rounded-xl"
            >
              <Sparkles className="h-4 w-4" />
              {loadingAnalysis ? "Analyzing..." : "Get AI Analysis"}
            </Button>

          </div>
        </Card>

        {/* AI Analysis Modal */}
        {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setShowAiModal(false)}>
            <Card 
              className="w-[90vw] max-w-2xl max-h-[80vh] bg-zinc-900 border-zinc-800 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-zinc-100">AI Analysis</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setShowAiModal(false)}
                >
                  <X className="h-4 w-4 text-zinc-400" />
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                {loadingAnalysis ? (
                  <div className="text-center py-8 text-zinc-400">Analyzing indicators...</div>
                ) : aiAnalysis ? (
                  <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {aiAnalysis}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-400">No analysis available</div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

declare global {
  interface Window {
    TradingView: any
  }
}
