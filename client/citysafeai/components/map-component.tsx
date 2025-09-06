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

    const L = (window as any).L
    if (!L) return

    // Remove existing route elements
    if (mapInstanceRef.current._routeElements) {
      mapInstanceRef.current._routeElements.forEach((element: any) => {
        mapInstanceRef.current.removeLayer(element)
      })
    }

    // Create safe route
    geocodeAndRoute(L, mapInstanceRef.current, source, destination)
  }, [source, destination, showRoute])

  useEffect(() => {
    if (typeof window === "undefined") return

    const loadLeaflet = async () => {
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
          await initializeMap((window as any).L)
        }
        document.head.appendChild(routingScript)
      }

      document.head.appendChild(script)
    }

    const initializeMap = async (L: any) => {
      if (!mapRef.current || mapInstanceRef.current) return

      // Load routing plugin
      const routingControl = L.Routing.control({
        waypoints: [],
        routeWhileDragging: true,
        show: false
      });

      // Tamil Nadu inland center coordinates (away from coast)
      const tnCoords: [number, number] = [11.0168, 77.5]

      // Initialize map
      const map = L.map(mapRef.current).setView(tnCoords, 7)
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
        zones: L.layerGroup(),
      }

      // Add demo data for each layer
      await setupEnhancedDemoLayers(L, layersRef.current)
      
      // Load approved public reports as alerts
      loadApprovedReports(L, layersRef.current)

      // Add legend only for heatmap
      if (map && L.control) {
        addLegend(L, map)
      }
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
    const updateLayers = async () => {
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
        await setupEnhancedDemoLayers(L, layersRef.current)
        loadApprovedReports(L, layersRef.current)
      }

      // Add active layer
      if (activeLayer && layersRef.current[activeLayer]) {
        layersRef.current[activeLayer].addTo(mapInstanceRef.current)
      }
    }
    
    updateLayers()
  }, [activeLayer])

  // Listen for localStorage changes to refresh approved reports
  useEffect(() => {
    const handleStorageChange = async () => {
      if (!mapInstanceRef.current || !layersRef.current || activeLayer !== 'alerts') return
      
      const L = (window as any).L
      if (L) {
        layersRef.current.alerts.clearLayers()
        await setupEnhancedDemoLayers(L, layersRef.current)
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

async function setupEnhancedDemoLayers(L: any, layers: any) {
  let crimeHotspots: any[] = []
  
  try {
    // Fetch crime hotspots from server API
    const response = await fetch('http://localhost:8000/api/crime-predictions/?city=TamilNadu&count=100')
    const data = await response.json()
    
    if (data.status === 'success' && data.coordinates) {
      // Transform server data to match expected format
      crimeHotspots = data.coordinates.map((coord: any, index: number) => {
        const riskIntensity = {
          'high': 0.8 + Math.random() * 0.2,
          'medium': 0.4 + Math.random() * 0.4,
          'low': 0.1 + Math.random() * 0.3
        }[coord.risk_level] || 0.5
        
        return {
          lat: coord.lat,
          lng: coord.lng,
          intensity: riskIntensity,
          area: `TN Location ${index + 1}`,
          crimes: Math.floor(riskIntensity * 70)
        }
      })
    }
  } catch (error) {
    console.error('Failed to fetch crime data from server:', error)
  }
  
  // Fallback to default data if server request fails
  if (crimeHotspots.length === 0) {
    crimeHotspots = [
      { lat: 13.0405, lng: 80.2337, intensity: 0.95, area: "T. Nagar Main Road", crimes: 67 },
      { lat: 13.0368, lng: 80.2676, intensity: 0.92, area: "Mylapore East", crimes: 58 },
      { lat: 13.0064, lng: 80.2206, intensity: 0.88, area: "Guindy Railway Station", crimes: 52 },
      { lat: 13.0850, lng: 80.2101, intensity: 0.85, area: "Anna Nagar West", crimes: 48 },
      { lat: 13.0827, lng: 80.2442, intensity: 0.82, area: "Kilpauk Garden Road", crimes: 45 }
    ]
  }

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

function addLegend(L: any, map: any) {
  if (!map || !L || !L.control) return
  
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
      <h4 style="margin: 0 0 8px 0; font-weight: bold; color: #000000;">Crime Risk Levels</h4>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 16px; height: 16px; background: #dc2626; border-radius: 50%;"></div>
          <span style="color: #000000;">High Risk (80-100%)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 16px; height: 16px; background: #f97316; border-radius: 50%;"></div>
          <span style="color: #000000;">Medium-High Risk (60-79%)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 16px; height: 16px; background: #facc15; border-radius: 50%;"></div>
          <span style="color: #000000;">Medium Risk (40-59%)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 16px; height: 16px; background: #22c55e; border-radius: 50%;"></div>
          <span style="color: #000000;">Low Risk (0-39%)</span>
        </div>
      </div>
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #000000;">
        Circle size indicates crime intensity
      </div>
    `;

    return div;
  };

  legend.addTo(map);
}
