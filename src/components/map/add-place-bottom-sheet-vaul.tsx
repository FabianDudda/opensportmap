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
import { sportIcons } from '@/lib/utils/sport-utils'
import { useToast } from '@/hooks/use-toast'
import { SportType, PlaceWithCourts } from '@/lib/supabase/types'
import { database } from '@/lib/supabase/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reverseGeocode, AddressComponents } from '@/lib/geocoding'
import { uploadCourtImage, UploadProgress } from '@/lib/supabase/storage'
import { auth } from '@/lib/supabase/auth'
import {
  MapPin, Plus, Check, Upload, X, Image, Loader2,
  RefreshCcw, Mail, Lock, LogIn
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

  const [name, setName] = useState('')
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
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)

  const resetForm = () => {
    setName('')
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
    if (!user) return
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

    createCourtMutation.mutate({
      name: name.trim(),
      latitude: location.lat,
      longitude: location.lng,
      sports: selectedSports,
      image_url: imageUrl,
      added_by_user: user.id,
      courts,
      address: Object.values(address).some(v => v) ? address : undefined,
    })
  }

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true)
    try {
      const { error } = await auth.signInWithGoogle()
      if (error) toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' })
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSigningIn(true)
    try {
      const { data, error } = await auth.signIn(signInEmail, signInPassword)
      if (error) toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' })
      else if (data.user) toast({ title: 'Welcome back!' })
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[98dvh] max-w-2xl mx-auto">
        <DrawerHeader className="pb-0">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-xl">Add a Place</DrawerTitle>
            <Button variant="secondary" size="icon" onClick={() => onOpenChange(false)} title="Close" className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-4">
          {!user ? (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground text-center">Sign in to add courts and help others discover places.</p>

              <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSigningIn}>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="ap-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="ap-email" type="email" placeholder="Enter your email" value={signInEmail} onChange={e => setSignInEmail(e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ap-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="ap-password" type="password" placeholder="Enter your password" value={signInPassword} onChange={e => setSignInPassword(e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isSigningIn}>
                  {isSigningIn ? 'Signing in...' : <><LogIn className="h-4 w-4 mr-2" />Sign In</>}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                No account?{' '}
                <Link href="/auth/signup" className="text-primary hover:underline" onClick={() => onOpenChange(false)}>Sign up</Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 py-2">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="ap-name">Place Name *</Label>
                <Input id="ap-name" placeholder="e.g., Central Park Tennis Courts" value={name} onChange={e => setName(e.target.value)} required />
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
              <Button type="submit" className="w-full" disabled={createCourtMutation.isPending || isUploadingImage}>
                {isUploadingImage ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading... {uploadProgress && `${uploadProgress.percentage.toFixed(0)}%`}</>
                ) : createCourtMutation.isPending ? (
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
