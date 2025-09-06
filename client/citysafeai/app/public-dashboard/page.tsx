"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Map, 
  Shield, 
  AlertTriangle, 
  FileText, 
  Users, 
  LogOut,
  User,
  Home,
  Navigation,
  Eye,
  BarChart3,
  Route,
  Bell,
  Plus
} from "lucide-react"

export default function PublicDashboardPage() {
  const [username, setUsername] = useState<string>("")
  const [userLocation, setUserLocation] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const user = localStorage.getItem("username")
    const role = localStorage.getItem("userRole")
    const location = localStorage.getItem("userLocation")

    if (!user || role !== "public") {
      router.push("/")
      return
    }

    setUsername(user)
    if (location) {
      const locData = JSON.parse(location)
      setUserLocation(locData.address || "Location not set")
    }
  }, [router])

  // Reset loading state when component unmounts or when coming back
  useEffect(() => {
    return () => {
      setIsLoading(false)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("username")
    localStorage.removeItem("userPhone")
    localStorage.removeItem("userLocation")
    localStorage.removeItem("emergencyContacts")
    router.push("/")
  }

  const handleFeatureClick = (feature: string) => {
    // Prevent multiple clicks
    if (isLoading) return
    
    setIsLoading(true)
    
    // Store the selected feature and redirect to the main dashboard
    localStorage.setItem("selectedFeature", feature)
    
    // Use setTimeout to ensure the state is set before navigation
    setTimeout(() => {
      router.push("/dashboard")
    }, 100)
  }

  const features = [
    {
      id: "heatmap",
      title: "Crime Analytics",
      description: "Real-time crime statistics and heatmap visualization",
      icon: BarChart3,
      color: "from-slate-700 to-slate-900",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-200",
      hoverColor: "hover:from-slate-800 hover:to-slate-900"
    },
    {
      id: "saferoute",
      title: "Route Planning",
      description: "AI-powered safe route recommendations",
      icon: Route,
      color: "from-blue-600 to-blue-800",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      hoverColor: "hover:from-blue-700 hover:to-blue-900"
    },
    {
      id: "alerts",
      title: "Safety Alerts",
      description: "Live incident alerts and safety notifications",
      icon: Bell,
      color: "from-amber-600 to-amber-800",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      hoverColor: "hover:from-amber-700 hover:to-amber-900"
    },
    {
      id: "report",
      title: "Incident Reporting",
      description: "Report incidents and suspicious activities",
      icon: Plus,
      color: "from-emerald-600 to-emerald-800",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      hoverColor: "hover:from-emerald-700 hover:to-emerald-900"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">CitySafe AI</h1>
                  <p className="text-sm text-slate-600 font-medium">Public Safety Portal</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-slate-900">Welcome, {username}</p>
                <p className="text-xs text-slate-500 font-medium">{userLocation}</p>
              </div>
              <Link href="/profile">
                <Button variant="outline" size="sm" className="flex items-center space-x-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50">
                  <User className="w-4 h-4" />
                  <span className="font-medium">Profile</span>
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center space-x-2 border-slate-300 hover:border-red-400 hover:bg-red-50 hover:text-red-700">
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Community Safety Dashboard</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Access powerful safety tools and real-time information to keep your community secure
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">24/7</p>
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Safety Monitoring</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">1,200+</p>
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Active Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">95%</p>
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Crime Reduction</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => {
            const IconComponent = feature.icon
            return (
              <Card 
                key={feature.id}
                className={`${feature.bgColor} ${feature.borderColor} hover:shadow-2xl transition-all duration-500 cursor-pointer group hover:scale-105 border-2 hover:border-opacity-50`}
              >
                <CardHeader className="pb-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} ${feature.hoverColor} rounded-3xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-lg group-hover:shadow-xl`}>
                      <IconComponent className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors mb-2">
                        {feature.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-slate-600 mb-6 text-center leading-relaxed">
                    {feature.description}
                  </CardDescription>
                  <Button 
                    className={`w-full bg-gradient-to-r ${feature.color} ${feature.hoverColor} hover:shadow-lg text-white border-0 py-3 font-semibold text-base transition-all duration-300`}
                    onClick={() => handleFeatureClick(feature.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : "Launch Feature"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Emergency Contact Info */}
        <div className="mt-20">
          <Card className="bg-gradient-to-r from-red-50/80 to-pink-50/80 border-red-200/50 backdrop-blur-sm shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-red-900">Emergency Information</h3>
                  <p className="text-red-700 font-medium">Quick access to emergency services</p>
                </div>
              </div>
              <p className="text-red-800 mb-6 text-lg leading-relaxed">
                In case of emergency, call <strong>100 (Police)</strong>, <strong>101 (Fire)</strong>, or <strong>108 (Ambulance)</strong>
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" size="lg" className="border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400 font-semibold">
                  Emergency Contacts
                </Button>
                <Button variant="outline" size="lg" className="border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400 font-semibold">
                  Safety Tips
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}