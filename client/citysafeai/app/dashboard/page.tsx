"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

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
  const [activeLayer, setActiveLayer] = useState<string>("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

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
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">
              Dashboard – {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
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
            <Button variant="outline" size="sm" onClick={() => router.push("/profile")}>
              Profile
            </Button>
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
        <div className="absolute inset-0">
          <MapComponent activeLayer={activeLayer} />
        </div>

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
              <Button
                variant={activeLayer === "patrol" ? "default" : "outline"}
                size="sm"
                onClick={() => toggleLayer("patrol")}
                className="justify-start"
              >
                <span className="mr-2">🚔</span>
                Patrol
              </Button>
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
                  <Button
                    variant={activeLayer === "patrol" ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleLayer("patrol")}
                    className="justify-start text-sm"
                  >
                    <span className="mr-2">🚔</span>
                    Patrol
                  </Button>
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
