"use client"

import { useState, useEffect } from "react"
import MapComponent from "../../components/map-component"
import SafeZoneFinder from "../../components/safe-zone-finder"
import { Card } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"

interface SafePlace {
  id: string
  name: string
  type: 'police' | 'hospital' | 'shelter' | 'women_help'
  lat: number
  lng: number
  address: string
  phone?: string
  hours?: string
  distance?: number
  emergency?: boolean
  description?: string
}

export default function SafeZonesPage() {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | undefined>()
  const [safePlaces, setSafePlaces] = useState<SafePlace[]>([])
  const [showSafeZones, setShowSafeZones] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<SafePlace | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setIsLoadingLocation(false)
        },
        (error) => {
          console.log('Could not get location:', error)
          // Default to Chennai if location access denied
          setUserLocation({
            lat: 13.0827,
            lng: 80.2707
          })
          setIsLoadingLocation(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      )
    } else {
      // Default to Chennai if geolocation not supported
      setUserLocation({
        lat: 13.0827,
        lng: 80.2707
      })
    }
  }, [])

  // Handle place selection from SafeZoneFinder
  const handlePlaceSelect = (place: SafePlace) => {
    setSelectedPlace(place)
    setShowSafeZones(true)
    
    // Center map on selected place
    if (userLocation) {
      // This will be handled by the map component
      console.log('Selected place:', place)
    }
  }

  // Handle showing places on map
  const handleShowOnMap = (places: SafePlace[]) => {
    setSafePlaces(places)
    setShowSafeZones(true)
    setSelectedPlace(null)
  }

  // Handle emergency call
  const handleEmergencyCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Safe Zone Finder</h1>
              <p className="text-gray-600 mt-1">Find nearby safe places and emergency services</p>
            </div>
            <div className="flex items-center gap-2">
              {userLocation ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  📍 Location Found
                </Badge>
              ) : (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  {isLoadingLocation ? '🔄 Finding Location...' : '📍 Using Default Location'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Safe Zone Finder Panel */}
          <div className="lg:col-span-1">
            <Card className="p-4 h-fit">
              <SafeZoneFinder
                userLocation={userLocation}
                onPlaceSelect={handlePlaceSelect}
                onShowOnMap={handleShowOnMap}
              />
            </Card>

            {/* Emergency Numbers */}
            <Card className="p-4 mt-4 bg-red-50 border-red-200">
              <h3 className="font-semibold text-red-800 mb-3">🚨 Emergency Numbers</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Police</span>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleEmergencyCall('100')}
                  >
                    Call 100
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Ambulance</span>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleEmergencyCall('108')}
                  >
                    Call 108
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Women Help</span>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleEmergencyCall('181')}
                  >
                    Call 181
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Suicide Prevention</span>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleEmergencyCall('044-2464-0050')}
                  >
                    Call Now
                  </Button>
                </div>
              </div>
            </Card>

            {/* Selected Place Details */}
            {selectedPlace && (
              <Card className="p-4 mt-4 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-3">📍 Selected Place</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {selectedPlace.type === 'police' ? '🚔' : 
                       selectedPlace.type === 'hospital' ? '🏥' :
                       selectedPlace.type === 'shelter' ? '🏠' : '🛡️'}
                    </span>
                    <span className="font-medium">{selectedPlace.name}</span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedPlace.address}</p>
                  {selectedPlace.phone && (
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleEmergencyCall(selectedPlace.phone!)}
                    >
                      📞 Call {selectedPlace.phone}
                    </Button>
                  )}
                  {selectedPlace.distance && (
                    <p className="text-sm text-blue-600">
                      📍 {selectedPlace.distance.toFixed(1)} km away
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="p-4">
              <div className="h-[600px] rounded-lg overflow-hidden">
                <MapComponent
                  activeLayer="safeZones"
                  currentLocation={userLocation}
                  userRole="public"
                  safePlaces={safePlaces}
                  showSafeZones={showSafeZones}
                />
              </div>
              
              {/* Map Controls */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Map Legend:</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-xs">Police</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-xs">Hospitals</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-xs">Shelters</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-xs">Women Help</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-xs">Fire Stations</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSafeZones(!showSafeZones)}
                  >
                    {showSafeZones ? 'Hide' : 'Show'} Safe Zones
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSafePlaces([])
                      setShowSafeZones(false)
                      setSelectedPlace(null)
                    }}
                  >
                    Clear Map
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Safety Tips */}
        <Card className="p-6 mt-6 bg-green-50 border-green-200">
          <h3 className="font-semibold text-green-800 mb-4">🛡️ Safety Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-700 mb-2">Emergency Situations</h4>
              <ul className="text-sm text-green-600 space-y-1">
                <li>• Call emergency numbers immediately</li>
                <li>• Share your location with trusted contacts</li>
                <li>• Move to well-lit, populated areas</li>
                <li>• Keep emergency contacts handy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-700 mb-2">Prevention</h4>
              <ul className="text-sm text-green-600 space-y-1">
                <li>• Plan your route in advance</li>
                <li>• Avoid isolated areas at night</li>
                <li>• Trust your instincts</li>
                <li>• Stay aware of your surroundings</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
