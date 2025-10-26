"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings2 } from "lucide-react"

interface StockChartProps {
  stockSymbol: string
  isSidebarCollapsed: boolean
}

declare global {
  interface Window {
    TradingView: any
    Datafeeds: any
  }
}

/**
 * IMPORTANT: Place the official Charting Library in:
 *   /public/charting_library/
 * so this file can load: /charting_library/charting_library.js
 * For data: expose a UDF-compatible endpoint at http://localhost:8000/udf
 * (You can stub this first and wire real candles later.)
 */
export function StockChart({ stockSymbol }: StockChartProps) {
  const containerId = "tv_main_chart"
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Load Charting Library once
    const load = () => {
      if (window.TradingView?.widget && window.Datafeeds) {
        setReady(true)
        return
      }
      const s = document.createElement("script")
      s.src = "/charting_library/charting_library.js"
      s.async = true
      s.onload = () => setReady(true)
      scriptRef.current = s
      document.body.appendChild(s)
    }
    load()
    return () => {
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        document.body.removeChild(scriptRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    // UDF datafeed (implement /udf on FastAPI later)
    const datafeed = new window.Datafeeds.UDFCompatibleDatafeed("http://localhost:8000/udf", 10 * 1000)

    const widget = new window.TradingView.widget({
      symbol: `NASDAQ:${stockSymbol}`,
      interval: "D",
      container_id: containerId,
      library_path: "/charting_library/",
      datafeed,
      locale: "en",
      theme: "dark",
      autosize: true,
      disabled_features: [
        "header_symbol_search",
        "header_compare",
        "header_undo_redo",
        "header_screenshot",
        "header_fullscreen_button",
        "timeframes_toolbar",
        "use_localstorage_for_settings",
      ],
      enabled_features: ["hide_left_toolbar_by_default"],
      overrides: {
        "paneProperties.background": "#0a0a0b",
        "paneProperties.vertGridProperties.color": "rgba(63,63,70,0.18)",
        "paneProperties.horzGridProperties.color": "rgba(63,63,70,0.18)",
        "scalesProperties.textColor": "#a1a1aa",
        "mainSeriesProperties.showCountdown": false,
      },
      studies_overrides: {},
    })

    return () => {
      // @ts-ignore
      if (widget?.remove) widget.remove()
    }
  }, [ready, stockSymbol])

  return (
    <div className="flex-1 flex flex-col bg-zinc-950">
      <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{stockSymbol} • TradingView</h1>
        <Button variant="outline" className="rounded-xl bg-zinc-900 border-zinc-800">
          <Settings2 className="h-4 w-4 mr-2" />
          Chart Settings
        </Button>
      </div>

      <div className="flex-1 p-6">
        <Card className="h-full p-0 bg-zinc-950/30 border-zinc-800/50 overflow-hidden">
          <div id={containerId} className="h-full w-full min-h-[420px]" />
        </Card>
      </div>
    </div>
  )
}
