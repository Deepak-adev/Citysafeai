"use client"

import { useEffect, useRef, useState } from "react"

export default function RouteMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const routeControlRef = useRef<any>(null)
  const crimeLayerRef = useRef<any>(null)
  const heatLayerRef = useRef<any>(null)
  const currentLocationRef = useRef<number[] | null>(null)
  const currentMarkerRef = useRef<any>(null)
  const waypointMarkersRef = useRef<any[]>([])
  const manualWaypointsRef = useRef<number[][]>([])
  const [status, setStatus] = useState<string>("Ready")
  const [toValue, setToValue] = useState<string>("Coimbatore")
  const [showZones, setShowZones] = useState<boolean>(false)
  const [isAddingWaypoint, setIsAddingWaypoint] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const ensureLeaflet = async () => {
      const loadCss = (href: string) => {
        if ([...document.styleSheets].some(s => (s as any).href === href)) return
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = href
        document.head.appendChild(link)
      }
      loadCss('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css')
      loadCss('https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css')

      await new Promise<void>((resolve) => {
        if ((window as any).L && (window as any).L.Routing) return resolve()
        const s = document.createElement('script')
        s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        s.onload = () => {
          const r = document.createElement('script')
          r.src = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js'
          r.onload = () => resolve()
          document.body.appendChild(r)
        }
        document.body.appendChild(s)
      })
    }

    const initMap = async () => {
      await ensureLeaflet()
      const L = (window as any).L
      if (!mapRef.current) return
      const map = L.map(mapRef.current).setView([12.5, 78.5], 7)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
      map.on('click', (e: any) => {
        if (!isAddingWaypoint) return
        const latlng = [e.latlng.lat, e.latlng.lng]
        manualWaypointsRef.current.push(latlng)
        const marker = L.marker(latlng, { draggable: true }).addTo(map)
          .bindPopup(`Waypoint ${manualWaypointsRef.current.length}`).openPopup()
        marker.on('dragend', (ev: any) => {
          const ll = ev.target.getLatLng()
          const idx = waypointMarkersRef.current.indexOf(ev.target)
          if (idx >= 0) manualWaypointsRef.current[idx] = [ll.lat, ll.lng]
        })
        waypointMarkersRef.current.push(marker)
      })
      mapInstanceRef.current = map
      // Try to quickly center on user's location (fast, then refine)
      try {
        navigator.geolocation.getCurrentPosition((pos) => {
          const quick = [pos.coords.latitude, pos.coords.longitude] as number[]
          map.setView(quick, 13)
        }, () => {}, { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 })
      } catch {}
    }

    initMap()

    return () => {
      try { mapInstanceRef.current?.remove() } catch {}
      mapInstanceRef.current = null
      routeControlRef.current = null
      crimeLayerRef.current = null
      heatLayerRef.current = null
      waypointMarkersRef.current = []
      manualWaypointsRef.current = []
    }
  }, [isAddingWaypoint])

  const getCurrentLocation = () => {
    setStatus('Getting your location...')
    if (!navigator.geolocation) {
      setStatus('Geolocation not supported')
      return
    }
    // First quick attempt for fast response
    navigator.geolocation.getCurrentPosition((pos) => {
      const quick = [pos.coords.latitude, pos.coords.longitude] as number[]
      currentLocationRef.current = quick
      mapInstanceRef.current.setView(quick, 13)
      const L = (window as any).L
      if (currentMarkerRef.current) {
        mapInstanceRef.current.removeLayer(currentMarkerRef.current)
      }
      currentMarkerRef.current = L.marker(quick).addTo(mapInstanceRef.current).bindPopup('Your Current Location').openPopup()
      setStatus('Current location found (approx). Refining...')
    }, () => {}, { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 })

    // Then high-accuracy refine with timeout
    navigator.geolocation.getCurrentPosition((pos) => {
      const precise = [pos.coords.latitude, pos.coords.longitude] as number[]
      currentLocationRef.current = precise
      mapInstanceRef.current.setView(precise, 15)
      const L = (window as any).L
      if (currentMarkerRef.current) {
        mapInstanceRef.current.removeLayer(currentMarkerRef.current)
      }
      currentMarkerRef.current = L.marker(precise).addTo(mapInstanceRef.current).bindPopup('Your Current Location').openPopup()
      setStatus('Precise location locked')
    }, () => {
      setStatus('Using approximate location')
    }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 })
  }

  const geocode = async (city: string): Promise<number[] | null> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`)
      const data = await res.json()
      return data.length > 0 ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null
    } catch {
      return null
    }
  }

  const loadCrimeData = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/crime-predictions/?city=TamilNadu&count=50')
      const data = await res.json()
      if (data.status === 'success') {
        try { localStorage.setItem('lastCrimePredictions', JSON.stringify(data.coordinates)) } catch {}
        return data.coordinates
      }
      return []
    } catch {
      return []
    }
  }

  const clearLayers = () => {
    const map = mapInstanceRef.current
    if (!map) return
    if (routeControlRef.current) map.removeControl(routeControlRef.current)
    if (crimeLayerRef.current) map.removeLayer(crimeLayerRef.current)
    if (heatLayerRef.current) map.removeLayer(heatLayerRef.current)
  }

  const showCrimeZones = (crimeData: any[]) => {
    const L = (window as any).L
    const map = mapInstanceRef.current
    if (!map) return
    if (crimeLayerRef.current) map.removeLayer(crimeLayerRef.current)
    const layer = L.layerGroup()
    crimeData.forEach((coord: any) => {
      const color = coord.risk_level === 'high' ? '#ff0000' : coord.risk_level === 'medium' ? '#ff8c00' : '#32cd32'
      L.circle([coord.lat, coord.lng], { color, fillColor: color, fillOpacity: 0.4, radius: 10000, weight: 2 }).addTo(layer)
    })
    layer.addTo(map)
    crimeLayerRef.current = layer
  }

  // Geometry helpers
  const toRad = (deg: number) => deg * Math.PI / 180
  const pointToSegmentMeters = (p: number[], a: number[], b: number[]) => {
    const latRad = toRad((a[0] + b[0]) / 2)
    const mPerDegLat = 111132.92 - 559.82 * Math.cos(2*latRad) + 1.175 * Math.cos(4*latRad)
    const mPerDegLng = 111412.84 * Math.cos(latRad) - 93.5 * Math.cos(3*latRad)
    const ax = a[1] * mPerDegLng, ay = a[0] * mPerDegLat
    const bx = b[1] * mPerDegLng, by = b[0] * mPerDegLat
    const px = p[1] * mPerDegLng, py = p[0] * mPerDegLat
    const vx = bx - ax, vy = by - ay
    const wx = px - ax, wy = py - ay
    const c1 = vx*wx + vy*wy
    const c2 = vx*vx + vy*vy
    let t = c2 === 0 ? 0 : c1 / c2
    t = Math.max(0, Math.min(1, t))
    const cx = ax + t * vx, cy = ay + t * vy
    const dx = px - cx, dy = py - cy
    return Math.sqrt(dx*dx + dy*dy)
  }
  const filterHotspotsAlongRoute = (routeLatLngs: {lat:number,lng:number}[], hotspots: any[]) => {
    const route = routeLatLngs.map(pt => [pt.lat, pt.lng] as number[])
    const maxDist = 10000
    const filtered: any[] = []
    for (const h of hotspots) {
      let near = false
      for (let i = 0; i < route.length - 1 && !near; i++) {
        const d = pointToSegmentMeters([h.lat, h.lng], route[i], route[i+1])
        if (d <= maxDist) near = true
      }
      if (near) filtered.push(h)
    }
    return filtered
  }

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const isPointSafe = (lat: number, lng: number, zones: any[]) => {
    for (let zone of zones) {
      const distance = getDistance(lat, lng, zone.lat, zone.lng)
      if (distance <= 12) return false
    }
    return true
  }

  const findSafePoint = (lat: number, lng: number, zones: any[]) => {
    if (isPointSafe(lat, lng, zones)) return [lat, lng]
    const offsets = [ [0.2,0],[-0.2,0],[0,0.2],[0,-0.2],[0.2,0.2],[-0.2,-0.2],[0.2,-0.2],[-0.2,0.2],[0.4,0],[-0.4,0],[0,0.4],[0,-0.4] ]
    for (let o of offsets) {
      const testLat = lat + o[0]
      const testLng = lng + o[1]
      if (isPointSafe(testLat, testLng, zones)) return [testLat, testLng]
    }
    return null
  }

  const createSafePath = (start: number[], end: number[], zones: any[]) => {
    const L = (window as any).L
    const safePoints: any[] = []
    const steps = 5
    const latStep = (end[0] - start[0]) / steps
    const lngStep = (end[1] - start[1]) / steps
    for (let i = 1; i < steps; i++) {
      const baseLat = start[0] + (latStep * i)
      const baseLng = start[1] + (lngStep * i)
      const p = findSafePoint(baseLat, baseLng, zones)
      if (p) safePoints.push(L.latLng(p[0], p[1]))
    }
    return safePoints
  }

  const avoidCrimeZones = (start: number[], end: number[], crimeData: any[]) => {
    const L = (window as any).L
    const waypoints: any[] = [L.latLng(start[0], start[1])]
    const safePoints = createSafePath(start, end, crimeData)
    waypoints.push(...safePoints)
    waypoints.push(L.latLng(end[0], end[1]))
    return waypoints
  }

  const findRoute = async () => {
    if (!currentLocationRef.current) { setStatus('Please get current location first'); return }
    setStatus('Finding route...')
    const toCoords = await geocode(toValue)
    if (!toCoords) { setStatus('Destination not found'); return }
    const crimeData = await loadCrimeData()
    clearLayers()

    const L = (window as any).L
    const map = mapInstanceRef.current
    let waypoints: any[]
    if (manualWaypointsRef.current.length > 0) {
      waypoints = [ L.latLng(currentLocationRef.current[0], currentLocationRef.current[1]), ...manualWaypointsRef.current.map(wp => L.latLng(wp[0], wp[1])), L.latLng(toCoords[0], toCoords[1]) ]
    } else {
      waypoints = avoidCrimeZones(currentLocationRef.current, toCoords, crimeData)
    }
    routeControlRef.current = L.Routing.control({
      waypoints,
      createMarker: () => null,
      lineOptions: { styles: [{ color: '#00ff00', weight: 4, opacity: 0.8 }] }
    }).addTo(map)
    routeControlRef.current.on('routesfound', (e: any) => {
      const coords = e.routes?.[0]?.coordinates || []
      if (coords.length > 1) {
        const filtered = filterHotspotsAlongRoute(coords, crimeData)
        try { localStorage.setItem('lastRouteHotspots', JSON.stringify(filtered)) } catch {}
        if (showZones) showCrimeZones(filtered)
      } else if (showZones) {
        showCrimeZones([])
      }
    })
    if (showZones) showCrimeZones([])
    setStatus(`Safe route: Current Location → ${toValue}`)
    if (isAddingWaypoint) toggleAddWaypoints()
  }

  const toggleView = async () => {
    let filtered: any[] | null = null
    try {
      const cached = localStorage.getItem('lastRouteHotspots')
      if (cached) filtered = JSON.parse(cached)
    } catch {}
    const crimeData = filtered ?? await loadCrimeData()
    setShowZones((prev) => {
      const next = !prev
      if (next) showCrimeZones(crimeData)
      else if (crimeLayerRef.current) mapInstanceRef.current.removeLayer(crimeLayerRef.current)
      return next
    })
  }

  const toggleAddWaypoints = () => {
    setIsAddingWaypoint(prev => !prev)
    setStatus(!isAddingWaypoint ? 'Click on the map to add waypoints' : 'Waypoint add stopped')
  }

  const clearWaypoints = () => {
    waypointMarkersRef.current.forEach(m => mapInstanceRef.current?.removeLayer(m))
    waypointMarkersRef.current = []
    manualWaypointsRef.current = []
    setStatus('Waypoints cleared')
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-5 left-5 z-[1000] bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl shadow-xl p-4 w-80">
        <h3 className="font-semibold mb-3 text-slate-900">SafeRoute - Public</h3>
        <button className="w-full mb-2 bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2 transition" onClick={getCurrentLocation}>Get Current Location</button>
        <input className="w-full mb-2 bg-white border border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 rounded px-2 py-2 text-slate-900" value={toValue} onChange={(e) => setToValue(e.target.value)} placeholder="To location" />
        <button className="w-full mb-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded px-3 py-2 transition" onClick={findRoute}>Find Safe Route</button>
        <div className="grid grid-cols-2 gap-2">
          <button className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded px-3 py-2 text-sm transition" onClick={toggleAddWaypoints}>{isAddingWaypoint ? 'Stop Adding' : 'Add Waypoints'}</button>
          <button className="w-full bg-slate-600 hover:bg-slate-700 text-white rounded px-3 py-2 text-sm transition" onClick={clearWaypoints}>Clear Waypoints</button>
        </div>
        <button className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white rounded px-3 py-2 transition" onClick={toggleView}>{showZones ? 'Hide Crime Zones' : 'Show Crime Zones'}</button>
        <div className="text-xs mt-3 text-slate-600">{status}</div>
      </div>
    </div>
  )
}


