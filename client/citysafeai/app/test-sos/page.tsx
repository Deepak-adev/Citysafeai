"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function TestSOSPage() {
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testTelegramSOS = async () => {
    setLoading(true)
    setTestResult('')
    
    try {
      const response = await fetch('http://localhost:8000/api/send-sos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Test User',
          phone: '+91-9876543210',
          location: '13.0827, 80.2707',
          duration_minutes: 5
        })
      })

      const result = await response.json()
      setTestResult(JSON.stringify(result, null, 2))
    } catch (error) {
      setTestResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testHotspotCheck = async () => {
    setLoading(true)
    setTestResult('')
    
    try {
      const response = await fetch('http://localhost:8000/api/check-hotspot/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: 13.0827,
          lng: 80.2707,
          username: 'Test User',
          phone: '+91-9876543210'
        })
      })

      const result = await response.json()
      setTestResult(JSON.stringify(result, null, 2))
    } catch (error) {
      setTestResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">SOS Feature Test</h1>
        
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Test Telegram SOS Alert</h2>
            <Button 
              onClick={testTelegramSOS} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Sending...' : 'Send Test SOS Alert'}
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Test Hotspot Detection</h2>
            <Button 
              onClick={testHotspotCheck} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Checking...' : 'Check Hotspot Status'}
            </Button>
          </Card>

          {testResult && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {testResult}
              </pre>
            </Card>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Bot Token:</strong> 8347422810:AAFQ7CT5BXT0fqk9_X9ehO9gUGwaWqfX7YA</p>
          <p><strong>Chat ID:</strong> 5527167310</p>
        </div>
      </div>
    </div>
  )
}