"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Building, Award, Globe, Shield, ChevronLeft } from "lucide-react"

interface EmergencyContact {
  name: string
  phone: string
  relationship: string
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
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: `${position.coords.latitude}, ${position.coords.longitude}`
          })
        },
        () => {
          alert("Location access denied. Please enter manually.")
          setUseManualLocation(true)
        }
      )
    }
  }

  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const updated = [...emergencyContacts]
    updated[index][field] = value
    setEmergencyContacts(updated)
  }

  const handleNextStep = () => {
    // Validate first step before proceeding
    if (phone && (location.address || manualAddress)) {
      setCurrentStep(2)
    } else {
      alert("Please fill in all required fields in the contact information section.")
    }
  }

  const handlePreviousStep = () => {
    setCurrentStep(1)
  }

  const resetForm = () => {
    setCurrentStep(1)
    setIsLogin(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!isLogin) {
      const validContacts = emergencyContacts.filter(c => c.name && c.phone)
      if (validContacts.length === 0) {
        alert("Please add at least one emergency contact")
        setIsLoading(false)
        return
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))

    localStorage.setItem("userRole", "public")
    localStorage.setItem("username", username)
    if (!isLogin) {
      localStorage.setItem("userPhone", phone)
      localStorage.setItem("userLocation", JSON.stringify(useManualLocation ? { address: manualAddress } : location))
      localStorage.setItem("emergencyContacts", JSON.stringify(emergencyContacts.filter(c => c.name && c.phone)))
    }
    
    router.push("/dashboard")
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-slate-800 overflow-hidden">
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

      <div className="relative min-h-screen flex items-center justify-center px-6 lg:px-8 py-8">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center space-y-4">
            <Link href="/" className="group inline-flex items-center text-blue-700 hover:text-blue-800 transition-all duration-300 text-sm font-medium hover:scale-105 transform">
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              Back to Home
            </Link>
            
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              <span className="block text-slate-900 mb-2">
                Public
              </span>
              <span className="block bg-gradient-to-r from-emerald-700 to-blue-700 bg-clip-text text-transparent">
                Safety Portal
              </span>
            </h1>
            <p className="text-lg text-slate-600 font-medium">Join our community safety network</p>
          </div>

          <Card className="group relative bg-gradient-to-br from-white to-slate-50 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-700 ease-out hover:transform hover:scale-105 hover:-translate-y-2">
            <CardHeader>
              <div className="flex justify-center space-x-4 mb-6">
                <Button
                  variant={isLogin ? "default" : "outline"}
                  onClick={() => {
                    setIsLogin(true)
                    resetForm()
                  }}
                  className={`px-6 py-2 font-semibold transition-all duration-300 ${
                    isLogin 
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:shadow-lg hover:shadow-emerald-500/25" 
                      : "border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-700"
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
                  className={`px-6 py-2 font-semibold transition-all duration-300 ${
                    !isLogin 
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:shadow-lg hover:shadow-emerald-500/25" 
                      : "border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-700"
                  }`}
                >
                  Register
                </Button>
              </div>
              <CardTitle className="text-2xl text-center text-slate-900 group-hover:text-emerald-700 transition-all duration-300">
                {isLogin ? "Welcome Back" : "Create Account"}
              </CardTitle>
              <CardDescription className="text-center text-slate-600 font-medium">
                {isLogin ? "Sign in to access safety features" : "Register for emergency services and community safety"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-semibold text-slate-700">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="h-12 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300 text-slate-900 placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300 text-slate-900 placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {!isLogin && (
                  <>
                    {/* Step Indicator */}
                    <div className="flex items-center justify-center space-x-4 mb-6">
                      <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                          currentStep >= 1 
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg' 
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          1
                        </div>
                        <span className="text-sm font-medium">Contact Info</span>
                      </div>
                      <div className={`w-12 h-0.5 transition-all duration-300 ${
                        currentStep >= 2 ? 'bg-gradient-to-r from-emerald-600 to-emerald-700' : 'bg-slate-200'
                      }`}></div>
                      <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                          currentStep >= 2 
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg' 
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          2
                        </div>
                        <span className="text-sm font-medium">Emergency Contacts</span>
                      </div>
                    </div>

                    {/* Section 1: Contact Information */}
                    {currentStep === 1 && (
                      <div className="space-y-6 p-6 bg-gradient-to-br from-emerald-50/30 to-blue-50/30 rounded-xl border border-emerald-100 transition-all duration-300">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900">Contact Information</h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="+1 (555) 123-4567"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              required
                              className="h-12 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300 text-slate-900 placeholder:text-slate-500"
                            />
                          </div>

                          <div className="space-y-4">
                            <Label className="text-sm font-semibold text-slate-700">Location</Label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={requestLocation}
                                disabled={useManualLocation}
                                className="border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 transition-all duration-300"
                              >
                                Use Current Location
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setUseManualLocation(!useManualLocation)}
                                className="border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 transition-all duration-300"
                              >
                                {useManualLocation ? "Use GPS" : "Enter Manually"}
                              </Button>
                            </div>
                            {useManualLocation ? (
                              <Input
                                placeholder="Enter your address"
                                value={manualAddress}
                                onChange={(e) => setManualAddress(e.target.value)}
                                required
                                className="h-12 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300 text-slate-900 placeholder:text-slate-500"
                              />
                            ) : (
                              location.address && (
                                <p className="text-sm text-slate-600 font-medium">Location: {location.address}</p>
                              )
                            )}
                          </div>
                        </div>

                        {/* Next Button for Step 1 */}
                        <div className="flex justify-end pt-4">
                          <Button
                            type="button"
                            onClick={handleNextStep}
                            className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold hover:shadow-xl hover:shadow-emerald-500/25 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 hover:from-emerald-700 hover:to-emerald-800"
                          >
                            Next Step
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Section 2: Emergency Contacts */}
                    {currentStep === 2 && (
                      <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50/30 to-emerald-50/30 rounded-xl border border-blue-100 transition-all duration-300">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                            <Shield className="w-4 h-4 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900">Emergency Contacts</h3>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">Add up to 5</span>
                        </div>
                        
                        <div className="space-y-4">
                          {emergencyContacts.map((contact, index) => (
                            <div key={index} className="group relative">
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium text-slate-500">Name</Label>
                                  <Input
                                    placeholder="Full name"
                                    value={contact.name}
                                    onChange={(e) => updateEmergencyContact(index, "name", e.target.value)}
                                    className="h-10 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300 group-hover:border-emerald-300 text-slate-900 placeholder:text-slate-500"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium text-slate-500">Phone</Label>
                                  <Input
                                    placeholder="Phone number"
                                    value={contact.phone}
                                    onChange={(e) => updateEmergencyContact(index, "phone", e.target.value)}
                                    className="h-10 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300 group-hover:border-emerald-300 text-slate-900 placeholder:text-slate-500"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium text-slate-500">Relationship</Label>
                                  <Input
                                    placeholder="e.g., Spouse, Parent"
                                    value={contact.relationship}
                                    onChange={(e) => updateEmergencyContact(index, "relationship", e.target.value)}
                                    className="h-10 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300 group-hover:border-emerald-300 text-slate-900 placeholder:text-slate-500"
                                  />
                                </div>
                              </div>
                              
                              {/* Contact number indicator */}
                              <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                {index + 1}
                              </div>
                            </div>
                          ))}
                          
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
                            className="px-6 py-3 border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 transition-all duration-300"
                          >
                            Previous
                          </Button>
                          <Button
                            type="submit"
                            className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold hover:shadow-xl hover:shadow-emerald-500/25 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 hover:from-emerald-700 hover:to-emerald-800"
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
                    className="w-full h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold hover:shadow-xl hover:shadow-emerald-500/25 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 hover:from-emerald-700 hover:to-emerald-800" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                )}
              </form>
            </CardContent>
            
            {/* Subtle Background Animation */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-blue-50/0 group-hover:from-emerald-50/30 group-hover:to-blue-50/30 rounded-xl transition-all duration-500 pointer-events-none"></div>
          </Card>
        </div>
      </div>
    </div>
  )
}
