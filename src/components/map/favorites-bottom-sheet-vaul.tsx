'use client'

import Link from 'next/link'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Heart, X, MapPin, Loader2 } from 'lucide-react'
import { PlaceWithCourts, UserFavorite } from '@/lib/supabase/types'
import { sportIcons, sportNames } from '@/lib/utils/sport-utils'
import { getDistanceText } from '@/lib/utils/distance'
import { database } from '@/lib/supabase/database'
import { useToast } from '@/hooks/use-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface FavoritesBottomSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  user: { id: string } | null
  userLocation: { lat: number; lng: number } | null
  onPlaceSelect: (place: PlaceWithCourts) => void
}

function PlaceCard({
  place,
  userId,
  userLocation,
  onSelect,
}: {
  place: PlaceWithCourts
  userId: string
  userLocation: { lat: number; lng: number } | null
  onSelect: (place: PlaceWithCourts) => void
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const removeMutation = useMutation({
    mutationFn: () => database.favorites.removeFavorite(userId, place.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
      queryClient.invalidateQueries({ queryKey: ['favorite', userId, place.id] })
      toast({ title: 'Aus Favoriten entfernt' })
    },
    onError: () => {
      toast({ title: 'Entfernen fehlgeschlagen', variant: 'destructive' })
    },
  })

  const sportsWithCounts = (place.courts?.length ?? 0) > 0
    ? place.courts!.reduce((acc, c) => {
        acc[c.sport] = (acc[c.sport] || 0) + (c.quantity || 1)
        return acc
      }, {} as Record<string, number>)
    : (place.sports?.reduce((acc, sport) => ({ ...acc, [sport]: 1 }), {} as Record<string, number>) || {})

  const quickAddress = [place.street, place.district || place.city].filter(Boolean).join(', ')

  return (
    <div
      className="border rounded-xl overflow-hidden bg-card cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => onSelect(place)}
    >
      {place.image_url && (
        <div className="h-36 w-full overflow-hidden">
          <img
            src={place.image_url}
            alt={place.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).parentElement?.remove() }}
          />
        </div>
      )}
      <div className="p-3 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base leading-tight line-clamp-1">{place.name}</p>
            {quickAddress && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{quickAddress}</p>
            )}
            {userLocation && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" />
                {getDistanceText(userLocation, { lat: place.latitude, lng: place.longitude })}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 -mt-1 -mr-1"
            onClick={(e) => { e.stopPropagation(); removeMutation.mutate() }}
            disabled={removeMutation.isPending}
            title="Remove from favorites"
          >
            {removeMutation.isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Heart className="h-4 w-4 fill-current" />}
          </Button>
        </div>

        {Object.keys(sportsWithCounts).length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(sportsWithCounts).map(([sport]) => (
              <span
                key={sport}
                className="inline-flex items-center gap-1 border border-border rounded-full px-2.5 py-1 text-xs font-medium"
              >
                <span className="text-[13px] leading-none">{sportIcons[sport] || '📍'}</span>
                {sportNames[sport] || sport}
              </span>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default function FavoritesBottomSheetVaul({
  isOpen,
  onOpenChange,
  user,
  userLocation,
  onPlaceSelect,
}: FavoritesBottomSheetProps) {
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => database.favorites.getFavorites(user!.id),
    enabled: !!user && isOpen,
  })

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange} modal={false} shouldScaleBackground={false}>
      <DrawerContent hideOverlay className="max-h-[92dvh] max-w-2xl mx-auto">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-xl">Gespeicherte Orte</DrawerTitle>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => onOpenChange(false)}
              title="Schließen"
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto p-4">
          {!user ? (
            <div className="text-center space-y-4">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">Melde dich an, um deine Lieblingsorte zu speichern.</p>
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <Button asChild className="w-full">
                  <Link href="/auth/signin" onClick={() => onOpenChange(false)}>Anmelden</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/signup" onClick={() => onOpenChange(false)}>Registrieren</Link>
                </Button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <p className="font-medium">Noch keine gespeicherten Orte</p>
              <p className="text-sm text-muted-foreground">
                Tippe auf das Herz bei einem Ort, um ihn hier zu speichern.
              </p>
            </div>
          ) : (
            <div className="space-y-3 py-1">
              {favorites.map((fav: UserFavorite) =>
                fav.places ? (
                  <PlaceCard
                    key={fav.id}
                    place={fav.places as PlaceWithCourts}
                    userId={user.id}
                    userLocation={userLocation}
                    onSelect={onPlaceSelect}
                  />
                ) : null
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
