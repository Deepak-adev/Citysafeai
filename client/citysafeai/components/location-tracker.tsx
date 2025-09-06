"use client"

import { useEffect, useState } from 'react'

interface LocationTrackerProps {
  onLocationUpdate: (lat: number, lng: number) => void
}

export default function LocationTracker({ onLocationUpdate }: LocationTrackerProps) {
  const [watchId, setWatchId] = useState<number | null>(null)
  const [permissionGranted, setPermissionGranted] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported')
      return
    }

    // Request location permission
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPermissionGranted(true)
        onLocationUpdate(position.coords.latitude, position.coords.longitude)
        
        // Start watching location
        const id = navigator.geolocation.watchPosition(
          (position) => {
            onLocationUpdate(position.coords.latitude, position.coords.longitude)
          },
          (error) => console.error('Location error:', error),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000
          }
        )
        setWatchId(id)
      },
      (error) => {
        console.error('Location permission denied:', error)
        alert('Please enable location access for safety monitoring')
      }
    )

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [onLocationUpdate])

  return null
}