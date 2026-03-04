'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useQuery } from '@tanstack/react-query'
import { database } from '@/lib/supabase/database'
import { PlaceWithCourts, SportType } from '@/lib/supabase/types'
// Dynamic import to prevent SSR issues with Leaflet
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
import { MapPin, Plus, Search, Filter } from 'lucide-react'
import Link from 'next/link'


const SPORTS = [ 'fußball', 'basketball', 'tischtennis', 'tennis', 'volleyball', 'beachvolleyball', 'skatepark', 'calisthenics', 'boule'] as const

const SURFACE_TYPES = [
  'Rasen',
  'Hartplatz', 
  'Asphalt',
  'Kunststoffbelag',
  'Asche',
  'Kunstrasen',
  'Sonstiges',
] as const

export default function CourtsPage() {
  const { user, loading } = useAuth()
  const [selectedSports, setSelectedSports] = useState<SportType[]>([])
  const [selectedSurface, setSelectedSurface] = useState<string | 'all'>('all')
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithCourts | null>(null)

  // Fetch all places (formerly courts) — wait for auth to initialize first so the
  // session is properly set before the query runs, preventing empty RLS responses
  // from being cached by React Query before auth is ready.
  const { data: places = [], isLoading, isError, error } = useQuery({
    queryKey: ['places'],
    queryFn: async () => {
      console.log('[Map] Fetching map pins...')
      const result = await database.courts.getAllCourts()
      console.log('[Map] Map pins loaded:', result.length, 'places')
      return result
    },
    enabled: !loading,
  })

  useEffect(() => {
    if (isError) {
      console.error('[Map] Failed to load map pins:', error)
    }
  }, [isError, error])

  // Filter places based on sports and surface
  const filteredPlaces = places.filter((place) => {
    const noSportFilter = selectedSports.length === 0
    const noSurfaceFilter = selectedSurface === 'all'

    if (noSportFilter && noSurfaceFilter) return true

    if (noSportFilter) {
      return place.courts?.some(court => court.surface === selectedSurface)
    }

    if (noSurfaceFilter) {
      return selectedSports.some(sport =>
        place.courts?.some(court => court.sport === sport) ||
        place.sports?.includes(sport)
      )
    }

    return selectedSports.some(sport =>
      place.courts?.some(court => court.sport === sport && court.surface === selectedSurface)
    )
  })

  useEffect(() => {
    if (!isLoading) {
      console.log('[Map] Pins displayed on map:', filteredPlaces.length, `(sports: ${selectedSports.join(', ') || 'all'})`)
    }
  }, [filteredPlaces.length, selectedSports, isLoading])

  const handlePlaceSelect = (place: PlaceWithCourts) => {
    setSelectedPlace(place)
  }

  return (
    <LeafletCourtMap
      courts={filteredPlaces}
      onCourtSelect={handlePlaceSelect}
      height="100dvh"
      selectedSports={selectedSports}
      onSportsChange={setSelectedSports}
      placesCount={filteredPlaces.length}
    />
  )
}