'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Pencil, Flag, Share2 } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { PlaceWithCourts } from '@/lib/supabase/types'
import { useToast } from '@/hooks/use-toast'
import ReportPlaceBottomSheet from '@/components/map/report-place-bottom-sheet-vaul'
import { useRouter } from 'next/navigation'

interface PlaceActionsProps {
  place: PlaceWithCourts
}

export default function PlaceActions({ place }: PlaceActionsProps) {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isReportOpen, setIsReportOpen] = useState(false)

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/places/${place.id}`
    if (navigator.share) {
      navigator.share({
        title: place.name,
        text: `Check out ${place.name}`,
        url: shareUrl,
      }).catch(err => console.log('Share failed:', err))
    } else {
      navigator.clipboard.writeText(shareUrl)
        .then(() => toast({ title: 'Link kopiert!' }))
        .catch(() => toast({ title: 'Link konnte nicht kopiert werden', variant: 'destructive' }))
    }
  }

  const handleEdit = () => {
    if (!user) {
      router.push(`/auth/signin?redirect=/places/${place.id}/edit`)
    } else {
      router.push(`/places/${place.id}/edit`)
    }
  }

  return (
    <>
      <ReportPlaceBottomSheet
        isOpen={isReportOpen}
        onOpenChange={setIsReportOpen}
        placeId={place.id}
        placeName={place.name}
        userId={user?.id ?? null}
      />

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full"
          onClick={handleEdit}
          title={user && profile?.user_role === 'admin' ? 'Ort bearbeiten' : user ? 'Bearbeitung vorschlagen' : 'Anmelden zum Bearbeiten'}
        >
          <Pencil className="h-[18px] w-[18px]" />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className="rounded-full"
          onClick={() => setIsReportOpen(true)}
          title="Platz melden"
        >
          <Flag className="h-[18px] w-[18px]" />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className="rounded-full"
          onClick={handleShare}
          title="Teilen"
        >
          <Share2 className="h-[18px] w-[18px]" />
        </Button>
      </div>
    </>
  )
}
