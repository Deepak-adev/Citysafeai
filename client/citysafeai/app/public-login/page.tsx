"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Building, Award, Globe, Shield, ChevronLeft, AlertCircle, CheckCircle } from "lucide-react"
import Navbar from "@/components/ui/navbar"

interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

interface ValidationErrors {
  username?: string
  password?: string
  phone?: string
  location?: string
  emergencyContacts?: string
}

interface User {
  username: string
  password: string
  phone: string
  location: { lat: number; lng: number; address: string } | { address: string }
  emergencyContacts: EmergencyContact[]
}

export default function PublicLoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState({ lat: 0, lng: 0, address: "" })
  const [manualAddress, setManualAddress] = useState("")
  const [useManualLocation, setUseManualLocation] = useState(false)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: "", phone: "", relationship: "" },
    { name: "", phone: "", relationship: "" },
    { name: "", phone: "", relationship: "" },
    { name: "", phone: "", relationship: "" },
    { name: "", phone: "", relationship: "" }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [authError, setAuthError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Create demo user for testing (only if no users exist)
  useEffect(() => {
    const existingUsers = JSON.parse(localStorage.getItem('publicUsers') || '[]')
    if (existingUsers.length === 0) {
      const demoUser: User = {
        username: "demo",
        password: "Demo123",
        phone: "+1234567890",
        location: { address: "123 Demo Street, Demo City" },
        emergencyContacts: [
          { name: "John Doe", phone: "+1987654321", relationship: "Emergency Contact" }
        ]
      }
      localStorage.setItem('publicUsers', JSON.stringify([demoUser]))
    }
  }, [])

  // Validation functions
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

  const validatePhone = (phone: string): string | null => {
    if (!phone.trim()) return "Phone number is required"
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    if (!phoneRegex.test(cleanPhone)) return "Please enter a valid phone number"
    return null
  }

  const validateLocation = (): string | null => {
    if (useManualLocation) {
      if (!manualAddress.trim()) return "Please enter your address"
      if (manualAddress.length < 5) return "Please enter a complete address"
    } else {
      if (!location.address || (location.lat === 0 && location.lng === 0)) {
        return "Please allow location access or enter address manually"
      }
    }
    return null
  }

  const validateEmergencyContacts = (): string | null => {
    const validContacts = emergencyContacts.filter(c => c.name.trim() && c.phone.trim())
    if (validContacts.length === 0) return "Please add at least one emergency contact"
    
    for (const contact of validContacts) {
      if (contact.name.length < 2) return "Emergency contact name must be at least 2 characters"
      const phoneError = validatePhone(contact.phone)
      if (phoneError) return `Invalid phone number for ${contact.name}`
    }
    return null
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    
    // Always validate username and password
    const usernameError = validateUsername(username)
    if (usernameError) newErrors.username = usernameError
    
    const passwordError = validatePassword(password)
    if (passwordError) newErrors.password = passwordError
    
    // For registration, validate additional fields
    if (!isLogin) {
      const phoneError = validatePhone(phone)
      if (phoneError) newErrors.phone = phoneError
      
      const locationError = validateLocation()
      if (locationError) newErrors.location = locationError
      
      const contactsError = validateEmergencyContacts()
      if (contactsError) newErrors.emergencyContacts = contactsError
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Authentication functions
  const authenticateUser = async (username: string, password: string): Promise<{ success: boolean; message?: string; user?: any }> => {
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
      
      if (data.status === 'success') {
        return { success: true, user: data.user }
      } else {
        return { success: false, message: data.message || "Authentication failed. Please try again." }
      }
    } catch (error) {
      console.error('Authentication error:', error)
      return { success: false, message: "Authentication failed. Please try again." }
    }
  }

  const registerUser = async (userData: User): Promise<{ success: boolean; message?: string; user?: any }> => {
    try {
      const response = await fetch('http://localhost:8000/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.username,
          password: userData.password,
          email: '', // Add email field if needed
          phone: userData.phone,
          role: 'public'
        })
      })

      const data = await response.json()
      
      if (data.status === 'success') {
        // Add emergency contacts after user registration
        if (userData.emergencyContacts && userData.emergencyContacts.length > 0) {
          for (const contact of userData.emergencyContacts.filter(c => c.name.trim() && c.phone.trim())) {
            await fetch('http://localhost:8000/api/emergency-contacts/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                username: userData.username,
                name: contact.name,
                phone: contact.phone,
                relationship: contact.relationship
              })
            })
          }
        }

        // Save location if available
        if (userData.location && 'lat' in userData.location && 'lng' in userData.location) {
          await fetch('http://localhost:8000/api/update-location/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: userData.username,
              latitude: userData.location.lat,
              longitude: userData.location.lng,
              address: userData.location.address || "Current Location"
            })
          })
        }

        return { success: true, user: data }
      } else {
        return { success: false, message: data.message || "Registration failed. Please try again." }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, message: "Registration failed. Please try again." }
    }
  }

  const requestLocation = () => {
    if (navigator.geolocation) {
      // Clear any previous location errors
      if (errors.location) {
        setErrors(prev => ({ ...prev, location: undefined }))
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: `${position.coords.latitude}, ${position.coords.longitude}`
          })
          setUseManualLocation(false)
          setAuthError("") // Clear any auth errors
        },
        (error) => {
          console.error('Location error:', error)
          let errorMessage = "Location access denied. Please enter manually."
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied. Please allow location access or enter address manually."
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable. Please enter address manually."
              break
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please enter address manually."
              break
            default:
              errorMessage = "Unable to get location. Please enter address manually."
              break
          }
          
          setAuthError(errorMessage)
          setUseManualLocation(true)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    } else {
      setAuthError("Geolocation is not supported by this browser. Please enter address manually.")
      setUseManualLocation(true)
    }
  }

  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const updated = [...emergencyContacts]
    updated[index][field] = value
    setEmergencyContacts(updated)
  }

  const handleNextStep = () => {
    // Validate first step before proceeding
    const newErrors: ValidationErrors = {}
    
    const phoneError = validatePhone(phone)
    if (phoneError) newErrors.phone = phoneError
    
    const locationError = validateLocation()
    if (locationError) newErrors.location = locationError
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setErrors({})
    setCurrentStep(2)
  }

  const handlePreviousStep = () => {
    setCurrentStep(1)
  }

  const resetForm = () => {
    setCurrentStep(1)
    setIsLogin(true)
    setErrors({})
    setAuthError("")
    setSuccessMessage("")
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
      if (isLogin) {
        // Handle login
        const authResult = await authenticateUser(username, password)
        
        if (authResult.success && authResult.user) {
          setSuccessMessage("Login successful!")
          localStorage.setItem("userRole", authResult.user.role)
          localStorage.setItem("username", authResult.user.username)
          localStorage.setItem("userPhone", authResult.user.phone || "")
          localStorage.setItem("userEmail", authResult.user.email || "")
          localStorage.setItem("userId", authResult.user.id)
          
          setTimeout(() => {
            router.push("/public-dashboard")
          }, 1000)
        } else {
          setAuthError(authResult.message || "Authentication failed. Please try again.")
        }
      } else {
        // Handle registration
        const userData: User = {
          username,
          password,
          phone,
          location: useManualLocation ? { address: manualAddress } : location,
          emergencyContacts: emergencyContacts.filter(c => c.name.trim() && c.phone.trim())
        }
        
        const registrationResult = await registerUser(userData)
        
        if (registrationResult.success) {
          setSuccessMessage("Account created successfully!")
          localStorage.setItem("userRole", "public")
          localStorage.setItem("username", username)
          localStorage.setItem("userPhone", phone)
          localStorage.setItem("userId", registrationResult.user?.user_id || "")
          
          setTimeout(() => {
            router.push("/public-dashboard")
          }, 1000)
        } else {
          setAuthError(registrationResult.message || "Registration failed. Please try again.")
        }
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Public Safety Portal</h1>
            <p className="text-gray-600">Access community safety features</p>
          </div>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex justify-center space-x-4 mb-6">
                <Button
                  variant={isLogin ? "default" : "outline"}
                  onClick={() => {
                    setIsLogin(true)
                    resetForm()
                  }}
                  className={`px-6 py-2 ${
                    isLogin 
                      ? "bg-blue-600 text-white hover:bg-blue-700" 
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  Sign In
                </Button>
                <Button
                  variant={!isLogin ? "default" : "outline"}
                  onClick={() => {
                    setIsLogin(false)
                    setCurrentStep(1)
                  }}
                  className={`px-6 py-2 ${
                    !isLogin 
                      ? "bg-blue-600 text-white hover:bg-blue-700" 
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  Register
                </Button>
              </div>
              <CardTitle className="text-2xl text-center text-gray-900">
                {isLogin ? "Welcome Back" : "Create Account"}
              </CardTitle>
              <CardDescription className="text-center text-gray-600">
                {isLogin ? "Sign in to access safety features" : "Register for emergency services and community safety"}
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
              {isLogin && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-700 text-xs font-medium">
                    💡 <strong>Demo Login:</strong> Username: <code>demo</code>, Password: <code>Demo123</code>
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                {!isLogin && (
                  <>
                    {/* Step Indicator */}
                    <div className="flex items-center justify-center space-x-4 mb-6">
                      <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          currentStep >= 1 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          1
                        </div>
                        <span className="text-sm font-medium">Contact Info</span>
                      </div>
                      <div className={`w-12 h-0.5 ${
                        currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'
                      }`}></div>
                      <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          currentStep >= 2 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          2
                        </div>
                        <span className="text-sm font-medium">Emergency Contacts</span>
                      </div>
                    </div>

                    {/* Section 1: Contact Information */}
                    {currentStep === 1 && (
                      <div className="space-y-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="+1 (555) 123-4567"
                              value={phone}
                              onChange={(e) => {
                                setPhone(e.target.value)
                                if (errors.phone) {
                                  setErrors(prev => ({ ...prev, phone: undefined }))
                                }
                              }}
                              required
                              className={`h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                                errors.phone ? 'border-red-500 focus:border-red-500' : ''
                              }`}
                            />
                            {errors.phone && (
                              <p className="text-red-600 text-xs flex items-center space-x-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>{errors.phone}</span>
                              </p>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-1">
                              <Label className="text-sm font-semibold text-slate-700">Location</Label>
                              <p className="text-xs text-slate-500">Required for emergency services and safety alerts</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={requestLocation}
                                disabled={useManualLocation}
                                className="border-gray-300 text-gray-600 hover:border-gray-400"
                              >
                                Use Current Location
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setUseManualLocation(!useManualLocation)
                                  // Clear location errors when switching modes
                                  if (errors.location) {
                                    setErrors(prev => ({ ...prev, location: undefined }))
                                  }
                                  setAuthError("") // Clear any auth errors
                                }}
                                className="border-gray-300 text-gray-600 hover:border-gray-400"
                              >
                                {useManualLocation ? "Use GPS" : "Enter Manually"}
                              </Button>
                            </div>
                            {useManualLocation ? (
                              <div className="space-y-2">
                                <Input
                                  placeholder="Enter your address"
                                  value={manualAddress}
                                  onChange={(e) => {
                                    setManualAddress(e.target.value)
                                    if (errors.location) {
                                      setErrors(prev => ({ ...prev, location: undefined }))
                                    }
                                  }}
                                  required
                                  className={`h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                                    errors.location ? 'border-red-500 focus:border-red-500' : ''
                                  }`}
                                />
                                {errors.location && (
                                  <p className="text-red-600 text-xs flex items-center space-x-1">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{errors.location}</span>
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {location.address && (
                                  <p className="text-sm text-slate-600 font-medium">Location: {location.address}</p>
                                )}
                                {errors.location && (
                                  <p className="text-red-600 text-xs flex items-center space-x-1">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{errors.location}</span>
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Next Button for Step 1 */}
                        <div className="flex justify-end pt-4">
                          <Button
                            type="button"
                            onClick={handleNextStep}
                            className="px-8 py-3 bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Next Step
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Section 2: Emergency Contacts */}
                    {currentStep === 2 && (
                      <div className="space-y-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Shield className="w-4 h-4 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Emergency Contacts</h3>
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full font-medium">Add up to 5</span>
                        </div>
                        
                        <div className="space-y-4">
                          {emergencyContacts.map((contact, index) => (
                            <div key={index} className="group relative">
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium text-gray-500">Name</Label>
                                  <Input
                                    placeholder="Full name"
                                    value={contact.name}
                                    onChange={(e) => updateEmergencyContact(index, "name", e.target.value)}
                                    className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium text-gray-500">Phone</Label>
                                  <Input
                                    placeholder="Phone number"
                                    value={contact.phone}
                                    onChange={(e) => updateEmergencyContact(index, "phone", e.target.value)}
                                    className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium text-gray-500">Relationship</Label>
                                  <Input
                                    placeholder="e.g., Spouse, Parent"
                                    value={contact.relationship}
                                    onChange={(e) => updateEmergencyContact(index, "relationship", e.target.value)}
                                    className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              
                              {/* Contact number indicator */}
                              <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {index + 1}
                              </div>
                            </div>
                          ))}
                          
                          {errors.emergencyContacts && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-red-600 text-xs flex items-center space-x-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>{errors.emergencyContacts}</span>
                              </p>
                            </div>
                          )}
                          
                          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-600 font-medium">
                              💡 <strong>Tip:</strong> Add at least one emergency contact to ensure we can reach someone if needed.
                            </p>
                          </div>
                        </div>

                        {/* Navigation Buttons for Step 2 */}
                        <div className="flex justify-between pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handlePreviousStep}
                            className="px-6 py-3 border-gray-300 text-gray-600 hover:border-gray-400"
                          >
                            Previous
                          </Button>
                          <Button
                            type="submit"
                            className="px-8 py-3 bg-blue-600 text-white hover:bg-blue-700"
                            disabled={isLoading}
                          >
                            {isLoading ? "Creating Account..." : "Create Account"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Sign In Button - only show for login mode */}
                {isLogin && (
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
