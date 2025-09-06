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
  Car,
  ClipboardList,
  TrendingUp,
  Clock
} from "lucide-react"

export default function PoliceDashboardPage() {
  const [username, setUsername] = useState<string>("")
  const [publicReports, setPublicReports] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const user = localStorage.getItem("username")
    const role = localStorage.getItem("userRole")

    if (!user || role !== "police") {
      router.push("/")
      return
    }

    setUsername(user)
    
    // Load public reports for stats
    const reports = JSON.parse(localStorage.getItem("publicReports") || "[]")
    setPublicReports(reports)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("username")
    router.push("/")
  }

  const handleFeatureClick = (feature: string) => {
    // Store the selected feature and redirect to the main dashboard
    localStorage.setItem("selectedFeature", feature)
    router.push("/dashboard")
  }

  const features = [
    {
      id: "heatmap",
      title: "Crime Heatmap",
      description: "View real-time crime statistics and patterns",
      icon: Map,
      color: "from-red-500 to-orange-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    },
    {
      id: "patrol",
      title: "Patrol Management",
      description: "Manage patrol routes and officer assignments",
      icon: Car,
      color: "from-blue-500 to-indigo-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      id: "publicReports",
      title: "Public Reports",
      description: "Review and manage citizen incident reports",
      icon: ClipboardList,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      badge: publicReports.filter(r => r.status === "pending").length
    },
    {
      id: "alerts",
      title: "Active Alerts",
      description: "Monitor active safety alerts and incidents",
      icon: AlertTriangle,
      color: "from-yellow-500 to-amber-500",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    },
    {
      id: "saferoute",
      title: "Route Analysis",
      description: "Analyze safe routes and traffic patterns",
      icon: TrendingUp,
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    }
  ]

  const pendingReports = publicReports.filter(r => r.status === "pending").length
  const approvedReports = publicReports.filter(r => r.status === "approved").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900">CitySafe AI</h1>
                  <p className="text-sm text-slate-600">Police Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-slate-900">Officer {username}</p>
                <p className="text-xs text-slate-500">Law Enforcement Portal</p>
              </div>
              <Link href="/profile">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center space-x-2">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Police Command Center</h2>
          <p className="text-lg text-slate-600">Access law enforcement tools and community safety data</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-900">{pendingReports}</p>
                  <p className="text-sm text-red-700">Pending Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-900">{approvedReports}</p>
                  <p className="text-sm text-green-700">Approved Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Car className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-900">12</p>
                  <p className="text-sm text-blue-700">Active Patrols</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-900">4.2min</p>
                  <p className="text-sm text-purple-700">Avg Response</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const IconComponent = feature.icon
            return (
              <Card 
                key={feature.id}
                className={`${feature.bgColor} ${feature.borderColor} hover:shadow-lg transition-all duration-300 cursor-pointer group hover:scale-105 relative`}
                onClick={() => handleFeatureClick(feature.id)}
              >
                {feature.badge && feature.badge > 0 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {feature.badge}
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-slate-900 group-hover:text-slate-700 transition-colors">
                        {feature.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 mb-4">
                    {feature.description}
                  </CardDescription>
                  <Button 
                    className={`w-full bg-gradient-to-r ${feature.color} hover:opacity-90 text-white border-0`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFeatureClick(feature.id)
                    }}
                  >
                    Access Tool
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Recent Activity */}
        <div className="mt-12">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {publicReports.slice(0, 3).map((report, index) => (
                  <div key={report.id || index} className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${
                      report.status === 'pending' ? 'bg-yellow-500' :
                      report.status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {report.type?.replace('_', ' ').toUpperCase() || 'Incident Report'}
                      </p>
                      <p className="text-sm text-slate-600">
                        {report.location} • {new Date(report.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      report.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {report.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>
                ))}
                {publicReports.length === 0 && (
                  <p className="text-center text-slate-500 py-8">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
