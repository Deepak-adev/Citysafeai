"use client"

import { useEffect, useRef } from 'react'
import 'ol/ol.css'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { fromLonLat, toLonLat } from 'ol/proj'
import { Style, Icon } from 'ol/style'

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void
}

export default function MapPicker({ onLocationSelect }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<Map | null>(null)
  const vectorSource = useRef<VectorSource>(new VectorSource())

  useEffect(() => {
    if (!mapRef.current) return

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        new VectorLayer({
          source: vectorSource.current,
          style: new Style({
            image: new Icon({
              anchor: [0.5, 1],
              src: 'data:image/svg+xml;base64,' + btoa(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444"/>
                  <circle cx="12" cy="9" r="2.5" fill="white"/>
                </svg>
              `)
            })
          })
        })
      ],
      view: new View({
        center: fromLonLat([80.2707, 13.0827]), // Chennai
        zoom: 12
      })
    })

    map.on('click', (event) => {
      const coordinate = event.coordinate
      const [lng, lat] = toLonLat(coordinate)
      
      vectorSource.current.clear()
      const marker = new Feature({
        geometry: new Point(coordinate)
      })
      vectorSource.current.addFeature(marker)
      
      onLocationSelect(lat, lng)
    })

    mapInstance.current = map

    return () => {
      map.setTarget(undefined)
    }
  }, [onLocationSelect])

  return (
    <div 
      ref={mapRef} 
      className="w-full h-64 border rounded-md"
      style={{ cursor: 'crosshair' }}
    />
  )
}