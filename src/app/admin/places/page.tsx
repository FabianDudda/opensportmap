'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/components/providers/auth-provider'
import { database } from '@/lib/supabase/database'
import { PlaceWithCourts, ModerationStatus, PendingPlaceChange } from '@/lib/supabase/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MapPin, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye,
  MoreVertical,
  Calendar,
  Edit
} from 'lucide-react'
import { getSportBadgeClasses, sportNames, sportIcons } from '@/lib/utils/sport-utils'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

function ModerationStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['moderation-stats'],
    queryFn: database.moderation.getModerationStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  if (isLoading) return <div>Loading stats...</div>

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <AlertCircle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.pending || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Community Edits</CardTitle>
          <Edit className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.community_edits || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approved</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.approved || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
          <MapPin className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.total || 0}</div>
        </CardContent>
      </Card>
    </div>
  )
}

function PlaceCard({ 
  place, 
  onApprove, 
  onReject, 
  showStatus = true,
  isSelectable = false,
  isSelected = false,
  onToggleSelection
}: {
  place: PlaceWithCourts
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
  showStatus?: boolean
  isSelectable?: boolean
  isSelected?: boolean
  onToggleSelection?: () => void
}) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)

  // Get unique sports from the courts array, fallback to legacy sports array
  const availableSports = place.courts?.length > 0 
    ? [...new Set(place.courts.map(court => court.sport))]
    : (place.sports || [])

  // Build address string
  const addressParts = [
    place.street && place.house_number ? `${place.street} ${place.house_number}` : place.street,
    place.city,
    place.district,
    place.state,
    place.country
  ].filter(Boolean)
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : null

  const handleReject = () => {
    if (!rejectionReason.trim()) return
    onReject(place.id, rejectionReason)
    setRejectionReason('')
    setIsRejectDialogOpen(false)
  }

  const getStatusIcon = (status: ModerationStatus) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusColor = (status: ModerationStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {isSelectable && (
              <div className="pt-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={onToggleSelection}
                  className="rounded"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{place.name}</CardTitle>
              {showStatus && (
                <Badge className={`text-xs ${getStatusColor(place.moderation_status)}`}>
                  {getStatusIcon(place.moderation_status)}
                  <span className="ml-1 capitalize">{place.moderation_status}</span>
                </Badge>
              )}
            </div>
            
            {fullAddress && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                {fullAddress}
              </div>
            )}
            
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {place.profiles.name}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(place.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/places/${place.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Image */}
        {place.image_url && (
          <img
            src={place.image_url}
            alt={place.name}
            className="w-full h-40 object-cover rounded-lg"
          />
        )}

        {/* Description */}
        {place.description && (
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Description</Label>
            <p className="text-sm mt-1">{place.description}</p>
          </div>
        )}

        {/* Address */}
        {(place.street || place.city || place.postcode || place.country) && (
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Address</Label>
            <div className="mt-1 text-sm space-y-0.5">
              {(place.street || place.house_number) && (
                <div>{[place.street, place.house_number].filter(Boolean).join(' ')}</div>
              )}
              {(place.postcode || place.city) && (
                <div>{[place.postcode, place.city].filter(Boolean).join(' ')}</div>
              )}
              {place.district && <div className="text-muted-foreground">{place.district}</div>}
              {place.county && <div className="text-muted-foreground">{place.county}</div>}
              {place.state && <div className="text-muted-foreground">{place.state}</div>}
              {place.country && <div className="text-muted-foreground">{place.country}</div>}
            </div>
          </div>
        )}

        {/* Location */}
        {(place.latitude != null && place.longitude != null) && (
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Coordinates</Label>
            <p className="text-xs font-mono mt-1 text-muted-foreground">
              {Number(place.latitude).toFixed(6)}, {Number(place.longitude).toFixed(6)}
            </p>
          </div>
        )}

        {/* Sports */}
        <div>
          <Label className="text-xs font-medium text-muted-foreground">Sports</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {availableSports.length > 0 ? (
              availableSports.map((sport) => (
                <Badge key={sport} className={`text-xs ${getSportBadgeClasses(sport)}`}>
                  {sportIcons[sport] || '📍'} {sportNames[sport] || sport}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No sports specified</span>
            )}
          </div>
        </div>

        {/* Courts */}
        {place.courts && place.courts.length > 0 && (
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Courts</Label>
            <div className="space-y-2 mt-1">
              {place.courts.map((court) => (
                <div key={court.id} className="text-xs bg-muted p-2 rounded">
                  <div className="flex justify-between">
                    <span className="font-medium">{sportNames[court.sport] || court.sport}</span>
                    <span>Qty: {court.quantity}</span>
                  </div>
                  {court.surface && <div className="text-muted-foreground">Surface: {court.surface}</div>}
                  {court.notes && <div className="text-muted-foreground">Notes: {court.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Rejection reason for rejected items */}
        {place.moderation_status === 'rejected' && place.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <Label className="text-xs font-medium text-red-700">Rejection Reason:</Label>
            <p className="text-sm text-red-600 mt-1">{place.rejection_reason}</p>
          </div>
        )}
        
        {/* Moderated info */}
        {place.moderated_at && (
          <div className="text-xs text-muted-foreground">
            Moderated on {new Date(place.moderated_at).toLocaleString()}
          </div>
        )}
        
        {/* Actions for pending items */}
        {place.moderation_status === 'pending' && (
          <div className="flex gap-2 pt-2">
            <Button 
              
              onClick={() => onApprove(place.id)}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex-1">
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Place</DialogTitle>
                  <DialogDescription>
                    Please provide a reason for rejecting "{place.name}". This will be shown to the user.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">Rejection Reason</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Enter reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleReject}
                    disabled={!rejectionReason.trim()}
                  >
                    Reject Place
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PlacesList({ status }: { status: ModerationStatus }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Bulk selection state
  const [selectedPlaces, setSelectedPlaces] = useState<Set<string>>(new Set())
  const [isBulkMode, setIsBulkMode] = useState(false)
  
  const { data: places, isLoading } = useQuery({
    queryKey: ['places', status],
    queryFn: () => database.moderation.getPlacesByStatus(status),
    refetchInterval: status === 'pending' ? 10000 : undefined, // Refresh pending more often
  })

  const approveMutation = useMutation({
    mutationFn: (placeId: string) => database.moderation.approvePlace(placeId, user!.id),
    onSuccess: (data) => {
      console.log('✅ Place approval successful:', data)
      toast({
        title: 'Place approved',
        description: 'The place has been approved and is now visible on the map.',
      })
      // Invalidate all places queries (including those with status filters)
      console.log('🔄 Invalidating queries after place approval')
      queryClient.invalidateQueries({ queryKey: ['places'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['courts'] })
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] })
    },
    onError: (error) => {
      toast({
        title: 'Error approving place',
        description: error instanceof Error ? error.message : 'Failed to approve place',
        variant: 'destructive',
      })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ placeId, reason }: { placeId: string; reason: string }) => 
      database.moderation.rejectPlace(placeId, user!.id, reason),
    onSuccess: () => {
      toast({
        title: 'Place rejected',
        description: 'The place has been rejected and the user will be notified.',
      })
      queryClient.invalidateQueries({ queryKey: ['places'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] })
    },
    onError: (error) => {
      toast({
        title: 'Error rejecting place',
        description: error instanceof Error ? error.message : 'Failed to reject place',
        variant: 'destructive',
      })
    },
  })

  const bulkApproveMutation = useMutation({
    mutationFn: (placeIds: string[]) => database.moderation.bulkApprovePlace(placeIds, user!.id),
    onSuccess: (result) => {
      const { successCount, failureCount, failed } = result
      
      if (failureCount === 0) {
        toast({
          title: 'Bulk approval successful',
          description: `Successfully approved ${successCount} places.`,
        })
      } else {
        toast({
          title: 'Partial success',
          description: `Approved ${successCount} places, ${failureCount} failed. Check console for details.`,
          variant: failureCount > successCount ? 'destructive' : 'default',
        })
        failed.forEach(failure => {
          console.error('Failed to approve place:', failure)
        })
      }
      
      // Clear selection and invalidate queries
      setSelectedPlaces(new Set())
      queryClient.invalidateQueries({ queryKey: ['places'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['courts'] })
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] })
    },
    onError: (error) => {
      toast({
        title: 'Bulk approval failed',
        description: error instanceof Error ? error.message : 'Failed to approve places',
        variant: 'destructive',
      })
    },
  })

  // Bulk selection helpers
  const togglePlaceSelection = (placeId: string) => {
    const newSelection = new Set(selectedPlaces)
    if (newSelection.has(placeId)) {
      newSelection.delete(placeId)
    } else {
      newSelection.add(placeId)
    }
    setSelectedPlaces(newSelection)
  }

  const selectAllPlaces = () => {
    if (!places) return
    setSelectedPlaces(new Set(places.map(place => place.id)))
  }

  const clearSelection = () => {
    setSelectedPlaces(new Set())
  }

  const handleBulkApprove = () => {
    if (selectedPlaces.size === 0) return
    bulkApproveMutation.mutate(Array.from(selectedPlaces))
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading places...</div>
  }

  if (!places || places.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No {status} places found.
      </div>
    )
  }

  return (
    <div>
      {/* Bulk operations controls - only show for pending places */}
      {status === 'pending' && places.length > 0 && (
        <div className="mb-4 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Button
                variant={isBulkMode ? "default" : "outline"}
               
                onClick={() => {
                  setIsBulkMode(!isBulkMode)
                  setSelectedPlaces(new Set())
                }}
              >
                {isBulkMode ? 'Exit Bulk Mode' : 'Bulk Select'}
              </Button>
              
              {isBulkMode && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPlaces.size === places.length}
                      onChange={selectedPlaces.size === places.length ? clearSelection : selectAllPlaces}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">
                      Select All ({selectedPlaces.size}/{places.length})
                    </span>
                  </div>
                </>
              )}
            </div>
            
            {isBulkMode && selectedPlaces.size > 0 && (
              <div className="flex items-center gap-2">
                <Button
                 
                  onClick={handleBulkApprove}
                  disabled={bulkApproveMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Selected ({selectedPlaces.size})
                </Button>
                <Button
                 
                  variant="outline"
                  onClick={clearSelection}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
          
          {bulkApproveMutation.isPending && (
            <div className="text-sm text-muted-foreground">
              Approving {selectedPlaces.size} places...
            </div>
          )}
        </div>
      )}
      
      {places.map((place) => (
        <PlaceCard
          key={place.id}
          place={place}
          onApprove={(id) => {
            console.log('🎯 Approving place from PlacesList:', id)
            approveMutation.mutate(id)
          }}
          onReject={(id, reason) => rejectMutation.mutate({ placeId: id, reason })}
          showStatus={false} // Don't show status badge in filtered views
          isSelectable={isBulkMode}
          isSelected={selectedPlaces.has(place.id)}
          onToggleSelection={() => togglePlaceSelection(place.id)}
        />
      ))}
    </div>
  )
}

function CommunityEditsTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: pendingEdits, isLoading } = useQuery({
    queryKey: ['community-edits'],
    queryFn: database.community.getPendingPlaceChanges,
    refetchInterval: 10000, // Refresh every 10 seconds
  })

  const approveMutation = useMutation({
    mutationFn: (editId: string) => database.community.approvePlaceEdit(editId, user!.id),
    onSuccess: () => {
      toast({
        title: 'Community edit approved',
        description: 'The suggested changes have been applied to the place.',
      })
      queryClient.invalidateQueries({ queryKey: ['community-edits'] })
      queryClient.invalidateQueries({ queryKey: ['places'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['courts'] })
    },
    onError: (error) => {
      toast({
        title: 'Error approving edit',
        description: error instanceof Error ? error.message : 'Failed to approve edit',
        variant: 'destructive',
      })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ editId, reason }: { editId: string; reason: string }) => 
      database.community.rejectPlaceEdit(editId, user!.id, reason),
    onSuccess: () => {
      toast({
        title: 'Community edit rejected',
        description: 'The contributor will be notified of the rejection.',
      })
      queryClient.invalidateQueries({ queryKey: ['community-edits'] })
    },
    onError: (error) => {
      toast({
        title: 'Error rejecting edit',
        description: error instanceof Error ? error.message : 'Failed to reject edit',
        variant: 'destructive',
      })
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading community edits...</div>
  }

  if (!pendingEdits || pendingEdits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            Community Edits
          </CardTitle>
          <CardDescription>
            Community-suggested changes to existing places
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No pending community edits found.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5 text-blue-600" />
          Community Edits ({pendingEdits.length})
        </CardTitle>
        <CardDescription>
          Review and approve community-suggested changes to places
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingEdits.map((edit: any) => (
            <CommunityEditCard
              key={edit.id}
              edit={edit}
              onApprove={(id) => approveMutation.mutate(id)}
              onReject={(id, reason) => rejectMutation.mutate({ editId: id, reason })}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function CommunityEditCard({ edit, onApprove, onReject }: {
  edit: any
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
}) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [showDiff, setShowDiff] = useState(false)

  const handleReject = () => {
    if (!rejectionReason.trim()) return
    onReject(edit.id, rejectionReason)
    setRejectionReason('')
    setIsRejectDialogOpen(false)
  }

  const proposedData = edit.proposed_data as any
  const currentData = edit.current_data as any

  const addressFields: { key: string; label: string }[] = [
    { key: 'street', label: 'Street' },
    { key: 'house_number', label: 'House No.' },
    { key: 'city', label: 'City' },
    { key: 'district', label: 'District' },
    { key: 'county', label: 'County' },
    { key: 'state', label: 'State' },
    { key: 'postcode', label: 'Postcode' },
    { key: 'country', label: 'Country' },
  ]
  const changedAddressFields = addressFields.filter(
    ({ key }) => proposedData?.place?.[key] !== currentData?.place?.[key]
  )
  const proposedSports: string[] = proposedData?.place?.sports || []
  const currentSports: string[] = currentData?.place?.sports || []
  const sportsChanged = JSON.stringify([...proposedSports].sort()) !== JSON.stringify([...currentSports].sort())
  const currentCourts: any[] = currentData?.courts || currentData?.place?.courts || []
  const proposedCourts: any[] = proposedData?.courts || []
  const locationChanged =
    proposedData?.place?.latitude !== currentData?.place?.latitude ||
    proposedData?.place?.longitude !== currentData?.place?.longitude

  return (
    <Card className="border-l-4 border-l-blue-400">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">
              Edit suggestion for "{edit.places?.name || 'Unknown Place'}"
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {edit.profiles?.name || 'Unknown User'}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(edit.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
           
            onClick={() => setShowDiff(!showDiff)}
          >
            {showDiff ? 'Hide Changes' : 'Show Changes'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showDiff && (
          <div className="border rounded-lg p-4 bg-muted/50 space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-muted-foreground">
              <span className="text-green-700">▲ Proposed</span>
              <span className="text-red-700">▼ Current</span>
            </div>

            {/* Name */}
            {proposedData?.place?.name !== currentData?.place?.name && (
              <div>
                <p className="text-xs font-medium mb-1">Name</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded">{proposedData?.place?.name || '—'}</div>
                  <div className="font-mono bg-red-100 text-red-800 px-2 py-1 rounded">{currentData?.place?.name || '—'}</div>
                </div>
              </div>
            )}

            {/* Description */}
            {proposedData?.place?.description !== currentData?.place?.description && (
              <div>
                <p className="text-xs font-medium mb-1">Description</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded whitespace-pre-wrap">{proposedData?.place?.description || '—'}</div>
                  <div className="font-mono bg-red-100 text-red-800 px-2 py-1 rounded whitespace-pre-wrap">{currentData?.place?.description || '—'}</div>
                </div>
              </div>
            )}

            {/* Image */}
            {proposedData?.place?.image_url !== currentData?.place?.image_url && (
              <div>
                <p className="text-xs font-medium mb-1">Image</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    {proposedData?.place?.image_url ? (
                      <img src={proposedData.place.image_url} alt="Proposed" className="w-full h-32 object-cover rounded border-2 border-green-400" />
                    ) : (
                      <div className="w-full h-32 bg-green-100 text-green-800 rounded flex items-center justify-center text-xs">No image</div>
                    )}
                  </div>
                  <div>
                    {currentData?.place?.image_url ? (
                      <img src={currentData.place.image_url} alt="Current" className="w-full h-32 object-cover rounded border-2 border-red-400" />
                    ) : (
                      <div className="w-full h-32 bg-red-100 text-red-800 rounded flex items-center justify-center text-xs">No image</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Location */}
            {locationChanged && (
              <div>
                <p className="text-xs font-medium mb-1">Location</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded">
                    {proposedData?.place?.latitude != null
                      ? `${Number(proposedData.place.latitude).toFixed(6)}, ${Number(proposedData.place.longitude).toFixed(6)}`
                      : '—'}
                  </div>
                  <div className="font-mono bg-red-100 text-red-800 px-2 py-1 rounded">
                    {currentData?.place?.latitude != null
                      ? `${Number(currentData.place.latitude).toFixed(6)}, ${Number(currentData.place.longitude).toFixed(6)}`
                      : '—'}
                  </div>
                </div>
              </div>
            )}

            {/* Address fields */}
            {changedAddressFields.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1">Address</p>
                <div className="space-y-1">
                  {changedAddressFields.map(({ key, label }) => (
                    <div key={key} className="grid grid-cols-2 gap-2 text-xs">
                      <div className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded">
                        <span className="font-medium">{label}: </span>{proposedData?.place?.[key] || '—'}
                      </div>
                      <div className="font-mono bg-red-100 text-red-800 px-2 py-1 rounded">
                        <span className="font-medium">{label}: </span>{currentData?.place?.[key] || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sports */}
            {sportsChanged && (
              <div>
                <p className="text-xs font-medium mb-1">Sports</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-wrap gap-1">
                    {proposedSports.length > 0 ? proposedSports.map((sport: string) => (
                      <Badge key={sport} className={`text-xs ${getSportBadgeClasses(sport)}`}>
                        {sportIcons[sport] || '📍'} {sportNames[sport] || sport}
                      </Badge>
                    )) : <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {currentSports.length > 0 ? currentSports.map((sport: string) => (
                      <Badge key={sport} className={`text-xs ${getSportBadgeClasses(sport)}`}>
                        {sportIcons[sport] || '📍'} {sportNames[sport] || sport}
                      </Badge>
                    )) : <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Courts */}
            {(proposedCourts.length > 0 || currentCourts.length > 0) && (
              <div>
                <p className="text-xs font-medium mb-1">Courts</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    {proposedCourts.length > 0 ? proposedCourts.map((court: any, i: number) => (
                      <div key={i} className="text-xs bg-green-50 border border-green-200 rounded p-2">
                        <div className="font-medium">{sportNames[court.sport] || court.sport}</div>
                        <div>Qty: {court.quantity}{court.surface ? `, ${court.surface}` : ''}</div>
                        {court.notes && <div className="text-muted-foreground">{court.notes}</div>}
                      </div>
                    )) : <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                  <div className="space-y-1">
                    {currentCourts.length > 0 ? currentCourts.map((court: any, i: number) => (
                      <div key={i} className="text-xs bg-red-50 border border-red-200 rounded p-2">
                        <div className="font-medium">{sportNames[court.sport] || court.sport}</div>
                        <div>Qty: {court.quantity}{court.surface ? `, ${court.surface}` : ''}</div>
                        {court.notes && <div className="text-muted-foreground">{court.notes}</div>}
                      </div>
                    )) : <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          <Button 
            
            onClick={() => onApprove(edit.id)}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve Changes
          </Button>
          
          <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="flex-1">
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Community Edit</DialogTitle>
                <DialogDescription>
                  Please provide a reason for rejecting this community contribution. This will help the contributor understand what needs to be improved.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                >
                  Reject Edit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}

function AdminPlacesPage() {
  return (
    <div className="container px-4 py-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Place Moderation</h1>
        <p className="text-muted-foreground mt-2">
          Review and moderate user-submitted places and courts
        </p>
      </div>

      <ModerationStats />

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pending Places</TabsTrigger>
          <TabsTrigger value="community-edits">Community Edits</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Pending Places
              </CardTitle>
              <CardDescription>
                Places waiting for your review. These are not visible to users yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlacesList status="pending" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="community-edits">
          <CommunityEditsTab />
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Approved Places
              </CardTitle>
              <CardDescription>
                Places that have been approved and are visible on the map.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlacesList status="approved" />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}

export default AdminPlacesPage