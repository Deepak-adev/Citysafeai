"use client"

import { useEffect, useRef, useState } from "react"

interface SafePlace {
  id: string
  name: string
  type: 'police' | 'hospital' | 'shelter' | 'women_help' | 'fire_station'
  lat: number
  lng: number
  address: string
  phone?: string
  hours?: string
  distance?: number
  emergency?: boolean
  description?: string
  rating?: number
  place_id?: string
}

interface MapComponentProps {
  activeLayer: string
  source?: string
  destination?: string
  showRoute?: boolean
  patrolRoute?: {
    id: string
    name: string
    waypoints: Array<{
      lat: number
      lng: number
      name: string
      type: 'hotspot' | 'checkpoint' | 'station'
      priority: number
      estimated_time: number
      status: 'pending' | 'in_progress' | 'completed'
    }>
    total_distance: number
    estimated_duration: number
    status: 'scheduled' | 'active' | 'completed' | 'paused'
    assigned_officers: string[]
    efficiency_score: number
  }
  currentLocation?: {
    lat: number
    lng: number
  }
  userRole?: string
  safePlaces?: SafePlace[]
  showSafeZones?: boolean
}

export default function MapComponent({ activeLayer, source, destination, showRoute, patrolRoute, currentLocation, userRole, safePlaces, showSafeZones }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const layersRef = useRef<any>({})
  const [isLoadingHotspots, setIsLoadingHotspots] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [isRecenterLoading, setIsRecenterLoading] = useState(false)
  const lastHotspotUpdateRef = useRef<number>(0)
  const hotspotCacheRef = useRef<any[]>([])
  const cacheTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializingRef = useRef<boolean>(false)
  const retryCountRef = useRef<number>(0)

  // Function to recenter map on user location
  const handleRecenter = async () => {
    if (!mapInstanceRef.current) return
    
    setIsRecenterLoading(true)
    
    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          })
        })
        
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        
        setUserLocation(coords)
        
        // Center map on user location
        mapInstanceRef.current.setView([coords.lat, coords.lng], 15)
        
        // Add a marker for user location
        const L = (window as any).L
        if (L) {
          // Remove existing user location marker
          if (layersRef.current.userLocation) {
            mapInstanceRef.current.removeLayer(layersRef.current.userLocation)
          }
          
          // Create new user location marker
          const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `
              <div style="
                width: 20px;
                height: 20px;
                background: #3b82f6;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              "></div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
          
          layersRef.current.userLocation = L.marker([coords.lat, coords.lng], { icon: userIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup('Your current location')
        }
        
      } else {
        console.log('Geolocation is not supported by this browser')
      }
    } catch (error) {
      console.error('Error getting user location:', error)
    } finally {
      setIsRecenterLoading(false)
    }
  }

  // Handle route display
  useEffect(() => {
    if (!mapInstanceRef.current || !showRoute || !source || !destination) return

    const L = (window as any).L
    if (!L) return

    // Additional safety check for map instance
    if (!mapInstanceRef.current || typeof mapInstanceRef.current.removeLayer !== 'function') {
      console.log('Map instance not properly initialized for route display')
      return
    }

    // Remove existing route elements
    if (mapInstanceRef.current._routeElements) {
      mapInstanceRef.current._routeElements.forEach((element: any) => {
        if (mapInstanceRef.current && typeof mapInstanceRef.current.removeLayer === 'function') {
          mapInstanceRef.current.removeLayer(element)
        }
      })
    }

    // Create safe route
    geocodeAndRoute(L, mapInstanceRef.current, source, destination)
  }, [source, destination, showRoute])

  // Handle patrol route display
  useEffect(() => {
    console.log('Patrol route useEffect triggered:', { 
      hasMap: !!mapInstanceRef.current, 
      hasPatrolRoute: !!patrolRoute, 
      hasLayers: !!layersRef.current,
      activeLayer 
    })
    
    if (!mapInstanceRef.current || !patrolRoute || !layersRef.current) {
      console.log('Missing requirements for patrol route display')
      return
    }

    // Additional safety check for map instance
    if (!mapInstanceRef.current || typeof mapInstanceRef.current.hasLayer !== 'function') {
      console.log('Map instance not properly initialized for patrol route display')
      return
    }

    const L = (window as any).L
    if (!L) {
      console.log('Leaflet not available for patrol route display')
      return
    }

    // Clear existing patrol route
    if (layersRef.current.patrolRoute && typeof layersRef.current.patrolRoute.clearLayers === 'function') {
      layersRef.current.patrolRoute.clearLayers()
      console.log('Cleared existing patrol route')
    }

    // Add patrol route to map
    displayPatrolRoute(L, layersRef.current.patrolRoute, patrolRoute).then(() => {
      console.log('Displayed patrol route on map')
    }).catch((error) => {
      console.error('Error displaying patrol route:', error)
    })

    // Add patrol route layer to map if not already added
    if (mapInstanceRef.current && typeof mapInstanceRef.current.hasLayer === 'function' && 
        !mapInstanceRef.current.hasLayer(layersRef.current.patrolRoute)) {
      layersRef.current.patrolRoute.addTo(mapInstanceRef.current)
      console.log('Patrol route layer added to map')
    } else {
      console.log('Patrol route layer already on map')
    }
  }, [patrolRoute, activeLayer])

  // Note: Live patrol location tracking removed - using static safe places data instead

  // Handle role-based path display when zones are active
  useEffect(() => {
    console.log('Role-based path useEffect triggered:', { 
      activeLayer, 
      userRole, 
      mapReady: !!mapInstanceRef.current, 
      layersReady: !!layersRef.current 
    })
    
    if (!mapInstanceRef.current || !layersRef.current || activeLayer !== 'zones' || !userRole) {
      console.log('Missing requirements for role-based paths')
      return
    }

    // Additional safety check for map instance
    if (!mapInstanceRef.current || typeof mapInstanceRef.current.hasLayer !== 'function') {
      console.log('Map instance not properly initialized for role-based paths')
      return
    }

    const L = (window as any).L
    if (!L) {
      console.log('Leaflet not available for role-based paths')
      return
    }

    // Clear existing role-based paths
    if (layersRef.current.roleBasedPaths && typeof layersRef.current.roleBasedPaths.clearLayers === 'function') {
      layersRef.current.roleBasedPaths.clearLayers()
      console.log('Cleared existing role-based paths')
    }

    // Add role-based paths based on user role
    if (userRole === 'police') {
      console.log('Adding red zone paths for police user')
      addRedZonePaths(L, layersRef.current.roleBasedPaths).then(() => {
        console.log('Red zone paths added successfully')
      }).catch((error) => {
        console.error('Error adding red zone paths:', error)
      })
    } else if (userRole === 'public') {
      console.log('Adding green zone paths for public user')
      addGreenZonePaths(L, layersRef.current.roleBasedPaths).then(() => {
        console.log('Green zone paths added successfully')
      }).catch((error) => {
        console.error('Error adding green zone paths:', error)
      })
    }

    // Add role-based paths layer to map
    if (mapInstanceRef.current && typeof mapInstanceRef.current.hasLayer === 'function' && 
        !mapInstanceRef.current.hasLayer(layersRef.current.roleBasedPaths)) {
      layersRef.current.roleBasedPaths.addTo(mapInstanceRef.current)
      console.log('Role-based paths layer added to map')
    } else {
      console.log('Role-based paths layer already on map')
    }
  }, [activeLayer, userRole])

  // Handle safe zones display
  useEffect(() => {
    console.log('Safe zones useEffect triggered:', { 
      hasMap: !!mapInstanceRef.current, 
      hasLayers: !!layersRef.current,
      safePlaces: safePlaces?.length || 0,
      showSafeZones
    })
    
    if (!mapInstanceRef.current || !layersRef.current || !safePlaces || !showSafeZones) {
      console.log('Missing requirements for safe zones display')
      return
    }

    const L = (window as any).L
    if (!L) {
      console.log('Leaflet not available for safe zones display')
      return
    }

    // Additional safety check for map instance
    if (!mapInstanceRef.current || typeof mapInstanceRef.current.hasLayer !== 'function') {
      console.log('Map instance not properly initialized for safe zones display')
      return
    }

    // Clear existing safe zones
    if (layersRef.current.safeZones && typeof layersRef.current.safeZones.clearLayers === 'function') {
      layersRef.current.safeZones.clearLayers()
      console.log('Cleared existing safe zones')
    }

    // Add safe zones to map
    displaySafeZones(L, layersRef.current.safeZones, safePlaces)

    // Add safe zones layer to map if not already added
    if (mapInstanceRef.current && typeof mapInstanceRef.current.hasLayer === 'function' && 
        !mapInstanceRef.current.hasLayer(layersRef.current.safeZones)) {
      layersRef.current.safeZones.addTo(mapInstanceRef.current)
      console.log('Safe zones layer added to map')
    } else {
      console.log('Safe zones layer already on map')
    }
  }, [safePlaces, showSafeZones])

  useEffect(() => {
    if (typeof window === "undefined") return
    
    // Prevent multiple initializations
    if (isInitializingRef.current) {
      console.log('Map initialization already in progress, skipping...')
      return
    }

    // Check if map is already initialized and working
    if (mapInstanceRef.current && mapRef.current && !(mapRef.current as any)._leaflet_id) {
      console.log('Map already initialized and working, skipping...')
      return
    }

    const loadLeaflet = async () => {
      // Ensure map container exists before proceeding
      if (!mapRef.current) {
        if (retryCountRef.current < 10) { // Max 10 retries (1 second total)
          retryCountRef.current++
          console.log(`Map container not available, retrying in 100ms... (attempt ${retryCountRef.current}/10)`)
          setTimeout(() => {
            if (mapRef.current) {
              loadLeaflet()
            } else {
              loadLeaflet() // Will retry or give up based on retry count
            }
          }, 100)
        } else {
          console.log('Map container still not available after 10 retries, skipping initialization')
          isInitializingRef.current = false
          retryCountRef.current = 0
        }
        return
      }

      // Check if Leaflet is already loaded
      if ((window as any).L) {
        await initializeMap((window as any).L)
        return
      }

      // Load Leaflet CSS
      const cssLink = document.createElement("link")
      cssLink.rel = "stylesheet"
      cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      cssLink.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      cssLink.crossOrigin = ""
      document.head.appendChild(cssLink)

      // Load Leaflet Routing Machine CSS
      const routingCssLink = document.createElement("link")
      routingCssLink.rel = "stylesheet"
      routingCssLink.href = "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css"
      document.head.appendChild(routingCssLink)

      // Load Leaflet JS
      const script = document.createElement("script")
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      script.crossOrigin = ""

      script.onload = () => {
        // Load Leaflet Routing Machine after Leaflet is loaded
        const routingScript = document.createElement("script")
        routingScript.src = "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.min.js"
        routingScript.onload = async () => {
          // Check if container still exists after script loading
          if (!mapRef.current) {
            console.log('Map container no longer available after script loading')
            isInitializingRef.current = false
            return
          }
          await initializeMap((window as any).L)
        }
        document.head.appendChild(routingScript)
      }

      document.head.appendChild(script)
    }

    const initializeMap = async (L: any) => {
      if (!mapRef.current || isInitializingRef.current) return

      isInitializingRef.current = true
      console.log('Starting map initialization...')

      // Check if the map container already has a map instance
      if ((mapRef.current as any)._leaflet_id) {
        console.log('Map container already initialized, removing existing map')
        // Remove existing map instance
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }
        // Clear the leaflet ID from the container
        delete (mapRef.current as any)._leaflet_id
      }

      // Additional check: if mapInstanceRef already exists, clean it up
      if (mapInstanceRef.current) {
        console.log('Cleaning up existing map instance')
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      // Load routing plugin
      const routingControl = L.Routing.control({
        waypoints: [],
        routeWhileDragging: true,
        show: false
      });

      // Get user's current location for map initialization
      const initializeMapWithLocation = async () => {
        let initialCoords: [number, number] = [13.0827, 80.2707] // Default to Chennai
        let initialZoom = 11

        try {
          if (navigator.geolocation) {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 60000
              })
            })
            
            initialCoords = [position.coords.latitude, position.coords.longitude]
            initialZoom = 13 // Closer zoom for current location
            setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
            console.log('Map initialized with current location:', initialCoords)
          }
        } catch (error) {
          console.log('Using default location for map initialization:', error)
        }

        // Double-check that the container exists and is clean before initializing
        if (!mapRef.current) {
          console.log('Map container not found, cannot initialize map')
          throw new Error('Map container not found')
        }

        if ((mapRef.current as any)._leaflet_id) {
          console.log('Container still has leaflet_id, clearing it')
          delete (mapRef.current as any)._leaflet_id
        }

        // Initialize map with current location or default
        const map = L.map(mapRef.current, {
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
          dragging: true,
          touchZoom: true
        }).setView(initialCoords, initialZoom)
        
        // Add zoom controls
        L.control.zoom({
          position: 'topright'
        }).addTo(map)
        
        return map
      }

      // Initialize map
      let map: any
      try {
        map = await initializeMapWithLocation()
        mapInstanceRef.current = map
      } catch (error) {
        console.error('Failed to initialize map:', error)
        isInitializingRef.current = false
        return
      }

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // Fix marker icons (Leaflet issue with webpack)
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      })

      // Create layer groups for different features
      layersRef.current = {
        heatmap: L.layerGroup(),
        patrol: L.layerGroup(),
        saferoute: L.layerGroup(),
        alerts: L.layerGroup(),
        zones: L.layerGroup(),
        patrolRoute: L.layerGroup(),
        policeVehicle: L.layerGroup(),
        roleBasedPaths: L.layerGroup(),
        safeZones: L.layerGroup(),
      }

      // Add demo data for each layer
      if (layersRef.current) {
        await setupEnhancedDemoLayers(L, layersRef.current)
        
        // Load approved public reports as alerts
        loadApprovedReports(L, layersRef.current)
      } else {
        console.log('Layers not initialized, skipping demo data setup')
      }

        // Add default heatmap layer to map
        if (layersRef.current.heatmap) {
          console.log('Adding initial heatmap layer to map')
          layersRef.current.heatmap.addTo(map)
          console.log('Initial heatmap layer added successfully')
          console.log('Heatmap layer has', layersRef.current.heatmap.getLayers().length, 'layers')
        }

        // Center map on current location if available
        if (navigator.geolocation && map) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (map && map.setView) {
                const userLocation = [position.coords.latitude, position.coords.longitude] as [number, number]
                map.setView(userLocation, 13)
                console.log('Map centered on user location:', userLocation)
              } else {
                console.log('Map instance not available for centering')
              }
            },
            (error) => {
              console.log('Could not get location for map centering:', error)
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 60000
            }
          )
        }

      // Start automatic hotspot refresh
      startAutomaticHotspotRefresh()
      
      // Reset initialization flag and retry count
      isInitializingRef.current = false
      retryCountRef.current = 0
      console.log('Map initialization completed successfully')
    }

    loadLeaflet()

    // Cleanup function
    return () => {
      console.log('Map component cleanup started')
      
      // Clear timeout
      if (cacheTimeoutRef.current) {
        clearTimeout(cacheTimeoutRef.current)
        cacheTimeoutRef.current = null
      }
      
      // Remove map instance
      if (mapInstanceRef.current) {
        console.log('Removing map instance')
        try {
          mapInstanceRef.current.remove()
        } catch (error) {
          console.log('Error removing map instance:', error)
        }
        mapInstanceRef.current = null
      }
      
      // Clear the leaflet ID from the container if it exists
      if (mapRef.current && (mapRef.current as any)._leaflet_id) {
        console.log('Clearing leaflet ID from container')
        delete (mapRef.current as any)._leaflet_id
      }
      
      // Clear layers reference
      if (layersRef.current) {
        layersRef.current = {}
      }
      
      // Reset initialization flag and retry count
      isInitializingRef.current = false
      retryCountRef.current = 0
      console.log('Map component cleanup completed')
    }
  }, [])

  // Automatic hotspot refresh function
  const startAutomaticHotspotRefresh = () => {
    const refreshHotspots = async () => {
      if (!mapInstanceRef.current || !layersRef.current) return

      const L = (window as any).L
      if (!L) return

      // Only refresh if heatmap is active or if cache is stale (older than 5 minutes)
      const now = Date.now()
      const shouldRefresh = activeLayer === 'heatmap' || 
                           (now - lastHotspotUpdateRef.current) > 5 * 60 * 1000

      if (shouldRefresh && !isLoadingHotspots && layersRef.current) {
        setIsLoadingHotspots(true)
        try {
          await setupEnhancedDemoLayers(L, layersRef.current)
          lastHotspotUpdateRef.current = now
          console.log('Hotspots refreshed automatically')
        } catch (error) {
          console.error('Error refreshing hotspots:', error)
        } finally {
          setIsLoadingHotspots(false)
        }
      }

      // Schedule next refresh (every 2 minutes)
      cacheTimeoutRef.current = setTimeout(refreshHotspots, 2 * 60 * 1000)
    }

    // Start the refresh cycle
    cacheTimeoutRef.current = setTimeout(refreshHotspots, 2 * 60 * 1000)
  }

  // Handle layer visibility and refresh approved reports
  useEffect(() => {
    const updateLayers = async () => {
      if (!mapInstanceRef.current || !layersRef.current) return

      // Additional safety check for map instance
      if (!mapInstanceRef.current || typeof mapInstanceRef.current.hasLayer !== 'function') {
        console.log('Map instance not properly initialized for layer updates')
        return
      }

      // Remove all layers first
      Object.values(layersRef.current).forEach((layer: any) => {
        if (mapInstanceRef.current && typeof mapInstanceRef.current.hasLayer === 'function' && 
            mapInstanceRef.current.hasLayer(layer)) {
          mapInstanceRef.current.removeLayer(layer)
        }
      })

      // Recreate layers with fresh data
      const L = (window as any).L
      if (L && layersRef.current) {
        if (layersRef.current.alerts && typeof layersRef.current.alerts.clearLayers === 'function') {
          layersRef.current.alerts.clearLayers()
        }
        await setupEnhancedDemoLayers(L, layersRef.current)
        loadApprovedReports(L, layersRef.current)
      }

      // Add active layer
      if (activeLayer && layersRef.current[activeLayer]) {
        console.log(`Adding ${activeLayer} layer to map`)
        if (mapInstanceRef.current && typeof mapInstanceRef.current.addLayer === 'function') {
          layersRef.current[activeLayer].addTo(mapInstanceRef.current)
          console.log(`Layer ${activeLayer} added successfully`)
        }
      } else {
        console.log(`Layer ${activeLayer} not found or map not ready`)
      }

      // Always add police vehicle layer (if it exists and has content)
      if (layersRef.current.policeVehicle && layersRef.current.policeVehicle.getLayers().length > 0) {
        if (mapInstanceRef.current && typeof mapInstanceRef.current.hasLayer === 'function' && 
            !mapInstanceRef.current.hasLayer(layersRef.current.policeVehicle)) {
          layersRef.current.policeVehicle.addTo(mapInstanceRef.current)
          console.log('Police vehicle layer added to map')
        }
      }

      // Always add role-based paths layer (if it exists and has content)
      if (layersRef.current.roleBasedPaths && layersRef.current.roleBasedPaths.getLayers().length > 0) {
        if (mapInstanceRef.current && typeof mapInstanceRef.current.hasLayer === 'function' && 
            !mapInstanceRef.current.hasLayer(layersRef.current.roleBasedPaths)) {
          layersRef.current.roleBasedPaths.addTo(mapInstanceRef.current)
          console.log('Role-based paths layer added to map')
        }
      }
    }
    
    updateLayers()
  }, [activeLayer])

  // Listen for localStorage changes to refresh approved reports
  useEffect(() => {
    const handleStorageChange = async () => {
      if (!mapInstanceRef.current || !layersRef.current || activeLayer !== 'alerts') return
      
      const L = (window as any).L
      if (L && layersRef.current && layersRef.current.alerts) {
        layersRef.current.alerts.clearLayers()
        await setupEnhancedDemoLayers(L, layersRef.current)
        loadApprovedReports(L, layersRef.current)
      }
    }

    const handleHotspotRefresh = async () => {
      if (!mapInstanceRef.current || !layersRef.current) return
      
      const L = (window as any).L
      if (L && !isLoadingHotspots && layersRef.current) {
        setIsLoadingHotspots(true)
        try {
          await setupEnhancedDemoLayers(L, layersRef.current)
          lastHotspotUpdateRef.current = Date.now()
          console.log('Hotspots refreshed manually')
        } catch (error) {
          console.error('Error refreshing hotspots:', error)
        } finally {
          setIsLoadingHotspots(false)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('publicReportsUpdated', handleStorageChange)
    window.addEventListener('refreshHotspots', handleHotspotRefresh)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('publicReportsUpdated', handleStorageChange)
      window.removeEventListener('refreshHotspots', handleHotspotRefresh)
    }
  }, [activeLayer, isLoadingHotspots])

  return (
    <div className="relative w-full h-full rounded-lg">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Recenter Button */}
      <button
        onClick={handleRecenter}
        disabled={isRecenterLoading}
        className="absolute top-4 left-4 z-[1000] bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 shadow-lg transition-colors disabled:opacity-50"
        title="Recenter on your location"
      >
        {isRecenterLoading ? (
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
      
      {isLoadingHotspots && (
        <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-sm">
              <div className="font-medium text-slate-700">Loading AI Predictions...</div>
              <div className="text-xs text-slate-500">This may take 15-30 seconds</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

async function setupEnhancedDemoLayers(L: any, layers: any, useCache: boolean = true) {
  // Check if layers object exists
  if (!layers) {
    console.log('Layers object not available, skipping demo layers setup')
    return
  }

  let crimeHotspots: any[] = []
  
  console.log('Setting up enhanced demo layers...')
  
  try {
    console.log('🔄 Starting API call to fetch crime predictions...')
    console.log('⏳ This may take 15-30 seconds for AI processing...')
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.log('⏰ API call timed out after 30 seconds')
      controller.abort()
    }, 30000) // 30 second timeout
    
    // Fetch crime hotspots from server API
    const response = await fetch('http://localhost:8000/api/crime-predictions/?city=TamilNadu&count=50', {
      signal: controller.signal
      // Removed headers that cause CORS issues
    })
    
    clearTimeout(timeoutId)
    console.log('📡 API Response status:', response.status, response.statusText)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('📊 Full API Response:', data)
    
    if (data.status === 'success' && data.coordinates) {
      console.log('✅ API Success! Raw coordinates count:', data.coordinates.length)
      console.log('📍 Raw API coordinates (first 3):', data.coordinates.slice(0, 3))
      
      // Transform server data to match expected format
      crimeHotspots = data.coordinates.map((coord: any, index: number) => {
        console.log(`🔄 Processing coordinate ${index + 1}:`, coord)
        
        const riskLevels = {
          'high': 0.8 + Math.random() * 0.2,
          'medium': 0.4 + Math.random() * 0.4,
          'low': 0.1 + Math.random() * 0.3
        } as const
        const riskIntensity = riskLevels[coord.risk_level as keyof typeof riskLevels] || 0.5
        
        const hotspot = {
          lat: coord.lat,
          lng: coord.lng,
          intensity: riskIntensity,
          area: `API Location ${index + 1}`,
          crimes: Math.floor(riskIntensity * 70)
        }
        
        console.log(`✅ Created hotspot ${index + 1}:`, hotspot)
        return hotspot
      })
      
      console.log(`🎯 Successfully processed ${crimeHotspots.length} API hotspots`)
      console.log('📍 First few processed hotspots:', crimeHotspots.slice(0, 3))
    } else {
      console.log('❌ API Response issue - status:', data.status, 'coordinates:', data.coordinates)
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('⏰ Crime data request timed out, using fallback data')
    } else {
      console.error('💥 Failed to fetch crime data from server:', error)
    }
  }
  
  // Only use API data - no fallback
  if (crimeHotspots.length === 0) {
    console.log('❌ No API data received - showing empty map')
    return // Don't add any hotspots if API fails
  } else {
    console.log(`🎉 Using ${crimeHotspots.length} REAL API hotspots!`)
  }

  console.log(`Adding ${crimeHotspots.length} crime hotspots to heatmap layer`)
  
  crimeHotspots.forEach((hotspot, index) => {
    // Calculate color based on intensity
    const getColor = (intensity: number) => {
      if (intensity >= 0.8) return "#dc2626" // High risk - Red
      if (intensity >= 0.6) return "#f97316" // Medium-high risk - Orange
      if (intensity >= 0.4) return "#facc15" // Medium risk - Yellow
      return "#22c55e" // Low risk - Green
    }

    console.log(`Adding hotspot ${index + 1}: ${hotspot.area} at [${hotspot.lat}, ${hotspot.lng}]`)

    const circle = L.circle([hotspot.lat, hotspot.lng], {
      color: getColor(hotspot.intensity),
      fillColor: getColor(hotspot.intensity),
      fillOpacity: 0.7, // Increased opacity for better visibility
      radius: 500, // Fixed radius for better visibility
      weight: 3,
    })

    circle.bindPopup(`
      <div style="font-family: system-ui; padding: 12px; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; color: ${getColor(hotspot.intensity)}; font-weight: bold;">${hotspot.area}</h3>
        <div style="
          padding: 8px;
          background: ${hotspot.intensity >= 0.8 ? '#fef2f2' : 
                       hotspot.intensity >= 0.6 ? '#fff7ed' :
                       hotspot.intensity >= 0.4 ? '#fefce8' :
                       '#f0fdf4'};
          border: 1px solid ${hotspot.intensity >= 0.8 ? '#fecaca' :
                             hotspot.intensity >= 0.6 ? '#fed7aa' :
                             hotspot.intensity >= 0.4 ? '#fef08a' :
                             '#86efac'};
          border-radius: 6px;
          margin-bottom: 8px;
        ">
          <div style="color: #374151; margin-bottom: 4px;">
            <strong>Crime Reports:</strong> ${hotspot.crimes}
          </div>
          <div style="color: #374151;">
            <strong>Risk Level:</strong> 
            <span style="
              color: ${getColor(hotspot.intensity)};
              font-weight: 500;
            ">
              ${hotspot.intensity >= 0.8 ? 'High Risk' :
                hotspot.intensity >= 0.6 ? 'Medium-High Risk' :
                hotspot.intensity >= 0.4 ? 'Medium Risk' :
                'Low Risk'}
            </span>
          </div>
        </div>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">
          Updated: ${new Date().toLocaleDateString()}
        </p>
      </div>
    `)

    layers.heatmap.addLayer(circle)
  })
  
  console.log(`Successfully added ${crimeHotspots.length} hotspots to heatmap layer`)
  
  // Fit map bounds to show all hotspots if we have any
  if (crimeHotspots.length > 0) {
    try {
      const bounds = L.latLngBounds()
      crimeHotspots.forEach(hotspot => {
        bounds.extend([hotspot.lat, hotspot.lng])
      })
      
      // Get the map instance from the layer
      const map = layers.heatmap._map
      if (map) {
        map.fitBounds(bounds.pad(0.1))
        console.log('Map bounds fitted to show all hotspots')
      }
    } catch (error) {
      console.log('Could not fit bounds, but hotspots are added:', error)
    }
  }

  // Patrol layer - Enhanced polyline routes with multiple patrol paths
  const patrolRoutes = [
    {
      name: "Central Patrol",
      route: [
        [13.0827, 80.2707],
        [13.0756, 80.2634],
        [13.0689, 80.2578],
        [13.0623, 80.2512],
        [13.0678, 80.2785],
        [13.0827, 80.2707],
      ],
      color: "#3b82f6",
      status: "Active",
    },
    {
      name: "South Patrol",
      route: [
        [13.0458, 80.2209],
        [13.0389, 80.2619],
        [13.0582, 80.2623],
        [13.0458, 80.2209],
      ],
      color: "#06b6d4",
      status: "Active",
    },
    {
      name: "North Patrol",
      route: [
        [13.1067, 80.2109],
        [13.1185, 80.2574],
        [13.1067, 80.2109],
      ],
      color: "#8b5cf6",
      status: "Standby",
    },
  ]

  patrolRoutes.forEach((patrol) => {
    const polyline = L.polyline(patrol.route, {
      color: patrol.color,
      weight: 4,
      opacity: 0.8,
      dashArray: patrol.status === "Standby" ? "10, 5" : null,
    })

    polyline.bindPopup(`
      <div style="font-family: system-ui; padding: 8px;">
        <h3 style="margin: 0 0 8px 0; color: ${patrol.color}; font-weight: bold;">${patrol.name}</h3>
        <p style="margin: 0; color: #374151;">Status: <strong>${patrol.status}</strong></p>
        <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 12px;">Route Length: ${patrol.route.length - 1} checkpoints</p>
      </div>
    `)

    polyline.addTo(layers.patrol)
  })

  // Safe Route layer - Enhanced green paths with safety ratings
  const safeRoutes = [
    {
      name: "Marina Beach Route",
      route: [
        [13.0827, 80.2707],
        [13.0756, 80.2834],
        [13.0689, 80.2878],
        [13.0623, 80.2912],
      ],
      safety: "High",
      lighting: "Excellent",
    },
    {
      name: "Express Avenue Route",
      route: [
        [13.0678, 80.2785],
        [13.0582, 80.2623],
        [13.0458, 80.2209],
      ],
      safety: "Medium",
      lighting: "Good",
    },
    {
      name: "Anna Nagar Circuit",
      route: [
        [13.1067, 80.2109],
        [13.1185, 80.2574],
        [13.1067, 80.2309],
      ],
      safety: "High",
      lighting: "Excellent",
    },
  ]

  safeRoutes.forEach((route) => {
    const polyline = L.polyline(route.route, {
      color: "#15803d",
      weight: 5,
      opacity: 0.9,
    })

    polyline.bindPopup(`
      <div style="font-family: system-ui; padding: 8px;">
        <h3 style="margin: 0 0 8px 0; color: #15803d; font-weight: bold;">${route.name}</h3>
        <p style="margin: 0; color: #374151;">Safety Rating: <strong>${route.safety}</strong></p>
        <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 12px;">Lighting: ${route.lighting}</p>
      </div>
    `)

    polyline.addTo(layers.saferoute)
  })

  // Alerts layer - Enhanced warning markers with different alert types
  const alertsData = [
    {
      lat: 13.0678,
      lng: 80.2785,
      type: "High Crime Alert",
      severity: "high",
      time: "2 mins ago",
      description: "Multiple theft reports in the area",
      status: "accepted",
      patrolUnit: "Central Patrol",
      attachments: {
        photos: 2,
        videos: 1,
        documents: 1
      }
    },
    {
      lat: 13.0458,
      lng: 80.2209,
      type: "Traffic Incident",
      severity: "medium",
      time: "15 mins ago",
      description: "Road accident causing traffic delays",
      status: "pending",
      attachments: {
        photos: 3,
        videos: 1,
        documents: 0
      }
    },
    {
      lat: 13.1067,
      lng: 80.2109,
      type: "Emergency Response",
      severity: "high",
      time: "5 mins ago",
      description: "Police units dispatched to location",
      status: "accepted",
      patrolUnit: "North Patrol",
      attachments: {
        photos: 1,
        videos: 0,
        documents: 2
      }
    },
    {
      lat: 13.0582,
      lng: 80.2623,
      type: "Suspicious Activity",
      severity: "low",
      time: "1 hour ago",
      description: "Reported by community member",
      status: "pending",
      attachments: {
        photos: 1,
        videos: 0,
        documents: 0
      }
    },
    {
      lat: 13.1185,
      lng: 80.2574,
      type: "Public Safety",
      severity: "medium",
      time: "30 mins ago",
      description: "Street lighting maintenance required",
      status: "accepted",
      patrolUnit: "North Patrol",
      attachments: {
        photos: 2,
        videos: 0,
        documents: 1
      }
    },
  ]

  alertsData.forEach((alert) => {
    const severityColors = {
      high: "#dc2626",
      medium: "#f59e0b",
      low: "#10b981",
    }

    const marker = L.marker([alert.lat, alert.lng], {
      icon: L.divIcon({
        className: "custom-alert-marker",
        html: `
          <div style="position: relative;">
            <div style="
              background: ${severityColors[alert.severity as keyof typeof severityColors]}; 
              color: white; 
              border-radius: 50%; 
              width: 28px; 
              height: 28px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: bold;
              font-size: 14px;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">!</div>
            ${alert.status === 'accepted' ? `
              <div style="
                position: absolute;
                bottom: -4px;
                right: -4px;
                background: #16a34a;
                color: white;
                border-radius: 50%;
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 10px;
                border: 2px solid white;
                box-shadow: 0 1px 2px rgba(0,0,0,0.3);
              ">✓</div>
            ` : ''}
          </div>`,
        iconSize: [32, 32],
      }),
    })

    marker.bindPopup(`
      <div style="font-family: system-ui; padding: 12px; min-width: 240px;">
        <h3 style="margin: 0 0 8px 0; color: ${severityColors[alert.severity as keyof typeof severityColors]}; font-weight: bold;">${alert.type}</h3>
        <p style="margin: 0 0 8px 0; color: #374151;">${alert.description}</p>
        <div style="
          margin: 8px 0;
          padding: 8px;
          background: ${alert.status === 'accepted' ? '#f0fdf4' : '#fef2f2'};
          border: 1px solid ${alert.status === 'accepted' ? '#86efac' : '#fecaca'};
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span style="
            color: ${alert.status === 'accepted' ? '#16a34a' : '#dc2626'};
            font-size: 13px;
            font-weight: 500;
          ">
            ${alert.status === 'accepted' ? '✓ Accepted by ' + alert.patrolUnit : '⏳ Pending Response'}
          </span>
        </div>
        <div style="margin: 8px 0;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Attachments:</div>
          <div style="display: flex; gap: 8px;">
            ${alert.attachments.photos > 0 ? `
              <span style="color: #374151; font-size: 12px;">
                📷 ${alert.attachments.photos} Photo${alert.attachments.photos > 1 ? 's' : ''}
              </span>
            ` : ''}
            ${alert.attachments.videos > 0 ? `
              <span style="color: #374151; font-size: 12px;">
                🎥 ${alert.attachments.videos} Video${alert.attachments.videos > 1 ? 's' : ''}
              </span>
            ` : ''}
            ${alert.attachments.documents > 0 ? `
              <span style="color: #374151; font-size: 12px;">
                📄 ${alert.attachments.documents} Doc${alert.attachments.documents > 1 ? 's' : ''}
              </span>
            ` : ''}
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
          <span style="color: #6b7280; font-size: 12px;">${alert.time}</span>
          <span style="
            background: ${severityColors[alert.severity as keyof typeof severityColors]}; 
            color: white; 
            padding: 2px 8px; 
            border-radius: 12px; 
            font-size: 11px; 
            text-transform: uppercase;
          ">${alert.severity}</span>
        </div>
      </div>
    `)

    marker.addTo(layers.alerts)
  })

  // Zones layer - Police jurisdiction zones with boundaries
  const zonesData = [
    {
      name: "Zone 1 - Central Chennai",
      coordinates: [
        [13.0827, 80.2707],
        [13.0756, 80.2834],
        [13.0689, 80.2878],
        [13.0623, 80.2912],
        [13.0582, 80.2823],
        [13.0678, 80.2785],
        [13.0827, 80.2707]
      ],
      officer: "Inspector Kumar",
      stations: 3,
      population: "~250,000",
      crimeRate: "Medium"
    },
    {
      name: "Zone 2 - North Chennai", 
      coordinates: [
        [13.1067, 80.2109],
        [13.1185, 80.2574],
        [13.1067, 80.2809],
        [13.0950, 80.2650],
        [13.0890, 80.2200],
        [13.1067, 80.2109]
      ],
      officer: "Inspector Priya",
      stations: 2,
      population: "~180,000",
      crimeRate: "Low"
    },
    {
      name: "Zone 3 - South Chennai",
      coordinates: [
        [13.0458, 80.2209],
        [13.0389, 80.2619],
        [13.0200, 80.2500],
        [13.0100, 80.2200],
        [13.0300, 80.2100],
        [13.0458, 80.2209]
      ],
      officer: "Inspector Raj",
      stations: 4,
      population: "~320,000",
      crimeRate: "High"
    }
  ]

  zonesData.forEach((zone, index) => {
    const zoneColors = ["#3b82f6", "#10b981", "#f59e0b"]
    const color = zoneColors[index % zoneColors.length]
    
    const polygon = L.polygon(zone.coordinates, {
      color: color,
      fillColor: color,
      fillOpacity: 0.1,
      weight: 3,
      opacity: 0.8,
      dashArray: "5, 5"
    })

    polygon.bindPopup(`
      <div style="font-family: system-ui; padding: 12px; min-width: 220px;">
        <h3 style="margin: 0 0 8px 0; color: ${color}; font-weight: bold;">${zone.name}</h3>
        <div style="
          padding: 8px;
          background: ${color}15;
          border: 1px solid ${color}40;
          border-radius: 6px;
          margin-bottom: 8px;
        ">
          <div style="color: #374151; margin-bottom: 4px;">
            <strong>Officer in Charge:</strong> ${zone.officer}
          </div>
          <div style="color: #374151; margin-bottom: 4px;">
            <strong>Police Stations:</strong> ${zone.stations}
          </div>
          <div style="color: #374151; margin-bottom: 4px;">
            <strong>Population:</strong> ${zone.population}
          </div>
          <div style="color: #374151;">
            <strong>Crime Rate:</strong> 
            <span style="
              color: ${zone.crimeRate === 'High' ? '#dc2626' : zone.crimeRate === 'Medium' ? '#f59e0b' : '#10b981'};
              font-weight: 500;
            ">
              ${zone.crimeRate}
            </span>
          </div>
        </div>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">
          Jurisdiction boundary updated: ${new Date().toLocaleDateString()}
        </p>
      </div>
    `)

    polygon.addTo(layers.zones)
  })
}

function loadApprovedReports(L: any, layers: any) {
  // Check if layers and alerts layer exist
  if (!layers || !layers.alerts) {
    console.log('Layers or alerts layer not available, skipping approved reports loading')
    return
  }

  const reports = JSON.parse(localStorage.getItem("publicReports") || "[]")
  const approvedReports = reports.filter((report: any) => report.status === "approved")
  
  approvedReports.forEach((report: any) => {
    let lat, lng
    
    // Parse coordinates from location string
    if (report.location.includes(',')) {
      const coords = report.location.split(',')
      lat = parseFloat(coords[0].trim())
      lng = parseFloat(coords[1].trim())
    } else {
      // Default coordinates for landmark locations
      const landmarks: { [key: string]: [number, number] } = {
        "Marina Beach": [13.0478, 80.2838],
        "T. Nagar": [13.0418, 80.2341],
        "Anna Nagar": [13.0850, 80.2101],
        "Velachery": [12.9816, 80.2209],
        "Adyar": [13.0067, 80.2206],
        "Mylapore": [13.0339, 80.2619],
        "Guindy": [13.0067, 80.2206],
        "Tambaram": [12.9249, 80.1000],
        "Porur": [13.0381, 80.1564],
        "OMR (IT Corridor)": [12.8406, 80.1534],
        "GST Road": [12.9165, 80.1854],
        "ECR (East Coast Road)": [12.7925, 80.2269]
      }
      const coords = landmarks[report.location] || [13.0827, 80.2707]
      lat = coords[0]
      lng = coords[1]
    }
    
    const severityColors = {
      Low: "#10b981",
      Medium: "#f59e0b", 
      High: "#dc2626",
      Critical: "#dc2626"
    }
    
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: "custom-alert-marker",
        html: `
          <div style="
            background: ${severityColors[report.severity as keyof typeof severityColors]};
            color: white;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">!</div>`,
        iconSize: [32, 32]
      })
    })
    
    marker.bindPopup(`
      <div style="font-family: system-ui; padding: 12px; min-width: 240px;">
        <h3 style="margin: 0 0 8px 0; color: ${severityColors[report.severity as keyof typeof severityColors]}; font-weight: bold;">${report.type.replace('_', ' ').toUpperCase()}</h3>
        <p style="margin: 0 0 8px 0; color: #374151;">${report.description}</p>
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;"><strong>Location:</strong> ${report.location}</p>
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;"><strong>Reported by:</strong> ${report.reportedBy}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
          <span style="color: #6b7280; font-size: 12px;">${new Date(report.timestamp).toLocaleString()}</span>
          <span style="
            background: ${severityColors[report.severity as keyof typeof severityColors]};
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            text-transform: uppercase;
          ">${report.severity}</span>
        </div>
      </div>
    `)
    
    marker.addTo(layers.alerts)
  })
}

function geocodeAndRoute(L: any, map: any, source: string, destination: string) {
  // Predefined Tamil Nadu locations
  const locations: { [key: string]: [number, number] } = {
    // Chennai locations
    "marina beach": [13.0478, 80.2838],
    "t nagar": [13.0418, 80.2341],
    "anna nagar": [13.0850, 80.2101],
    "velachery": [12.9816, 80.2209],
    "adyar": [13.0067, 80.2206],
    "mylapore": [13.0339, 80.2619],
    "guindy": [13.0067, 80.2206],
    "tambaram": [12.9249, 80.1000],
    "porur": [13.0381, 80.1564],
    "omr": [12.8406, 80.1534],
    "gst road": [12.9165, 80.1854],
    "ecr": [12.7925, 80.2269],
    "central station": [13.0836, 80.2750],
    "airport": [12.9941, 80.1709],
    "express avenue": [13.0732, 80.2609],
    "chennai": [13.0827, 80.2707],
    
    // Major Tamil Nadu cities
    "madurai": [9.9252, 78.1198],
    "coimbatore": [11.0168, 76.9558],
    "trichy": [10.7905, 78.7047],
    "salem": [11.6643, 78.1460],
    "tirunelveli": [8.7139, 77.7567],
    "erode": [11.3410, 77.7172],
    "vellore": [12.9165, 79.1325],
    "thoothukudi": [8.7642, 78.1348],
    "dindigul": [10.3673, 77.9803],
    "thanjavur": [10.7870, 79.1378],
    "kanchipuram": [12.8342, 79.7036],
    "kumbakonam": [10.9601, 79.3788],
    "nagercoil": [8.1790, 77.4338],
    "karur": [10.9571, 78.0766],
    "hosur": [12.7409, 77.8253]
  }
  
  // Flexible location matching
  const findLocation = (input: string) => {
    const key = input.toLowerCase().trim()
    
    // Direct match
    if (locations[key]) return locations[key]
    
    // Partial match
    const partialMatch = Object.keys(locations).find(loc => 
      loc.includes(key) || key.includes(loc)
    )
    
    return partialMatch ? locations[partialMatch] : null
  }
  
  const sourceCoords = findLocation(source)
  const destCoords = findLocation(destination)
  
  if (!sourceCoords || !destCoords) {
    const availableLocations = Object.keys(locations).sort().join(', ')
    alert(`Available locations: ${availableLocations}`)
    return
  }
  
  // Get crime hotspots to avoid
  const crimeHotspots = getCrimeHotspots()
  
  // Create safe route avoiding crime areas
  const safeWaypoints = calculateSafeRoute(sourceCoords, destCoords, crimeHotspots)
  
  // Create simple polyline route (no external routing API needed)
  const routeLine = L.polyline(safeWaypoints, {
    color: '#22c55e',
    weight: 6,
    opacity: 0.8
  }).addTo(map)
  
  // Add start and end markers
  const startMarker = L.marker(sourceCoords, {
    icon: L.divIcon({
      html: '<div style="background: #22c55e; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">S</div>',
      iconSize: [24, 24]
    })
  }).addTo(map)
  
  const endMarker = L.marker(destCoords, {
    icon: L.divIcon({
      html: '<div style="background: #dc2626; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">D</div>',
      iconSize: [24, 24]
    })
  }).addTo(map)
  
  // Store route elements for cleanup
  map._routeElements = [routeLine, startMarker, endMarker]
  
  // Fit map to route bounds
  map.fitBounds(routeLine.getBounds().pad(0.1))
  
  // Add route info popup
  const distance = calculateDistance(sourceCoords, destCoords)
  const routeInfo = L.popup()
    .setLatLng([(sourceCoords[0] + destCoords[0]) / 2, (sourceCoords[1] + destCoords[1]) / 2])
    .setContent(`
      <div style="font-family: system-ui; padding: 8px; text-align: center;">
        <h4 style="margin: 0 0 4px 0; color: #22c55e;">Safe Route</h4>
        <p style="margin: 0; color: #374151;">Distance: ~${distance.toFixed(1)} km</p>
        <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 12px;">Route avoids high-crime areas</p>
      </div>
    `)
    .openOn(map)
}

function getCrimeHotspots() {
  return [
    { lat: 13.0405, lng: 80.2337, intensity: 0.95, radius: 1200 },
    { lat: 13.0368, lng: 80.2676, intensity: 0.92, radius: 1100 },
    { lat: 13.0064, lng: 80.2206, intensity: 0.88, radius: 1000 },
    { lat: 13.0850, lng: 80.2101, intensity: 0.85, radius: 900 },
    { lat: 13.0827, lng: 80.2442, intensity: 0.82, radius: 800 }
  ]
}

function calculateSafeRoute(source: number[], destination: number[], crimeHotspots: any[]) {
  const waypoints = [source]
  
  // Simple safe routing: add intermediate waypoints to avoid high-crime areas
  const midLat = (source[0] + destination[0]) / 2
  const midLng = (source[1] + destination[1]) / 2
  
  // Check if direct route passes through high-crime areas
  const directRouteRisk = crimeHotspots.some(hotspot => {
    if (hotspot.intensity < 0.8) return false
    
    // Simple distance check to crime hotspot
    const distToHotspot = Math.sqrt(
      Math.pow(midLat - hotspot.lat, 2) + Math.pow(midLng - hotspot.lng, 2)
    )
    
    return distToHotspot < 0.01 // Approximately 1km
  })
  
  if (directRouteRisk) {
    // Add safe intermediate waypoints
    const safeOffset = 0.008 // Offset to avoid crime areas
    
    // Try different safe routes
    const safeRoutes = [
      [midLat + safeOffset, midLng],
      [midLat - safeOffset, midLng],
      [midLat, midLng + safeOffset],
      [midLat, midLng - safeOffset]
    ]
    
    // Pick the safest intermediate point
    const safestPoint = safeRoutes.reduce((safest, point) => {
      const risk = crimeHotspots.reduce((totalRisk, hotspot) => {
        const dist = Math.sqrt(
          Math.pow(point[0] - hotspot.lat, 2) + Math.pow(point[1] - hotspot.lng, 2)
        )
        return totalRisk + (hotspot.intensity / (dist + 0.001))
      }, 0)
      
      return risk < safest.risk ? { point, risk } : safest
    }, { point: safeRoutes[0], risk: Infinity })
    
    waypoints.push(safestPoint.point)
  }
  
  waypoints.push(destination)
  return waypoints
}

function calculateDistance(coord1: number[], coord2: number[]) {
  const R = 6371 // Earth's radius in km
  const dLat = (coord2[0] - coord1[0]) * Math.PI / 180
  const dLon = (coord2[1] - coord1[1]) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

async function getRoadRoute(L: any, start: [number, number], end: [number, number]) {
  try {
    // Use OpenRouteService for road routing
    const apiKey = '5b3ce3597851110001cf6248c8b8b8b8' // Free API key for demo
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${start[1]},${start[0]}&end=${end[1]},${end[0]}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.features && data.features[0] && data.features[0].geometry) {
      const coordinates = data.features[0].geometry.coordinates
      return coordinates.map((coord: number[]) => [coord[1], coord[0]]) // Convert to [lat, lng]
    }
  } catch (error) {
    console.log('Routing API error, using straight line:', error)
  }
  
  // Fallback to straight line if routing fails
  return [start, end]
}

async function getMultiPointRoute(L: any, waypoints: any[]) {
  if (waypoints.length < 2) return waypoints.map((wp: any) => [wp.lat, wp.lng])
  
  let routeCoords: [number, number][] = []
  
  // Get route between each consecutive pair of waypoints
  for (let i = 0; i < waypoints.length - 1; i++) {
    const start: [number, number] = [waypoints[i].lat, waypoints[i].lng]
    const end: [number, number] = [waypoints[i + 1].lat, waypoints[i + 1].lng]
    
    const segment = await getRoadRoute(L, start, end)
    
    if (i === 0) {
      routeCoords = [...segment]
    } else {
      // Remove the first point to avoid duplication
      routeCoords = [...routeCoords, ...segment.slice(1)]
    }
  }
  
  return routeCoords
}

async function displayPatrolRoute(L: any, layer: any, patrolRoute: any) {
  if (!patrolRoute || !patrolRoute.waypoints || patrolRoute.waypoints.length === 0) return

  const waypoints = patrolRoute.waypoints
  const routeColor = getRouteColor(patrolRoute.status)
  
  console.log('Getting road route for patrol route with', waypoints.length, 'waypoints')
  
  // Get actual road route between waypoints
  const routeCoords = await getMultiPointRoute(L, waypoints)
  
  const routeLine = L.polyline(routeCoords, {
    color: routeColor,
    weight: 6,
    opacity: 0.8,
    dashArray: patrolRoute.status === 'paused' ? "10, 5" : null
  })

  // Add route direction arrows for better visualization
  const addRouteArrows = (line: any, map: any) => {
    const latlngs = line.getLatLngs()
    for (let i = 0; i < latlngs.length - 1; i++) {
      const start = latlngs[i]
      const end = latlngs[i + 1]
      const midLat = (start.lat + end.lat) / 2
      const midLng = (start.lng + end.lng) / 2
      
      // Calculate bearing for arrow direction
      const bearing = Math.atan2(end.lng - start.lng, end.lat - start.lat) * 180 / Math.PI
      
      const arrow = L.marker([midLat, midLng], {
        icon: L.divIcon({
          className: "route-arrow",
          html: `<div style="
            transform: rotate(${bearing}deg);
            color: ${routeColor};
            font-size: 16px;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
          ">→</div>`,
          iconSize: [20, 20]
        })
      })
      
      layer.addLayer(arrow)
    }
  }

  routeLine.bindPopup(`
    <div style="font-family: system-ui; padding: 12px; min-width: 250px;">
      <h3 style="margin: 0 0 8px 0; color: ${routeColor}; font-weight: bold;">${patrolRoute.name}</h3>
      <div style="
        padding: 8px;
        background: ${routeColor}15;
        border: 1px solid ${routeColor}40;
        border-radius: 6px;
        margin-bottom: 8px;
      ">
        <div style="color: #374151; margin-bottom: 4px;">
          <strong>Status:</strong> ${patrolRoute.status.toUpperCase()}
        </div>
        <div style="color: #374151; margin-bottom: 4px;">
          <strong>Distance:</strong> ${patrolRoute.total_distance} km
        </div>
        <div style="color: #374151; margin-bottom: 4px;">
          <strong>Duration:</strong> ${patrolRoute.estimated_duration} min
        </div>
        <div style="color: #374151; margin-bottom: 4px;">
          <strong>Officers:</strong> ${patrolRoute.assigned_officers.join(', ')}
        </div>
        <div style="color: #374151;">
          <strong>Efficiency:</strong> ${patrolRoute.efficiency_score}%
        </div>
      </div>
      <p style="margin: 0; color: #6b7280; font-size: 12px;">
        ${waypoints.length} waypoints • Generated: ${new Date().toLocaleDateString()}
      </p>
    </div>
  `)

  layer.addLayer(routeLine)
  
  // Add route direction arrows
  addRouteArrows(routeLine, layer._map)

  // Add waypoint markers (only for important waypoints, not all intermediate points)
  waypoints.forEach((waypoint: any, index: number) => {
    const isCurrentLocation = waypoint.type === 'station' && waypoint.name === 'Current Location'
    const isHotspot = waypoint.type === 'hotspot'
    const isCheckpoint = waypoint.type === 'checkpoint'
    
    // Only show markers for current location and hotspots, skip intermediate checkpoints
    if (!isCurrentLocation && !isHotspot) return
    
    const markerColor = isCurrentLocation ? '#3b82f6' : getWaypointColor(waypoint.status, waypoint.priority)
    const markerIcon = L.divIcon({
      className: "custom-waypoint-marker",
      html: `
        <div style="position: relative;">
          <div style="
            background: ${markerColor}; 
            color: white; 
            border-radius: 50%; 
            width: 32px; 
            height: 32px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-weight: bold;
            font-size: 14px;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">${isCurrentLocation ? '📍' : isHotspot ? '🚨' : '•'}</div>
          ${waypoint.status === 'completed' ? `
            <div style="
              position: absolute;
              bottom: -2px;
              right: -2px;
              background: #16a34a;
              color: white;
              border-radius: 50%;
              width: 18px;
              height: 18px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 10px;
              border: 2px solid white;
              box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            ">✓</div>
          ` : waypoint.status === 'in_progress' ? `
            <div style="
              position: absolute;
              bottom: -2px;
              right: -2px;
              background: #f59e0b;
              color: white;
              border-radius: 50%;
              width: 18px;
              height: 18px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 10px;
              border: 2px solid white;
              box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            ">▶</div>
          ` : ''}
        </div>`,
      iconSize: [36, 36]
    })

    const marker = L.marker([waypoint.lat, waypoint.lng], { icon: markerIcon })
    
    marker.bindPopup(`
      <div style="font-family: system-ui; padding: 12px; min-width: 220px;">
        <h3 style="margin: 0 0 8px 0; color: ${markerColor}; font-weight: bold;">
          ${isCurrentLocation ? '📍 Current Location' : `Waypoint ${index}: ${waypoint.name}`}
        </h3>
        <div style="
          padding: 8px;
          background: ${markerColor}15;
          border: 1px solid ${markerColor}40;
          border-radius: 6px;
          margin-bottom: 8px;
        ">
          <div style="color: #374151; margin-bottom: 4px;">
            <strong>Type:</strong> ${waypoint.type.replace('_', ' ').toUpperCase()}
          </div>
          ${!isCurrentLocation && (
            `<div style="color: #374151; margin-bottom: 4px;">
              <strong>Priority:</strong> 
              <span style="
                color: ${waypoint.priority === 3 ? '#dc2626' : waypoint.priority === 2 ? '#f59e0b' : '#10b981'};
                font-weight: 500;
              ">
                ${waypoint.priority === 3 ? 'High' : waypoint.priority === 2 ? 'Medium' : 'Low'}
              </span>
            </div>`
          )}
          ${!isCurrentLocation && (
            `<div style="color: #374151; margin-bottom: 4px;">
              <strong>Est. Time:</strong> ${waypoint.estimated_time} min
            </div>`
          )}
          <div style="color: #374151;">
            <strong>Status:</strong> 
            <span style="
              color: ${waypoint.status === 'completed' ? '#16a34a' : 
                      waypoint.status === 'in_progress' ? '#f59e0b' : '#6b7280'};
              font-weight: 500;
            ">
              ${waypoint.status.toUpperCase()}
            </span>
          </div>
        </div>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">
          Coordinates: ${waypoint.lat.toFixed(4)}, ${waypoint.lng.toFixed(4)}
        </p>
      </div>
    `)

    layer.addLayer(marker)
  })

  // Fit map to route bounds
  if (routeCoords.length > 0) {
    const bounds = L.latLngBounds(routeCoords)
    setTimeout(() => {
      const map = layer._map
      if (map) {
        map.fitBounds(bounds.pad(0.1))
      }
    }, 100)
  }
}

const createPoliceVehicleIcon = (L: any) => {
  return L.divIcon({
    html: `<div style="
      background: linear-gradient(135deg, #1e40af, #3b82f6);
      border: 3px solid #ffffff;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      position: relative;
    ">
      <div style="
        color: white;
        font-size: 18px;
        font-weight: bold;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      ">🚔</div>
      <div style="
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid #1e40af;
      "></div>
    </div>`,
    className: 'police-vehicle-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  })
}

const addPoliceVehiclePin = (L: any, location: {lat: number, lng: number}, layer: any) => {
  if (!layer) {
    console.log('Police vehicle layer not available')
    return
  }

  console.log('Adding police vehicle pin at:', location)

  // Clear existing police vehicle pins
  layer.clearLayers()

  const policeIcon = createPoliceVehicleIcon(L)
  
  const marker = L.marker([location.lat, location.lng], { 
    icon: policeIcon,
    zIndexOffset: 1000 // Ensure it's on top
  })
  
  marker.bindPopup(`
    <div style="text-align: center; padding: 8px;">
      <div style="font-size: 24px; margin-bottom: 4px;">🚔</div>
      <div style="font-weight: bold; color: #1e40af; margin-bottom: 4px;">Police Vehicle</div>
      <div style="font-size: 12px; color: #666;">
        Current Location<br>
        ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}
      </div>
    </div>
  `)
  
  layer.addLayer(marker)
  console.log('Police vehicle pin added to layer')
}

const addRedZonePaths = async (L: any, layer: any) => {
  console.log('Adding red zone paths for police users')
  
  // Define red zone paths (shortest/dangerous routes for police)
  const redZonePaths = [
    {
      name: "High Crime Corridor",
      coordinates: [
        [13.0827, 80.2707], // Chennai Central
        [13.0458, 80.2209], // South Chennai
        [13.1067, 80.2109], // North Chennai
        [13.0827, 80.2707]  // Back to Central
      ],
      description: "Shortest route through high-crime areas",
      riskLevel: "High"
    },
    {
      name: "Emergency Response Route",
      coordinates: [
        [13.0827, 80.2707], // Chennai Central
        [13.1185, 80.2574], // North Chennai
        [13.0200, 80.2500], // South Chennai
        [13.0827, 80.2707]  // Back to Central
      ],
      description: "Fastest emergency response path",
      riskLevel: "Critical"
    },
    {
      name: "Patrol Hotspot Circuit",
      coordinates: [
        [13.0827, 80.2707], // Chennai Central
        [13.0756, 80.2834], // Central East
        [13.0689, 80.2878], // Central North
        [13.0623, 80.2912], // Central Northeast
        [13.0827, 80.2707]  // Back to Central
      ],
      description: "Circuit covering all crime hotspots",
      riskLevel: "High"
    }
  ]

  for (const [index, path] of redZonePaths.entries()) {
    console.log(`Adding red zone path ${index + 1}:`, path.name, path.coordinates)
    
    // Get road route for this path
    const roadCoords = await getMultiPointRoute(L, path.coordinates.map(coord => ({ lat: coord[0], lng: coord[1] })))
    
    const polyline = L.polyline(roadCoords, {
      color: '#dc2626', // Red color
      weight: 6, // Increased weight for better visibility
      opacity: 0.9, // Increased opacity
      dashArray: '10, 15' // More visible dash pattern
    })

    polyline.bindPopup(`
      <div style="font-family: system-ui; padding: 12px; min-width: 250px;">
        <h3 style="margin: 0 0 8px 0; color: #dc2626; font-weight: bold;">
          🚨 ${path.name}
        </h3>
        <div style="
          padding: 8px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          margin-bottom: 8px;
        ">
          <div style="color: #374151; margin-bottom: 4px;">
            <strong>Risk Level:</strong> 
            <span style="color: #dc2626; font-weight: 500;">${path.riskLevel}</span>
          </div>
          <div style="color: #374151;">
            <strong>Description:</strong> ${path.description}
          </div>
        </div>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">
          Police-only route - Use with caution
        </p>
      </div>
    `)

    layer.addLayer(polyline)
    console.log(`Red zone path ${index + 1} added to layer`)
  }
  
  console.log(`Total red zone paths added: ${redZonePaths.length}`)
}

const addGreenZonePaths = async (L: any, layer: any) => {
  console.log('Adding green zone paths for public users')
  
  // Define green zone paths (safe routes for public)
  const greenZonePaths = [
    {
      name: "Safe Public Route",
      coordinates: [
        [13.0827, 80.2707], // Chennai Central
        [13.0900, 80.2800], // Safe area 1
        [13.0950, 80.2900], // Safe area 2
        [13.1000, 80.3000], // Safe area 3
        [13.0827, 80.2707]  // Back to Central
      ],
      description: "Safest route for public use",
      safetyLevel: "High"
    },
    {
      name: "Well-lit Main Roads",
      coordinates: [
        [13.0827, 80.2707], // Chennai Central
        [13.0700, 80.2600], // Main road 1
        [13.0600, 80.2500], // Main road 2
        [13.0500, 80.2400], // Main road 3
        [13.0827, 80.2707]  // Back to Central
      ],
      description: "Main roads with good lighting and security",
      safetyLevel: "Very High"
    },
    {
      name: "Commercial District Route",
      coordinates: [
        [13.0827, 80.2707], // Chennai Central
        [13.0800, 80.2750], // Commercial area 1
        [13.0775, 80.2800], // Commercial area 2
        [13.0750, 80.2850], // Commercial area 3
        [13.0827, 80.2707]  // Back to Central
      ],
      description: "Route through busy commercial areas",
      safetyLevel: "High"
    }
  ]

  for (const [index, path] of greenZonePaths.entries()) {
    console.log(`Adding green zone path ${index + 1}:`, path.name, path.coordinates)
    
    // Get road route for this path
    const roadCoords = await getMultiPointRoute(L, path.coordinates.map(coord => ({ lat: coord[0], lng: coord[1] })))
    
    const polyline = L.polyline(roadCoords, {
      color: '#16a34a', // Green color
      weight: 6, // Increased weight for better visibility
      opacity: 0.9, // Increased opacity
      dashArray: '15, 10' // More visible dash pattern
    })

    polyline.bindPopup(`
      <div style="font-family: system-ui; padding: 12px; min-width: 250px;">
        <h3 style="margin: 0 0 8px 0; color: #16a34a; font-weight: bold;">
          🛡️ ${path.name}
        </h3>
        <div style="
          padding: 8px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          margin-bottom: 8px;
        ">
          <div style="color: #374151; margin-bottom: 4px;">
            <strong>Safety Level:</strong> 
            <span style="color: #16a34a; font-weight: 500;">${path.safetyLevel}</span>
          </div>
          <div style="color: #374151;">
            <strong>Description:</strong> ${path.description}
          </div>
        </div>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">
          Recommended safe route for public use
        </p>
      </div>
    `)

    layer.addLayer(polyline)
    console.log(`Green zone path ${index + 1} added to layer`)
  }
  
  console.log(`Total green zone paths added: ${greenZonePaths.length}`)
}

function getRouteColor(status: string): string {
  switch (status) {
    case 'active': return '#16a34a' // Green
    case 'paused': return '#f59e0b' // Yellow
    case 'completed': return '#6b7280' // Gray
    case 'scheduled': return '#3b82f6' // Blue
    default: return '#3b82f6'
  }
}

function getWaypointColor(status: string, priority: number): string {
  if (status === 'completed') return '#16a34a' // Green
  if (status === 'in_progress') return '#f59e0b' // Yellow
  
  // Color by priority for pending waypoints
  switch (priority) {
    case 3: return '#dc2626' // Red for high priority
    case 2: return '#f59e0b' // Yellow for medium priority
    case 1: return '#10b981' // Green for low priority
    default: return '#6b7280' // Gray
  }
}

function displaySafeZones(L: any, layer: any, safePlaces: SafePlace[]) {
  if (!safePlaces || safePlaces.length === 0) return

  console.log(`Displaying ${safePlaces.length} safe zones on map`)

  safePlaces.forEach((place, index) => {
    const iconColor = getSafePlaceColor(place.type)
    const iconSymbol = getSafePlaceIcon(place.type)
    
    const marker = L.marker([place.lat, place.lng], {
      icon: L.divIcon({
        className: "safe-zone-marker",
        html: `
          <div style="position: relative;">
            <div style="
              background: ${iconColor}; 
              color: white; 
              border-radius: 50%; 
              width: 36px; 
              height: 36px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: bold;
              font-size: 18px;
              border: 3px solid white;
              box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            ">${iconSymbol}</div>
            ${place.emergency ? `
              <div style="
                position: absolute;
                top: -4px;
                right: -4px;
                background: #dc2626;
                color: white;
                border-radius: 50%;
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 10px;
                border: 2px solid white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
              ">!</div>
            ` : ''}
          </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      })
    })

    marker.bindPopup(`
      <div style="font-family: system-ui; padding: 12px; min-width: 280px;">
        <h3 style="margin: 0 0 8px 0; color: ${iconColor}; font-weight: bold;">
          ${iconSymbol} ${place.name}
        </h3>
        <div style="
          padding: 8px;
          background: ${iconColor}15;
          border: 1px solid ${iconColor}40;
          border-radius: 6px;
          margin-bottom: 8px;
        ">
          <div style="color: #374151; margin-bottom: 4px;">
            <strong>Type:</strong> ${place.type.replace('_', ' ').toUpperCase()}
          </div>
          <div style="color: #374151; margin-bottom: 4px;">
            <strong>Address:</strong> ${place.address}
          </div>
          ${place.phone ? `
            <div style="color: #374151; margin-bottom: 4px;">
              <strong>Phone:</strong> 
              <a href="tel:${place.phone}" style="color: ${iconColor}; text-decoration: none;">
                ${place.phone}
              </a>
            </div>
          ` : ''}
          ${place.hours ? `
            <div style="color: #374151; margin-bottom: 4px;">
              <strong>Hours:</strong> ${place.hours}
            </div>
          ` : ''}
          ${place.distance ? `
            <div style="color: #374151; margin-bottom: 4px;">
              <strong>Distance:</strong> ${place.distance.toFixed(1)} km away
            </div>
          ` : ''}
          ${place.emergency ? `
            <div style="color: #dc2626; font-weight: bold;">
              🚨 EMERGENCY SERVICES AVAILABLE
            </div>
          ` : ''}
        </div>
        ${place.description ? `
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
            ${place.description}
          </p>
        ` : ''}
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          ${place.phone ? `
            <a href="tel:${place.phone}" style="
              background: ${iconColor};
              color: white;
              padding: 6px 12px;
              border-radius: 4px;
              text-decoration: none;
              font-size: 12px;
              font-weight: 500;
            ">📞 Call Now</a>
          ` : ''}
          <button onclick="navigator.share && navigator.share({
            title: '${place.name}',
            text: 'Safe place: ${place.address}',
            url: window.location.href
          })" style="
            background: #6b7280;
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            border: none;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
          ">📤 Share</button>
        </div>
      </div>
    `)

    layer.addLayer(marker)
    console.log(`Safe zone ${index + 1} added: ${place.name}`)
  })

  console.log(`Successfully added ${safePlaces.length} safe zones to map`)
}

function getSafePlaceColor(type: string): string {
  switch (type) {
    case 'police': return '#1e40af' // Blue
    case 'hospital': return '#dc2626' // Red
    case 'shelter': return '#16a34a' // Green
    case 'women_help': return '#7c3aed' // Purple
    case 'fire_station': return '#ea580c' // Orange
    default: return '#6b7280' // Gray
  }
}

function getSafePlaceIcon(type: string): string {
  switch (type) {
    case 'police': return '🚔'
    case 'hospital': return '🏥'
    case 'shelter': return '🏠'
    case 'women_help': return '🛡️'
    case 'fire_station': return '🚒'
    default: return '📍'
  }
}


