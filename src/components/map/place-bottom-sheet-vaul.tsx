'use client'

import { useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import LoginPromptBottomSheet from './login-prompt-bottom-sheet-vaul'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, Navigation, Share2, Heart, Pencil, X, Upload, Image, Loader2, Maximize2 } from 'lucide-react'
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
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false)
  const [isSaveLoginPromptOpen, setIsSaveLoginPromptOpen] = useState(false)

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
      toast({ title: isFavorited ? 'Aus gespeicherten Orten entfernt' : 'Gespeichert!' })
    },
    onError: () => {
      toast({ title: 'Etwas ist schiefgelaufen', variant: 'destructive' })
    },
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Datei zu groß', description: 'Bitte ein Bild kleiner als 10MB auswählen.', variant: 'destructive' })
      return
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Ungültiger Dateityp', description: 'Bitte eine Bilddatei auswählen (JPG, PNG, WebP).', variant: 'destructive' })
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
        toast({ title: 'Bild hochgeladen', description: 'Das Foto wurde diesem Ort hinzugefügt.' })
        queryClient.invalidateQueries({ queryKey: ['places'] })
      } else {
        await database.community.submitPlaceImageEdit(selectedCourt.id, url, user.id)
        toast({ title: 'Foto zur Überprüfung eingereicht', description: 'Dein Foto wird sichtbar, sobald ein Admin es genehmigt.' })
      }
      setImageFile(null)
      setImagePreview(null)
    } catch (error) {
      toast({ title: 'Upload fehlgeschlagen', description: error instanceof Error ? error.message : 'Unbekannter Fehler', variant: 'destructive' })
    } finally {
      setIsUploadingImage(false)
    }
  }

  return (
    <>
    <LoginPromptBottomSheet isOpen={isLoginPromptOpen} onOpenChange={setIsLoginPromptOpen} />
    <LoginPromptBottomSheet
      isOpen={isSaveLoginPromptOpen}
      onOpenChange={setIsSaveLoginPromptOpen}
      title="Ort speichern"
      description="Melde dich an, um Orte als Favoriten zu speichern."
      icon={Heart}
    />
    <Drawer open={isOpen} onOpenChange={onOpenChange} modal={false} shouldScaleBackground={false}>
      <DrawerContent
        hideOverlay
        className="max-h-[92dvh] max-w-2xl mx-auto"
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
                        setIsLoginPromptOpen(true)
                      } else {
                        window.location.href = `/places/${selectedCourt.id}/edit`
                      }
                    }}
                    title={user && profile?.user_role === 'admin' ? 'Ort bearbeiten' : user ? 'Bearbeitung vorschlagen' : 'Anmelden zum Bearbeiten'}
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
                    title="Teilen"
                  >
                    <Share2 className="h-[18px] w-[18px]" />
                  </Button>

                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full"
                    onClick={() => onOpenChange(false)}
                    title="Schließen"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

            </DrawerHeader>

            {/* Fullscreen image overlay */}
            {isFullscreenOpen && selectedCourt.image_url && (
              <div
                className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
                onClick={() => setIsFullscreenOpen(false)}
              >
                <img
                  src={selectedCourt.image_url}
                  alt={selectedCourt.name}
                  className="max-w-full max-h-full object-contain"
                />
                <button
                  className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2"
                  onClick={() => setIsFullscreenOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            <div className="space-y-4 p-4 overflow-y-auto">

              {/* Address + distance */}
              <div className="flex flex-col gap-1">
                {(() => {
                  const quickAddress = [selectedCourt.street, selectedCourt.district || selectedCourt.city]
                    .filter(Boolean)
                    .join(', ')
                  return quickAddress && (
                    <p className="text-base text-muted-foreground">{quickAddress}</p>
                  )
                })()}
                {userLocation && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {getDistanceText(userLocation, { lat: selectedCourt.latitude, lng: selectedCourt.longitude })}
                  </p>
                )}
              </div>

              {/* Thumbnail + sports pills */}
              <div className="flex gap-3 items-start">
                {/* 72×72 thumbnail */}
                {selectedCourt.image_url ? (
                  <button
                    className="relative shrink-0 w-[88px] h-[88px] rounded-[10px] overflow-hidden block"
                    onClick={() => setIsFullscreenOpen(true)}
                  >
                    <img
                      src={selectedCourt.image_url}
                      alt={selectedCourt.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1 right-1 bg-black/40 rounded p-0.5">
                      <Maximize2 className="h-3 w-3 text-white" />
                    </span>
                  </button>
                ) : (
                  <div
                    className="shrink-0 w-[88px] h-[88px] rounded-[10px] border-2 border-dashed border-muted-foreground/30 flex items-center justify-center"
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.03) 4px, rgba(0,0,0,0.03) 5px), repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.03) 4px, rgba(0,0,0,0.03) 5px)' }}
                  >
                    <Image className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                )}

                {/* Sports pills stacked */}
                {(() => {
                  const sportsWithCounts = (selectedCourt.courts?.length ?? 0) > 0
                    ? selectedCourt.courts!.reduce((acc, c) => {
                        acc[c.sport] = (acc[c.sport] || 0) + (c.quantity || 1)
                        return acc
                      }, {} as Record<string, number>)
                    : (selectedCourt.sports?.reduce((acc, sport) => ({ ...acc, [sport]: 1 }), {} as Record<string, number>) || {})

                  return Object.keys(sportsWithCounts).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(sportsWithCounts).map(([sport, count]) => (
                        <div
                          key={sport}
                          className="flex items-center gap-1 border border-border rounded-full px-3 py-1.5 self-start"
                        >
                          <span className="text-[16px] leading-none">{sportIcons[sport] || '📍'}</span>
                          <span className="text-[14px] font-medium text-muted-foreground">{sportNames[sport] || sport}</span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {selectedCourt.description && (
                <p className="text-sm text-muted-foreground">{selectedCourt.description}</p>
              )}

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
                  Route
                </Button>
                {showFavorite && (
                  <Button
                    variant="secondary"
                    className="flex-1 text-base"
                    onClick={() => {
                      if (!user) {
                        setIsSaveLoginPromptOpen(true)
                        return
                      }
                      favoriteMutation.mutate()
                    }}
                    disabled={favoriteMutation.isPending}
                  >
                    {favoriteMutation.isPending
                      ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      : <Heart className={`h-4 w-4 mr-1 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />}
                    {isFavorited ? 'Gespeichert' : 'Speichern'}
                  </Button>
                )}
              </div>

            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
    </>
  )
}
