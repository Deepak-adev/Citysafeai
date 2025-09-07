"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, ChevronLeft, AlertCircle, CheckCircle } from "lucide-react"

interface ValidationErrors {
  policeId?: string
  username?: string
  email?: string
  password?: string
}

interface PoliceUser {
  policeId: string
  username: string
  password: string
  email?: string
  name?: string
  badge?: string
  department?: string
}

export default function PoliceRegisterPage() {
  const [policeId, setPoliceId] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [authError, setAuthError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const router = useRouter()

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

  const validateEmail = (email: string): string | null => {
    if (!email.trim()) return "Email is required"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return "Please enter a valid email address"
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
    
    const emailError = validateEmail(email)
    if (emailError) newErrors.email = emailError
    
    const passwordError = validatePassword(password)
    if (passwordError) newErrors.password = passwordError
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Registration function
  const registerPoliceUser = async (userData: PoliceUser): Promise<{ success: boolean; message?: string; user?: any }> => {
    try {
      const response = await fetch('http://localhost:8000/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.username,
          password: userData.password,
          email: userData.email || '',
          phone: '', // Add phone field if needed
          role: 'police',
          police_id: userData.policeId
        })
      })

      const data = await response.json()
      
      if (data.status === 'success') {
        return { success: true, user: data }
      } else {
        return { success: false, message: data.message || "Registration failed. Please try again." }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, message: "Registration failed. Please try again." }
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
      // Handle registration
      const userData: PoliceUser = {
        policeId,
        username,
        password,
        email,
        name: `Officer ${username}`,
        badge: policeId,
        department: "General Division"
      }
      
      const registrationResult = await registerPoliceUser(userData)
      
      if (registrationResult.success) {
        setSuccessMessage("Registration successful! Redirecting to login...")
        setTimeout(() => {
          router.push("/police-login")
        }, 2000)
      } else {
        setAuthError(registrationResult.message || "Registration failed. Please try again.")
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setAuthError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/police-login" className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium mb-6">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
          
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Police Registration</h1>
          <p className="text-gray-600">Register with your Police ID</p>
        </div>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Create Account</CardTitle>
            <CardDescription className="text-gray-600">Register with your Police ID</CardDescription>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="policeId" className="text-sm font-medium text-gray-700">Police ID</Label>
                <Input
                  id="policeId"
                  placeholder="e.g., TN001"
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
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
                <Input
                  id="username"
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
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: undefined }))
                    }
                  }}
                  required
                  className={`h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
                {errors.email && (
                  <p className="text-red-600 text-xs flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
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
              
              <Button type="submit" className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? "Registering..." : "Register"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}