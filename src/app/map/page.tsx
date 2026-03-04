'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useQuery } from '@tanstack/react-query'
import { database } from '@/lib/supabase/database'
import { PlaceWithCourts, SportType } from '@/lib/supabase/types'
import AddPlaceBottomSheetVaul from '@/components/map/add-place-bottom-sheet-vaul'

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

export default function CourtsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedSports, setSelectedSports] = useState<SportType[]>([])
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithCourts | null>(null)
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false)

  // Open sheet when ?addPlace=1 is in the URL
  useEffect(() => {
    if (searchParams.get('addPlace') === '1') {
      setIsAddPlaceOpen(true)
    }
  }, [searchParams])

  const handleAddPlaceOpenChange = (open: boolean) => {
    setIsAddPlaceOpen(open)
    if (!open) {
      router.replace('/map')
    }
  }

  const { data: places = [], isLoading, isError, error } = useQuery({
    queryKey: ['places'],
    queryFn: async () => {
      const result = await database.courts.getAllCourts()
      return result
    },
    enabled: !loading,
  })

  useEffect(() => {
    if (isError) {
      console.error('[Map] Failed to load map pins:', error)
    }
  }, [isError, error])

  const filteredPlaces = places.filter((place) => {
    if (selectedSports.length === 0) return true
    return selectedSports.some(sport =>
      place.courts?.some(court => court.sport === sport) ||
      place.sports?.includes(sport)
    )
  })

  useEffect(() => {
    if (!isLoading) {
      console.log('[Map] Pins displayed on map:', filteredPlaces.length, `(sports: ${selectedSports.join(', ') || 'all'})`)
    }
  }, [filteredPlaces.length, selectedSports, isLoading])

  return (
    <>
      <LeafletCourtMap
        courts={filteredPlaces}
        onCourtSelect={setSelectedPlace}
        height="calc(100dvh - 4rem)"
        selectedSports={selectedSports}
        onSportsChange={setSelectedSports}
        placesCount={filteredPlaces.length}
      />
      <AddPlaceBottomSheetVaul
        isOpen={isAddPlaceOpen}
        onOpenChange={handleAddPlaceOpenChange}
        user={user}
      />
    </>
  )
}
