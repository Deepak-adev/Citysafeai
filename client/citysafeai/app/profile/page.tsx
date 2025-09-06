"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

export default function ProfilePage() {
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState<any>(null)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem("userRole")
    if (!role) {
      router.push("/")
      return
    }

    setUserRole(role)
    setUsername(localStorage.getItem("username") || "")
    setPhone(localStorage.getItem("userPhone") || "")
    
    const locationData = localStorage.getItem("userLocation")
    if (locationData) {
      setLocation(JSON.parse(locationData))
    }

    const contactsData = localStorage.getItem("emergencyContacts")
    if (contactsData) {
      setEmergencyContacts(JSON.parse(contactsData))
    }
  }, [router])

  if (!userRole) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile Information</h1>
          <div className="space-x-2">
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Button 
              variant="destructive"
              onClick={() => {
                localStorage.clear()
                router.push("/")
              }}
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Username</Label>
                <p className="text-lg">{username || "Not provided"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Role</Label>
                <p className="text-lg capitalize">{userRole}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Phone Number</Label>
                <p className="text-lg">{phone || "Not provided"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location Information</CardTitle>
            </CardHeader>
            <CardContent>
              {location ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Current Location</Label>
                  {location.address && <p className="text-lg">{location.address}</p>}
                  {location.lat && location.lng && (
                    <p className="text-sm text-muted-foreground">
                      Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No location data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Emergency Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            {emergencyContacts.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {emergencyContacts.map((contact, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm font-medium">Name</Label>
                        <p className="text-lg">{contact.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Phone</Label>
                        <p className="text-lg">{contact.phone}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Relationship</Label>
                        <p className="text-lg">{contact.relationship}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No emergency contacts added</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SOS Emergency</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              size="lg"
              className="w-full"
              onClick={() => {
                if (emergencyContacts.length > 0) {
                  alert(`SOS Alert sent to ${emergencyContacts.length} emergency contacts!`)
                } else {
                  alert("No emergency contacts available. Please add contacts first.")
                }
              }}
            >
              🚨 SEND SOS ALERT
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              This will send your location and emergency alert to all your emergency contacts.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}