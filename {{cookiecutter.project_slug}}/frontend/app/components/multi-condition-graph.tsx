"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Calendar, Brain, ArrowLeft } from "lucide-react"
import { getSMA, getEMA, getRSI } from "@/lib/api"

const API_BASE_URL = "http://localhost:8000"

interface MultiConditionGraphProps {
  stockSymbol: string
  conditions: Array<{
    id: string
    type: string
    period: number
    condition: string
    value: number
  }>
  onBack?: () => void
}

interface ConditionMatch {
  date: string
  values: { [key: string]: number }
  allConditionsMet: boolean
}

export function MultiConditionGraph({ 
  stockSymbol, 
  conditions,
  onBack
}: MultiConditionGraphProps) {
  const [matches, setMatches] = useState<ConditionMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string>("")
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    fetchMultiConditionData()
  }, [stockSymbol, conditions])

  const fetchMultiConditionData = async () => {
    setLoading(true)
    try {
      console.log(`Fetching multi-condition data for ${stockSymbol}`)
      console.log("Conditions:", conditions)
      
      // Fetch data for all indicators
      const indicatorDataPromises = conditions.map(async (cond) => {
        let data
        if (cond.type === "SMA") {
          data = await getSMA(stockSymbol, cond.period)
        } else if (cond.type === "EMA") {
          data = await getEMA(stockSymbol, cond.period)
        } else if (cond.type === "RSI") {
          data = await getRSI(stockSymbol, cond.period)
        }
        return { condition: cond, data }
      })

      const allIndicatorData = await Promise.all(indicatorDataPromises)
      console.log("All indicator data received:", allIndicatorData)

      // Find dates where ALL conditions are met
      const allMatches: ConditionMatch[] = []
      
      if (allIndicatorData.length > 0 && allIndicatorData[0].data?.success) {
        const firstData = allIndicatorData[0].data.data.results.values
        console.log(`Found ${firstData.length} data points`)

        firstData.forEach((item: any, index: number) => {
          const date = new Date(item.timestamp).toISOString().split('T')[0]
          const values: { [key: string]: number } = {}
          let allConditionsMet = true

          // Check each condition
          allIndicatorData.forEach(({ condition, data }) => {
            if (data?.success && data.data?.results?.values) {
              const value = data.data.results.values[index]?.value || 0
              values[`${condition.type}_${condition.period}`] = value
              
              let meetsCondition = false
              if (condition.condition === ">") {
                meetsCondition = value > condition.value
              } else if (condition.condition === "<") {
                meetsCondition = value < condition.value
              }
              
              if (!meetsCondition) {
                allConditionsMet = false
              }
            } else {
              allConditionsMet = false
            }
          })

          if (allConditionsMet) {
            console.log(`All conditions met on ${date}:`, values)
            allMatches.push({
              date,
              values,
              allConditionsMet: true
            })
          }
        })

        console.log(`Total matches found: ${allMatches.length}`)
        setMatches(allMatches)
      } else {
        console.log("No indicator data found or API call failed")
        setMatches([])
      }
    } catch (error) {
      console.error("Error fetching multi-condition data:", error)
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  const analyzeWithGemini = async () => {
    setAnalyzing(true)
    try {
      console.log("Analyzing multi-conditions with Gemini...")
      console.log("Matches found:", matches.length)
      
      const conditionSummary = {
        stock: stockSymbol,
        conditions: conditions,
        matches: matches.length,
        recentMatches: matches.slice(-5), // Last 5 matches
        totalDays: matches.length
      }

      console.log("Sending condition summary:", conditionSummary)

      const response = await fetch(`${API_BASE_URL}/rag/analyze-multi-conditions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conditionSummary)
      })

      console.log("Response status:", response.status)

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
          <h3 className="text-lg font-semibold">Multi-Condition Analysis</h3>
        </div>
        <div className="text-sm text-zinc-400">
          {conditions.length} conditions - Found {matches.length} matches where ALL conditions are met
        </div>
        <div className="mt-2 space-y-1">
          {conditions.map((cond, index) => (
            <div key={cond.id} className="text-xs text-zinc-300">
              {index + 1}. {cond.type} {cond.condition} {cond.value}
            </div>
          ))}
        </div>
      </Card>

      {/* Matches List */}
      <Card className="p-4 bg-zinc-900 border-zinc-800">
        <h4 className="text-md font-semibold mb-4">All Conditions Met</h4>
        {loading ? (
          <div className="text-center py-4 text-zinc-400">Loading...</div>
        ) : matches.length === 0 ? (
          <div className="text-center py-4 text-zinc-400">No matches found where all conditions are met</div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {matches.map((match, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-zinc-800 rounded">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-400" />
                  <span className="text-sm">{match.date}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {Object.entries(match.values).map(([key, value]) => (
                    <span key={key} className="text-zinc-300">
                      {key}: {value.toFixed(2)}
                    </span>
                  ))}
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
          {analyzing ? "Analyzing..." : "Analyze Multi-Conditions with Gemini AI"}
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
