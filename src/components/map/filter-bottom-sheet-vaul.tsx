'use client'

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { SportType } from '@/lib/supabase/types'
import { sportNames, sportIcons } from '@/lib/utils/sport-utils'
import { cn } from '@/lib/utils'

interface FilterBottomSheetVaulProps {
  isOpen: boolean
  onClose: (open: boolean) => void
  onExplicitClose: () => void
  selectedSport: SportType | 'all'
  onSportChange: (sport: SportType | 'all') => void
}

const SPORTS: (SportType | 'all')[] = [
  'all',
  'fußball',
  'basketball',
  'tischtennis',
  'tennis',
  'beachvolleyball',
  'volleyball',
  'skatepark',
  'boule',
  'hockey'
]

export default function FilterBottomSheetVaul({
  isOpen,
  onClose,
  onExplicitClose,
  selectedSport,
  onSportChange
}: FilterBottomSheetVaulProps) {
  return (
    <Drawer open={isOpen} onOpenChange={onClose} modal={false} shouldScaleBackground={false}>
      <DrawerContent
        hideOverlay
        className="h-auto max-w-2xl mx-auto"
      >
        <DrawerHeader className="pb-0">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-xl">Filter</DrawerTitle>
            <Button
              variant="secondary"
              size="icon"
              onClick={onExplicitClose}
              title="Close"
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="space-y-6 px-4 py-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SPORTS.map((sport) => {
              const isSelected = selectedSport === sport
              const sportName = sport === 'all' ? 'Alle Sportarten' : sportNames[sport] || sport
              const sportIcon = sport === 'all' ? '🏟️' : sportIcons[sport] || '📍'

              return (
                <Button
                  key={sport}
                  variant={isSelected ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => onSportChange(sport)}
                  className={cn(
                    "px-3 flex items-center gap-3 justify-start relative",
                    isSelected && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  {isSelected && (
                    <Check className="w-4 h-4 absolute top-1 right-1 text-primary" />
                  )}
                  <span className="text-2xl">{sportIcon}</span>
                  <span className="text-base font-medium">{sportName}</span>
                </Button>
              )
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
