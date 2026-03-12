'use client'

import { useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { X, Loader2 } from 'lucide-react'
import { database } from '@/lib/supabase/database'
import { useToast } from '@/hooks/use-toast'
import { useMutation } from '@tanstack/react-query'

interface ReportPlaceBottomSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  placeId: string | null
  placeName: string | null
  userId: string | null
}

const REPORT_REASONS = [
  { value: 'no_longer_exists', label: 'Platz existiert nicht mehr' },
  { value: 'other', label: 'Sonstiges' },
] as const

export default function ReportPlaceBottomSheet({
  isOpen,
  onOpenChange,
  placeId,
  placeName,
  userId,
}: ReportPlaceBottomSheetProps) {
  const { toast } = useToast()
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [comment, setComment] = useState('')

  const reportMutation = useMutation({
    mutationFn: () =>
      database.reports.submitReport({
        placeId: placeId!,
        reason: selectedReason!,
        comment: comment.trim() || undefined,
        reporterUserId: userId || undefined,
      }),
    onSuccess: () => {
      toast({ title: 'Danke für dein Feedback!', description: 'Deine Meldung wurde eingereicht.' })
      handleClose()
    },
    onError: () => {
      toast({ title: 'Fehler beim Melden', variant: 'destructive' })
    },
  })

  const handleClose = () => {
    setSelectedReason(null)
    setComment('')
    onOpenChange(false)
  }

  const canSubmit = !!selectedReason && (selectedReason !== 'other' || comment.trim().length > 0)

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }} modal={false} shouldScaleBackground={false}>
      <DrawerContent hideOverlay className="max-h-[92dvh] max-w-2xl mx-auto">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-xl">Platz melden</DrawerTitle>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleClose}
              title="Schließen"
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="p-4 space-y-4 overflow-y-auto">
          <p className="text-sm text-muted-foreground">
            Warum möchtest du{' '}
            <span className="font-medium text-foreground">{placeName}</span> melden?
          </p>

          <div className="space-y-2">
            {REPORT_REASONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedReason(value)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  selectedReason === value
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-foreground hover:bg-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {selectedReason === 'other' && (
            <Textarea
              placeholder="Bitte beschreibe das Problem..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button
              className="flex-1"
              disabled={!canSubmit || reportMutation.isPending}
              onClick={() => reportMutation.mutate()}
            >
              {reportMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Melden
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
