rad"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface CrimeForecastAlert {
  type: string
  title: string
  message: string
  severity: 'high' | 'medium' | 'low'
  articles: Array<{
    title: string
    link: string
    source: string
    keywords: Array<[string, string, number]>
  }>
  recommendations: string[]
  generated_at: string
}

interface ForecastData {
  summary: {
    total_articles_analyzed: number
    high_risk_articles: number
    medium_risk_articles: number
    low_risk_articles: number
    total_alerts_generated: number
    analysis_timestamp: string
  }
  articles: Array<{
    title: string
    link: string
    source: string
    keywords: Array<[string, string, number]>
    severity: string
    scraped_at: string
  }>
  alerts: CrimeForecastAlert[]
}

export default function CrimeForecastAlerts() {
  const [forecastData, setForecastData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchForecastData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('http://localhost:8000/api/crime-forecast-alerts/')
      const data = await response.json()
      
      if (data.status === 'success') {
        setForecastData(data.forecast_data)
        setLastUpdated(new Date().toLocaleString())
      } else {
        setError(data.message || 'Failed to fetch forecast data')
      }
    } catch (err) {
      setError('Failed to connect to forecast service')
      console.error('Error fetching forecast data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchForecastData()
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchForecastData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return '🚨'
      case 'medium': return '⚠️'
      case 'low': return 'ℹ️'
      default: return '📊'
    }
  }

  if (loading && !forecastData) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Loading crime forecast analysis...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-4xl">⚠️</div>
          <h3 className="text-lg font-semibold text-red-700">Forecast Analysis Error</h3>
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchForecastData} variant="outline">
            Retry Analysis
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Crime Forecast Analysis</h2>
          <p className="text-muted-foreground">
            Real-time analysis of news sources for potential crime indicators
          </p>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>
        <Button onClick={fetchForecastData} disabled={loading} variant="outline">
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
              Analyzing...
            </>
          ) : (
            'Refresh Analysis'
          )}
        </Button>
      </div>

      {/* Summary Stats */}
      {forecastData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {forecastData.summary.total_articles_analyzed}
              </div>
              <div className="text-sm text-muted-foreground">Articles Analyzed</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {forecastData.summary.high_risk_articles}
              </div>
              <div className="text-sm text-muted-foreground">High Risk</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {forecastData.summary.medium_risk_articles}
              </div>
              <div className="text-sm text-muted-foreground">Medium Risk</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {forecastData.summary.total_alerts_generated}
              </div>
              <div className="text-sm text-muted-foreground">Alerts Generated</div>
            </div>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {forecastData && forecastData.alerts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Alerts</h3>
          {forecastData.alerts.map((alert, index) => (
            <Card key={index} className={`p-6 border-l-4 ${getSeverityColor(alert.severity)}`}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
                    <div>
                      <h4 className="text-lg font-semibold">{alert.title}</h4>
                      <p className="text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  <Badge className={getSeverityColor(alert.severity)}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>

                {/* Recommendations */}
                <div>
                  <h5 className="font-medium mb-2">Recommendations:</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {alert.recommendations.map((rec, recIndex) => (
                      <li key={recIndex} className="text-muted-foreground">{rec}</li>
                    ))}
                  </ul>
                </div>

                {/* Related Articles */}
                {alert.articles.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2">Related Articles:</h5>
                    <div className="space-y-2">
                      {alert.articles.map((article, articleIndex) => (
                        <div key={articleIndex} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h6 className="font-medium text-sm">{article.title}</h6>
                              <p className="text-xs text-muted-foreground mt-1">
                                Source: {article.source}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {article.keywords.slice(0, 3).map(([keyword, severity, count], kwIndex) => (
                                  <Badge key={kwIndex} variant="secondary" className="text-xs">
                                    {keyword} ({count})
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(article.link, '_blank')}
                              className="ml-2"
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Generated: {new Date(alert.generated_at).toLocaleString()}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No Alerts */}
      {forecastData && forecastData.alerts.length === 0 && (
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="text-green-500 text-4xl">✅</div>
            <h3 className="text-lg font-semibold text-green-700">No Active Alerts</h3>
            <p className="text-muted-foreground">
              No significant crime indicators detected in recent news analysis.
            </p>
          </div>
        </Card>
      )}

      {/* Recent Articles */}
      {forecastData && forecastData.articles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Crime-Related Articles</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {forecastData.articles.slice(0, 10).map((article, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h6 className="font-medium">{article.title}</h6>
                    <p className="text-sm text-muted-foreground mt-1">
                      {article.source} • {new Date(article.scraped_at).toLocaleString()}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {article.keywords.slice(0, 5).map(([keyword, severity, count], kwIndex) => (
                        <Badge 
                          key={kwIndex} 
                          variant="secondary" 
                          className={`text-xs ${
                            severity === 'high_risk' ? 'bg-red-100 text-red-800' :
                            severity === 'medium_risk' ? 'bg-yellow-100 text-yellow-800' :
                            severity === 'legal_risk' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {keyword} ({count})
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Badge className={getSeverityColor(article.severity)}>
                      {article.severity}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(article.link, '_blank')}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

