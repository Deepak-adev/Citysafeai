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
  Zap,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  BarChart3,
  TrendingUp,
  Activity
} from "lucide-react"
import MapComponent from "./map-component"
import PatrolScheduler from "./patrol-scheduler"

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

export default function PatrolManagement() {
  const [activeRoute, setActiveRoute] = useState<PatrolRoute | null>(null)
  const [showMap, setShowMap] = useState(true)
  const [mapExpanded, setMapExpanded] = useState(false)
  const [selectedLayer, setSelectedLayer] = useState('heatmap') // Start with heatmap to show crime hotspots
  const [crimeHotspots, setCrimeHotspots] = useState<any[]>([])
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [patrolArea, setPatrolArea] = useState<string>('Unknown')
  const [userRole, setUserRole] = useState<string>('')
  const [patrolStats, setPatrolStats] = useState({
    totalRoutes: 0,
    activeRoutes: 0,
    completedToday: 0,
    avgEfficiency: 0,
    totalDistance: 0,
    totalTime: 0
  })

  const handleRouteGenerated = (route: PatrolRoute) => {
    setActiveRoute(route)
    setSelectedLayer('patrolRoute')
    updatePatrolStats()
  }

  const handleRouteStarted = (route: PatrolRoute) => {
    setActiveRoute(route)
    updatePatrolStats()
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setUserLocation(location)
        
        // Determine patrol area based on location
        const area = determinePatrolArea(location)
        setPatrolArea(area)
        console.log(`User location: ${location.lat}, ${location.lng} - Patrol area: ${area}`)
      },
      (error) => {
        console.error('Error getting location:', error)
        setPatrolArea('Chennai (Default)')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }

  const determinePatrolArea = (location: {lat: number, lng: number}): string => {
    const cityBoundaries = {
      chennai: { center: { lat: 13.0827, lng: 80.2707 }, radius: 25, name: 'Chennai' },
      salem: { center: { lat: 11.6643, lng: 78.1460 }, radius: 20, name: 'Salem' },
      madurai: { center: { lat: 9.9252, lng: 78.1198 }, radius: 20, name: 'Madurai' },
      coimbatore: { center: { lat: 11.0168, lng: 76.9558 }, radius: 20, name: 'Coimbatore' }
    }

    for (const [cityName, cityData] of Object.entries(cityBoundaries)) {
      const distance = calculateDistance(location, cityData.center)
      if (distance <= cityData.radius) {
        return cityData.name
      }
    }
    
    return 'Local Area'
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

  const fetchCrimeHotspots = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/crime-predictions/?city=TamilNadu&count=50')
      const data = await response.json()
      
      if (data.status === 'success' && data.coordinates) {
        const processedHotspots = data.coordinates.map((coord: any, index: number) => {
          const riskLevel = coord.risk_level || (coord.intensity > 0.8 ? 'high' : coord.intensity > 0.5 ? 'medium' : 'low')
          const priority = riskLevel === 'high' ? 3 : riskLevel === 'medium' ? 2 : 1
          const estimatedTime = riskLevel === 'high' ? 15 : riskLevel === 'medium' ? 10 : 5
          
          return {
            lat: coord.lat,
            lng: coord.lng,
            intensity: coord.intensity || 0.5,
            area: coord.area || `Crime Hotspot ${index + 1}`,
            crimes: coord.crimes || Math.floor((coord.intensity || 0.5) * 50),
            risk_level: riskLevel,
            priority,
            estimated_time: estimatedTime
          }
        })
        
        setCrimeHotspots(processedHotspots)
        console.log('Fetched crime hotspots for patrol management:', processedHotspots.length)
      }
    } catch (error) {
      console.error('Failed to fetch crime hotspots:', error)
      // Use demo data as fallback
      setCrimeHotspots(getDemoHotspots())
    }
  }

  const getDemoHotspots = () => [
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
    }
  ]

  const updatePatrolStats = () => {
    // This would typically fetch from a backend API
    // For now, we'll use mock data
    setPatrolStats({
      totalRoutes: 12,
      activeRoutes: 3,
      completedToday: 8,
      avgEfficiency: 87,
      totalDistance: 156.7,
      totalTime: 1240
    })
  }

  useEffect(() => {
    // Load user role from localStorage
    const storedRole = localStorage.getItem("userRole")
    console.log('Patrol management - loaded user role:', storedRole)
    if (storedRole) {
      setUserRole(storedRole)
    }
    
    updatePatrolStats()
    getUserLocation()
    fetchCrimeHotspots()
  }, [])

  // Debug MapComponent props
  useEffect(() => {
    console.log('MapComponent props:', { 
      activeLayer: selectedLayer, 
      userRole, 
      hasPatrolRoute: !!activeRoute, 
      hasCurrentLocation: !!userLocation 
    })
  }, [selectedLayer, userRole, activeRoute, userLocation])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Patrol Management</h2>
          <p className="text-muted-foreground">
            AI-powered patrol scheduling and real-time monitoring
          </p>
          {patrolArea && (
            <div className="flex items-center space-x-2 mt-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Patrol Area: {patrolArea}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchCrimeHotspots}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh Hotspots
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowMap(!showMap)}
          >
            {showMap ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showMap ? 'Hide Map' : 'Show Map'}
          </Button>
          {showMap && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setMapExpanded(!mapExpanded)}
            >
              {mapExpanded ? <Minimize2 className="w-4 h-4 mr-2" /> : <Maximize2 className="w-4 h-4 mr-2" />}
              {mapExpanded ? 'Minimize' : 'Expand'} Map
            </Button>
          )}
        </div>
      </div>

      {/* Crime Hotspots Summary */}
      {crimeHotspots.length > 0 && (
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-orange-800">Active Crime Hotspots</h3>
                <p className="text-sm text-orange-600">
                  {crimeHotspots.length} total hotspots • 
                  {crimeHotspots.filter(h => h.priority === 3).length} high priority • 
                  {crimeHotspots.filter(h => h.priority === 2).length} medium priority
                </p>
                <p className="text-xs text-orange-500 mt-1">
                  Routes will be generated within {patrolArea} area only
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedLayer('heatmap')}
              className="text-orange-700 border-orange-300 hover:bg-orange-100"
            >
              View on Map
            </Button>
          </div>
        </Card>
      )}

      {/* Patrol Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Route className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{patrolStats.totalRoutes}</p>
              <p className="text-sm text-blue-700">Total Routes</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900">{patrolStats.activeRoutes}</p>
              <p className="text-sm text-green-700">Active Routes</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-900">{patrolStats.avgEfficiency}%</p>
              <p className="text-sm text-purple-700">Avg Efficiency</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Navigation className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-900">{patrolStats.totalDistance}km</p>
              <p className="text-sm text-orange-700">Total Distance</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Layout */}
      <div className={`grid gap-6 ${showMap ? (mapExpanded ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2') : 'grid-cols-1'}`}>
        {/* Patrol Scheduler */}
        <div className={`${showMap && !mapExpanded ? 'order-2 lg:order-1' : ''}`}>
            <PatrolScheduler 
              onRouteGenerated={handleRouteGenerated}
              onRouteStarted={handleRouteStarted}
              onLocationUpdate={(location) => {
                console.log('Location updated in patrol management:', location)
                setUserLocation(location)
              }}
              crimeHotspots={crimeHotspots}
            />
        </div>

        {/* Map Component */}
        {showMap && (
          <div className={`${mapExpanded ? 'order-1' : 'order-1 lg:order-2'}`}>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Patrol Route Map</h3>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    {selectedLayer === 'patrolRoute' ? 'Route View' : 'Standard View'}
                  </Badge>
                  {activeRoute && (
                    <Badge className={getStatusColor(activeRoute.status)}>
                      {activeRoute.status.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className={`${mapExpanded ? 'h-[600px]' : 'h-[400px]'} rounded-lg overflow-hidden`}>
                <MapComponent 
                  activeLayer={selectedLayer}
                  patrolRoute={activeRoute || undefined}
                  currentLocation={userLocation || undefined}
                  userRole={userRole}
                />
              </div>

              {/* Map Controls */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant={selectedLayer === 'heatmap' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedLayer('heatmap')}
                  >
                    Crime Hotspots
                  </Button>
                  <Button
                    variant={selectedLayer === 'patrolRoute' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedLayer('patrolRoute')}
                  >
                    Patrol Routes
                  </Button>
                  <Button
                    variant={selectedLayer === 'alerts' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedLayer('alerts')}
                  >
                    Active Alerts
                  </Button>
                </div>
                
                {activeRoute && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{activeRoute.name}</span>
                    <span className="mx-2">•</span>
                    <span>{activeRoute.total_distance}km</span>
                    <span className="mx-2">•</span>
                    <span>{activeRoute.estimated_duration}min</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Active Route Status */}
      {activeRoute && (
        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold">{activeRoute.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {activeRoute.assigned_officers.join(', ')} • 
                  {activeRoute.waypoints.length} waypoints • 
                  Efficiency: {activeRoute.efficiency_score}%
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">
                  {activeRoute.total_distance} km • {activeRoute.estimated_duration} min
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeRoute.status === 'active' && activeRoute.start_time && 
                    `Started: ${activeRoute.start_time.toLocaleTimeString()}`
                  }
                </p>
              </div>
              <Badge className={getStatusColor(activeRoute.status)}>
                {activeRoute.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Route Progress */}
          {activeRoute.status === 'active' && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Route Progress</span>
                <span>
                  {activeRoute.waypoints.filter(w => w.status === 'completed').length - 1} / {activeRoute.waypoints.length - 1} hotspots
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(0, ((activeRoute.waypoints.filter(w => w.status === 'completed').length - 1) / (activeRoute.waypoints.length - 1)) * 100)}%`
                  }}
                ></div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
            <Settings className="w-6 h-6" />
            <span>Route Settings</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
            <BarChart3 className="w-6 h-6" />
            <span>Analytics</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
            <Users className="w-6 h-6" />
            <span>Officer Management</span>
          </Button>
        </div>
      </Card>
    </div>
  )
}
