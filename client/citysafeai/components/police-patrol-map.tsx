"use client"

import { useEffect, useRef, useState } from "react"

export default function PolicePatrolMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const routeRef = useRef<any>(null)
  const zoneLayerRef = useRef<any>(null)
  const currentMarkerRef = useRef<any>(null)
  const [status, setStatus] = useState("Ready")

  useEffect(() => {
    if (typeof window === 'undefined') return

    const ensureLeaflet = async () => {
      const addCss = (href: string) => { const l = document.createElement('link'); l.rel='stylesheet'; l.href=href; document.head.appendChild(l) }
      addCss('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css')
      addCss('https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css')
      await new Promise<void>((resolve) => {
        if ((window as any).L && (window as any).L.Routing) return resolve()
        const s = document.createElement('script'); s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        s.onload = () => { const r=document.createElement('script'); r.src='https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js'; r.onload=()=>resolve(); document.body.appendChild(r) }
        document.body.appendChild(s)
      })
    }

    const init = async () => {
      await ensureLeaflet()
      const L = (window as any).L
      if (!mapRef.current) return
      const map = L.map(mapRef.current).setView([13.0827, 80.2707], 12)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
      mapInstanceRef.current = map
      drawZones()
      try {
        navigator.geolocation.getCurrentPosition((pos)=>{
          const p=[pos.coords.latitude,pos.coords.longitude] as number[]
          map.setView(p, 14)
          if (currentMarkerRef.current) map.removeLayer(currentMarkerRef.current)
          currentMarkerRef.current = L.marker(p).addTo(map).bindPopup('Patrol Start').openPopup()
        },()=>{}, {enableHighAccuracy:true, timeout:5000, maximumAge:10000})
      } catch {}
    }

    init()

    return () => { try { mapInstanceRef.current?.remove() } catch {} }
  }, [])

  const zonesData = [
    { name: 'Zone 1 - Central Chennai', coordinates: [[13.0827,80.2707],[13.0756,80.2834],[13.0689,80.2878],[13.0623,80.2912],[13.0582,80.2823],[13.0678,80.2785],[13.0827,80.2707]] },
    { name: 'Zone 2 - North Chennai', coordinates: [[13.1067,80.2109],[13.1185,80.2574],[13.1067,80.2809],[13.0950,80.2650],[13.0890,80.2200],[13.1067,80.2109]] },
    { name: 'Zone 3 - South Chennai', coordinates: [[13.0458,80.2209],[13.0389,80.2619],[13.0200,80.2500],[13.0100,80.2200],[13.0300,80.2100],[13.0458,80.2209]] }
  ]

  const zoneColors = ["#2563eb", "#16a34a", "#f59e0b"]

  const drawZones = () => {
    const L = (window as any).L
    if (!mapInstanceRef.current) return
    if (zoneLayerRef.current) mapInstanceRef.current.removeLayer(zoneLayerRef.current)
    const layer = L.layerGroup()
    zonesData.forEach((zone, idx) => {
      const poly = L.polygon(zone.coordinates, { color: zoneColors[idx%zoneColors.length], weight: 3, fillOpacity: 0.1 })
      poly.bindPopup(zone.name)
      layer.addLayer(poly)
    })
    layer.addTo(mapInstanceRef.current)
    zoneLayerRef.current = layer
  }

  const centroid = (coords: number[][]) => {
    let x=0,y=0
    coords.forEach(c=>{ x+=c[0]; y+=c[1] })
    return [x/coords.length, y/coords.length] as number[]
  }

  const planPatrol = () => {
    const L = (window as any).L
    if (!mapInstanceRef.current) return
    setStatus('Planning patrol through all zones...')
    const starts = currentMarkerRef.current?.getLatLng()
    const startLatLng = starts ? [starts.lat, starts.lng] as number[] : zonesData.length? centroid(zonesData[0].coordinates):[13.0827,80.2707]
    const targets = zonesData.map(z => centroid(z.coordinates))
    // Greedy nearest neighbor
    const remaining = [...targets]
    const order: number[][] = []
    let cur = startLatLng
    while (remaining.length) {
      let bestIdx = 0, bestDist = Number.POSITIVE_INFINITY
      remaining.forEach((p, i)=>{
        const d = Math.hypot(cur[0]-p[0], cur[1]-p[1])
        if (d < bestDist) { bestDist = d; bestIdx = i }
      })
      const next = remaining.splice(bestIdx,1)[0]
      order.push(next)
      cur = next
    }
    const waypoints = [ L.latLng(startLatLng[0], startLatLng[1]), ...order.map(p=>L.latLng(p[0], p[1])) ]
    if (routeRef.current) mapInstanceRef.current.removeControl(routeRef.current)
    routeRef.current = L.Routing.control({ waypoints, createMarker: (i, wp)=> L.marker(wp.latLng).bindPopup(i===0? 'Start' : `Zone ${i}`), lineOptions: { styles: [{ color: '#dc2626', weight: 5, opacity: 0.9 }] } }).addTo(mapInstanceRef.current)
    setStatus('Patrol route ready')
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-5 left-5 z-[1000] bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl shadow-xl p-4 w-80">
        <h3 className="font-semibold mb-3 text-slate-900">Patrol Planner</h3>
        <button className="w-full mb-2 bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2 transition" onClick={()=>{
          setStatus('Getting precise location...')
          navigator.geolocation.getCurrentPosition((pos)=>{
            const p=[pos.coords.latitude,pos.coords.longitude] as number[]
            mapInstanceRef.current.setView(p, 15)
            const L=(window as any).L
            if (currentMarkerRef.current) mapInstanceRef.current.removeLayer(currentMarkerRef.current)
            currentMarkerRef.current=L.marker(p).addTo(mapInstanceRef.current).bindPopup('Patrol Start').openPopup()
            setStatus('Location set')
          },()=> setStatus('Unable to get location'), {enableHighAccuracy:true, timeout:8000, maximumAge:0})
        }}>Set Current Location</button>
        <button className="w-full mb-2 bg-rose-600 hover:bg-rose-700 text-white rounded px-3 py-2 transition" onClick={planPatrol}>Plan Patrol Through All Zones</button>
        <div className="text-xs mt-2 text-slate-600">{status}</div>
      </div>
    </div>
  )
}


