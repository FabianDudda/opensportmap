'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Map, Plus, User } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers/auth-provider'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [isGuestSheetOpen, setIsGuestSheetOpen] = useState(false)

  const handleAddClick = () => {
    const stored = sessionStorage.getItem('map-position')
    if (stored) {
      const { lat, lng, zoom } = JSON.parse(stored)
      router.push(`/new?lat=${lat}&lng=${lng}&zoom=${zoom}`)
    } else {
      router.push('/new')
    }
  }

  useEffect(() => {
    const close = () => setIsGuestSheetOpen(false)
    window.addEventListener('favorites-opened', close)
    window.addEventListener('filter-opened', close)
    return () => {
      window.removeEventListener('favorites-opened', close)
      window.removeEventListener('filter-opened', close)
    }
  }, [])

  useEffect(() => {
    if (!isGuestSheetOpen) return
    const raf = requestAnimationFrame(() => {
      document.body.style.pointerEvents = 'auto'
    })
    return () => cancelAnimationFrame(raf)
  }, [isGuestSheetOpen])

  const navItems = [
    { name: 'Karte', href: '/', icon: Map, active: pathname === '/' },
    { name: 'Profil', href: '/profile', icon: User, active: pathname === '/profile' },
  ]

  const addActive = pathname === '/new'

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-around px-4 max-w-2xl mx-auto w-full">
          <Link
            href="/"
            className={`flex flex-1 flex-col items-center gap-1 text-xs font-medium transition-colors ${
              navItems[0].active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Map className="h-5 w-5" />
            <span>Karte</span>
          </Link>

          {user ? (
            <button
              onClick={handleAddClick}
              className={`flex flex-1 flex-col items-center gap-1 text-xs font-medium transition-colors ${
                addActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Plus className="h-5 w-5" />
              <span>Hinzufügen</span>
            </button>
          ) : (
            <button
              onClick={() => setIsGuestSheetOpen(true)}
              className="flex flex-1 flex-col items-center gap-1 text-xs font-medium transition-colors text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-5 w-5" />
              <span>Hinzufügen</span>
            </button>
          )}

          <Link
            href="/profile"
            className={`flex flex-1 flex-col items-center gap-1 text-xs font-medium transition-colors ${
              navItems[1].active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="h-5 w-5" />
            <span>Profil</span>
          </Link>
        </div>
      </nav>

      <Drawer open={isGuestSheetOpen} onOpenChange={setIsGuestSheetOpen} modal={false} shouldScaleBackground={false}>
        <DrawerContent className="max-w-2xl mx-auto">
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-xl">Ort hinzufügen</DrawerTitle>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsGuestSheetOpen(false)}
                title="Schließen"
                className="rounded-full"
              >
                <Plus className="h-5 w-5 rotate-45" />
              </Button>
            </div>
          </DrawerHeader>

          <div className="overflow-y-auto p-4">
            <div className="text-center space-y-4 py-4">
              <Plus className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">Melde dich an, um Orte hinzuzufügen.</p>
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <Button asChild className="w-full">
                  <Link href="/auth/signin" onClick={() => setIsGuestSheetOpen(false)}>Anmelden</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/signup" onClick={() => setIsGuestSheetOpen(false)}>Registrieren</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => {
                    setIsGuestSheetOpen(false)
                    const stored = sessionStorage.getItem('map-position')
                    if (stored) {
                      const { lat, lng, zoom } = JSON.parse(stored)
                      router.push(`/new?guest=true&lat=${lat}&lng=${lng}&zoom=${zoom}`)
                    } else {
                      router.push('/new?guest=true')
                    }
                  }}
                >
                  Weiter als Gast
                </Button>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
