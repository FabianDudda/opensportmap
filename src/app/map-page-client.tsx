'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useQuery } from '@tanstack/react-query'
import { database } from '@/lib/supabase/database'
import { SportType, PlaceMarker } from '@/lib/supabase/types'
import { PlaceType } from '@/lib/utils/sport-utils'

const LeafletCourtMap = dynamic(() => import('@/components/map/leaflet-court-map'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  )
})

function MapPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedSports, setSelectedSports] = useState<SportType[]>([])
  const [selectedPlaceType, setSelectedPlaceType] = useState<PlaceType | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<PlaceMarker | null>(null)
  const defaultFavoritesOpen = searchParams.get('favorites') === '1'
  const initialPlaceId = searchParams.get('place')

  const savedPosition = typeof window !== 'undefined'
    ? (() => { try { return JSON.parse(sessionStorage.getItem('map-position') || '') } catch { return null } })()
    : null

  const { data: places = [], isLoading, isError, error } = useQuery({
    queryKey: ['places-lightweight'],
    queryFn: () => database.courts.getAllPlacesLightweight(),
    enabled: !loading,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (isError) console.error('[Map] Failed to load map pins:', error)
  }, [isError, error])

  // Only used for the pin count display — filtering is handled inside MarkerClusterGroup
  const visibleCount = useMemo(() => {
    return places.filter((place) => {
      if (selectedSports.length > 0 && !selectedSports.some(sport => place.sports?.includes(sport))) return false
      if (selectedPlaceType !== null && (place.place_type || 'öffentlich') !== selectedPlaceType) return false
      return true
    }).length
  }, [places, selectedSports, selectedPlaceType])

  useEffect(() => {
    if (!isLoading) {
      // console.log('[Map] Pins displayed on map:', visibleCount, `(sports: ${selectedSports.join(', ') || 'all'})`)
    }
  }, [visibleCount, selectedSports, isLoading])

  return (
    <>
      <h1 className="sr-only">Kostenlose Sportplätze in deiner Nähe finden</h1>
      <h2 className="sr-only">Interaktive Karte mit über 13.000 Sportplätzen in Deutschland</h2>
      <LeafletCourtMap
        courts={places}
        onCourtSelect={setSelectedPlace}
        height="100dvh"
        selectedSports={selectedSports}
        onSportsChange={setSelectedSports}
        selectedPlaceType={selectedPlaceType}
        onPlaceTypeChange={setSelectedPlaceType}
        placesCount={visibleCount}
        defaultFavoritesOpen={defaultFavoritesOpen}
        onFavoritesClose={() => router.replace('/')}
        initialCenter={savedPosition ? { lat: savedPosition.lat, lng: savedPosition.lng } : undefined}
        initialZoom={savedPosition?.zoom}
        initialPlaceId={initialPlaceId}
        trackPosition={true}
      />
    </>
  )
}

export default function MapPageClient() {
  return (
    <Suspense>
      <MapPage />
    </Suspense>
  )
}
