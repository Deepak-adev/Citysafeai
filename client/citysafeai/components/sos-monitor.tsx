"use client"

import { useEffect, useState, useRef } from 'react'

interface SOSMonitorProps {
  userLat: number
  userLng: number
  username: string
  phone?: string
}

export default function SOSMonitor({ userLat, userLng, username, phone }: SOSMonitorProps) {
  const [inHotspot, setInHotspot] = useState(false)
  const [hotspotStartTime, setHotspotStartTime] = useState<number | null>(null)
  const [sosTriggered, setSosTriggered] = useState(false)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const sosTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const SOS_THRESHOLD_MINUTES = 5 // Trigger SOS after 5 minutes in hotspot

  useEffect(() => {
    if (userLat === 0 || userLng === 0) return

    const checkHotspotStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/check-hotspot/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: userLat,
            lng: userLng,
            username,
            phone: phone || localStorage.getItem('userPhone') || 'Not provided'
          })
        })

        const data = await response.json()
        
        if (data.in_hotspot && !inHotspot) {
          // User entered hotspot
          setInHotspot(true)
          setHotspotStartTime(Date.now())
          setSosTriggered(false)
          
          // Set SOS timer
          sosTimeoutRef.current = setTimeout(() => {
            triggerSOS()
          }, SOS_THRESHOLD_MINUTES * 60 * 1000)
          
        } else if (!data.in_hotspot && inHotspot) {
          // User left hotspot
          setInHotspot(false)
          setHotspotStartTime(null)
          setSosTriggered(false)
          
          if (sosTimeoutRef.current) {
            clearTimeout(sosTimeoutRef.current)
            sosTimeoutRef.current = null
          }
        }
      } catch (error) {
        console.error('Error checking hotspot status:', error)
      }
    }

    const triggerSOS = async () => {
      if (sosTriggered) return
      
      setSosTriggered(true)
      
      try {
        const response = await fetch('http://localhost:8000/api/send-sos/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            phone: phone || localStorage.getItem('userPhone') || 'Not provided',
            location: `${userLat}, ${userLng}`,
            duration_minutes: SOS_THRESHOLD_MINUTES
          })
        })

        const result = await response.json()
        
        if (result.status === 'success') {
          // Show success notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('SOS Alert Sent', {
              body: 'Emergency services have been notified of your location.',
              icon: '/favicon.ico'
            })
          }
        }
      } catch (error) {
        console.error('Error sending SOS:', error)
      }
    }

    // Check hotspot status every 30 seconds
    checkHotspotStatus()
    checkIntervalRef.current = setInterval(checkHotspotStatus, 30000)

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      if (sosTimeoutRef.current) {
        clearTimeout(sosTimeoutRef.current)
      }
    }
  }, [userLat, userLng, username, phone, inHotspot, sosTriggered])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const getTimeInHotspot = () => {
    if (!hotspotStartTime) return 0
    return Math.floor((Date.now() - hotspotStartTime) / 1000 / 60)
  }

  if (!inHotspot && !sosTriggered) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] max-w-sm">
      <div className={`p-4 rounded-lg shadow-lg border-2 ${
        sosTriggered 
          ? 'bg-red-100 border-red-500 text-red-800' 
          : 'bg-yellow-100 border-yellow-500 text-yellow-800'
      }`}>
        <div className="flex items-center space-x-2">
          <div className="text-2xl">
            {sosTriggered ? '🚨' : '⚠️'}
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm">
              {sosTriggered ? 'SOS Alert Sent!' : 'Hotspot Warning'}
            </div>
            <div className="text-xs">
              {sosTriggered 
                ? 'Emergency services notified'
                : `In hotspot for ${getTimeInHotspot()}/${SOS_THRESHOLD_MINUTES} min`
              }
            </div>
          </div>
        </div>
        
        {inHotspot && !sosTriggered && (
          <div className="mt-2">
            <div className="w-full bg-yellow-200 rounded-full h-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${Math.min((getTimeInHotspot() / SOS_THRESHOLD_MINUTES) * 100, 100)}%` 
                }}
              />
            </div>
            <div className="text-xs mt-1 text-center">
              SOS will trigger in {SOS_THRESHOLD_MINUTES - getTimeInHotspot()} minutes
            </div>
          </div>
        )}
      </div>
    </div>
  )
}