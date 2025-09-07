"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// TypeScript Interfaces
interface EmergencyContact {
  id: string
  name: string
  phone: string
  relationship: string
  isActive: boolean
  addedDate: string
}

interface UserStats {
  reportsSubmitted: number
  alertsReceived: number
  safetyScore: number
  lastActive: string
  totalReports: number
  responseTime: number
}

interface LocationData {
  address: string
  lat: number
  lng: number
  accuracy: number
  timestamp: string
}

interface UserProfile {
  username: string
  email: string
  phone: string
  role: 'police' | 'public' | 'admin'
  avatar?: string
  preferences: {
    notifications: boolean
    locationTracking: boolean
    emergencyAlerts: boolean
  }
}

// Utility Types
type ButtonAction = 'edit' | 'save' | 'cancel' | 'delete' | 'add' | 'sos' | 'location' | 'settings'
type NotificationType = 'success' | 'error' | 'warning' | 'info'

export default function ProfilePage() {
  // State Management
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: "",
    email: "",
    phone: "",
    role: "public",
    preferences: {
      notifications: true,
      locationTracking: false,
      emergencyAlerts: true
    }
  })
  
  const [location, setLocation] = useState<LocationData | null>(null)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [userStats, setUserStats] = useState<UserStats>({
    reportsSubmitted: 0,
    alertsReceived: 0,
    safetyScore: 85,
    lastActive: "2 hours ago",
    totalReports: 0,
    responseTime: 0
  })
  
  // UI State
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState<{type: NotificationType, message: string} | null>(null)
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: "", phone: "", relationship: "" })
  const [showLocationDialog, setShowLocationDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  
  const router = useRouter()

  // Load user data from database on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUsername = localStorage.getItem("username")
        if (!storedUsername) {
          router.push("/")
          return
        }

        // Fetch user profile from database
        const response = await fetch(`http://localhost:8000/api/user-profile/?username=${storedUsername}`)
        const data = await response.json()

        if (data.status === 'success') {
          const user = data.user
          
          setUserProfile({
            username: user.username,
            email: user.email || "",
            phone: user.phone || "",
            role: user.role,
            avatar: user.avatar,
            preferences: {
              notifications: user.preferences.notifications_enabled,
              locationTracking: user.preferences.location_tracking_enabled,
              emergencyAlerts: user.preferences.emergency_alerts_enabled
            }
          })

          // Set emergency contacts from database
          if (user.emergency_contacts) {
            const contacts = user.emergency_contacts.map((contact: any) => ({
              id: contact.id,
              name: contact.name,
              phone: contact.phone,
              relationship: contact.relationship,
              isActive: true,
              addedDate: contact.added_date
            }))
            setEmergencyContacts(contacts)
          }

          // Set user stats from database
          setUserStats({
            reportsSubmitted: user.reports_submitted || 0,
            alertsReceived: user.alerts_received || 0,
            safetyScore: user.safety_score || 85,
            lastActive: new Date(user.last_active).toLocaleString(),
            totalReports: user.reports_submitted || 0,
            responseTime: 0
          })

          // Set location from database
          if (user.latest_location) {
            setLocation({
              address: user.latest_location.address || "Current Location",
              lat: user.latest_location.latitude,
              lng: user.latest_location.longitude,
              accuracy: user.latest_location.accuracy || 0,
              timestamp: user.latest_location.timestamp
            })
          }

          // Update localStorage with fresh data
          localStorage.setItem("userRole", user.role)
          localStorage.setItem("username", user.username)
          localStorage.setItem("userPhone", user.phone || "")
          localStorage.setItem("userEmail", user.email || "")
          localStorage.setItem("userProfile", JSON.stringify({
            username: user.username,
            email: user.email,
            phone: user.phone,
            role: user.role,
            preferences: {
              notifications: user.preferences.notifications_enabled,
              locationTracking: user.preferences.location_tracking_enabled,
              emergencyAlerts: user.preferences.emergency_alerts_enabled
            }
          }))
        } else {
          showNotification('error', 'Failed to load user data from database')
          router.push("/")
        }
      } catch (error) {
        console.error('Error loading user data:', error)
        showNotification('error', 'Failed to load user data')
        router.push("/")
      }
    }

    loadUserData()
  }, [router])

  // Notification system
  const showNotification = useCallback((type: NotificationType, message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }, [])

  // Button Handlers
  const handleButtonClick = useCallback(async (action: ButtonAction, data?: any) => {
    setIsLoading(true)
    
    try {
      switch (action) {
        case 'edit':
          setIsEditing(true)
          break
          
        case 'save':
          await handleSaveProfile()
          showNotification('success', 'Profile updated successfully')
          break
          
        case 'cancel':
          setIsEditing(false)
          // Reload original data
          const originalData = localStorage.getItem("userProfile")
          if (originalData) {
            setUserProfile(JSON.parse(originalData))
          }
          break
          
        case 'add':
          await handleAddContact()
          showNotification('success', 'Emergency contact added successfully')
          break
          
        case 'delete':
          await handleRemoveContact(data.index)
          showNotification('success', 'Contact removed successfully')
          break
          
        case 'sos':
          await handleSOSAlert()
          break
          
        case 'location':
          await handleLocationUpdate()
          break
          
        case 'settings':
          setShowSettingsDialog(true)
          break
          
        default:
          break
      }
    } catch (error) {
      showNotification('error', 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSaveProfile = async () => {
    try {
      const updatedProfile = { ...userProfile }
      
      // Save to database
      const response = await fetch('http://localhost:8000/api/user-profile/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: updatedProfile.username,
          email: updatedProfile.email,
          phone: updatedProfile.phone,
          avatar: updatedProfile.avatar,
          preferences: {
            notifications_enabled: updatedProfile.preferences.notifications,
            location_tracking_enabled: updatedProfile.preferences.locationTracking,
            emergency_alerts_enabled: updatedProfile.preferences.emergencyAlerts
          }
        })
      })

      const data = await response.json()
      
      if (data.status === 'success') {
        setUserProfile(updatedProfile)
        
        // Update localStorage
        localStorage.setItem("username", updatedProfile.username)
        localStorage.setItem("userPhone", updatedProfile.phone)
        localStorage.setItem("userEmail", updatedProfile.email)
        localStorage.setItem("userProfile", JSON.stringify(updatedProfile))
        
        setIsEditing(false)
        showNotification('success', 'Profile updated successfully')
      } else {
        showNotification('error', data.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      showNotification('error', 'Failed to update profile')
    }
  }

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone || !newContact.relationship) {
      showNotification('warning', 'Please fill in all contact fields')
      return
    }

    try {
      const response = await fetch('http://localhost:8000/api/emergency-contacts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userProfile.username,
          name: newContact.name,
          phone: newContact.phone,
          relationship: newContact.relationship
        })
      })

      const data = await response.json()
      
      if (data.status === 'success') {
        const contact: EmergencyContact = {
          id: data.contact.id,
          name: data.contact.name,
          phone: data.contact.phone,
          relationship: data.contact.relationship,
          isActive: true,
          addedDate: data.contact.added_date
        }

        const updatedContacts = [...emergencyContacts, contact]
        setEmergencyContacts(updatedContacts)
        localStorage.setItem("emergencyContacts", JSON.stringify(updatedContacts))
        
        setNewContact({ name: "", phone: "", relationship: "" })
        setShowAddContact(false)
        showNotification('success', 'Emergency contact added successfully')
      } else {
        showNotification('error', data.message || 'Failed to add contact')
      }
    } catch (error) {
      console.error('Error adding contact:', error)
      showNotification('error', 'Failed to add contact')
    }
  }

  const handleRemoveContact = async (index: number) => {
    const contactToRemove = emergencyContacts[index]
    if (!contactToRemove) return

    try {
      const response = await fetch('http://localhost:8000/api/emergency-contacts/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact_id: contactToRemove.id
        })
      })

      const data = await response.json()
      
      if (data.status === 'success') {
        const updatedContacts = emergencyContacts.filter((_, i) => i !== index)
        setEmergencyContacts(updatedContacts)
        localStorage.setItem("emergencyContacts", JSON.stringify(updatedContacts))
        showNotification('success', 'Emergency contact removed successfully')
      } else {
        showNotification('error', data.message || 'Failed to remove contact')
      }
    } catch (error) {
      console.error('Error removing contact:', error)
      showNotification('error', 'Failed to remove contact')
    }
  }

  const handleSOSAlert = async () => {
    if (emergencyContacts.length === 0) {
      showNotification('warning', 'Please add emergency contacts first')
      return
    }

    // Simulate SOS alert sending
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    showNotification('success', `SOS Alert sent to ${emergencyContacts.length} emergency contacts!`)
    
    // Update stats
    const updatedStats = { ...userStats, alertsReceived: userStats.alertsReceived + 1 }
    setUserStats(updatedStats)
    localStorage.setItem("userStats", JSON.stringify(updatedStats))
  }

  const handleLocationUpdate = async () => {
    if (!navigator.geolocation) {
      showNotification('error', 'Geolocation is not supported by this browser')
      return
    }

    setIsLoading(true)
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const locationData: LocationData = {
            address: "Current Location", // Would be resolved via reverse geocoding
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          }
          
          // Save to database
          const response = await fetch('http://localhost:8000/api/update-location/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: userProfile.username,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              address: locationData.address,
              accuracy: position.coords.accuracy
            })
          })

          const data = await response.json()
          
          if (data.status === 'success') {
            setLocation(locationData)
            localStorage.setItem("userLocation", JSON.stringify(locationData))
            showNotification('success', 'Location updated successfully')
            setShowLocationDialog(false)
          } else {
            showNotification('error', data.message || 'Failed to update location')
          }
        } catch (error) {
          console.error('Error updating location:', error)
          showNotification('error', 'Failed to update location')
        }
      },
      (error) => {
        showNotification('error', 'Failed to get location. Please check permissions.')
        setIsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    )
    
    setIsLoading(false)
  }

  const handleViewOnMap = () => {
    if (location) {
      const mapUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`
      window.open(mapUrl, '_blank')
    }
  }

  const handleShareLocation = async () => {
    if (navigator.share && location) {
      try {
        await navigator.share({
          title: 'My Location',
          text: `I'm at: ${location.address}`,
          url: `https://www.google.com/maps?q=${location.lat},${location.lng}`
        })
        showNotification('success', 'Location shared successfully')
      } catch (error) {
        showNotification('error', 'Failed to share location')
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`https://www.google.com/maps?q=${location?.lat},${location?.lng}`)
      showNotification('success', 'Location link copied to clipboard')
    }
  }

  const handleSafetyReminders = () => {
    showNotification('info', 'Safety reminders feature coming soon!')
  }

  const handleSafetyReport = () => {
    showNotification('info', 'Safety report feature coming soon!')
  }

  const handlePrivacySettings = () => {
    setShowSettingsDialog(true)
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push("/")
  }

  // Utility functions
  const getRoleColor = (role: string) => {
    switch (role) {
      case "police": return "bg-blue-600"
      case "public": return "bg-green-600"
      case "admin": return "bg-purple-600"
      default: return "bg-gray-600"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "police": return "👮‍♂️"
      case "public": return "👤"
      case "admin": return "👑"
      default: return "👤"
    }
  }

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'success': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      case 'warning': return 'bg-yellow-500'
      case 'info': return 'bg-blue-500'
    }
  }

  if (!userProfile.username) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 ${getNotificationColor(notification.type)} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300`}>
          <div className="flex items-center space-x-2">
            <span>{notification.type === 'success' ? '✓' : notification.type === 'error' ? '✕' : notification.type === 'warning' ? '⚠' : 'ℹ'}</span>
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 text-white/80 hover:text-white">×</button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Enhanced Professional Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-4xl border-2 border-white/20 shadow-2xl">
                    {getRoleIcon(userProfile.role)}
                  </div>
                  <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full ${getRoleColor(userProfile.role)} flex items-center justify-center text-white text-sm font-bold border-3 border-white shadow-lg`}>
                    ✓
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">{userProfile.username}</h1>
                  <div className="flex items-center space-x-4">
                    <Badge className={`${getRoleColor(userProfile.role)} text-white text-sm px-4 py-2 rounded-full shadow-lg`}>
                      {getRoleIcon(userProfile.role)} {userProfile.role.toUpperCase()}
                    </Badge>
                    <div className="flex items-center space-x-2 text-white/80">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm">Last active: {userStats.lastActive}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-4">
                <Link href="/dashboard">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
                    ← Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="destructive"
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? '...' : 'Logout'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Reports</p>
                  <p className="text-4xl font-bold text-blue-900 mt-2">{userStats.reportsSubmitted}</p>
                  <p className="text-sm text-blue-600 mt-1">Submitted this month</p>
                </div>
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">📝</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Alerts</p>
                  <p className="text-4xl font-bold text-amber-900 mt-2">{userStats.alertsReceived}</p>
                  <p className="text-sm text-amber-600 mt-1">Received this week</p>
                </div>
                <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">🔔</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-violet-700 uppercase tracking-wide">Contacts</p>
                  <p className="text-4xl font-bold text-violet-900 mt-2">{emergencyContacts.length}</p>
                  <p className="text-sm text-violet-600 mt-1">Emergency contacts</p>
                </div>
                <div className="w-16 h-16 bg-violet-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">👥</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Enhanced Profile Information */}
          <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-3 text-slate-900">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl text-blue-600">👤</span>
                  </div>
                  <span className="text-xl font-bold">Profile Information</span>
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleButtonClick(isEditing ? 'cancel' : 'edit')}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 shadow-sm"
                  disabled={isLoading}
                >
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Username</Label>
                  {isEditing ? (
                    <Input 
                      value={userProfile.username} 
                      onChange={(e) => setUserProfile({...userProfile, username: e.target.value})}
                      className="mt-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      placeholder="Enter username"
                    />
                  ) : (
                    <p className="text-lg font-semibold mt-3 text-slate-900">{userProfile.username || "Not provided"}</p>
                  )}
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Email</Label>
                  {isEditing ? (
                    <Input 
                      type="email"
                      value={userProfile.email} 
                      onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                      className="mt-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      placeholder="Enter email address"
                    />
                  ) : (
                    <p className="text-lg font-semibold mt-3 text-slate-900">{userProfile.email || "Not provided"}</p>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Phone Number</Label>
                  {isEditing ? (
                    <Input 
                      value={userProfile.phone} 
                      onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                      className="mt-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <p className="text-lg font-semibold mt-3 text-slate-900">{userProfile.phone || "Not provided"}</p>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Role</Label>
                  <div className="mt-3">
                    <Badge className={`${getRoleColor(userProfile.role)} text-white text-sm px-4 py-2 rounded-full shadow-sm`}>
                      {getRoleIcon(userProfile.role)} {userProfile.role.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex space-x-4 pt-6 border-t border-slate-200">
                  <Button 
                    onClick={() => handleButtonClick('save')} 
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleButtonClick('cancel')}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 flex-1"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Location Information */}
          <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200 rounded-t-xl">
              <CardTitle className="flex items-center space-x-3 text-slate-900">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <span className="text-xl text-emerald-600">📍</span>
                </div>
                <span className="text-xl font-bold">Location Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {location ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <Label className="text-sm font-semibold text-emerald-700">Current Location</Label>
                    {location.address && (
                      <p className="text-lg font-medium text-emerald-800 mt-1">{location.address}</p>
                    )}
                    {location.lat && location.lng && (
                      <p className="text-sm text-emerald-600 mt-2">
                        📍 Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </p>
                    )}
                    <p className="text-xs text-emerald-500 mt-2">
                      Last updated: {new Date(location.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleViewOnMap}
                      className="border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      🗺️ View on Map
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleButtonClick('location')}
                      className="border-slate-300 text-slate-700 hover:bg-slate-50"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Updating...' : '🔄 Update Location'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📍</span>
                  </div>
                  <p className="text-slate-500 mb-4">No location data available</p>
                  <Button 
                    variant="outline"
                    onClick={() => handleButtonClick('location')}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Getting Location...' : '📍 Enable Location Tracking'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Emergency Contacts */}
        <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200 rounded-t-xl">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-3 text-slate-900">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <span className="text-xl text-red-600">🚨</span>
                </div>
                <span className="text-xl font-bold">Emergency Contacts</span>
              </CardTitle>
              <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
                <DialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    + Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-slate-900">Add Emergency Contact</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-700">Name</Label>
                      <Input 
                        value={newContact.name}
                        onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                        placeholder="Enter contact name"
                        className="mt-1 border-slate-300 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-700">Phone Number</Label>
                      <Input 
                        value={newContact.phone}
                        onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                        placeholder="Enter phone number"
                        className="mt-1 border-slate-300 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-700">Relationship</Label>
                      <Input 
                        value={newContact.relationship}
                        onChange={(e) => setNewContact({...newContact, relationship: e.target.value})}
                        placeholder="e.g., Family, Friend, Doctor"
                        className="mt-1 border-slate-300 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex space-x-2 pt-4">
                      <Button 
                        onClick={() => handleButtonClick('add')} 
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Adding...' : 'Add Contact'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAddContact(false)} 
                        className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {emergencyContacts.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {emergencyContacts.map((contact, index) => (
                  <div key={contact.id || index} className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">👤</span>
                          <p className="font-semibold text-red-800">{contact.name}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">📞</span>
                          <p className="text-red-700">{contact.phone}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">🤝</span>
                          <p className="text-red-600 text-sm">{contact.relationship}</p>
                        </div>
                        {contact.addedDate && (
                          <p className="text-xs text-red-500">
                            Added: {new Date(contact.addedDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleButtonClick('delete', { index })}
                        className="text-red-600 border-red-300 hover:bg-red-100"
                        disabled={isLoading}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <p className="text-slate-500 mb-4">No emergency contacts added yet</p>
                <Button 
                  onClick={() => setShowAddContact(true)} 
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Add Your First Contact
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Emergency Actions */}
        <div className="grid gap-8 md:grid-cols-2">
          <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200 rounded-t-xl">
              <CardTitle className="flex items-center space-x-3 text-red-900">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <span className="text-xl text-red-600">🚨</span>
                </div>
                <span className="text-xl font-bold">SOS Emergency</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Button 
                variant="destructive" 
                size="lg"
                className="w-full h-16 text-lg font-bold bg-red-600 hover:bg-red-700"
                onClick={() => handleButtonClick('sos')}
                disabled={isLoading}
              >
                {isLoading ? 'Sending Alert...' : '🚨 SEND SOS ALERT'}
              </Button>
              <p className="text-sm text-red-600 mt-3 text-center">
                This will send your location and emergency alert to all your emergency contacts.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 rounded-t-xl">
              <CardTitle className="flex items-center space-x-3 text-slate-900">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-xl text-blue-600">🛡️</span>
                </div>
                <span className="text-xl font-bold">Safety Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-50" 
                size="lg"
                onClick={handleShareLocation}
                disabled={!location}
              >
                📍 Share Live Location
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-50" 
                size="lg"
                onClick={handleSafetyReminders}
              >
                🔔 Set Safety Reminders
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-50" 
                size="lg"
                onClick={handleSafetyReport}
              >
                📊 View Safety Report
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-50" 
                size="lg"
                onClick={handlePrivacySettings}
              >
                ⚙️ Privacy Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Settings Dialog */}
        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-900">Privacy Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-slate-700">Notifications</Label>
                <input 
                  type="checkbox" 
                  checked={userProfile.preferences.notifications}
                  onChange={(e) => setUserProfile({
                    ...userProfile, 
                    preferences: {...userProfile.preferences, notifications: e.target.checked}
                  })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-slate-700">Location Tracking</Label>
                <input 
                  type="checkbox" 
                  checked={userProfile.preferences.locationTracking}
                  onChange={(e) => setUserProfile({
                    ...userProfile, 
                    preferences: {...userProfile.preferences, locationTracking: e.target.checked}
                  })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-slate-700">Emergency Alerts</Label>
                <input 
                  type="checkbox" 
                  checked={userProfile.preferences.emergencyAlerts}
                  onChange={(e) => setUserProfile({
                    ...userProfile, 
                    preferences: {...userProfile.preferences, emergencyAlerts: e.target.checked}
                  })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <Button 
                  onClick={() => {
                    localStorage.setItem("userPreferences", JSON.stringify(userProfile.preferences))
                    setShowSettingsDialog(false)
                    showNotification('success', 'Settings saved successfully')
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Save Settings
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowSettingsDialog(false)} 
                  className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}