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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium mb-6"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Police Dashboard Access</h1>
            <p className="text-gray-600">Secure access to your law enforcement dashboard</p>
          </div>

          {/* Login Form */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl text-center text-gray-900">
                Sign In
              </CardTitle>
              <CardDescription className="text-center text-gray-600">
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
                  <Label htmlFor="policeId" className="text-sm font-medium text-gray-700">
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
                    className={`h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                      errors.policeId ? 'border-red-500 focus:border-red-500' : ''
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
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">
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
                    className={`h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                      errors.username ? 'border-red-500 focus:border-red-500' : ''
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
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
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
                    className={`h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                      errors.password ? 'border-red-500 focus:border-red-500' : ''
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
                  className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700" 
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-gray-500 px-4 space-y-2">
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
