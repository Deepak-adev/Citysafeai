"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { IncidentReportForm } from "@/components/incident-form"
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

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<string>("")
  const [username, setUsername] = useState<string>("")
  const [activeLayer, setActiveLayer] = useState<string>("heatmap") // Set default layer to heatmap
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [source, setSource] = useState<string>("")
  const [destination, setDestination] = useState<string>("")
  const [showRoute, setShowRoute] = useState(false)
  const [publicReports, setPublicReports] = useState<any[]>([])
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
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
      localStorage.removeItem("selectedFeature")
    } else {
      // If no feature selected, redirect to appropriate dashboard
      if (storedRole === "public") {
        router.push("/public-dashboard")
      } else if (storedRole === "police") {
        router.push("/police-dashboard")
      }
    }
  }, [router])

  // Load public reports and refresh when dialog closes
  useEffect(() => {
    const reports = JSON.parse(localStorage.getItem("publicReports") || "[]")
    setPublicReports(reports)
  }, [isReportModalOpen]) // Reload reports when dialog state changes

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

  const toggleLayer = (layer: string) => {
    setActiveLayer(activeLayer === layer ? "" : layer)
    setIsMobileMenuOpen(false)
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
              onClick={() => {
                if (userRole === "public") {
                  router.push("/public-dashboard")
                } else if (userRole === "police") {
                  router.push("/police-dashboard")
                }
              }}
              className="flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Dashboard</span>
            </Button>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">
              {activeLayer.charAt(0).toUpperCase() + activeLayer.slice(1)} – {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </h1>
            <div className="hidden sm:block text-sm text-muted-foreground">Welcome, {username}</div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="md:hidden bg-transparent"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
            {userRole === "public" && (
              <Dialog modal={true} open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    🚨 Report Incident
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
        {/* Map Container */}
        <div className="absolute inset-0 z-0">
          <MapComponent 
            activeLayer={activeLayer}
            source={source}
            destination={destination}
            showRoute={showRoute}
          />
        </div>

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
                            {alert.isPublicReport && (
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

        {/* Desktop Version */}
        <div className="hidden md:block absolute top-4 right-4 z-[1000] space-y-2">
          <Card className="p-2">
            <div className="flex flex-col space-y-2">
              <Button
                variant={activeLayer === "heatmap" ? "default" : "outline"}
                size="sm"
                onClick={() => toggleLayer("heatmap")}
                className="justify-start"
              >
                <span className="mr-2">🔥</span>
                Heatmap
              </Button>
              {userRole === "police" && (
                <Button
                  variant={activeLayer === "patrol" ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleLayer("patrol")}
                  className="justify-start"
                >
                  <span className="mr-2">🚔</span>
                  Patrol
                </Button>
              )}
              <Button
                variant={activeLayer === "saferoute" ? "default" : "outline"}
                size="sm"
                onClick={() => toggleLayer("saferoute")}
                className="justify-start"
              >
                <span className="mr-2">🛡️</span>
                Safe Route
              </Button>
              <Button
                variant={activeLayer === "alerts" ? "default" : "outline"}
                size="sm"
                onClick={() => toggleLayer("alerts")}
                className="justify-start"
              >
                <span className="mr-2">⚠️</span>
                Alerts
              </Button>
              {userRole === "police" && (
                <Button
                  variant={activeLayer === "publicReports" ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleLayer("publicReports")}
                  className="justify-start"
                >
                  <span className="mr-2">📋</span>
                  Public Reports
                  {publicReports.filter(r => r.status === "pending").length > 0 && (
                    <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                      {publicReports.filter(r => r.status === "pending").length}
                    </span>
                  )}
                </Button>
              )}
            </div>
          </Card>
        </div>

        <div className="md:hidden">
          {isMobileMenuOpen && (
            <div className="absolute top-4 right-4 z-[1000]">
              <Card className="p-2">
                <div className="flex flex-col space-y-2 min-w-[140px]">
                  <Button
                    variant={activeLayer === "heatmap" ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleLayer("heatmap")}
                    className="justify-start text-sm"
                  >
                    <span className="mr-2">🔥</span>
                    Heatmap
                  </Button>
                  {userRole === "police" && (
                    <Button
                      variant={activeLayer === "patrol" ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleLayer("patrol")}
                      className="justify-start text-sm"
                    >
                      <span className="mr-2">🚔</span>
                      Patrol
                    </Button>
                  )}
                  <Button
                    variant={activeLayer === "saferoute" ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleLayer("saferoute")}
                    className="justify-start text-sm"
                  >
                    <span className="mr-2">🛡️</span>
                    Safe Route
                  </Button>
                  <Button
                    variant={activeLayer === "alerts" ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleLayer("alerts")}
                    className="justify-start text-sm"
                  >
                    <span className="mr-2">⚠️</span>
                    Alerts
                  </Button>
                  {userRole === "police" && (
                    <Button
                      variant={activeLayer === "publicReports" ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleLayer("publicReports")}
                      className="justify-start text-sm"
                    >
                      <span className="mr-2">📋</span>
                      Public Reports
                      {publicReports.filter(r => r.status === "pending").length > 0 && (
                        <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                          {publicReports.filter(r => r.status === "pending").length}
                        </span>
                      )}
                    </Button>
                  )}
                  {userRole === "public" && (
                    <Dialog modal={true} open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="default"
                          size="sm"
                          className="justify-start bg-red-500 hover:bg-red-600 text-sm"
                        >
                          <span className="mr-2">🚨</span>
                          Report Incident
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-background border shadow-lg max-w-3xl max-h-[90vh] overflow-y-auto z-[9999]">
                        <DialogHeader>
                          <DialogTitle>Report an Incident</DialogTitle>
                          <DialogDescription>
                            Please provide details about the incident. You can add photos, videos, and supporting documents.
                          </DialogDescription>
                        </DialogHeader>
                        <IncidentReportForm onClose={() => setIsReportModalOpen(false)} />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="absolute bottom-4 left-2 sm:left-4 right-2 sm:right-auto z-[1000]">
          <Card className="p-2 sm:p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-muted-foreground">System Online</span>
              </div>
              <div className="text-muted-foreground hidden sm:block">Chennai Crime Prevention Center</div>
              {activeLayer && (
                <div className="text-primary font-medium">
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
