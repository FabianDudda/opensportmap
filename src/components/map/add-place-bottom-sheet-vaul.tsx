'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { sportIcons, PlaceType, placeTypeLabels, placeTypeIcons } from '@/lib/utils/sport-utils'
import { useToast } from '@/hooks/use-toast'
import { SportType, PlaceWithCourts } from '@/lib/supabase/types'
import { database } from '@/lib/supabase/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reverseGeocode, AddressComponents } from '@/lib/geocoding'
import { uploadCourtImage, UploadProgress } from '@/lib/supabase/storage'
import {
  MapPin, Plus, Check, Upload, X, Image, Loader2,
  RefreshCcw
} from 'lucide-react'

const LeafletCourtMap = dynamic(() => import('@/components/map/leaflet-court-map'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
})

const SPORTS = [
  { id: 'fußball', label: 'Fußball' },
  { id: 'basketball', label: 'Basketball' },
  { id: 'tischtennis', label: 'Tischtennis' },
  { id: 'tennis', label: 'Tennis' },
  { id: 'volleyball', label: 'Volleyball' },
  { id: 'beachvolleyball', label: 'Beachvolleyball' },
  { id: 'skatepark', label: 'Skatepark' },
  { id: 'calisthenics', label: 'Calisthenics' },
  { id: 'boule', label: 'Boule' },
  { id: 'laufen', label: 'Laufen' },
  { id: 'schwimmen', label: 'Schwimmen' },
] as const

const SURFACE_TYPES = [
  'Unbekannt', 'Rasen', 'Kunstrasen', 'Hartplatz', 'Asphalt',
  'Kunststoffbelag', 'Asche', 'Sand', 'Sonstiges',
] as const

interface CourtDetails {
  sport: SportType
  quantity: number
  surface: string
  notes: string
}

interface AddPlaceBottomSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  user: { id: string } | null
}

export default function AddPlaceBottomSheetVaul({ isOpen, onOpenChange, user }: AddPlaceBottomSheetProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: places = [] } = useQuery({
    queryKey: ['places'],
    queryFn: () => database.courts.getAllCourts(),
  })

  const [isGuestMode, setIsGuestMode] = useState(false)
  const [name, setName] = useState('')
  const [placeType, setPlaceType] = useState<PlaceType>('öffentlich')
  const [selectedSports, setSelectedSports] = useState<SportType[]>([])
  const [courtSurfaces, setCourtSurfaces] = useState<Partial<Record<SportType, string[]>>>({})
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState<AddressComponents>({})
  const [isDetectingAddress, setIsDetectingAddress] = useState(false)
  const [addressAutoDetected, setAddressAutoDetected] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)

  const resetForm = () => {
    setIsGuestMode(false)
    setName('')
    setPlaceType('öffentlich')
    setSelectedSports([])
    setCourtSurfaces({})
    setLocation(null)
    setAddress({})
    setAddressAutoDetected(false)
    setImageFile(null)
    setImagePreview(null)
    setUploadProgress(null)
  }

  const createCourtMutation = useMutation({
    mutationFn: async (placeData: {
      name: string
      place_type: PlaceType
      latitude: number
      longitude: number
      sports: SportType[]
      description?: string
      image_url?: string
      added_by_user: string
      courts: CourtDetails[]
      address?: AddressComponents
    }) => {
      const { data: place, error: placeError } = await database.courts.addCourt({
        name: placeData.name,
        place_type: placeData.place_type,
        latitude: placeData.latitude,
        longitude: placeData.longitude,
        sports: placeData.sports,
        description: placeData.description || null,
        image_url: placeData.image_url || null,
        added_by_user: placeData.added_by_user,
        source: 'user_submitted',
        source_id: null,
        features: null,
        import_date: new Date().toISOString(),
        street: placeData.address?.street || null,
        house_number: placeData.address?.house_number || null,
        city: placeData.address?.city || null,
        county: placeData.address?.county || null,
        state: placeData.address?.state || null,
        country: placeData.address?.country || null,
        postcode: placeData.address?.postcode || null,
        district: placeData.address?.district || null,
      })
      if (placeError || !place) throw new Error(placeError?.message || 'Failed to create place')

      if (placeData.courts.length > 0) {
        await Promise.all(placeData.courts.map(court =>
          database.courtDetails.addCourt({
            place_id: place.id,
            sport: court.sport,
            quantity: court.quantity,
            surface: court.surface || null,
            notes: court.notes || null,
          })
        ))
      }
      return place
    },
    onSuccess: () => {
      toast({ title: 'Court submitted!', description: 'It will appear on the map once approved.' })
      queryClient.invalidateQueries({ queryKey: ['courts'] })
      resetForm()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({ title: 'Error adding court', description: error.message, variant: 'destructive' })
    },
  })

  const guestCreateCourtMutation = useMutation({
    mutationFn: async (payload: Parameters<typeof createCourtMutation.mutate>[0]) => {
      const courts: CourtDetails[] = payload.courts
      const res = await fetch('/api/guest/submit-place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          place_type: payload.place_type,
          latitude: payload.latitude,
          longitude: payload.longitude,
          sports: payload.sports,
          image_url: payload.image_url,
          address: payload.address,
          courts,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Fehler beim Einreichen')
      return json.data
    },
    onSuccess: () => {
      toast({ title: 'Ort eingereicht!', description: 'Er erscheint auf der Karte, sobald er genehmigt wurde.' })
      queryClient.invalidateQueries({ queryKey: ['courts'] })
      resetForm()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({ title: 'Fehler beim Hinzufügen', description: error.message, variant: 'destructive' })
    },
  })

  const handleMapClick = useCallback(async (lng: number, lat: number) => {
    setLocation({ lat, lng })
    setIsDetectingAddress(true)
    setAddressAutoDetected(false)
    try {
      const addressComponents = await reverseGeocode(lat, lng)
      if (addressComponents) {
        setAddress(addressComponents)
        setAddressAutoDetected(true)
      } else {
        setAddress({})
      }
    } catch {
      setAddress({})
    } finally {
      setIsDetectingAddress(false)
    }
  }, [])

  const handleSportToggle = (sport: SportType) => {
    setSelectedSports(prev => {
      if (prev.includes(sport)) {
        setCourtSurfaces(cur => { const u = { ...cur }; delete u[sport]; return u })
        return prev.filter(s => s !== sport)
      } else {
        setCourtSurfaces(cur => ({ ...cur, [sport]: [''] }))
        return [...prev, sport]
      }
    })
  }

  const addCourtForSport = (sport: SportType) =>
    setCourtSurfaces(prev => ({ ...prev, [sport]: [...(prev[sport] || []), ''] }))

  const updateCourtSurface = (sport: SportType, idx: number, surface: string) =>
    setCourtSurfaces(prev => {
      const surfaces = [...(prev[sport] || [])]
      surfaces[idx] = surface
      return { ...prev, [sport]: surfaces }
    })

  const removeCourtForSport = (sport: SportType, idx: number) =>
    setCourtSurfaces(prev => ({ ...prev, [sport]: (prev[sport] || []).filter((_, i) => i !== idx) }))

  const updateAddressField = (field: keyof AddressComponents, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value.trim() || undefined }))
    if (addressAutoDetected && value.trim()) setAddressAutoDetected(false)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 10MB.', variant: 'destructive' }); return
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Select an image file.', variant: 'destructive' }); return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user && !isGuestMode) return
    if (!name.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return }
    if (selectedSports.length === 0) { toast({ title: 'Select at least one sport', variant: 'destructive' }); return }
    if (!location) { toast({ title: 'Location required', description: 'Tap the map to set a location.', variant: 'destructive' }); return }

    let imageUrl: string | undefined
    if (imageFile) {
      try {
        setIsUploadingImage(true)
        setUploadProgress({ loaded: 0, total: 100, percentage: 0 })
        const result = await uploadCourtImage(imageFile, p => setUploadProgress(p))
        imageUrl = result.url
      } catch (err) {
        toast({ title: 'Image upload failed', description: err instanceof Error ? err.message : '', variant: 'destructive' })
      } finally {
        setIsUploadingImage(false)
        setUploadProgress(null)
      }
    }

    const courts: CourtDetails[] = selectedSports.flatMap(sport => {
      const surfaces = (courtSurfaces[sport] || ['']).map(s => s || 'Unbekannt')
      const counts = surfaces.reduce<Record<string, number>>((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc }, {})
      return Object.entries(counts).map(([surface, quantity]) => ({ sport, quantity, surface, notes: '' }))
    })

    const payload = {
      name: name.trim(),
      place_type: placeType,
      latitude: location.lat,
      longitude: location.lng,
      sports: selectedSports,
      image_url: imageUrl,
      added_by_user: user?.id ?? '',
      courts,
      address: Object.values(address).some(v => v) ? address : undefined,
    }

    if (isGuestMode) {
      guestCreateCourtMutation.mutate(payload)
    } else {
      createCourtMutation.mutate(payload)
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[98dvh] max-w-2xl mx-auto">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-xl">Add a Place</DrawerTitle>
            <Button variant="secondary" size="icon" onClick={() => onOpenChange(false)} title="Close" className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-4">
          {!user && !isGuestMode ? (
            <div className="text-center space-y-4 py-4">
              <Plus className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">Melde dich an, um Orte hinzuzufügen.</p>
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <Button asChild className="w-full">
                  <Link href="/auth/signin" onClick={() => onOpenChange(false)}>Anmelden</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/signup" onClick={() => onOpenChange(false)}>Registrieren</Link>
                </Button>
                <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setIsGuestMode(true)}>
                  Weiter als Gast
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 py-2">
              {/* Honeypot – hidden from real users, catches bots */}
              <input type="text" name="website" tabIndex={-1} aria-hidden="true" className="hidden" />
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="ap-name">Place Name *</Label>
                <Input id="ap-name" placeholder="e.g., Central Park Tennis Courts" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              {/* Place Type */}
              <div className="space-y-2">
                <Label>Art des Ortes *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['öffentlich', 'verein', 'schule'] as PlaceType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPlaceType(type)}
                      className={cn(
                        'flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all cursor-pointer',
                        placeType === type
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      )}
                    >
                      <span className="text-[20px] leading-none">{placeTypeIcons[type]}</span>
                      <span className="text-sm font-medium">{placeTypeLabels[type]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sports */}
              <div className="space-y-2">
                <Label>Sports Available *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {SPORTS.map(sport => {
                    const isSelected = selectedSports.includes(sport.id as SportType)
                    return (
                      <button
                        key={sport.id}
                        type="button"
                        onClick={() => handleSportToggle(sport.id as SportType)}
                        className={cn(
                          'flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all cursor-pointer',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        )}
                      >
                        <span className="text-[20px] leading-none">{sportIcons[sport.id as SportType] || '📍'}</span>
                        <span className="text-sm font-medium">{sport.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Court Details */}
              {selectedSports.length > 0 && (
                <div className="space-y-3">
                  <Label>Court Details</Label>
                  {selectedSports.map(sport => {
                    const surfaces = courtSurfaces[sport] || ['Unbekannt']
                    return (
                      <div key={sport} className="border rounded-lg p-4 space-y-3">
                        <h4 className="font-medium">{sport.charAt(0).toUpperCase() + sport.slice(1)}</h4>
                        <div className="space-y-2">
                          {surfaces.map((surface, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground min-w-[4.5rem]">Court {idx + 1}</span>
                              <Select value={surface} onValueChange={val => updateCourtSurface(sport, idx, val)}>
                                <SelectTrigger className="flex-1"><SelectValue placeholder="Surface type..." /></SelectTrigger>
                                <SelectContent>
                                  {SURFACE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <Button type="button" variant="ghost" size="icon" onClick={() => surfaces.length === 1 ? handleSportToggle(sport) : removeCourtForSport(sport, idx)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => addCourtForSport(sport)}>
                          <Plus className="h-4 w-4 mr-1" />Add another court
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Image */}
              <div className="space-y-2">
                <Label>Court Image (Optional)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                  {imagePreview ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <img src={imagePreview} alt="Court preview" className="w-full h-40 object-cover rounded-lg" />
                        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => { setImageFile(null); setImagePreview(null) }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">{imageFile?.name}</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <Image className="h-10 w-10 mx-auto text-muted-foreground" />
                      <Button type="button" size="sm" onClick={() => document.getElementById('ap-image-upload')?.click()}>
                        <Upload className="h-4 w-4 mr-1" />Upload Image
                      </Button>
                      <Input id="ap-image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      <p className="text-xs text-muted-foreground">JPG, PNG, WebP up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label>Location *</Label>
                <p className="text-xs text-muted-foreground">Tap the map to set the exact location.</p>
                <div className="border rounded-lg overflow-hidden">
                  <LeafletCourtMap
                    courts={places as PlaceWithCourts[]}
                    onMapClick={handleMapClick}
                    height="260px"
                    allowAddCourt={true}
                    selectedLocation={location}
                    placesCount={places.length}
                    showFilter={false}
                  />
                </div>
                {location ? (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg border border-green-200">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span><span className="font-medium">Location set:</span> {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="font-medium">Tap the map to set location</span>
                  </div>
                )}
              </div>

              {/* Address */}
              {location && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Address</Label>
                    {Object.values(address).some(v => v) && (
                      <Button type="button" variant="outline" size="sm" onClick={() => { setAddress({}); setAddressAutoDetected(false) }}>
                        <RefreshCcw className="h-3 w-3 mr-1" />Clear
                      </Button>
                    )}
                  </div>
                  {isDetectingAddress && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-200">
                      <Loader2 className="h-4 w-4 animate-spin" /><span>Detecting address...</span>
                    </div>
                  )}
                  {addressAutoDetected && !isDetectingAddress && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg border border-green-200">
                      <Check className="h-4 w-4" /><span>Address auto-detected.</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <Label htmlFor="ap-street" className="text-xs">Street</Label>
                      <Input id="ap-street" placeholder="Street & number" value={address.street && address.house_number ? `${address.street} ${address.house_number}` : address.street || ''}
                        onChange={e => {
                          const parts = e.target.value.trim().split(' ')
                          const num = parts[parts.length - 1]
                          if (parts.length > 1 && /^\d+[a-zA-Z]?$/.test(num)) {
                            updateAddressField('street', parts.slice(0, -1).join(' '))
                            updateAddressField('house_number', num)
                          } else {
                            updateAddressField('street', e.target.value)
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ap-city" className="text-xs">City</Label>
                      <Input id="ap-city" placeholder="City" value={address.city || ''} onChange={e => updateAddressField('city', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ap-postcode" className="text-xs">Postal Code</Label>
                      <Input id="ap-postcode" placeholder="Postcode" value={address.postcode || ''} onChange={e => updateAddressField('postcode', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ap-state" className="text-xs">State</Label>
                      <Input id="ap-state" placeholder="State" value={address.state || ''} onChange={e => updateAddressField('state', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ap-country" className="text-xs">Country</Label>
                      <Input id="ap-country" placeholder="Country" value={address.country || ''} onChange={e => updateAddressField('country', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={createCourtMutation.isPending || guestCreateCourtMutation.isPending || isUploadingImage}>
                {isUploadingImage ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading... {uploadProgress && `${uploadProgress.percentage.toFixed(0)}%`}</>
                ) : (createCourtMutation.isPending || guestCreateCourtMutation.isPending) ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Adding...</>
                ) : 'Add Place'}
              </Button>

              {isUploadingImage && uploadProgress && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress.percentage}%` }} />
                </div>
              )}
            </form>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
