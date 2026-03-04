'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { Court, SportType, PlaceWithCourts } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
// import FilterBottomSheet from './filter-bottom-sheet'
import { Plus, MapPin, Navigation, Share2, Heart, Search, Filter, Edit, Pencil, X } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import FilterBottomSheetVaul from './filter-bottom-sheet-vaul'
import PlaceBottomSheetVaul from './place-bottom-sheet-vaul'
import { sportNames, getSportBadgeClasses, sportIcons } from '@/lib/utils/sport-utils'
import { createSportIcon, createUserLocationIcon, createSelectedLocationIcon } from '@/lib/utils/sport-styles'
import { MAP_LAYERS, DEFAULT_LAYER_ID, createTileLayer, getSavedLayerPreference, saveLayerPreference } from '@/lib/utils/map-layers'
import { getDistanceText } from '@/lib/utils/distance'
import L from 'leaflet'
import MarkerClusterGroup from './marker-cluster-group'

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css'
import './cluster-styles.css'
import './map-controls.css'

interface LeafletCourtMapProps {
  courts: PlaceWithCourts[]
  onCourtSelect?: (court: PlaceWithCourts) => void
  onMapClick?: (lng: number, lat: number) => void
  height?: string
  allowAddCourt?: boolean
  selectedLocation?: { lat: number; lng: number } | null
  enableClustering?: boolean
  selectedSports?: SportType[]
  // Filter props
  onSportsChange?: (sports: SportType[]) => void
  placesCount?: number
  showAddCourtButton?: boolean
  onAddCourtClick?: () => void
}

// Component to handle map clicks
function MapClickHandler({ 
  onMapClick, 
  allowAddCourt, 
  onCloseFilterSheet,
  onCloseMapPinSheet 
}: { 
  onMapClick?: (lng: number, lat: number) => void, 
  allowAddCourt: boolean,
  onCloseFilterSheet?: () => void,
  onCloseMapPinSheet?: () => void
}) {
  useMapEvents({
    click: (e) => {
      console.log('🗺️ Map click detected - closing sheets')
      // Close both sheets on any map click (but not marker clicks)
      if (onCloseFilterSheet) {
        onCloseFilterSheet()
      }
      if (onCloseMapPinSheet) {
        onCloseMapPinSheet()
      }
      
      // Handle add court clicks
      if (allowAddCourt && onMapClick) {
        onMapClick(e.latlng.lng, e.latlng.lat)
      }
    }
  })
  return null
}


// Component to handle filter button in top right corner
function FilterButtonHandler({ onFilterClick, isFilterActive }: { onFilterClick: () => void, isFilterActive: boolean }) {
  const map = useMap()

  useEffect(() => {
    // Create top-right stack container if it doesn't exist
    let topRightStack = map.getContainer().querySelector('.map-control-top-right-stack') as HTMLElement
    if (!topRightStack) {
      topRightStack = L.DomUtil.create('div', 'map-control-top-right-stack')
      map.getContainer().appendChild(topRightStack)
    }

    // Create filter button container
    const filterContainer = L.DomUtil.create('div', 'leaflet-control-filter')

    // Create modern filter button
    const filterButton = L.DomUtil.create('button', 'filter-button map-control-button', filterContainer)
    filterButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
      </svg>
      ${isFilterActive ? '<span class="filter-active-dot"></span>' : ''}
    `
    filterButton.title = 'Filter'

    // Handle click events
    L.DomEvent.on(filterButton, 'click', (e) => {
      L.DomEvent.preventDefault(e)
      onFilterClick()
    })

    // Prevent map interactions
    L.DomEvent.disableClickPropagation(filterContainer)
    L.DomEvent.disableScrollPropagation(filterContainer)

    // Add to top-right stack
    topRightStack.appendChild(filterContainer)

    return () => {
      filterContainer.remove()
    }
  }, [map, onFilterClick, isFilterActive])

  return null
}

// Component to handle user location with modern bottom-right positioning
function UserLocationHandler({ onLocationFound }: { onLocationFound: (lat: number, lng: number) => void }) {
  const map = useMap()
  
  const findUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          onLocationFound(lat, lng)
          map.setView([lat, lng], 14)
        },
        (error) => {
          console.warn('Could not get user location:', error)
          alert('Could not access your location. Please check your browser settings and try again.')
        }
      )
    }
  }

  useEffect(() => {
    // Create bottom-right stack container if it doesn't exist
    let bottomRightStack = map.getContainer().querySelector('.map-control-bottom-right-stack') as HTMLElement
    if (!bottomRightStack) {
      bottomRightStack = L.DomUtil.create('div', 'map-control-bottom-right-stack')
      map.getContainer().appendChild(bottomRightStack)
    }
    
    // Create location button container
    const locationContainer = L.DomUtil.create('div', 'leaflet-control-location-modern')
    
    // Create modern location button
    const locationButton = L.DomUtil.create('button', 'location-button map-control-button', locationContainer)
    locationButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    `
    locationButton.title = 'Find my location'
    
    // Handle click events
    L.DomEvent.on(locationButton, 'click', L.DomEvent.preventDefault)
    L.DomEvent.on(locationButton, 'click', findUserLocation)
    
    // Prevent map interactions
    L.DomEvent.disableClickPropagation(locationContainer)
    L.DomEvent.disableScrollPropagation(locationContainer)
    
    // Add to bottom-right stack
    bottomRightStack.appendChild(locationContainer)
    
    return () => {
      locationContainer.remove()
    }
  }, [map])
  
  return null
}

// Component to handle custom attribution control positioned at bottom-left
function AttributionControlHandler({ attribution }: { attribution: string }) {
  const map = useMap()
  
  useEffect(() => {
    // Create bottom-left stack container if it doesn't exist
    let bottomLeftStack = map.getContainer().querySelector('.map-control-bottom-left-stack') as HTMLElement
    if (!bottomLeftStack) {
      bottomLeftStack = L.DomUtil.create('div', 'map-control-bottom-left-stack')
      map.getContainer().appendChild(bottomLeftStack)
    }

    const container = L.DomUtil.create('div', 'leaflet-control-attribution leaflet-control')
    container.innerHTML = attribution

    // Prevent map interactions
    L.DomEvent.disableClickPropagation(container)
    L.DomEvent.disableScrollPropagation(container)

    // Add to bottom-left stack
    bottomLeftStack.appendChild(container)

    return () => {
      container.remove()
    }
  }, [map, attribution])
  
  return null
}

// Component to handle layer toggle button positioned above places count
function LayerToggleHandler({ currentLayerId, onLayerChange }: { currentLayerId: string, onLayerChange: (layerId: string) => void }) {
  const map = useMap()
  
  const toggleLayer = () => {
    const cycle = ['light', 'satellite']
    const nextIndex = (cycle.indexOf(currentLayerId) + 1) % cycle.length
    onLayerChange(cycle[nextIndex])
  }
  
  const getLayersIcon = () => {
    return `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        <polyline points="2 17 12 22 22 17"/>
        <polyline points="2 12 12 17 22 12"/>
      </svg>
    `
  }

  useEffect(() => {
    // Create bottom-right stack container if it doesn't exist
    let bottomRightStack = map.getContainer().querySelector('.map-control-bottom-right-stack') as HTMLElement
    if (!bottomRightStack) {
      bottomRightStack = L.DomUtil.create('div', 'map-control-bottom-right-stack')
      map.getContainer().appendChild(bottomRightStack)
    }

    // Create layer toggle button container
    const layerContainer = L.DomUtil.create('div', 'leaflet-control-layer-toggle')

    // Create modern layer toggle button
    const layerButton = L.DomUtil.create('button', 'layer-toggle-button map-control-button', layerContainer)
    layerButton.innerHTML = getLayersIcon()
    layerButton.title = 'Toggle Map Style'

    // Handle click events
    L.DomEvent.on(layerButton, 'click', (e) => {
      L.DomEvent.preventDefault(e)
      toggleLayer()
    })

    // Prevent map interactions
    L.DomEvent.disableClickPropagation(layerContainer)
    L.DomEvent.disableScrollPropagation(layerContainer)

    // Add to bottom-right stack (will appear above location button)
    bottomRightStack.appendChild(layerContainer)
    
    return () => {
      layerContainer.remove()
    }
  }, [map, currentLayerId, onLayerChange])
  
  return null
}

// Component to display places count above attribution
function PlacesCountHandler({ count }: { count: number }) {
  const map = useMap()
  
  useEffect(() => {
    // Create bottom-left stack container if it doesn't exist
    let bottomLeftStack = map.getContainer().querySelector('.map-control-bottom-left-stack') as HTMLElement
    if (!bottomLeftStack) {
      bottomLeftStack = L.DomUtil.create('div', 'map-control-bottom-left-stack')
      map.getContainer().appendChild(bottomLeftStack)
    }
    
    const container = L.DomUtil.create('div', 'leaflet-control-places-count')
    container.innerHTML = `${count} Plätze gefunden`
    
    // Prevent map interactions
    L.DomEvent.disableClickPropagation(container)
    L.DomEvent.disableScrollPropagation(container)
    
    // Add to bottom-left stack (will appear above attribution due to flex order)
    bottomLeftStack.appendChild(container)
    
    return () => {
      container.remove()
    }
  }, [map, count])
  
  return null
}

// Component to handle add court button positioned above locate button
function AddCourtButtonHandler({ onAddCourtClick, user }: { onAddCourtClick: () => void, user: any }) {
  const map = useMap()
  
  useEffect(() => {
    // Create top-right stack container if it doesn't exist
    let topRightStack = map.getContainer().querySelector('.map-control-top-right-stack') as HTMLElement
    if (!topRightStack) {
      topRightStack = L.DomUtil.create('div', 'map-control-top-right-stack')
      map.getContainer().appendChild(topRightStack)
    }
    
    // Create add court button container
    const addCourtContainer = L.DomUtil.create('div', 'leaflet-control-add-court')
    
    // Create modern add court button
    const addCourtButton = L.DomUtil.create('button', 'add-court-button map-control-button', addCourtContainer)
    addCourtButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    `
    addCourtButton.title = user ? 'Add court' : 'Sign in to add court'
    
    // Handle click events
    L.DomEvent.on(addCourtButton, 'click', (e) => {
      L.DomEvent.preventDefault(e)
      if (!user) {
        window.location.href = '/auth/signin'
      } else {
        onAddCourtClick()
      }
    })
    
    // Prevent map interactions
    L.DomEvent.disableClickPropagation(addCourtContainer)
    L.DomEvent.disableScrollPropagation(addCourtContainer)
    
    // Add to top-right stack (will appear below filter due to flex order)
    topRightStack.appendChild(addCourtContainer)
    
    return () => {
      addCourtContainer.remove()
    }
  }, [map, onAddCourtClick])
  
  return null
}

export default function LeafletCourtMap({ 
  courts, 
  onCourtSelect, 
  onMapClick, 
  height = '400px',
  allowAddCourt = false,
  selectedLocation = null,
  enableClustering = true,
  selectedSports = [],
  onSportsChange,
  placesCount = 0,
  showAddCourtButton = false,
  onAddCourtClick,
}: LeafletCourtMapProps) {
  const { user, profile } = useAuth()
  const [selectedCourt, setSelectedCourt] = useState<PlaceWithCourts | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [currentLayerId, setCurrentLayerId] = useState<string>(() => getSavedLayerPreference())
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const isClosingExplicitly = useRef(false)
  const isClosingFilterExplicitly = useRef(false)
  const isBottomSheetOpenRef = useRef(false)
  const isFilterSheetOpenRef = useRef(false)

  // Keep refs in sync so stable callbacks can read current values
  isBottomSheetOpenRef.current = isBottomSheetOpen
  isFilterSheetOpenRef.current = isFilterSheetOpen

  // Vaul renders via @radix-ui/react-dialog which sets pointer-events:none on the body
  // when its DismissableLayer fires (modal=true by default in Radix, regardless of vaul's modal=false).
  // Restore pointer-events so the map remains pannable while a non-modal sheet is open.
  useEffect(() => {
    if (!isBottomSheetOpen && !isFilterSheetOpen) return
    const raf = requestAnimationFrame(() => {
      document.body.style.pointerEvents = 'auto'
    })
    return () => cancelAnimationFrame(raf)
  }, [isBottomSheetOpen, isFilterSheetOpen])

  const handleCourtSelect = useCallback((court: PlaceWithCourts) => {
    // Close filter sheet if open (mutual exclusion)
    if (isFilterSheetOpenRef.current) {
      setIsFilterSheetOpen(false)
    }

    setSelectedCourt(court)
    if (!isBottomSheetOpenRef.current) {
      setIsBottomSheetOpen(true)
    }
    onCourtSelect?.(court)
  }, [onCourtSelect])

  const handleExplicitClose = useCallback(() => {
    console.log('🗂️ Explicit close requested - clearing selection and closing sheet')
    setSelectedCourt(null)
    setIsBottomSheetOpen(false)
  }, [])

  const handleExplicitFilterClose = useCallback(() => {
    console.log('🗂️ Explicit filter close requested')
    isClosingFilterExplicitly.current = true
    setIsFilterSheetOpen(false)
  }, [])

  const handleLocationFound = useCallback((lat: number, lng: number) => {
    setUserLocation({ lat, lng })
  }, [])

  const handleLayerChange = useCallback((layerId: string) => {
    setCurrentLayerId(layerId)
    saveLayerPreference(layerId)
  }, [])

  const handleFilterClick = useCallback(() => {
    // Close marker sheet if open (mutual exclusion)
    if (isBottomSheetOpenRef.current) {
      setIsBottomSheetOpen(false)
      setSelectedCourt(null)
    }
    setIsFilterSheetOpen(true)
  }, [])


  // Default center (Germany)
  const defaultCenter: [number, number] = [51.165691, 10.451526]
  
  // Get current layer configuration (memoized)
  const currentLayer = useMemo(() => MAP_LAYERS[currentLayerId] || MAP_LAYERS[DEFAULT_LAYER_ID], [currentLayerId])

  return (
    <div className="relative" style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={false}
      >
          {/* Dynamic tile layer based on user selection */}
          <TileLayer
            attribution={currentLayer.attribution}
            url={currentLayer.url}
            maxZoom={currentLayer.maxZoom}
            {...(currentLayer.subdomains !== undefined && currentLayer.subdomains.length > 0 && { subdomains: currentLayer.subdomains })}
          />
          
          {/* Court markers - with optional clustering */}
          {useMemo(() => {
            if (enableClustering && courts.length > 10) {
              return (
                <MarkerClusterGroup
                  courts={courts}
                  onCourtSelect={handleCourtSelect}
                  selectedCourt={selectedCourt}
                  selectedSports={selectedSports}
                />
              )
            }
            
            // Individual markers when not clustering
            return courts.map((court) => {
              const allSports = court.sports || []
              const matchingSports = allSports.filter(s => selectedSports.includes(s))
              const sportsForIcon = selectedSports.length === 0 ? allSports : matchingSports.length > 0 ? matchingSports : allSports

              return (
              <Marker 
                key={court.id} 
                position={[court.latitude, court.longitude]}
                icon={createSportIcon(sportsForIcon, false)}
                eventHandlers={{
                  click: (e) => {
                    console.log('📍 Regular marker clicked:', {
                      courtId: court.id,
                      eventPropagationStopped: true
                    })
                    e.originalEvent.stopPropagation()
                    handleCourtSelect(court)
                  }
                }}
              />
            )
            })
          }, [enableClustering, courts, selectedSports, handleCourtSelect])}
          
          {/* User location marker */}
          {userLocation && (
            <Marker 
              position={[userLocation.lat, userLocation.lng]}
              icon={createUserLocationIcon()}
            />
          )}
          
          {/* Selected location marker (for adding courts) */}
          {selectedLocation && (
            <Marker 
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={createSelectedLocationIcon()}
            />
          )}
          
          {/* Handle map clicks */}
          <MapClickHandler 
            onMapClick={onMapClick} 
            allowAddCourt={allowAddCourt} 
            onCloseFilterSheet={handleExplicitFilterClose}
            onCloseMapPinSheet={() => {
              console.log('🗺️ Explicitly closing map pin sheet via map click')
              handleExplicitClose()
            }}
          />
          
          {/* User location control */}
          <UserLocationHandler onLocationFound={handleLocationFound} />
          
          {/* Filter button */}
          <FilterButtonHandler onFilterClick={handleFilterClick} isFilterActive={selectedSports.length > 0} />
          
          
          {/* Custom attribution control */}
          <AttributionControlHandler attribution={currentLayer.attribution} />
          
          {/* Layer toggle button */}
          <LayerToggleHandler currentLayerId={currentLayerId} onLayerChange={handleLayerChange} />
          
          {/* Places count display */}
          <PlacesCountHandler count={placesCount} />
          
          {/* Add court button */}
          {showAddCourtButton && onAddCourtClick && (
            <AddCourtButtonHandler onAddCourtClick={onAddCourtClick} user={user} />
          )}
        </MapContainer>
      
      {/* Add court instruction */}
      {allowAddCourt && (
        <div className="absolute top-4 right-4 bg-white/90 rounded-lg p-2 text-sm shadow-lg">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Plus className="h-3 w-3" />
            Click map to add court
          </div>
        </div>
      )}

      {/* Bottom Sheet for Court Details — vaul Drawer */}
      <PlaceBottomSheetVaul
        isOpen={isBottomSheetOpen}
        onOpenChange={setIsBottomSheetOpen}
        selectedCourt={selectedCourt}
        userLocation={userLocation}
        user={user}
        profile={profile}
      />

      {/* Filter Bottom Sheet — vaul Drawer */}
      <FilterBottomSheetVaul
        isOpen={isFilterSheetOpen}
        onClose={setIsFilterSheetOpen}
        onExplicitClose={handleExplicitFilterClose}
        selectedSports={selectedSports}
        onSportsChange={onSportsChange ?? (() => {})}
      />

      {/* OLD Sheet-based bottom sheets (commented out for vaul testing)
      <Sheet
        open={isBottomSheetOpen}
        onOpenChange={(open) => {
          if (open === false) {
            if (isClosingExplicitly.current) { isClosingExplicitly.current = false; return }
            if (selectedCourt) return
          }
          setIsBottomSheetOpen(open)
        }}
        modal={false}
      >
        <SheetContent side="bottom" className="border-0 h-auto max-w-2xl mx-auto rounded-t-xl" hideOverlay onClose={handleExplicitClose}>
          ... (original place sheet content)
        </SheetContent>
      </Sheet>

      <FilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={(open) => {
          if (open === false) {
            if (isClosingFilterExplicitly.current) { isClosingFilterExplicitly.current = false; return }
            if (isFilterSheetOpen) return
          }
          setIsFilterSheetOpen(open)
        }}
        onExplicitClose={handleExplicitFilterClose}
        selectedSport={selectedSport}
        onSportChange={onSportChange}
      />
      */}
    </div>
  )
}