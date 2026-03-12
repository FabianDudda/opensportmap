'use client'

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { PlaceMarker, SportType } from '@/lib/supabase/types'
import { createSportIcon } from '@/lib/utils/sport-styles'

interface MarkerClusterGroupProps {
  courts: PlaceMarker[]
  onCourtSelect?: (court: PlaceMarker) => void
  selectedCourt?: PlaceMarker | null
  selectedSports?: SportType[]
}

// Create custom cluster icon
function createClusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount()
  
  // Determine cluster size class
  let sizeClass = 'small'
  if (count >= 100) sizeClass = 'large'
  else if (count >= 10) sizeClass = 'medium'
  
  const iconSize = sizeClass === 'large' ? 50 : sizeClass === 'medium' ? 40 : 30
  
  return L.divIcon({
    html: `
      <div class="cluster-icon cluster-${sizeClass}">
        <div class="cluster-count">${count}</div>
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: L.point(iconSize, iconSize),
    iconAnchor: L.point(iconSize / 2, iconSize / 2)
  })
}

export default function MarkerClusterGroup({ courts, onCourtSelect, selectedCourt, selectedSports = [] }: MarkerClusterGroupProps) {
  const map = useMap()
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const courtsRef = useRef<PlaceMarker[]>(courts)
  const onCourtSelectRef = useRef(onCourtSelect)

  // Keep refs in sync without triggering rebuilds
  useEffect(() => { onCourtSelectRef.current = onCourtSelect }, [onCourtSelect])
  useEffect(() => { courtsRef.current = courts }, [courts])

  // Full rebuild only when the courts data changes
  useEffect(() => {
    if (!clusterGroupRef.current) {
      clusterGroupRef.current = L.markerClusterGroup({
        maxClusterRadius: 100,
        showCoverageOnHover: true,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        removeOutsideVisibleBounds: true,
        iconCreateFunction: createClusterIcon,
        disableClusteringAtZoom: 15,
      })
      map.addLayer(clusterGroupRef.current)
    }

    const clusterGroup = clusterGroupRef.current
    clusterGroup.clearLayers()
    markersRef.current = []

    courts.forEach((court) => {
      const availableSports = court.sports || []
      const marker = L.marker([court.latitude, court.longitude], {
        icon: createSportIcon(availableSports, false),
      } as any)

      ;(marker as any).options.placeData = court

      marker.on('click', (e) => {
        e.originalEvent.stopPropagation()
        onCourtSelectRef.current?.(court)
      })

      clusterGroup.addLayer(marker)
      markersRef.current.push(marker)
    })

    return () => {
      clusterGroup.clearLayers()
      markersRef.current = []
    }
  }, [courts, map])

  // Only update icons when sport filter changes — no marker rebuild needed
  useEffect(() => {
    markersRef.current.forEach((marker, i) => {
      const court = courtsRef.current[i]
      if (!court) return
      const availableSports = court.sports || []
      const matchingSports = availableSports.filter(s => selectedSports.includes(s))
      const sportsForIcon = selectedSports.length === 0 ? availableSports : matchingSports.length > 0 ? matchingSports : availableSports
      marker.setIcon(createSportIcon(sportsForIcon, false))
    })
  }, [selectedSports])

  // Handle court selection events from popups
  useEffect(() => {
    const handleCourtSelect = (event: any) => {
      const courtId = event.detail
      const court = courts.find(c => c.id === courtId)
      if (court && onCourtSelect) {
        onCourtSelect(court)
      }
    }

    window.addEventListener('courtSelect', handleCourtSelect)
    return () => window.removeEventListener('courtSelect', handleCourtSelect)
  }, [courts, onCourtSelect])

  // Log zoom level changes
  useEffect(() => {
    const handleZoomEnd = () => {
      const currentZoom = map.getZoom()
      console.log(`🗺️ Current zoom level: ${currentZoom}`)
    }

    // Log initial zoom level
    console.log(`🗺️ Initial zoom level: ${map.getZoom()}`)
    
    // Listen for zoom changes
    map.on('zoomend', handleZoomEnd)
    
    // Cleanup listener on unmount
    return () => {
      map.off('zoomend', handleZoomEnd)
    }
  }, [map])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clusterGroupRef.current && map) {
        map.removeLayer(clusterGroupRef.current)
        clusterGroupRef.current = null
      }
    }
  }, [map])

  return null // This component doesn't render anything directly
}