'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/components/providers/auth-provider'
import { database } from '@/lib/supabase/database'
import { useToast } from '@/hooks/use-toast'
import PlaceForm from '@/components/places/place-form'
import Link from 'next/link'
import React from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface EditPlacePageProps {
  params: Promise<{ id: string }>
}

export default function EditPlacePage({ params }: EditPlacePageProps) {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Get place ID from params
  const [placeId, setPlaceId] = useState<string>('')
  
  React.useEffect(() => {
    params.then(p => setPlaceId(p.id))
  }, [params])

  // Fetch place data for editing
  const { data: place, isLoading, error } = useQuery({
    queryKey: ['place-edit', placeId],
    queryFn: () => database.community.getPlaceForEdit(placeId),
    enabled: !!placeId,
  })

  const isAdmin = profile?.user_role === 'admin'

  // Submit mutation for community edits or direct admin updates
  const submitMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (!user) throw new Error('User not authenticated')
      if (!place) throw new Error('Place not found')

      const placeData = {
        name: formData.name,
        description: formData.description,
        latitude: formData.location.lat,
        longitude: formData.location.lng,
        sports: formData.selectedSports,
        image_url: formData.imageUrl,
        // Address fields
        street: formData.address.street,
        house_number: formData.address.house_number,
        city: formData.address.city,
        county: formData.address.county,
        state: formData.address.state,
        country: formData.address.country,
        postcode: formData.address.postcode,
        district: formData.address.district,
      }

      const courts = formData.courts

      if (isAdmin) {
        // Admin can make direct updates
        const { error: placeError } = await database.courts.updateCourt(place.id, placeData)
        if (placeError) throw new Error('Failed to update place')

        // Update courts
        // First delete existing courts
        await Promise.all(
          place.courts?.map(court => 
            database.courtDetails.deleteCourt(court.id)
          ) || []
        )

        // Add new courts
        await Promise.all(
          courts.map(court => 
            database.courtDetails.addCourt({
              ...court,
              place_id: place.id
            })
          )
        )

        return { directUpdate: true }
      } else {
        // Regular users submit for community review
        const result = await database.community.submitPlaceEdit(
          place.id,
          placeData,
          courts,
          user.id
        )
        return result
      }
    },
    onSuccess: (result) => {
      if (result?.directUpdate) {
        toast({
          title: 'Ort erfolgreich aktualisiert!',
          description: 'Deine Änderungen wurden sofort übernommen.',
        })
      } else {
        toast({
          title: 'Änderungen zur Überprüfung eingereicht!',
          description: 'Deine vorgeschlagenen Änderungen werden von Administratoren geprüft. Danke für deinen Beitrag!',
        })
      }
      
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['place-edit', placeId] })
      queryClient.invalidateQueries({ queryKey: ['courts'] })
      queryClient.invalidateQueries({ queryKey: ['places'] })
      
      // Redirect back to map
      router.push('/map')
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler beim Speichern',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Wait for auth and placeId to resolve
  if (authLoading || !placeId || isLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="max-w-xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Laden...</p>
          </div>
        </div>
      </div>
    )
  }

  // Redirect unauthenticated users
  if (!user) {
    return (
      <div className="container px-4 py-8">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Anmeldung erforderlich</h1>
          <p className="text-muted-foreground mb-4">
            Du musst angemeldet sein, um Orte zu bearbeiten.
          </p>
          <Link href="/auth/signin" className="text-primary hover:underline">
            Anmelden
          </Link>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !place) {
    notFound()
  }

  return (
    <div className="container px-4 py-4 max-w-xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/map"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Ort bearbeiten</h1>
      </div>
      <PlaceForm
        mode="edit"
        initialData={place}
        onSubmit={(formData) => submitMutation.mutateAsync(formData)}
        isLoading={submitMutation.isPending}
        title={isAdmin ? `${place.name} bearbeiten` : `Änderungen für ${place.name} vorschlagen`}
        description={
          isAdmin
            ? "Nimm Änderungen an diesem Ort vor. Deine Änderungen werden sofort übernommen."
            : "Schlage Verbesserungen für diesen Ort vor. Deine Änderungen werden vor der Veröffentlichung geprüft."
        }
        showCommunityMessage={!isAdmin}
        submitButtonText={isAdmin ? "Änderungen speichern" : "Zur Überprüfung einreichen"}
      />
    </div>
  )
}