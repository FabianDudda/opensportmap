'use client'

import { useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, Navigation, Share2, Heart, Pencil, X, Upload, Image, Loader2 } from 'lucide-react'
import { PlaceWithCourts } from '@/lib/supabase/types'
import { sportNames, sportIcons } from '@/lib/utils/sport-utils'
import { getDistanceText } from '@/lib/utils/distance'
import { uploadCourtImage } from '@/lib/supabase/storage'
import { database } from '@/lib/supabase/database'
import { useToast } from '@/hooks/use-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface PlaceBottomSheetVaulProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedCourt: PlaceWithCourts | null
  userLocation: { lat: number; lng: number } | null
  user: { id: string } | null
  profile: { user_role?: string } | null
  showFavorite?: boolean
}

export default function PlaceBottomSheetVaul({
  isOpen,
  onOpenChange,
  selectedCourt,
  userLocation,
  user,
  profile,
  showFavorite = true,
}: PlaceBottomSheetVaulProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [imageFile, setImageFile] = useState<File | null>(null)

  const { data: isFavorited = false } = useQuery({
    queryKey: ['favorite', user?.id, selectedCourt?.id],
    queryFn: () => database.favorites.isFavorite(user!.id, selectedCourt!.id),
    enabled: !!user && !!selectedCourt,
  })

  const favoriteMutation = useMutation({
    mutationFn: () => isFavorited
      ? database.favorites.removeFavorite(user!.id, selectedCourt!.id)
      : database.favorites.addFavorite(user!.id, selectedCourt!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite', user?.id, selectedCourt?.id] })
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] })
      toast({ title: isFavorited ? 'Removed from saved places' : 'Saved!' })
    },
    onError: () => {
      toast({ title: 'Something went wrong', variant: 'destructive' })
    },
  })
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

  const isAdmin = profile?.user_role === 'admin'

  const handleImageUpload = async () => {
    if (!imageFile || !selectedCourt || !user) return
    setIsUploadingImage(true)
    try {
      const { url } = await uploadCourtImage(imageFile)
      if (isAdmin) {
        await database.courts.updateCourt(selectedCourt.id, { image_url: url })
        toast({ title: 'Image uploaded', description: 'The photo has been added to this place.' })
        queryClient.invalidateQueries({ queryKey: ['places'] })
      } else {
        await database.community.submitPlaceImageEdit(selectedCourt.id, url, user.id)
        toast({ title: 'Photo submitted for review', description: 'Your photo will be visible once an admin approves it.' })
      }
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
        className="h-auto max-w-2xl mx-auto"
      >
        {selectedCourt && (
          <>
            <DrawerHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1 text-left">
                  <DrawerTitle className="text-xl text-left">
                    {selectedCourt.name}
                  </DrawerTitle>
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

            </DrawerHeader>

            <div className="space-y-4 p-4">

            {(() => {
              const quickAddress = [selectedCourt.street, selectedCourt.district || selectedCourt.city]
                .filter(Boolean)
                .join(', ')
              return quickAddress && (
                <p className="text-base text-muted-foreground">{quickAddress}</p>
              )
            })()}
            {selectedCourt.description && (
              <p className="text-sm text-muted-foreground">{selectedCourt.description}</p>
            )}
            {userLocation && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {getDistanceText(userLocation, { lat: selectedCourt.latitude, lng: selectedCourt.longitude })}
              </p>
            )}

            {/* Sports pills */}
            {(() => {
              const sportsWithCounts = (selectedCourt.courts?.length ?? 0) > 0
                ? selectedCourt.courts!.reduce((acc, c) => {
                    acc[c.sport] = (acc[c.sport] || 0) + (c.quantity || 1)
                    return acc
                  }, {} as Record<string, number>)
                : (selectedCourt.sports?.reduce((acc, sport) => ({ ...acc, [sport]: 1 }), {} as Record<string, number>) || {})

              return Object.keys(sportsWithCounts).length > 0 && (
                <div className="flex gap-2 overflow-x-auto -mx-4 px-4">
                  {Object.entries(sportsWithCounts).map(([sport, count]) => (
                    <div
                      key={sport}
                      className="flex-shrink-0 flex items-center gap-1.5 border border-border rounded-full px-3 py-1.5"
                    >
                      <span className="text-[16px] leading-none">{sportIcons[sport] || '📍'}</span>
                      <span className="text-[14px] font-medium text-muted-foreground">{sportNames[sport] || sport}</span>
                    </div>
                  ))}
                </div>
              )
            })()}

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
              {showFavorite && (
                <Button
                  variant="secondary"
                  className="flex-1 text-base"
                  onClick={() => {
                    if (!user) {
                      window.location.href = '/auth/signin'
                      return
                    }
                    favoriteMutation.mutate()
                  }}
                  disabled={favoriteMutation.isPending}
                >
                  {favoriteMutation.isPending
                    ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    : <Heart className={`h-4 w-4 mr-1 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />}
                  {isFavorited ? 'Saved' : 'Save'}
                </Button>
              )}
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
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(`upload-${selectedCourt.id}`)?.click()}>
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
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}
