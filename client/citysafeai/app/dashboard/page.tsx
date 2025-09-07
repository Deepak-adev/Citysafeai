"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { IncidentReportForm } from "@/components/incident-form"
import SafeZoneFinder from "@/components/safe-zone-finder"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Dynamically import map component to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-card rounded-lg flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
})

// Dynamically import patrol management component
const PatrolManagement = dynamic(() => import("@/components/patrol-management"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-card rounded-lg flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-muted-foreground">Loading patrol management...</p>
      </div>
    </div>
  ),
})

interface SafePlace {
  id: string
  name: string
  type: 'police' | 'hospital' | 'shelter' | 'women_help'
  lat: number
  lng: number
  address: string
  phone?: string
  hours?: string
  distance?: number
  emergency?: boolean
  description?: string
}

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<string>("")
  const [username, setUsername] = useState<string>("")
  const [activeLayer, setActiveLayer] = useState<string>("heatmap") // Set default layer to heatmap
  const [source, setSource] = useState<string>("")
  const [destination, setDestination] = useState<string>("")
  const [showRoute, setShowRoute] = useState(false)
  const [publicReports, setPublicReports] = useState<any[]>([])
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [safePlaces, setSafePlaces] = useState<SafePlace[]>([])
  const [showSafeZones, setShowSafeZones] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | undefined>()
  const router = useRouter()

  // Load user data on mount
  useEffect(() => {
    const storedRole = localStorage.getItem("userRole")
    const storedUsername = localStorage.getItem("username")
    const selectedFeature = localStorage.getItem("selectedFeature")
    
    if (!storedRole || !storedUsername) {
      router.push("/")
      return
    }

    setUserRole(storedRole)
    setUsername(storedUsername)
    
    // Auto-select feature if coming from feature dashboard
    if (selectedFeature) {
      setActiveLayer(selectedFeature)
      // Don't remove selectedFeature immediately - let it persist
    } else {
      // If no feature selected, redirect to appropriate dashboard
      if (storedRole === "public") {
        router.push("/public-dashboard")
      } else if (storedRole === "police") {
        router.push("/police-dashboard")
      }
    }
  }, [router])

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.log('Could not get location:', error)
          // Default to Chennai if location access denied
          setUserLocation({
            lat: 13.0827,
            lng: 80.2707
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      )
    } else {
      // Default to Chennai if geolocation not supported
      setUserLocation({
        lat: 13.0827,
        lng: 80.2707
      })
    }
  }, [])

  // Load public reports and refresh when dialog closes
  useEffect(() => {
    const reports = JSON.parse(localStorage.getItem("publicReports") || "[]")
    setPublicReports(reports)
  }, [isReportModalOpen]) // Reload reports when dialog state changes

  // Clean up selectedFeature after component is fully mounted
  useEffect(() => {
    const selectedFeature = localStorage.getItem("selectedFeature")
    if (selectedFeature && activeLayer === selectedFeature) {
      // Small delay to ensure the map is loaded
      const timer = setTimeout(() => {
        localStorage.removeItem("selectedFeature")
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [activeLayer])

  const handleRouteSearch = () => {
    if (source && destination) {
      setShowRoute(true)
    }
  }

  useEffect(() => {
    // Check authentication and get user role
    const role = localStorage.getItem("userRole")
    const user = localStorage.getItem("username")

    if (!role) {
      router.push("/")
      return
    }

    setUserRole(role)
    setUsername(user || "User")
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("username")
    router.push("/")
  }

  const handleExitFeature = () => {
    // Clear the selected feature and redirect back to appropriate dashboard
    localStorage.removeItem("selectedFeature")
    if (userRole === "public") {
      router.push("/public-dashboard")
    } else if (userRole === "police") {
      router.push("/police-dashboard")
    }
  }

  // Handle place selection from SafeZoneFinder
  const handlePlaceSelect = (place: SafePlace) => {
    setSafePlaces([place])
    setShowSafeZones(true)
    console.log('Selected place:', place)
  }

  // Handle showing places on map
  const handleShowOnMap = (places: SafePlace[]) => {
    setSafePlaces(places)
    setShowSafeZones(true)
  }


  if (!userRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Enhanced responsive design */}
      <header className="bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExitFeature}
              className="flex items-center space-x-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Exit Feature</span>
            </Button>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">
              {activeLayer.charAt(0).toUpperCase() + activeLayer.slice(1)} – {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </h1>
            <div className="hidden sm:block text-sm text-muted-foreground">Welcome, {username}</div>
          </div>
          <div className="flex items-center space-x-2">

            {userRole === "public" && (
              <>
                <Button 
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch('http://localhost:8000/api/send-sos/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          username,
                          phone: localStorage.getItem('userPhone') || 'Not provided',
                          location: 'Current location',
                          duration_minutes: 0
                        })
                      })
                      const result = await response.json()
                      if (result.status === 'success') {
                        alert('🚨 Emergency alert sent! Help is on the way.')
                      } else {
                        alert('Failed to send alert. Please try again.')
                      }
                    } catch (error) {
                      alert('Error sending alert. Check your connection.')
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold animate-pulse"
                >
                  🚨 SOS
                </Button>
                <Dialog modal={true} open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm"
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      📝 Report Incident
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-background border shadow-lg max-w-[600px] z-[9999]">
                    <DialogHeader>
                      <DialogTitle>Report an Incident</DialogTitle>
                      <DialogDescription>
                        Help keep your community safe by reporting suspicious activities
                      </DialogDescription>
                    </DialogHeader>
                    <IncidentReportForm onClose={() => setIsReportModalOpen(false)} />
                  </DialogContent>
                </Dialog>
              </>
            )}
            <Link href="/profile">
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{username || "Profile"}</span>
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
        <div className="sm:hidden px-4 pb-3 text-sm text-muted-foreground">Welcome, {username}</div>
      </header>

      {/* Main Content */}
      <main className="relative h-[calc(100vh-80px)] sm:h-[calc(100vh-88px)]">
        {/* Show Patrol Management for patrol feature */}
        {activeLayer === "patrol" ? (
          <div className="absolute inset-0 z-0 overflow-y-auto">
            <div className="p-4 sm:p-6">
              <PatrolManagement />
            </div>
          </div>
        ) : (
          /* Map Container for other features */
          <div className="absolute inset-0 z-0">
            <MapComponent 
              activeLayer={activeLayer}
              source={source}
              destination={destination}
              showRoute={showRoute}
              userRole={userRole}
              safePlaces={safePlaces}
              showSafeZones={showSafeZones}
              currentLocation={userLocation}
            />
          </div>
        )}

        {/* Alerts List Panel */}
        {activeLayer === "alerts" && (
          <div className="absolute right-4 top-4 w-80 z-[1000] max-h-[70vh] overflow-y-auto">
            <Card className="p-4">
              <div className="space-y-4">
                <h3 className="font-semibold">Active Alerts</h3>
                <div className="space-y-2">
                  {(() => {
                    const approvedReports = publicReports.filter((r: any) => r.status === "approved")
                    const demoAlerts = [
                      { type: "High Crime Alert", location: "Mylapore", severity: "High", time: "2 mins ago" },
                      { type: "Traffic Incident", location: "Guindy", severity: "Medium", time: "15 mins ago" },
                      { type: "Emergency Response", location: "Anna Nagar", severity: "High", time: "5 mins ago" },
                      { type: "Suspicious Activity", location: "Adyar", severity: "Low", time: "1 hour ago" },
                      { type: "Public Safety", location: "Kilpauk", severity: "Medium", time: "30 mins ago" }
                    ]
                    const allAlerts = [...approvedReports.map((r: any) => ({
                      type: r.type.replace('_', ' ').toUpperCase(),
                      location: r.location.includes(',') ? `${parseFloat(r.location.split(',')[0]).toFixed(4)}, ${parseFloat(r.location.split(',')[1]).toFixed(4)}` : r.location,
                      severity: r.severity,
                      time: new Date(r.timestamp).toLocaleString(),
                      isPublicReport: true
                    })), ...demoAlerts]
                    
                    return allAlerts.map((alert, index) => (
                      <Card key={index} className="p-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-sm">{alert.type}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              alert.severity === 'High' || alert.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                              alert.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {alert.severity}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <strong>Location:</strong> {alert.location}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">{alert.time}</span>
                            {'isPublicReport' in alert && alert.isPublicReport && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                Public Report
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  })()
                  }
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Public Reports Review Panel */}
        {activeLayer === "publicReports" && (
          <div className="absolute left-4 top-4 w-80 z-[1000]">
            <Card className="p-4">
              <div className="space-y-4">
                <h3 className="font-semibold">Public Reports</h3>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {publicReports.map((report) => (
                    <Card key={report.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{report.type.replace('_', ' ').toUpperCase()}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(report.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            report.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {report.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm">{report.description}</p>
                        <p className="text-sm"><strong>Location:</strong> {report.location}</p>
                        <p className="text-sm"><strong>Severity:</strong> {report.severity}</p>
                        <p className="text-sm"><strong>Reported by:</strong> {report.reportedBy}</p>
                        
                        {report.status === 'pending' && (
                          <div className="flex space-x-2 mt-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                const updatedReports = publicReports.map(r => 
                                  r.id === report.id ? {...r, status: 'approved'} : r
                                )
                                localStorage.setItem('publicReports', JSON.stringify(updatedReports))
                                setPublicReports(updatedReports)
                                window.dispatchEvent(new Event('publicReportsUpdated'))
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                const updatedReports = publicReports.map(r => 
                                  r.id === report.id ? {...r, status: 'declined'} : r
                                )
                                localStorage.setItem('publicReports', JSON.stringify(updatedReports))
                                setPublicReports(updatedReports)
                                window.dispatchEvent(new Event('publicReportsUpdated'))
                              }}
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                  {publicReports.length === 0 && (
                    <p className="text-center text-muted-foreground">No reports yet</p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Safe Route Search */}
        {activeLayer === "saferoute" && (
          <div className="absolute top-4 left-4 z-[1000] w-80">
            <Card className="p-4 space-y-4">
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter source location"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Enter destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <Button 
                  className="w-full" 
                  onClick={handleRouteSearch}
                  disabled={!source || !destination}
                >
                  Find Safe Route
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Safe Zone Finder Panel */}
        {activeLayer === "safeZones" && (
          <div className="absolute top-4 left-4 z-[1000] w-80 max-h-[80vh] overflow-y-auto">
            <Card className="p-4">
              <SafeZoneFinder
                userLocation={userLocation}
                onPlaceSelect={handlePlaceSelect}
                onShowOnMap={handleShowOnMap}
              />
            </Card>
          </div>
        )}

        {/* Heatmap Controls */}
        {activeLayer === "heatmap" && (
          <div className="absolute top-4 left-4 z-[1000]">
            <Card className="p-3 bg-white/90 backdrop-blur-sm border-slate-200/50 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="text-sm">
                  <p className="font-semibold text-slate-900">Crime Hotspots</p>
                  <p className="text-xs text-slate-600">Live AI predictions</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Trigger a manual refresh by dispatching a custom event
                    window.dispatchEvent(new CustomEvent('refreshHotspots'))
                  }}
                  className="flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await fetch('http://localhost:8000/api/crime-predictions/?city=TamilNadu&count=10')
                      const data = await response.json()
                      console.log('API Test Response:', data)
                      alert(`API Test: ${data.status} - ${data.total_coordinates} coordinates received`)
                    } catch (error) {
                      console.error('API Test Error:', error)
                      alert('API Test Failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
                    }
                  }}
                  className="flex items-center space-x-1 ml-2"
                >
                  <span>Test API</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Force show hotspots by dispatching refresh event
                    window.dispatchEvent(new CustomEvent('refreshHotspots'))
                    // Also try to fit map bounds
                    setTimeout(() => {
                      const mapElement = document.querySelector('#map')
                      if (mapElement && (window as any).L) {
                        const L = (window as any).L
                        const map = L.map('map')
                        if (map) {
                          map.setView([13.0827, 80.2707], 12)
                          console.log('Map view reset to Chennai center')
                        }
                      }
                    }, 1000)
                  }}
                  className="flex items-center space-x-1 ml-2"
                >
                  <span>Show Hotspots</span>
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Active Feature Display - Desktop Version */}
        <div className="hidden md:block absolute top-4 right-4 z-[1000]">
          <Card className="p-4 bg-white/90 backdrop-blur-sm border-slate-200/50 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                {activeLayer === "heatmap" && <span className="text-white text-lg">🔥</span>}
                {activeLayer === "patrol" && <span className="text-white text-lg">🚔</span>}
                {activeLayer === "saferoute" && <span className="text-white text-lg">🛡️</span>}
                {activeLayer === "safeZones" && <span className="text-white text-lg">📍</span>}
                {activeLayer === "alerts" && <span className="text-white text-lg">⚠️</span>}
                {activeLayer === "publicReports" && <span className="text-white text-lg">📋</span>}
                {activeLayer === "report" && <span className="text-white text-lg">📝</span>}
                {activeLayer === "zones" && <span className="text-white text-lg">🗺️</span>}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">
                  {activeLayer === "heatmap" && "Crime Analytics"}
                  {activeLayer === "patrol" && "Patrol Management"}
                  {activeLayer === "saferoute" && "Route Planning"}
                  {activeLayer === "safeZones" && "Safe Zone Finder"}
                  {activeLayer === "alerts" && "Safety Alerts"}
                  {activeLayer === "publicReports" && "Report Management"}
                  {activeLayer === "report" && "Incident Reporting"}
                  {activeLayer === "zones" && "Zone Management"}
                </h3>
                <p className="text-sm text-slate-600 font-medium">Active Feature</p>
                {activeLayer === "heatmap" && (
                  <p className="text-xs text-green-600 font-medium mt-1">🔄 Auto-refreshing every 2 minutes</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Active Feature Display - Mobile Version */}
        <div className="md:hidden">
          <div className="absolute top-4 right-4 z-[1000]">
            <Card className="p-3 bg-white/90 backdrop-blur-sm border-slate-200/50 shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg">
                  {activeLayer === "heatmap" && <span className="text-white text-sm">🔥</span>}
                  {activeLayer === "patrol" && <span className="text-white text-sm">🚔</span>}
                  {activeLayer === "saferoute" && <span className="text-white text-sm">🛡️</span>}
                  {activeLayer === "safeZones" && <span className="text-white text-sm">📍</span>}
                  {activeLayer === "alerts" && <span className="text-white text-sm">⚠️</span>}
                  {activeLayer === "publicReports" && <span className="text-white text-sm">📋</span>}
                  {activeLayer === "report" && <span className="text-white text-sm">📝</span>}
                  {activeLayer === "zones" && <span className="text-white text-sm">🗺️</span>}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {activeLayer === "heatmap" && "Crime Analytics"}
                    {activeLayer === "patrol" && "Patrol Management"}
                    {activeLayer === "saferoute" && "Route Planning"}
                    {activeLayer === "safeZones" && "Safe Zone Finder"}
                    {activeLayer === "alerts" && "Safety Alerts"}
                    {activeLayer === "publicReports" && "Report Management"}
                    {activeLayer === "report" && "Incident Reporting"}
                    {activeLayer === "zones" && "Zone Management"}
                  </h4>
                  <p className="text-xs text-slate-600 font-medium">Active</p>
                  {activeLayer === "heatmap" && (
                    <p className="text-xs text-green-600 font-medium">🔄 Auto-refresh</p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Floating Exit Button */}
        <div className="absolute top-4 left-4 z-[1000]">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExitFeature}
            className="bg-white/90 backdrop-blur-sm border-slate-300 hover:border-slate-400 hover:bg-white shadow-lg"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Exit
          </Button>
        </div>

        <div className="absolute bottom-4 left-2 sm:left-4 right-2 sm:right-auto z-[1000]">
          <Card className="p-2 sm:p-3 bg-white/90 backdrop-blur-sm border-slate-200/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-muted-foreground font-medium">System Online</span>
              </div>
              <div className="text-muted-foreground hidden sm:block font-medium">Chennai Crime Prevention Center</div>
              {activeLayer && (
                <div className="text-primary font-semibold">
                  {activeLayer.charAt(0).toUpperCase() + activeLayer.slice(1)} Active
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
