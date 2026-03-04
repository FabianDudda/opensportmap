'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, Plus, User } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()

  const items = [
    { name: 'Map', href: '/map', icon: Map, active: pathname === '/map' },
    { name: 'Add Place', href: '/map?addPlace=1', icon: Plus, active: false },
    { name: 'Profile', href: '/profile', icon: User, active: pathname === '/profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-around px-4 max-w-2xl mx-auto w-full">
        {items.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 text-xs font-medium transition-colors ${
              item.active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
