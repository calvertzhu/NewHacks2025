"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, TrendingUp, Mail, CheckCircle, ArrowLeft } from "lucide-react"
import { createAlert, getAlerts, checkAlerts, getSMA } from "@/lib/api"

interface AlertDemoProps {
  stockSymbol: string
  onBack?: () => void
}

export function AlertDemo({ stockSymbol, onBack }: AlertDemoProps) {
  const [threshold, setThreshold] = useState(200)
  const [condition, setCondition] = useState("above")
  const [currentSMA, setCurrentSMA] = useState<number | null>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [lastCheck, setLastCheck] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  // Load current SMA value
  useEffect(() => {
    const loadSMA = async () => {
      try {
        console.log(`Fetching SMA for ${stockSymbol}...`)
        const smaData = await getSMA(stockSymbol, 50)
        console.log("SMA Data:", smaData) // Debug log
        
        if (smaData && smaData.success) {
          // Handle the actual data structure from the API
          let values = []
          if (smaData.data && smaData.data.results && smaData.data.results.values) {
            values = smaData.data.results.values
          } else if (smaData.values) {
            values = smaData.values
          }
          
          if (values.length > 0) {
            const latestValue = values[values.length - 1].value
            console.log(`SMA value for ${stockSymbol}:`, latestValue)
            setCurrentSMA(latestValue)
          } else {
            console.log("No SMA values found, using fallback")
            setCurrentSMA(180.50) // Mock SMA value for demo
          }
        } else {
          console.log("SMA API failed, using fallback")
          setCurrentSMA(180.50) // Mock SMA value for demo
        }
      } catch (err) {
        console.error("Failed to load SMA:", err)
        console.log("Using fallback SMA value")
        setCurrentSMA(180.50) // Mock SMA value for demo
      }
    }
    loadSMA()
  }, [stockSymbol])

  // Load existing alerts
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const alertsData = await getAlerts(stockSymbol)
        setAlerts(alertsData)
      } catch (err) {
        console.error("Failed to load alerts:", err)
      }
    }
    loadAlerts()
  }, [stockSymbol])

  const createNewAlert = async () => {
    setLoading(true)
    try {
      await createAlert({
        ticker: stockSymbol,
        indicator_type: "SMA",
        threshold: threshold,
        condition: condition,
        user_email: "zhucalvert@gmail.com"
      })
      
      // Reload alerts
      const alertsData = await getAlerts(stockSymbol)
      setAlerts(alertsData)
      
      alert("Alert created successfully!")
    } catch (err: any) {
      alert(`Failed to create alert: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const checkAlertsNow = async () => {
    setLoading(true)
    try {
      const result = await checkAlerts(stockSymbol)
      setLastCheck(new Date().toLocaleTimeString())
      
      if (result.triggered > 0) {
        setEmailSent(true)
        setTimeout(() => setEmailSent(false), 5000) // Hide after 5 seconds
      }
      
      // Reload alerts to see updated status
      const alertsData = await getAlerts(stockSymbol)
      setAlerts(alertsData)
      
    } catch (err: any) {
      alert(`Failed to check alerts: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (alert: any) => {
    if (alert.triggered) return "text-green-500"
    if (currentSMA !== null) {
      if (alert.condition === "above" && currentSMA > alert.threshold) return "text-yellow-500"
      if (alert.condition === "below" && currentSMA < alert.threshold) return "text-yellow-500"
    }
    return "text-gray-500"
  }

  const getStatusText = (alert: any) => {
    if (alert.triggered) return "✅ Triggered"
    if (currentSMA !== null) {
      if (alert.condition === "above" && currentSMA > alert.threshold) return "⚠️ Ready to trigger"
      if (alert.condition === "below" && currentSMA < alert.threshold) return "⚠️ Ready to trigger"
    }
    return "⏳ Monitoring"
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {onBack && (
        <div className="flex items-center gap-3 mb-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="gap-2 bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chart
          </Button>
        </div>
      )}
      
      {/* Current SMA Display */}
      <Card className="p-4 bg-zinc-900 border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold">Current SMA (50-day)</h3>
        </div>
        <div className="text-2xl font-mono font-bold text-blue-400">
          {currentSMA ? `$${currentSMA.toFixed(2)}` : "Data unavailable"}
        </div>
        <div className="text-sm text-zinc-400 mt-1">
          {stockSymbol} - Last updated: {new Date().toLocaleTimeString()}
        </div>
        {!currentSMA && (
          <div className="text-xs text-yellow-400 mt-2">
            ⚠️ SMA data not available. Make sure the stock is in your portfolio.
          </div>
        )}
      </Card>

      {/* Create Alert */}
      <Card className="p-4 bg-zinc-900 border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-semibold">Create Alert</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-zinc-400 text-sm">Threshold</Label>
            <Input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="bg-zinc-950 border-zinc-800"
            />
          </div>
          
          <div>
            <Label className="text-zinc-400 text-sm">Condition</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="bg-zinc-950 border-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above">Above</SelectItem>
                <SelectItem value="below">Below</SelectItem>
                <SelectItem value="equals">Equals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          onClick={createNewAlert} 
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {loading ? "Creating..." : "Create Alert"}
        </Button>
      </Card>

      {/* Check Alerts */}
      <Card className="p-4 bg-zinc-900 border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <h3 className="text-lg font-semibold">Check Alerts</h3>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={checkAlertsNow} 
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {loading ? "Checking..." : "Check Now"}
          </Button>
        </div>
        
        {lastCheck && (
          <div className="text-sm text-zinc-400 mt-2">
            Last checked: {lastCheck}
          </div>
        )}
        
        {emailSent && (
          <div className="flex items-center gap-2 mt-3 p-3 bg-green-900/30 border border-green-500/30 rounded-lg">
            <Mail className="h-4 w-4 text-green-400" />
            <span className="text-green-400 text-sm">Email sent! Check your inbox.</span>
          </div>
        )}
      </Card>

      {/* Active Alerts */}
      <Card className="p-4 bg-zinc-900 border-zinc-800">
        <h3 className="text-lg font-semibold mb-4">Active Alerts</h3>
        
        {alerts.length === 0 ? (
          <div className="text-zinc-400 text-center py-4">
            No alerts created yet
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg">
                <div>
                  <div className="font-medium">
                    {alert.ticker} SMA {alert.condition} ${alert.threshold}
                  </div>
                  <div className={`text-sm ${getStatusColor(alert)}`}>
                    {getStatusText(alert)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500">
                    {alert.triggered ? "Triggered" : "Active"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
