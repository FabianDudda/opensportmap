'use client'

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { PlaceType, placeTypeLabels, placeTypeIcons } from '@/lib/utils/sport-utils'

const PLACE_TYPE_INFO: { type: PlaceType; description: string }[] = [
  {
    type: 'öffentlich',
    description: 'Für alle frei zugänglich — öffentliche Parks, Plätze und Freiflächen.',
  },
  {
    type: 'verein',
    description: 'Betrieben von einem Sportverein. Der Zugang kann eine Mitgliedschaft erfordern.',
  },
  {
    type: 'schule',
    description: 'Auf Schulgelände gelegen. Meist nur außerhalb der Schulzeiten zugänglich.',
  },
]

interface PlaceTypeInfoSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export default function PlaceTypeInfoSheet({ isOpen, onOpenChange }: PlaceTypeInfoSheetProps) {
  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange} modal={false} shouldScaleBackground={false}>
      <DrawerContent hideOverlay className="max-h-[92dvh] max-w-2xl mx-auto">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-xl">Platzarten</DrawerTitle>
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

        <div className="px-4 pb-6 pt-4 space-y-6">
          <div className="space-y-3">
            {PLACE_TYPE_INFO.map(({ type, description }) => {
                          return (
                <div
                  key={type}
                  className="flex items-start gap-3 rounded-xl border border-border bg-background p-4"
                >
                  <span className="text-2xl leading-none mt-0.5">{placeTypeIcons[type]}</span>
                  <div>
                    <p className="font-semibold text-sm">{placeTypeLabels[type]}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <Button className="w-full" onClick={() => onOpenChange(false)}>
            Verstanden
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
