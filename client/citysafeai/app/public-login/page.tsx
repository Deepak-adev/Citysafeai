"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  const router = useRouter()

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold">Public Portal</h1>
          <p className="text-muted-foreground">Join our community safety network</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-center space-x-4 mb-4">
              <Button
                variant={isLogin ? "default" : "outline"}
                onClick={() => setIsLogin(true)}
              >
                Sign In
              </Button>
              <Button
                variant={!isLogin ? "default" : "outline"}
                onClick={() => setIsLogin(false)}
              >
                Register
              </Button>
            </div>
            <CardTitle className="text-center">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
            <CardDescription className="text-center">
              {isLogin ? "Sign in to access safety features" : "Register for emergency services and community safety"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Location</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={requestLocation}
                        disabled={useManualLocation}
                      >
                        Use Current Location
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setUseManualLocation(!useManualLocation)}
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
                      />
                    ) : (
                      location.address && (
                        <p className="text-sm text-muted-foreground">Location: {location.address}</p>
                      )
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label>Emergency Contacts (Add up to 5)</Label>
                    {emergencyContacts.map((contact, index) => (
                      <div key={index} className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Name"
                          value={contact.name}
                          onChange={(e) => updateEmergencyContact(index, "name", e.target.value)}
                        />
                        <Input
                          placeholder="Phone"
                          value={contact.phone}
                          onChange={(e) => updateEmergencyContact(index, "phone", e.target.value)}
                        />
                        <Input
                          placeholder="Relationship"
                          value={contact.relationship}
                          onChange={(e) => updateEmergencyContact(index, "relationship", e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Processing..." : isLogin ? "Sign In" : "Register"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
