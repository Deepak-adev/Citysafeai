"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Building, Award, Globe, ChevronLeft, AlertCircle, CheckCircle } from "lucide-react"
import Navbar from "@/components/ui/navbar"

interface ValidationErrors {
  policeId?: string
  username?: string
  password?: string
}

interface PoliceUser {
  policeId: string
  username: string
  password: string
  name?: string
  badge?: string
  department?: string
}

export default function PoliceLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [policeId, setPoliceId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [authError, setAuthError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Create demo police user for testing (only if no users exist)
  useEffect(() => {
    const existingUsers = JSON.parse(localStorage.getItem('policeUsers') || '[]')
    if (existingUsers.length === 0) {
      const demoPoliceUser: PoliceUser = {
        policeId: "TN001",
        username: "officer_demo",
        password: "Police123",
        name: "Officer Demo",
        badge: "TN001",
        department: "Traffic Division"
      }
      localStorage.setItem('policeUsers', JSON.stringify([demoPoliceUser]))
    }
  }, [])

  // Validation functions
  const validatePoliceId = (policeId: string): string | null => {
    if (!policeId.trim()) return "Police ID is required"
    if (policeId.length < 3) return "Police ID must be at least 3 characters"
    if (policeId.length > 10) return "Police ID must be less than 10 characters"
    if (!/^[A-Z0-9]+$/.test(policeId)) return "Police ID can only contain uppercase letters and numbers"
    return null
  }

  const validateUsername = (username: string): string | null => {
    if (!username.trim()) return "Username is required"
    if (username.length < 3) return "Username must be at least 3 characters"
    if (username.length > 20) return "Username must be less than 20 characters"
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Username can only contain letters, numbers, and underscores"
    return null
  }

  const validatePassword = (password: string): string | null => {
    if (!password) return "Password is required"
    if (password.length < 6) return "Password must be at least 6 characters"
    if (password.length > 50) return "Password must be less than 50 characters"
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }
    return null
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    
    const policeIdError = validatePoliceId(policeId)
    if (policeIdError) newErrors.policeId = policeIdError
    
    const usernameError = validateUsername(username)
    if (usernameError) newErrors.username = usernameError
    
    const passwordError = validatePassword(password)
    if (passwordError) newErrors.password = passwordError
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Authentication function
  const authenticatePoliceUser = async (policeId: string, username: string, password: string): Promise<{ success: boolean; message?: string; user?: any }> => {
    try {
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        })
      })

      const data = await response.json()
      
      if (data.status === 'success' && data.user.role === 'police') {
        // Verify police ID matches
        if (data.user.police_id !== policeId) {
          return { success: false, message: "Police ID does not match. Please check your credentials." }
        }
        return { success: true, user: data.user }
      } else if (data.status === 'success' && data.user.role !== 'police') {
        return { success: false, message: "This account is not authorized for police access." }
      } else {
        return { success: false, message: data.message || "Authentication failed. Please try again." }
      }
    } catch (error) {
      console.error('Authentication error:', error)
      return { success: false, message: "Authentication failed. Please try again." }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setAuthError("")
    setSuccessMessage("")

    // Validate form
    if (!validateForm()) {
      setIsLoading(false)
      return
    }

    try {
      // Handle authentication
      const authResult = await authenticatePoliceUser(policeId, username, password)
      
      if (authResult.success && authResult.user) {
        setSuccessMessage("Login successful!")
        localStorage.setItem("userRole", authResult.user.role)
        localStorage.setItem("username", authResult.user.username)
        localStorage.setItem("policeId", authResult.user.police_id)
        localStorage.setItem("userPhone", authResult.user.phone || "")
        localStorage.setItem("userEmail", authResult.user.email || "")
        localStorage.setItem("userId", authResult.user.id)
        localStorage.setItem("policeRank", authResult.user.police_rank || "")
        
        setTimeout(() => {
          router.push("/police-dashboard")
        }, 1000)
      } else {
        setAuthError(authResult.message || "Authentication failed. Please try again.")
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setAuthError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-slate-800 overflow-hidden">
      <Navbar />
      {/* Government Seal Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32">
          <Building className="w-full h-full text-blue-600" />
        </div>
        <div className="absolute top-20 right-20 w-24 h-24">
          <Award className="w-full h-full text-emerald-600" />
        </div>
        <div className="absolute bottom-20 left-1/4 w-28 h-28">
          <Globe className="w-full h-full text-amber-600" />
        </div>
        <div className="absolute bottom-32 right-1/3 w-20 h-20">
          <Shield className="w-full h-full text-blue-600" />
        </div>
      </div>

      {/* Subtle Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-100/50 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-emerald-100/50 via-transparent to-transparent"></div>
      </div>

      {/* Floating Elements with Parallax */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-1/4 left-10 w-6 h-6 bg-blue-200 rounded-full opacity-40 transition-transform duration-1000"
          style={{ transform: `translateY(${scrollY * 0.1}px) rotate(${scrollY * 0.05}deg)` }}
        ></div>
        <div 
          className="absolute top-1/3 right-20 w-4 h-4 bg-emerald-200 rounded-full opacity-40 transition-transform duration-1000"
          style={{ transform: `translateY(${scrollY * -0.15}px) rotate(${scrollY * -0.08}deg)` }}
        ></div>
        <div 
          className="absolute bottom-1/4 left-1/4 w-5 h-5 bg-amber-200 rounded-full opacity-40 transition-transform duration-1000"
          style={{ transform: `translateY(${scrollY * 0.12}px) rotate(${scrollY * 0.06}deg)` }}
        ></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-4">
            <Link
              href="/"
              className="group inline-flex items-center text-blue-700 hover:text-blue-800 transition-all duration-300 text-sm font-medium hover:scale-105 transform"
            >
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              Back to Home
            </Link>
            
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              <span className="block text-slate-900 mb-2">
                Police
              </span>
              <span className="block bg-gradient-to-r from-blue-700 to-emerald-700 bg-clip-text text-transparent">
                Dashboard Access
              </span>
            </h1>
            <p className="text-lg text-slate-600 font-medium">Secure access to your law enforcement dashboard</p>
          </div>

          {/* Login Form */}
          <Card className="group relative bg-gradient-to-br from-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-700 ease-out hover:transform hover:scale-105 hover:-translate-y-2">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl text-center text-slate-900 group-hover:text-blue-700 transition-all duration-300">
                Sign In
              </CardTitle>
              <CardDescription className="text-center text-slate-600 font-medium">
                Enter your credentials to access the police dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Error and Success Messages */}
              {authError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm font-medium">{authError}</p>
                </div>
              )}
              
              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <p className="text-green-700 text-sm font-medium">{successMessage}</p>
                </div>
              )}

              {/* Demo credentials info */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700 text-xs font-medium">
                  💡 <strong>Demo Login:</strong> Police ID: <code>TN001</code>, Username: <code>officer_demo</code>, Password: <code>Police123</code>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="policeId" className="text-sm font-semibold text-slate-700">
                    Police ID
                  </Label>
                  <Input
                    id="policeId"
                    type="text"
                    placeholder="Enter your Police ID (e.g., TN001)"
                    value={policeId}
                    onChange={(e) => {
                      setPoliceId(e.target.value)
                      if (errors.policeId) {
                        setErrors(prev => ({ ...prev, policeId: undefined }))
                      }
                    }}
                    required
                    className={`h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300 text-black ${
                      errors.policeId ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                    }`}
                  />
                  {errors.policeId && (
                    <p className="text-red-600 text-xs flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.policeId}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-semibold text-slate-700">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value)
                      if (errors.username) {
                        setErrors(prev => ({ ...prev, username: undefined }))
                      }
                    }}
                    required
                    className={`h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300 text-black ${
                      errors.username ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                    }`}
                  />
                  {errors.username && (
                    <p className="text-red-600 text-xs flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.username}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errors.password) {
                        setErrors(prev => ({ ...prev, password: undefined }))
                      }
                    }}
                    required
                    className={`h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300 text-black ${
                      errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                    }`}
                  />
                  {errors.password && (
                    <p className="text-red-600 text-xs flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 hover:from-blue-700 hover:to-blue-800" 
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
            
            {/* Subtle Background Animation */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-emerald-50/0 group-hover:from-blue-50/30 group-hover:to-emerald-50/30 rounded-xl transition-all duration-500 pointer-events-none"></div>
          </Card>

          <div className="text-center text-sm text-slate-500 font-medium px-4 space-y-2">
            <p>This is a secure law enforcement system. Unauthorized access is prohibited.</p>
            <p>
              Need an account?{" "}
              <Link href="/police-register" className="text-blue-600 hover:underline font-semibold">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
