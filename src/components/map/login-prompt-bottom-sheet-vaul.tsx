'use client'

import Link from 'next/link'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Pencil, X, type LucideIcon } from 'lucide-react'

interface LoginPromptBottomSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  icon?: LucideIcon
}

export default function LoginPromptBottomSheet({
  isOpen,
  onOpenChange,
  title = 'Ort bearbeiten',
  description = 'Melde dich an, um Änderungen an diesem Ort vorzuschlagen.',
  icon: Icon = Pencil,
}: LoginPromptBottomSheetProps) {
  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange} modal={false} shouldScaleBackground={false}>
      <DrawerContent hideOverlay className="max-h-[92dvh] max-w-2xl mx-auto">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-xl">{title}</DrawerTitle>
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

        <div className="overflow-y-auto p-4">
          <div className="text-center space-y-4">
            <Icon className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">{description}</p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Button asChild className="w-full">
                <Link href="/auth/signin" onClick={() => onOpenChange(false)}>Anmelden</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/signup" onClick={() => onOpenChange(false)}>Registrieren</Link>
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
