"use client"

import { useEffect, useState } from 'react'

interface HotspotMonitorProps {
  userLat: number
  userLng: number
  username: string
}

const HOTSPOTS = [
  { lat: 13.0405, lng: 80.2337, intensity: 0.95, radius: 0.01 },
  { lat: 13.0368, lng: 80.2676, intensity: 0.92, radius: 0.01 },
  { lat: 13.0064, lng: 80.2206, intensity: 0.88, radius: 0.01 },
  { lat: 13.0850, lng: 80.2101, intensity: 0.85, radius: 0.01 },
  { lat: 13.0827, lng: 80.2442, intensity: 0.82, radius: 0.01 }
]

const ALERT_THRESHOLD = 5 * 60 * 1000 // 5 minutes in milliseconds

export default function HotspotMonitor({ userLat, userLng, username }: HotspotMonitorProps) {
  const [hotspotEntry, setHotspotEntry] = useState<number | null>(null)
  const [alertSent, setAlertSent] = useState(false)

  useEffect(() => {
    const isInHotspot = HOTSPOTS.some(hotspot => {
      const distance = Math.sqrt(
        Math.pow(userLat - hotspot.lat, 2) + Math.pow(userLng - hotspot.lng, 2)
      )
      return distance < hotspot.radius && hotspot.intensity > 0.8
    })

    if (isInHotspot) {
      if (!hotspotEntry) {
        setHotspotEntry(Date.now())
        setAlertSent(false)
      } else {
        const timeInHotspot = Date.now() - hotspotEntry
        if (timeInHotspot > ALERT_THRESHOLD && !alertSent) {
          sendAlert()
          setAlertSent(true)
        }
      }
    } else {
      setHotspotEntry(null)
      setAlertSent(false)
    }
  }, [userLat, userLng, hotspotEntry, alertSent])

  const sendAlert = async () => {
    try {
      const emergencyContacts = JSON.parse(localStorage.getItem('emergencyContacts') || '[]')
      
      if (emergencyContacts.length === 0) {
        console.warn('No emergency contacts found')
        return
      }

      const alertData = {
        username,
        location: `${userLat.toFixed(6)}, ${userLng.toFixed(6)}`,
        timestamp: new Date().toISOString(),
        contacts: emergencyContacts
      }

      // Send alert to backend
      await fetch('http://localhost:8000/api/send-alert/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData)
      })

      console.log('Alert sent successfully')
    } catch (error) {
      console.error('Failed to send alert:', error)
    }
  }

  return null
}