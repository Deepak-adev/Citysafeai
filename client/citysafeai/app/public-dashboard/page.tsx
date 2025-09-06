"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

export default function PublicDashboardPage() {
  const [username, setUsername] = useState<string>("")
  const [activeLayer, setActiveLayer] = useState<string>("saferoute")
  const [source, setSource] = useState<string>("")
  const [destination, setDestination] = useState<string>("")
  const [showRoute, setShowRoute] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportData, setReportData] = useState({
    type: "",
    description: "",
    location: "",
    severity: "low",
    timestamp: ""
  })
  const router = useRouter()

  const handleRouteSearch = () => {
    if (source && destination) {
      setShowRoute(true)
    }
  }

  const toggleLayer = (layer: string) => {
    setActiveLayer(layer === activeLayer ? "" : layer)
    if (layer !== "saferoute") {
      setShowRoute(false)
    }
  }

  useEffect(() => {
    // Check authentication
    const user = localStorage.getItem("username")
    const role = localStorage.getItem("userRole")

    if (!user || role !== "public") {
      router.push("/")
      return
    }

    setUsername(user)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("username")
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center px-4">
          <div className="flex w-full justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">CitySafe AI</h2>
              <p className="text-sm text-muted-foreground">Public Dashboard</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                className="md:hidden"
                variant="outline"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                Layers
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
        <div className="sm:hidden px-4 pb-3 text-sm text-muted-foreground">Welcome, {username}</div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeLayer === "heatmap" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  toggleLayer("heatmap")
                  setIsMobileMenuOpen(false)
                }}
              >
                <span className="mr-2">🔥</span>
                Heatmap
              </Button>

              <Button
                variant={activeLayer === "saferoute" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  toggleLayer("saferoute")
                  setIsMobileMenuOpen(false)
                }}
              >
                <span className="mr-2">🛡️</span>
                Safe Route
              </Button>
              <Button
                variant={activeLayer === "alerts" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  toggleLayer("alerts")
                  setIsMobileMenuOpen(false)
                }}
              >
                <span className="mr-2">⚠️</span>
                Alerts
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative h-[calc(100vh-80px)] sm:h-[calc(100vh-88px)]">
        {/* Map Container */}
        <div className="absolute inset-0">
          <MapComponent 
            activeLayer={activeLayer}
            source={source}
            destination={destination}
            showRoute={showRoute}
          />
        </div>

        {/* Report Incident Form */}
        {showReportForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[2000]">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Report Incident</CardTitle>
                <CardDescription>Help keep your community safe by reporting suspicious activities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Incident Type</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={reportData.type}
                    onChange={(e) => setReportData({...reportData, type: e.target.value})}
                    required
                  >
                    <option value="">Select type</option>
                    <option value="suspicious_activity">Suspicious Activity</option>
                    <option value="theft">Theft</option>
                    <option value="vandalism">Vandalism</option>
                    <option value="assault">Assault</option>
                    <option value="traffic_incident">Traffic Incident</option>
                    <option value="public_disturbance">Public Disturbance</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                    placeholder="Provide details about the incident..."
                    value={reportData.description}
                    onChange={(e) => setReportData({...reportData, description: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    placeholder="Enter incident location"
                    value={reportData.location}
                    onChange={(e) => setReportData({...reportData, location: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Severity</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={reportData.severity}
                    onChange={(e) => setReportData({...reportData, severity: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      // Save report to localStorage for demo
                      const reports = JSON.parse(localStorage.getItem("publicReports") || "[]")
                      const newReport = {
                        ...reportData,
                        id: Date.now().toString(),
                        status: "pending",
                        timestamp: new Date().toISOString(),
                        reportedBy: localStorage.getItem("username")
                      }
                      reports.push(newReport)
                      localStorage.setItem("publicReports", JSON.stringify(reports))
                      setShowReportForm(false)
                      setReportData({
                        type: "",
                        description: "",
                        location: "",
                        severity: "low",
                        timestamp: ""
                      })
                      alert("Report submitted successfully!")
                    }}
                  >
                    Submit Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowReportForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Layer Controls */}
        <div className="hidden md:block absolute top-4 right-4 z-[1000] space-y-2">
          <Card className="p-2">
            <div className="flex flex-col space-y-2">
              <Button
                variant={activeLayer === "heatmap" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveLayer("heatmap")}
                className="justify-start"
              >
                <span className="mr-2">🔥</span>
                Heatmap
              </Button>

              <Button
                variant={activeLayer === "saferoute" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveLayer("saferoute")}
                className="justify-start"
              >
                <span className="mr-2">🛡️</span>
                Safe Route
              </Button>
              <Button
                variant={activeLayer === "alerts" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveLayer("alerts")}
                className="justify-start"
              >
                <span className="mr-2">⚠️</span>
                Alerts
              </Button>
              {activeLayer === "alerts" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReportForm(true)}
                  className="justify-start"
                >
                  <span className="mr-2">📝</span>
                  Report Incident
                </Button>
              )}
            </div>
          </Card>
        </div>

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
      </main>
    </div>
  )
}
