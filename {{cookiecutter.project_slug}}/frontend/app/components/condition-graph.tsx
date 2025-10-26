"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Calendar, Brain, ArrowLeft } from "lucide-react"
import { getSMA, getEMA, getRSI } from "@/lib/api"

const API_BASE_URL = "http://localhost:8000"

interface ConditionGraphProps {
  stockSymbol: string
  indicatorType: string
  period: number
  condition: string
  threshold: number
  onBack?: () => void
}

interface ConditionMatch {
  date: string
  value: number
  price: number
  volume: number
}

export function ConditionGraph({ 
  stockSymbol, 
  indicatorType, 
  period, 
  condition, 
  threshold,
  onBack
}: ConditionGraphProps) {
  const [matches, setMatches] = useState<ConditionMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string>("")
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    fetchConditionData()
  }, [stockSymbol, indicatorType, period, condition, threshold])

  const fetchConditionData = async () => {
    setLoading(true)
    try {
      console.log(`Fetching ${indicatorType} data for ${stockSymbol} with period ${period}`)
      let indicatorData
      
      // Fetch indicator data based on type
      if (indicatorType === "SMA") {
        indicatorData = await getSMA(stockSymbol, period)
      } else if (indicatorType === "EMA") {
        indicatorData = await getEMA(stockSymbol, period)
      } else if (indicatorType === "RSI") {
        indicatorData = await getRSI(stockSymbol, period)
      }

      console.log("Indicator data received:", indicatorData)

      if (indicatorData?.success && indicatorData.data?.results?.values) {
        const values = indicatorData.data.results.values
        console.log(`Found ${values.length} data points`)
        const matches: ConditionMatch[] = []

        // Find dates where condition is met
        values.forEach((item: any) => {
          const value = item.value
          const date = new Date(item.timestamp).toISOString().split('T')[0]
          let meetsCondition = false

          if (condition === ">") {
            meetsCondition = value > threshold
          } else if (condition === "<") {
            meetsCondition = value < threshold
          }

          if (meetsCondition) {
            console.log(`Match found: ${date} - ${value} ${condition} ${threshold}`)
            matches.push({
              date,
              value,
              price: 0, // Would need price data
              volume: 0  // Would need volume data
            })
          }
        })

        console.log(`Total matches found: ${matches.length}`)
        setMatches(matches)
      } else {
        console.log("No indicator data found or API call failed")
        setMatches([])
      }
    } catch (error) {
      console.error("Error fetching condition data:", error)
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  const analyzeWithGemini = async () => {
    setAnalyzing(true)
    try {
      console.log("Analyzing with Gemini...")
      console.log("Matches found:", matches.length)
      console.log("Matches data:", matches)
      
      const conditionSummary = {
        stock: stockSymbol,
        indicator: indicatorType,
        period: period,
        condition: condition,
        threshold: threshold,
        matches: matches.length,
        recentMatches: matches.slice(-5), // Last 5 matches
        totalDays: matches.length
      }

      console.log("Sending condition summary:", conditionSummary)

      const response = await fetch(`${API_BASE_URL}/rag/analyze-conditions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conditionSummary)
      })

      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)

      if (response.ok) {
        const result = await response.json()
        console.log("Analysis result:", result)
        setAnalysis(result.analysis)
      } else {
        const errorText = await response.text()
        console.error("API Error:", response.status, errorText)
        setAnalysis(`Error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error("Error analyzing with Gemini:", error)
      setAnalysis(`Error: ${error.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-4 bg-zinc-900 border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold">Condition Analysis</h3>
        </div>
        <div className="text-sm text-zinc-400">
          {indicatorType} {condition} {threshold} - Found {matches.length} matches
        </div>
      </Card>

      {/* Matches List */}
      <Card className="p-4 bg-zinc-900 border-zinc-800">
        <h4 className="text-md font-semibold mb-4">Condition Matches</h4>
        {loading ? (
          <div className="text-center py-4 text-zinc-400">Loading...</div>
        ) : matches.length === 0 ? (
          <div className="text-center py-4 text-zinc-400">No matches found</div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {matches.map((match, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-zinc-800 rounded">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">{match.date}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-zinc-300">
                    {indicatorType}: {match.value.toFixed(2)}
                  </span>
                  <span className="text-green-400">
                    {condition} {threshold}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* AI Analysis */}
      <Card className="p-4 bg-zinc-900 border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="h-5 w-5 text-purple-400" />
          <h4 className="text-md font-semibold">AI Analysis</h4>
        </div>
        
        <Button
          onClick={analyzeWithGemini}
          disabled={analyzing || matches.length === 0}
          className="w-full gap-2 bg-purple-600 hover:bg-purple-700 mb-4"
        >
          <Brain className="h-4 w-4" />
          {analyzing ? "Analyzing..." : "Analyze with Gemini AI"}
        </Button>

        {analysis && (
          <div className="p-4 bg-zinc-800 rounded-lg">
            <div className="text-sm text-zinc-300 whitespace-pre-wrap">
              {analysis}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
