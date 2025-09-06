"use client"

import { useEffect, useRef } from "react"

interface MapComponentProps {
  activeLayer: string
}

export default function MapComponent({ activeLayer }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const layersRef = useRef<any>({})

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

      // Load Leaflet JS
      const script = document.createElement("script")
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      script.crossOrigin = ""

      script.onload = () => {
        initializeMap((window as any).L)
      }

      document.head.appendChild(script)
    }

    const initializeMap = (L: any) => {
      if (!mapRef.current || mapInstanceRef.current) return

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

  // Handle layer visibility
  useEffect(() => {
    if (!mapInstanceRef.current || !layersRef.current) return

    // Remove all layers first
    Object.values(layersRef.current).forEach((layer: any) => {
      if (mapInstanceRef.current.hasLayer(layer)) {
        mapInstanceRef.current.removeLayer(layer)
      }
    })

    // Add active layer
    if (activeLayer && layersRef.current[activeLayer]) {
      layersRef.current[activeLayer].addTo(mapInstanceRef.current)
    }
  }, [activeLayer])

  return <div ref={mapRef} className="w-full h-full rounded-lg" />
}

function setupEnhancedDemoLayers(L: any, layers: any) {
  // Heatmap layer - Enhanced red circular zones with crime intensity
  const crimeHotspots = [
    { lat: 13.0827, lng: 80.2707, intensity: 0.9, area: "T. Nagar", crimes: 45 },
    { lat: 13.0678, lng: 80.2785, intensity: 0.7, area: "Mylapore", crimes: 32 },
    { lat: 13.0458, lng: 80.2209, intensity: 0.8, area: "Guindy", crimes: 38 },
    { lat: 13.1067, lng: 80.2109, intensity: 0.6, area: "Anna Nagar", crimes: 28 },
    { lat: 13.0582, lng: 80.2623, intensity: 0.5, area: "Adyar", crimes: 22 },
    { lat: 13.1185, lng: 80.2574, intensity: 0.7, area: "Kilpauk", crimes: 31 },
    { lat: 13.0389, lng: 80.2619, intensity: 0.6, area: "Velachery", crimes: 26 },
  ]

  crimeHotspots.forEach((hotspot) => {
    const circle = L.circle([hotspot.lat, hotspot.lng], {
      color: "#dc2626",
      fillColor: "#ef4444",
      fillOpacity: hotspot.intensity * 0.4,
      radius: hotspot.intensity * 1500,
      weight: 2,
    })

    circle.bindPopup(`
      <div style="font-family: system-ui; padding: 8px;">
        <h3 style="margin: 0 0 8px 0; color: #dc2626; font-weight: bold;">${hotspot.area}</h3>
        <p style="margin: 0; color: #374151;">Crime Reports: <strong>${hotspot.crimes}</strong></p>
        <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 12px;">Risk Level: ${hotspot.intensity > 0.7 ? "High" : hotspot.intensity > 0.5 ? "Medium" : "Low"}</p>
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
    },
    {
      lat: 13.0458,
      lng: 80.2209,
      type: "Traffic Incident",
      severity: "medium",
      time: "15 mins ago",
      description: "Road accident causing traffic delays",
    },
    {
      lat: 13.1067,
      lng: 80.2109,
      type: "Emergency Response",
      severity: "high",
      time: "5 mins ago",
      description: "Police units dispatched to location",
    },
    {
      lat: 13.0582,
      lng: 80.2623,
      type: "Suspicious Activity",
      severity: "low",
      time: "1 hour ago",
      description: "Reported by community member",
    },
    {
      lat: 13.1185,
      lng: 80.2574,
      type: "Public Safety",
      severity: "medium",
      time: "30 mins ago",
      description: "Street lighting maintenance required",
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
        html: `<div style="
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
        ">!</div>`,
        iconSize: [28, 28],
      }),
    })

    marker.bindPopup(`
      <div style="font-family: system-ui; padding: 12px; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; color: ${severityColors[alert.severity as keyof typeof severityColors]}; font-weight: bold;">${alert.type}</h3>
        <p style="margin: 0 0 8px 0; color: #374151;">${alert.description}</p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
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
