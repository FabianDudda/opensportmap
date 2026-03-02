'use client'

import { useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, Navigation, Share2, Heart, Pencil, X, Upload, Image, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { PlaceWithCourts } from '@/lib/supabase/types'
import { sportNames, sportIcons } from '@/lib/utils/sport-utils'
import { getDistanceText } from '@/lib/utils/distance'
import { uploadCourtImage } from '@/lib/supabase/storage'
import { database } from '@/lib/supabase/database'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

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
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please select an image smaller than 10MB.', variant: 'destructive' })
      return
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please select an image file (JPG, PNG, WebP).', variant: 'destructive' })
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleImageUpload = async () => {
    if (!imageFile || !selectedCourt) return
    setIsUploadingImage(true)
    try {
      const { url } = await uploadCourtImage(imageFile)
      await database.courts.updateCourt(selectedCourt.id, { image_url: url })
      toast({ title: 'Image uploaded', description: 'The photo has been added to this place.' })
      queryClient.invalidateQueries({ queryKey: ['places'] })
      setImageFile(null)
      setImagePreview(null)
    } catch (error) {
      toast({ title: 'Upload failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' })
    } finally {
      setIsUploadingImage(false)
    }
  }

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
               
                className="flex-1 text-base"
                onClick={() => {
                  console.log('Save place:', selectedCourt.id)
                }}
              >
                <Heart className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>

            {selectedCourt.image_url ? (
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
            ) : user && (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                {imagePreview ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => { setImageFile(null); setImagePreview(null) }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button className="w-full" onClick={handleImageUpload} disabled={isUploadingImage}>
                      {isUploadingImage ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : <>Upload Photo</>}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <Image className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No photo yet — be the first to add one!</p>
                    <Button type="button" onClick={() => document.getElementById(`upload-${selectedCourt.id}`)?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Add Photo
                    </Button>
                    <Input
                      id={`upload-${selectedCourt.id}`}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
