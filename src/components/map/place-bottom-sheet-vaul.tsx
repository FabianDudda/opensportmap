'use client'

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, Share2, Heart, Pencil, X } from 'lucide-react'
import Link from 'next/link'
import { PlaceWithCourts } from '@/lib/supabase/types'
import { sportNames, sportIcons } from '@/lib/utils/sport-utils'
import { getDistanceText } from '@/lib/utils/distance'

interface PlaceBottomSheetVaulProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedCourt: PlaceWithCourts | null
  userLocation: { lat: number; lng: number } | null
  user: { id: string } | null
  profile: { user_role?: string } | null
}

export default function PlaceBottomSheetVaul({
  isOpen,
  onOpenChange,
  selectedCourt,
  userLocation,
  user,
  profile,
}: PlaceBottomSheetVaulProps) {
  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange} modal={false} shouldScaleBackground={false}>
      <DrawerContent
        hideOverlay
        className="border-0 h-auto max-w-2xl mx-auto"
      >
        {selectedCourt && (
          <div className="space-y-4 px-6 pb-6">
            <DrawerHeader className="px-0 pb-0">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-left">
                  <DrawerTitle className="text-xl text-left">
                    <Link href={`/places/${selectedCourt.id}`} className="hover:underline">
                      {selectedCourt.name}
                    </Link>
                  </DrawerTitle>
                  {userLocation && (
                    <p className="text-sm text-muted-foreground mt-1 text-left">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      {getDistanceText(userLocation, { lat: selectedCourt.latitude, lng: selectedCourt.longitude })}
                    </p>
                  )}
                </div>

                {/* Button group */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full"
                    onClick={() => {
                      if (!user) {
                        window.location.href = '/auth/signin'
                      } else {
                        window.location.href = `/places/${selectedCourt.id}/edit`
                      }
                    }}
                    title={user && profile?.user_role === 'admin' ? 'Edit Place' : user ? 'Suggest Edit' : 'Sign in to edit'}
                  >
                    <Pencil className="h-[18px] w-[18px]" />
                  </Button>

                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: selectedCourt.name,
                          text: `Check out ${selectedCourt.name}`,
                          url: `${window.location.origin}/places/${selectedCourt.id}`
                        }).catch(err => console.log('Share failed:', err))
                      }
                    }}
                    title="Share"
                  >
                    <Share2 className="h-[18px] w-[18px]" />
                  </Button>

                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full"
                    onClick={() => onOpenChange(false)}
                    title="Close"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Quick Address */}
              {(() => {
                const quickAddress = [selectedCourt.street, selectedCourt.district || selectedCourt.city]
                  .filter(Boolean)
                  .join(', ')
                return quickAddress && (
                  <DrawerDescription className="text-base text-muted-foreground text-left">
                    {quickAddress}
                  </DrawerDescription>
                )
              })()}
              {selectedCourt.description && (
                <DrawerDescription className="text-left">
                  {selectedCourt.description}
                </DrawerDescription>
              )}
            </DrawerHeader>

            {/* Sports pills */}
            {(() => {
              const sportsWithCounts = (selectedCourt.courts?.length ?? 0) > 0
                ? selectedCourt.courts!.reduce((acc, c) => {
                    acc[c.sport] = (acc[c.sport] || 0) + (c.quantity || 1)
                    return acc
                  }, {} as Record<string, number>)
                : (selectedCourt.sports?.reduce((acc, sport) => ({ ...acc, [sport]: 1 }), {} as Record<string, number>) || {})

              return Object.keys(sportsWithCounts).length > 0 && (
                <div className="flex gap-2 overflow-x-auto -mx-6 px-6">
                  {Object.entries(sportsWithCounts).map(([sport, count]) => (
                    <div
                      key={sport}
                      className="flex-shrink-0 flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1.5"
                    >
                      <span className="text-[16px] leading-none">{sportIcons[sport] || '📍'}</span>
                      <span className="text-[14px] font-medium text-gray-800">{sportNames[sport] || sport}</span>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Directions + Save row */}
            <div className="flex gap-2">
              <Button
                variant="default"
                size="lg"
                className="flex-1 text-base"
                onClick={() => {
                  const url = `https://maps.google.com/?q=${selectedCourt.latitude},${selectedCourt.longitude}`
                  window.open(url, '_blank', 'noopener,noreferrer')
                }}
              >
                <Navigation className="h-4 w-4 mr-1" />
                Directions
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="flex-1 text-base"
                onClick={() => {
                  console.log('Save place:', selectedCourt.id)
                }}
              >
                <Heart className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>

            {selectedCourt.image_url && (
              <div className="w-full rounded-lg overflow-hidden h-48">
                <img
                  src={selectedCourt.image_url}
                  alt={selectedCourt.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.parentElement?.remove()
                  }}
                />
              </div>
            )}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
