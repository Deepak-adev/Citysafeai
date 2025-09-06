"use client"

import { useEffect, useRef } from "react"

interface MapComponentProps {
  activeLayer: string
  source?: string
  destination?: string
  showRoute?: boolean
}

export default function MapComponent({ activeLayer, source, destination, showRoute }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const layersRef = useRef<any>({})

  // Handle route display
  useEffect(() => {
    if (!mapInstanceRef.current || !showRoute || !source || !destination) return

    // For demo purposes, using fixed coordinates
    // In a real app, you would use a geocoding service to convert addresses to coordinates
    const sourceCoords = [13.0827, 80.2707]
    const destCoords = [13.1000, 80.2500]

    const L = (window as any).L
    if (!L?.Routing) return

    // Remove existing routing control
    if (mapInstanceRef.current._routingControl) {
      mapInstanceRef.current.removeControl(mapInstanceRef.current._routingControl)
    }

    // Create new routing control
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(sourceCoords[0], sourceCoords[1]),
        L.latLng(destCoords[0], destCoords[1])
      ],
      routeWhileDragging: true,
      lineOptions: {
        styles: [{ color: '#0000ff', opacity: 0.6, weight: 6 }]
      },
      show: false
    }).addTo(mapInstanceRef.current)

    mapInstanceRef.current._routingControl = routingControl
  }, [source, destination, showRoute])

  useEffect(() => {
    if (typeof window === "undefined") return

    const loadLeaflet = async () => {
      // Check if Leaflet is already loaded
      if ((window as any).L) {
        initializeMap((window as any).L)
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
        routingScript.onload = () => {
          initializeMap((window as any).L)
        }
        document.head.appendChild(routingScript)
      }

      document.head.appendChild(script)
    }

    const initializeMap = (L: any) => {
      if (!mapRef.current || mapInstanceRef.current) return

      // Load routing plugin
      const routingControl = L.Routing.control({
        waypoints: [],
        routeWhileDragging: true,
        show: false
      });

      // Chennai coordinates
      const chennaiCoords: [number, number] = [13.0827, 80.2707]

      // Initialize map
      const map = L.map(mapRef.current).setView(chennaiCoords, 11)
      mapInstanceRef.current = map

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
      }

      // Add demo data for each layer
      setupEnhancedDemoLayers(L, layersRef.current)
      
      // Load approved public reports as alerts
      loadApprovedReports(L, layersRef.current)

      // Add legend
      addLegend(L, map)
    }

    loadLeaflet()

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Handle layer visibility and refresh approved reports
  useEffect(() => {
    if (!mapInstanceRef.current || !layersRef.current) return

    // Remove all layers first
    Object.values(layersRef.current).forEach((layer: any) => {
      if (mapInstanceRef.current.hasLayer(layer)) {
        mapInstanceRef.current.removeLayer(layer)
      }
    })

    // Recreate layers with fresh data
    const L = (window as any).L
    if (L) {
      layersRef.current.alerts.clearLayers()
      setupEnhancedDemoLayers(L, layersRef.current)
      loadApprovedReports(L, layersRef.current)
    }

    // Add active layer
    if (activeLayer && layersRef.current[activeLayer]) {
      layersRef.current[activeLayer].addTo(mapInstanceRef.current)
    }
  }, [activeLayer])

  // Listen for localStorage changes to refresh approved reports
  useEffect(() => {
    const handleStorageChange = () => {
      if (!mapInstanceRef.current || !layersRef.current || activeLayer !== 'alerts') return
      
      const L = (window as any).L
      if (L) {
        layersRef.current.alerts.clearLayers()
        setupEnhancedDemoLayers(L, layersRef.current)
        loadApprovedReports(L, layersRef.current)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom event for same-tab updates
    window.addEventListener('publicReportsUpdated', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('publicReportsUpdated', handleStorageChange)
    }
  }, [activeLayer])

  return <div ref={mapRef} className="w-full h-full rounded-lg" />
}

function setupEnhancedDemoLayers(L: any, layers: any) {
  // Heatmap layer - Enhanced red circular zones with crime intensity
  const crimeHotspots = [
    // Chennai High Risk Areas - Accurate Coordinates
    { lat: 13.0405, lng: 80.2337, intensity: 0.95, area: "T. Nagar Main Road", crimes: 67 },
    { lat: 13.0368, lng: 80.2676, intensity: 0.92, area: "Mylapore East", crimes: 58 },
    { lat: 13.0064, lng: 80.2206, intensity: 0.88, area: "Guindy Railway Station", crimes: 52 },
    { lat: 13.0850, lng: 80.2101, intensity: 0.85, area: "Anna Nagar West", crimes: 48 },
    { lat: 13.0827, lng: 80.2442, intensity: 0.82, area: "Kilpauk Garden Road", crimes: 45 },
    { lat: 13.0213, lng: 80.2231, intensity: 0.80, area: "Saidapet West", crimes: 42 },
    { lat: 12.9758, lng: 80.2209, intensity: 0.78, area: "Velachery Main Road", crimes: 40 },
    { lat: 13.0500, lng: 80.2121, intensity: 0.75, area: "Vadapalani Signal", crimes: 38 },
    { lat: 13.0554, lng: 80.2586, intensity: 0.72, area: "Royapettah High Road", crimes: 36 },
    { lat: 13.0067, lng: 80.2572, intensity: 0.70, area: "Adyar Bridge", crimes: 34 },

    // Chennai Medium-High Risk Areas - Accurate Coordinates
    { lat: 13.0694, lng: 80.2178, intensity: 0.68, area: "Aminjikarai Market", crimes: 32 },
    { lat: 13.0298, lng: 80.2405, intensity: 0.65, area: "Nandanam Signal", crimes: 30 },
    { lat: 13.0521, lng: 80.2210, intensity: 0.62, area: "Kodambakkam High Road", crimes: 28 },
    { lat: 13.0813, lng: 80.2485, intensity: 0.60, area: "Purasaiwakkam West", crimes: 26 },
    { lat: 13.1242, lng: 80.1947, intensity: 0.58, area: "Kolathur Junction", crimes: 24 },
    { lat: 12.9972, lng: 80.2707, intensity: 0.55, area: "Besant Nagar Beach", crimes: 22 },
    { lat: 12.9432, lng: 80.2417, intensity: 0.52, area: "Thiruvanmiyur Bus Stand", crimes: 20 },
    { lat: 12.9249, lng: 80.1000, intensity: 0.50, area: "Tambaram East", crimes: 18 },
    { lat: 13.0143, lng: 80.2094, intensity: 0.48, area: "Ekkatuthangal West", crimes: 16 },
    { lat: 12.9480, lng: 80.2078, intensity: 0.45, area: "Pallikaranai Junction", crimes: 14 },

    // Chennai Medium Risk Areas - Accurate Coordinates
    { lat: 13.0421, lng: 80.2312, intensity: 0.42, area: "T. Nagar South", crimes: 12 },
    { lat: 13.0321, lng: 80.2654, intensity: 0.40, area: "Mylapore West", crimes: 10 },
    { lat: 13.0102, lng: 80.2234, intensity: 0.38, area: "Guindy East", crimes: 8 },
    { lat: 13.0876, lng: 80.2134, intensity: 0.35, area: "Anna Nagar East", crimes: 6 },
    { lat: 13.0798, lng: 80.2412, intensity: 0.32, area: "Kilpauk Medical College", crimes: 4 },
    { lat: 13.0234, lng: 80.2256, intensity: 0.30, area: "Saidapet East", crimes: 3 },
    { lat: 12.9778, lng: 80.2234, intensity: 0.28, area: "Velachery East", crimes: 2 },
    { lat: 13.0512, lng: 80.2145, intensity: 0.25, area: "Vadapalani East", crimes: 1 },
    { lat: 13.0534, lng: 80.2567, intensity: 0.22, area: "Royapettah West", crimes: 1 },
    { lat: 13.0089, lng: 80.2598, intensity: 0.20, area: "Adyar East", crimes: 1 },

    // Tamil Nadu District Areas - High Risk - Accurate Coordinates
    { lat: 11.0168, lng: 76.9558, intensity: 0.85, area: "Coimbatore Gandhipuram", crimes: 55 },
    { lat: 10.7905, lng: 78.7047, intensity: 0.82, area: "Tiruchirappalli Central", crimes: 50 },
    { lat: 9.9252, lng: 78.1198, intensity: 0.80, area: "Madurai Meenakshi Temple", crimes: 48 },
    { lat: 8.7642, lng: 78.1348, intensity: 0.78, area: "Tirunelveli Junction", crimes: 45 },
    { lat: 12.9716, lng: 79.1587, intensity: 0.75, area: "Vellore CMC Hospital", crimes: 42 },
    { lat: 11.6643, lng: 78.1460, intensity: 0.72, area: "Salem Junction", crimes: 40 },
    { lat: 10.7867, lng: 79.1378, intensity: 0.70, area: "Thanjavur Big Temple", crimes: 38 },
    { lat: 11.3410, lng: 77.7172, intensity: 0.68, area: "Erode Bus Stand", crimes: 35 },
    { lat: 8.1833, lng: 77.4119, intensity: 0.65, area: "Nagercoil Town", crimes: 32 },
    { lat: 13.3178, lng: 80.4265, intensity: 0.62, area: "Tiruvallur Junction", crimes: 30 },

    // Tamil Nadu District Areas - Medium Risk - Accurate Coordinates
    { lat: 12.8342, lng: 80.0605, intensity: 0.60, area: "Chengalpattu Railway", crimes: 28 },
    { lat: 12.5186, lng: 78.2137, intensity: 0.58, area: "Krishnagiri Town", crimes: 26 },
    { lat: 10.3673, lng: 77.9803, intensity: 0.55, area: "Dindigul Fort", crimes: 24 },
    { lat: 9.4396, lng: 77.8028, intensity: 0.52, area: "Virudhunagar Market", crimes: 22 },
    { lat: 8.0883, lng: 77.5385, intensity: 0.50, area: "Kanyakumari Beach", crimes: 20 },
    { lat: 12.9202, lng: 79.1325, intensity: 0.48, area: "Ranipet Industrial", crimes: 18 },
    { lat: 10.6112, lng: 79.8496, intensity: 0.45, area: "Nagapattinam Port", crimes: 16 },
    { lat: 11.1085, lng: 79.6501, intensity: 0.42, area: "Cuddalore Beach", crimes: 14 },

    // Tamil Nadu District Areas - Low Risk - Accurate Coordinates
    { lat: 12.3072, lng: 78.4517, intensity: 0.35, area: "Dharmapuri Town", crimes: 8 },
    { lat: 9.8433, lng: 78.4809, intensity: 0.32, area: "Sivaganga Temple", crimes: 6 },
    { lat: 10.0743, lng: 78.7728, intensity: 0.30, area: "Pudukkottai Fort", crimes: 4 },
    { lat: 11.9214, lng: 79.4850, intensity: 0.28, area: "Villupuram Junction", crimes: 3 },
    { lat: 9.1705, lng: 78.1213, intensity: 0.25, area: "Ramanathapuram Coast", crimes: 2 },
    { lat: 8.3177, lng: 77.1694, intensity: 0.22, area: "Kanniyakumari Temple", crimes: 1 },
    { lat: 12.1197, lng: 79.0747, intensity: 0.20, area: "Tindivanam Market", crimes: 1 },
    { lat: 10.7870, lng: 79.1315, intensity: 0.18, area: "Thanjavur Railway", crimes: 1 },
  ]

  crimeHotspots.forEach((hotspot) => {
    // Calculate color based on intensity
    const getColor = (intensity: number) => {
      if (intensity >= 0.8) return "#dc2626" // High risk - Red
      if (intensity >= 0.6) return "#f97316" // Medium-high risk - Orange
      if (intensity >= 0.4) return "#facc15" // Medium risk - Yellow
      return "#22c55e" // Low risk - Green
    }

    const circle = L.circle([hotspot.lat, hotspot.lng], {
      color: getColor(hotspot.intensity),
      fillColor: getColor(hotspot.intensity),
      fillOpacity: hotspot.intensity * 0.35,
      radius: hotspot.intensity * 1200,
      weight: 2,
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

    circle.addTo(layers.heatmap)
  })

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
}

function loadApprovedReports(L: any, layers: any) {
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

function addLegend(L: any, map: any) {
  const legend = L.control({ position: 'bottomright' });

  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'info legend');
    div.style.backgroundColor = 'white';
    div.style.padding = '10px';
    div.style.borderRadius = '5px';
    div.style.boxShadow = '0 0 15px rgba(0,0,0,0.2)';
    div.style.fontFamily = 'system-ui';
    div.style.fontSize = '12px';
    div.style.lineHeight = '1.4';

    div.innerHTML = `
      <h4 style="margin: 0 0 8px 0; font-weight: bold; color: #374151;">Crime Risk Levels</h4>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 16px; height: 16px; background: #dc2626; border-radius: 50%;"></div>
          <span>High Risk (80-100%)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 16px; height: 16px; background: #f97316; border-radius: 50%;"></div>
          <span>Medium-High Risk (60-79%)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 16px; height: 16px; background: #facc15; border-radius: 50%;"></div>
          <span>Medium Risk (40-59%)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 16px; height: 16px; background: #22c55e; border-radius: 50%;"></div>
          <span>Low Risk (0-39%)</span>
        </div>
      </div>
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #2d64d3ff; font-size: 11px; color: #6b7280;">
        Circle size indicates crime intensity
      </div>
    `;

    return div;
  };

  legend.addTo(map);
}
