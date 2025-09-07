"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin, 
  Clock, 
  Car, 
  Route, 
  AlertTriangle, 
  CheckCircle, 
  Play, 
  Pause, 
  RotateCcw,
  Settings,
  Users,
  Calendar,
  Navigation,
  Zap
} from "lucide-react"

interface CrimeHotspot {
  lat: number
  lng: number
  intensity: number
  area: string
  crimes: number
  risk_level: 'high' | 'medium' | 'low'
  priority: number
  estimated_time: number // minutes to spend at this location
}

interface PatrolRoute {
  id: string
  name: string
  waypoints: Array<{
    lat: number
    lng: number
    name: string
    type: 'hotspot' | 'checkpoint' | 'station'
    priority: number
    estimated_time: number
    status: 'pending' | 'in_progress' | 'completed'
  }>
  total_distance: number
  estimated_duration: number
  status: 'scheduled' | 'active' | 'completed' | 'paused'
  assigned_officers: string[]
  start_time?: Date
  end_time?: Date
  efficiency_score: number
}

interface PatrolSchedulerProps {
  onRouteGenerated?: (route: PatrolRoute) => void
  onRouteStarted?: (route: PatrolRoute) => void
  onLocationUpdate?: (location: {lat: number, lng: number}) => void
  crimeHotspots?: CrimeHotspot[]
}

export default function PatrolScheduler({ onRouteGenerated, onRouteStarted, onLocationUpdate, crimeHotspots }: PatrolSchedulerProps) {
  const [hotspots, setHotspots] = useState<CrimeHotspot[]>([])
  const [generatedRoutes, setGeneratedRoutes] = useState<PatrolRoute[]>([])
  const [activeRoute, setActiveRoute] = useState<PatrolRoute | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning')
  const [availableOfficers, setAvailableOfficers] = useState<string[]>([
    'Officer Kumar', 'Officer Priya', 'Officer Raj', 'Officer Suresh', 'Officer Meera'
  ])
  const [selectedOfficers, setSelectedOfficers] = useState<string[]>([])
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [manualLocation, setManualLocation] = useState<{lat: string, lng: string}>({lat: '', lng: ''})
  const [showManualEntry, setShowManualEntry] = useState(false)

  // Get current location and use crime hotspots
  useEffect(() => {
    getCurrentLocation()
    
    // Use passed crime hotspots if available, otherwise fetch them
    if (crimeHotspots && crimeHotspots.length > 0) {
      console.log('Using passed crime hotspots:', crimeHotspots.length)
      setHotspots(crimeHotspots)
    } else {
      fetchCrimeHotspots()
    }
  }, [crimeHotspots])

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser')
      // Set fallback location
      const fallbackLocation = {
        lat: 13.0827,
        lng: 80.2707
      }
      setCurrentLocation(fallbackLocation)
      onLocationUpdate?.(fallbackLocation)
      return
    }

    setLoading(true)
    setLocationError(null)
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location obtained:', position.coords)
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setCurrentLocation(location)
        setLocationError(null)
        setLoading(false)
        onLocationUpdate?.(location)
      },
      (error) => {
        console.error('Error getting location:', error)
        let errorMessage = 'Unable to get current location. '
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access denied by user.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable.'
            break
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.'
            break
          default:
            errorMessage += 'Unknown error occurred.'
            break
        }
        
        setLocationError(errorMessage + ' Using default location.')
        // Fallback to Chennai center if location access fails
        const fallbackLocation = {
          lat: 13.0827,
          lng: 80.2707
        }
        setCurrentLocation(fallbackLocation)
        onLocationUpdate?.(fallbackLocation)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000 // 1 minute
      }
    )
  }

  const handleManualLocationSubmit = () => {
    const lat = parseFloat(manualLocation.lat)
    const lng = parseFloat(manualLocation.lng)
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid latitude and longitude values')
      return
    }
    
    if (lat < -90 || lat > 90) {
      alert('Latitude must be between -90 and 90 degrees')
      return
    }
    
    if (lng < -180 || lng > 180) {
      alert('Longitude must be between -180 and 180 degrees')
      return
    }
    
    const location = { lat, lng }
    setCurrentLocation(location)
    setLocationError(null)
    setShowManualEntry(false)
    onLocationUpdate?.(location)
    console.log('Manual location set:', { lat, lng })
  }

  const handleManualLocationChange = (field: 'lat' | 'lng', value: string) => {
    setManualLocation(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const testLocation = () => {
    const location = { lat: 13.0827, lng: 80.2707 }
    setCurrentLocation(location)
    setLocationError(null)
    onLocationUpdate?.(location)
    console.log('Test location set to Chennai')
  }

  const fetchCrimeHotspots = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/crime-predictions/?city=TamilNadu&count=50')
      const data = await response.json()
      
      if (data.status === 'success' && data.coordinates) {
        const processedHotspots: CrimeHotspot[] = data.coordinates.map((coord: any, index: number) => {
          const riskLevel = coord.risk_level || (coord.intensity > 0.8 ? 'high' : coord.intensity > 0.5 ? 'medium' : 'low')
          const priority = riskLevel === 'high' ? 3 : riskLevel === 'medium' ? 2 : 1
          const estimatedTime = riskLevel === 'high' ? 15 : riskLevel === 'medium' ? 10 : 5
          
          return {
            lat: coord.lat,
            lng: coord.lng,
            intensity: coord.intensity || 0.5,
            area: coord.area || `Location ${index + 1}`,
            crimes: coord.crimes || Math.floor((coord.intensity || 0.5) * 50),
            risk_level: riskLevel,
            priority,
            estimated_time: estimatedTime
          }
        })
        
        setHotspots(processedHotspots)
      }
    } catch (error) {
      console.error('Failed to fetch crime hotspots:', error)
      // Fallback to demo data
      setHotspots(getDemoHotspots())
    } finally {
      setLoading(false)
    }
  }

  const getDemoHotspots = (): CrimeHotspot[] => [
    {
      lat: 13.0405, lng: 80.2337, intensity: 0.95, area: "T. Nagar Main Road", crimes: 67,
      risk_level: 'high', priority: 3, estimated_time: 15
    },
    {
      lat: 13.0368, lng: 80.2676, intensity: 0.92, area: "Mylapore East", crimes: 58,
      risk_level: 'high', priority: 3, estimated_time: 15
    },
    {
      lat: 13.0064, lng: 80.2206, intensity: 0.88, area: "Guindy Railway Station", crimes: 52,
      risk_level: 'high', priority: 3, estimated_time: 12
    },
    {
      lat: 13.0850, lng: 80.2101, intensity: 0.75, area: "Anna Nagar West", crimes: 48,
      risk_level: 'medium', priority: 2, estimated_time: 10
    },
    {
      lat: 13.0827, lng: 80.2442, intensity: 0.70, area: "Kilpauk Garden Road", crimes: 45,
      risk_level: 'medium', priority: 2, estimated_time: 10
    },
    {
      lat: 13.0678, lng: 80.2785, intensity: 0.65, area: "Central Chennai", crimes: 42,
      risk_level: 'medium', priority: 2, estimated_time: 8
    },
    {
      lat: 13.0458, lng: 80.2209, intensity: 0.55, area: "South Chennai", crimes: 38,
      risk_level: 'low', priority: 1, estimated_time: 5
    },
    {
      lat: 13.1067, lng: 80.2109, intensity: 0.50, area: "North Chennai", crimes: 35,
      risk_level: 'low', priority: 1, estimated_time: 5
    }
  ]

  // TSP-like algorithm for optimal route calculation starting from current location
  const calculateOptimalRoute = (selectedHotspots: CrimeHotspot[]): PatrolRoute => {
    if (selectedHotspots.length === 0) {
      throw new Error('No hotspots selected')
    }

    if (!currentLocation) {
      throw new Error('Current location not available')
    }

    // Filter hotspots to only include those within reasonable distance (local area)
    const localHotspots = filterLocalHotspots(selectedHotspots, currentLocation)
    
    if (localHotspots.length === 0) {
      throw new Error('No local hotspots found within patrol range')
    }

    // Sort hotspots by priority (high to low) and then by intensity
    const sortedHotspots = [...localHotspots].sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority
      return b.intensity - a.intensity
    })

    // Calculate optimal order using nearest neighbor with priority weighting
    const route: CrimeHotspot[] = []
    const remaining = [...sortedHotspots]
    
    // Start from current location and find nearest high-priority hotspot
    let current = currentLocation
    let bestFirst: CrimeHotspot | null = null
    let bestScore = -1

    // Find the best starting hotspot (considering distance from current location and priority)
    for (const hotspot of remaining) {
      const distance = calculateDistance(current, hotspot)
      const priorityScore = hotspot.priority * 1000 // Weight priority heavily
      const intensityScore = hotspot.intensity * 100
      const distanceScore = Math.max(0, 1000 - distance * 50) // Closer is better, but less weight than priority
      
      const totalScore = priorityScore + intensityScore + distanceScore
      
      if (totalScore > bestScore) {
        bestScore = totalScore
        bestFirst = hotspot
      }
    }

    if (bestFirst) {
      route.push(bestFirst)
      remaining.splice(remaining.indexOf(bestFirst), 1)
      current = bestFirst
    }

    // Build route using nearest neighbor with priority consideration
    while (remaining.length > 0) {
      let bestNext: CrimeHotspot | null = null
      let bestScore = -1

      for (const hotspot of remaining) {
        const distance = calculateDistance(current, hotspot)
        const priorityScore = hotspot.priority * 1000 // Weight priority heavily
        const intensityScore = hotspot.intensity * 100
        const distanceScore = Math.max(0, 1000 - distance * 100) // Closer is better
        
        const totalScore = priorityScore + intensityScore + distanceScore
        
        if (totalScore > bestScore) {
          bestScore = totalScore
          bestNext = hotspot
        }
      }

      if (bestNext) {
        route.push(bestNext)
        remaining.splice(remaining.indexOf(bestNext), 1)
        current = bestNext
      }
    }

    // Calculate total distance and duration (including distance from current location to first hotspot)
    let totalDistance = 0
    let totalDuration = 0

    // Add distance from current location to first hotspot
    if (route.length > 0) {
      totalDistance += calculateDistance(currentLocation, route[0])
    }

    for (let i = 0; i < route.length; i++) {
      if (i > 0) {
        totalDistance += calculateDistance(route[i - 1], route[i])
      }
      totalDuration += route[i].estimated_time
    }

    // Add travel time (assuming 30 km/h average speed)
    const travelTime = (totalDistance / 30) * 60 // Convert to minutes
    totalDuration += travelTime

    // Calculate efficiency score (higher is better)
    const efficiencyScore = Math.round(
      (route.reduce((sum, h) => sum + h.priority * h.intensity, 0) / route.length) * 100
    )

    // Create optimized path with intermediate waypoints for fastest route
    const optimizedPath = calculateFastestPath(currentLocation, route)
    
    const patrolRoute: PatrolRoute = {
      id: `route_${Date.now()}`,
      name: `${selectedTimeframe.charAt(0).toUpperCase() + selectedTimeframe.slice(1)} Patrol Route`,
      waypoints: optimizedPath.map((point, index) => ({
        lat: point.lat,
        lng: point.lng,
        name: point.name,
        type: point.type,
        priority: point.priority,
        estimated_time: point.estimated_time,
        status: point.status
      })),
      total_distance: Math.round(totalDistance * 100) / 100,
      estimated_duration: Math.round(totalDuration),
      status: 'scheduled',
      assigned_officers: selectedOfficers.length > 0 ? selectedOfficers : [availableOfficers[0]],
      efficiency_score: efficiencyScore
    }

    return patrolRoute
  }

  const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number => {
    const R = 6371 // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180
    const dLon = (point2.lng - point1.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const filterLocalHotspots = (hotspots: CrimeHotspot[], currentLocation: {lat: number, lng: number}): CrimeHotspot[] => {
    // Define city boundaries and patrol radius
    const cityBoundaries = {
      chennai: {
        center: { lat: 13.0827, lng: 80.2707 },
        radius: 25, // 25km radius for Chennai
        name: 'Chennai'
      },
      salem: {
        center: { lat: 11.6643, lng: 78.1460 },
        radius: 20, // 20km radius for Salem
        name: 'Salem'
      },
      madurai: {
        center: { lat: 9.9252, lng: 78.1198 },
        radius: 20, // 20km radius for Madurai
        name: 'Madurai'
      },
      coimbatore: {
        center: { lat: 11.0168, lng: 76.9558 },
        radius: 20, // 20km radius for Coimbatore
        name: 'Coimbatore'
      }
    }

    // Determine which city the user is in
    let userCity = null
    let maxDistance = 50 // Default max distance if no city match

    for (const [cityName, cityData] of Object.entries(cityBoundaries)) {
      const distance = calculateDistance(currentLocation, cityData.center)
      if (distance <= cityData.radius) {
        userCity = cityData
        maxDistance = cityData.radius
        console.log(`User is in ${cityData.name}, using ${maxDistance}km patrol radius`)
        break
      }
    }

    if (!userCity) {
      // If not in any defined city, use a smaller default radius
      maxDistance = 15 // 15km default radius for other areas
      console.log(`User not in major city, using ${maxDistance}km default patrol radius`)
    }

    // Filter hotspots within the patrol radius
    const localHotspots = hotspots.filter(hotspot => {
      const distance = calculateDistance(currentLocation, hotspot)
      return distance <= maxDistance
    })

    console.log(`Filtered ${localHotspots.length} local hotspots from ${hotspots.length} total hotspots`)
    console.log(`Patrol radius: ${maxDistance}km from current location`)
    
    return localHotspots
  }

  const calculateFastestPath = (startLocation: {lat: number, lng: number}, hotspots: CrimeHotspot[]) => {
    const path = []
    
    // Add starting location
    path.push({
      lat: startLocation.lat,
      lng: startLocation.lng,
      name: 'Current Location',
      type: 'station' as const,
      priority: 0,
      estimated_time: 0,
      status: 'completed' as const
    })

    // Add intermediate waypoints for smoother route
    let currentPoint = startLocation
    
    hotspots.forEach((hotspot, index) => {
      // Add intermediate waypoints for better route visualization
      const intermediatePoints = generateIntermediateWaypoints(currentPoint, hotspot, index + 1)
      path.push(...intermediatePoints)
      
      // Add the actual hotspot
      path.push({
        lat: hotspot.lat,
        lng: hotspot.lng,
        name: hotspot.area,
        type: 'hotspot' as const,
        priority: hotspot.priority,
        estimated_time: hotspot.estimated_time,
        status: 'pending' as const
      })
      
      currentPoint = hotspot
    })

    return path
  }

  const generateIntermediateWaypoints = (start: {lat: number, lng: number}, end: CrimeHotspot, segmentIndex: number) => {
    const waypoints = []
    const distance = calculateDistance(start, end)
    
    // Add intermediate waypoints for routes longer than 2km
    if (distance > 2) {
      const numWaypoints = Math.min(Math.floor(distance / 1.5), 3) // Max 3 intermediate points
      
      for (let i = 1; i <= numWaypoints; i++) {
        const ratio = i / (numWaypoints + 1)
        const lat = start.lat + (end.lat - start.lat) * ratio
        const lng = start.lng + (end.lng - start.lng) * ratio
        
        waypoints.push({
          lat: lat,
          lng: lng,
          name: `Route Point ${segmentIndex}.${i}`,
          type: 'checkpoint' as const,
          priority: 0,
          estimated_time: 0,
          status: 'pending' as const
        })
      }
    }
    
    return waypoints
  }

  const generatePatrolRoute = () => {
    console.log('Generating patrol route...')
    console.log('Current location:', currentLocation)
    console.log('Available hotspots:', hotspots.length)
    
    if (hotspots.length === 0) {
      console.log('No crime hotspots available for route generation')
      return
    }

    if (!currentLocation) {
      console.log('Current location not available for route generation')
      return
    }

    setLoading(true)
    try {
      // Select top hotspots based on priority and intensity
      const topHotspots = hotspots
        .sort((a, b) => {
          if (a.priority !== b.priority) return b.priority - a.priority
          return b.intensity - a.intensity
        })
        .slice(0, Math.min(6, hotspots.length)) // Limit to 6 hotspots for manageable routes

      console.log('Selected hotspots for route:', topHotspots)
      const newRoute = calculateOptimalRoute(topHotspots)
      console.log('Generated route:', newRoute)
      
      setGeneratedRoutes(prev => [newRoute, ...prev])
      onRouteGenerated?.(newRoute)
    } catch (error) {
      console.error('Error generating patrol route:', error)
      if (error instanceof Error && error.message.includes('No local hotspots')) {
        console.log('No crime hotspots found within patrol area')
      } else {
        console.log('Error generating patrol route:', (error as Error).message)
      }
    } finally {
      setLoading(false)
    }
  }

  const startPatrol = (route: PatrolRoute) => {
    const updatedRoute = {
      ...route,
      status: 'active' as const,
      start_time: new Date()
    }
    setActiveRoute(updatedRoute)
    setGeneratedRoutes(prev => prev.map(r => r.id === route.id ? updatedRoute : r))
    onRouteStarted?.(updatedRoute)
  }

  const pausePatrol = (route: PatrolRoute) => {
    const updatedRoute = {
      ...route,
      status: 'paused' as const
    }
    setActiveRoute(route.status === 'active' ? null : updatedRoute)
    setGeneratedRoutes(prev => prev.map(r => r.id === route.id ? updatedRoute : r))
  }

  const completePatrol = (route: PatrolRoute) => {
    const updatedRoute = {
      ...route,
      status: 'completed' as const,
      end_time: new Date()
    }
    setActiveRoute(null)
    setGeneratedRoutes(prev => prev.map(r => r.id === route.id ? updatedRoute : r))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return 'bg-red-100 text-red-800'
      case 2: return 'bg-yellow-100 text-yellow-800'
      case 1: return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Patrol Scheduler</h2>
          <p className="text-muted-foreground">
            AI-powered patrol route optimization based on crime hotspots
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchCrimeHotspots} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button 
            onClick={generatePatrolRoute} 
            disabled={loading || hotspots.length === 0 || !currentLocation}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate Route
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Location Status */}
      {locationError && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">{locationError}</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={getCurrentLocation}
                className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
              >
                Retry
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowManualEntry(!showManualEntry)}
                className="text-purple-700 border-purple-300 hover:bg-purple-100"
              >
                Manual Entry
              </Button>
            </div>
          </div>
        </Card>
      )}

      {currentLocation && (
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-green-800 font-medium">
                  Current location detected
                </p>
                <p className="text-xs text-green-600">
                  {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={getCurrentLocation}
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Update
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testLocation}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                Test Location
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowManualEntry(!showManualEntry)}
                className="text-purple-700 border-purple-300 hover:bg-purple-100"
              >
                Manual Entry
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* No Location Detected */}
      {!currentLocation && !locationError && (
        <Card className="p-4 border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-gray-600" />
              <p className="text-sm text-gray-800">No location detected</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={getCurrentLocation}
                className="text-gray-700 border-gray-300 hover:bg-gray-100"
              >
                Get Location
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowManualEntry(!showManualEntry)}
                className="text-purple-700 border-purple-300 hover:bg-purple-100"
              >
                Manual Entry
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Manual Location Entry */}
      {showManualEntry && (
        <Card className="p-4 border-purple-200 bg-purple-50">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-medium text-purple-800">Manual Location Entry</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-purple-700 mb-1">
                  Latitude (-90 to 90)
                </label>
                <input
                  type="number"
                  step="any"
                  value={manualLocation.lat}
                  onChange={(e) => handleManualLocationChange('lat', e.target.value)}
                  placeholder="e.g., 13.0827"
                  className="w-full px-3 py-2 text-sm border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-700 mb-1">
                  Longitude (-180 to 180)
                </label>
                <input
                  type="number"
                  step="any"
                  value={manualLocation.lng}
                  onChange={(e) => handleManualLocationChange('lng', e.target.value)}
                  placeholder="e.g., 80.2707"
                  className="w-full px-3 py-2 text-sm border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                size="sm"
                onClick={handleManualLocationSubmit}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Set Location
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowManualEntry(false)}
                className="text-purple-700 border-purple-300 hover:bg-purple-100"
              >
                Cancel
              </Button>
            </div>
            <div className="text-xs text-purple-600">
              <p className="font-medium mb-1">Quick coordinates for major cities:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Chennai: 13.0827, 80.2707</div>
                <div>Salem: 11.6643, 78.1460</div>
                <div>Madurai: 9.9252, 78.1198</div>
                <div>Coimbatore: 11.0168, 76.9558</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Configuration Panel */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Timeframe Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Patrol Timeframe</label>
            <div className="grid grid-cols-2 gap-2">
              {(['morning', 'afternoon', 'evening', 'night'] as const).map((timeframe) => (
                <Button
                  key={timeframe}
                  variant={selectedTimeframe === timeframe ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe(timeframe)}
                  className="text-xs"
                >
                  {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Officer Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Available Officers</label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {availableOfficers.map((officer) => (
                <label key={officer} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedOfficers.includes(officer)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOfficers(prev => [...prev, officer])
                      } else {
                        setSelectedOfficers(prev => prev.filter(o => o !== officer))
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{officer}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Hotspot Summary */}
          <div>
            <label className="block text-sm font-medium mb-2">Crime Hotspots</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Total Hotspots:</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {hotspots.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>High Priority:</span>
                <Badge className="bg-red-100 text-red-800">
                  {hotspots.filter(h => h.priority === 3).length}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Medium Priority:</span>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {hotspots.filter(h => h.priority === 2).length}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Low Priority:</span>
                <Badge className="bg-green-100 text-green-800">
                  {hotspots.filter(h => h.priority === 1).length}
                </Badge>
              </div>
              {hotspots.length > 0 && (
                <div className="text-xs text-muted-foreground mt-2">
                  Route will cover top {Math.min(6, hotspots.length)} local hotspots within patrol area
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Generated Routes */}
      {generatedRoutes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generated Patrol Routes</h3>
          {generatedRoutes.map((route) => (
            <Card key={route.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                      <Route className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">{route.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {route.waypoints.length} waypoints • {route.assigned_officers.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(route.status)}>
                      {route.status.toUpperCase()}
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-800">
                      Efficiency: {route.efficiency_score}%
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Navigation className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{route.total_distance} km</p>
                      <p className="text-xs text-muted-foreground">Total Distance</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{route.estimated_duration} min</p>
                      <p className="text-xs text-muted-foreground">Est. Duration</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{route.assigned_officers.length}</p>
                      <p className="text-xs text-muted-foreground">Officers</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{route.waypoints.length}</p>
                      <p className="text-xs text-muted-foreground">Waypoints</p>
                    </div>
                  </div>
                </div>

                {/* Route Waypoints */}
                <div>
                  <h5 className="font-medium mb-2">Route Waypoints:</h5>
                  <div className="space-y-2">
                    {route.waypoints.map((waypoint, index) => {
                      const isCurrentLocation = waypoint.type === 'station' && waypoint.name === 'Current Location'
                      return (
                        <div key={index} className="flex items-center space-x-3 p-2 bg-muted/50 rounded-lg">
                          <div className={`w-6 h-6 ${isCurrentLocation ? 'bg-blue-600' : 'bg-blue-600'} text-white rounded-full flex items-center justify-center text-xs font-bold`}>
                            {isCurrentLocation ? '📍' : index}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{waypoint.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {isCurrentLocation ? 'Starting Point' : `${waypoint.estimated_time} min • Priority: ${waypoint.priority}`}
                            </p>
                          </div>
                          {!isCurrentLocation && (
                            <Badge className={getPriorityColor(waypoint.priority)}>
                              {waypoint.priority === 3 ? 'High' : waypoint.priority === 2 ? 'Medium' : 'Low'}
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  {route.status === 'scheduled' && (
                    <Button onClick={() => startPatrol(route)} size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Start Patrol
                    </Button>
                  )}
                  {route.status === 'active' && (
                    <>
                      <Button onClick={() => pausePatrol(route)} variant="outline" size="sm">
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                      <Button onClick={() => completePatrol(route)} variant="outline" size="sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete
                      </Button>
                    </>
                  )}
                  {route.status === 'paused' && (
                    <Button onClick={() => startPatrol(route)} size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  {route.status === 'completed' && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Active Patrol Status */}
      {activeRoute && (
        <Card className="p-6 border-green-200 bg-green-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-green-800">Active Patrol</h4>
              <p className="text-sm text-green-600">
                {activeRoute.name} • Started at {activeRoute.start_time?.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* No Routes Message */}
      {generatedRoutes.length === 0 && !loading && (
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Route className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No Patrol Routes Generated</h3>
              <p className="text-muted-foreground">
                Click "Generate Route" to create an optimized patrol schedule based on current crime hotspots.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
