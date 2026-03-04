'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { MapPin, Trophy, Plus, User, LogOut, TestTube, Shield, Calendar, LogIn } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import Image from 'next/image'
import '@/components/map/map-controls.css'

export default function Header() {
  const { user, signOut, loading, isAdmin, profile } = useAuth()
  const [open, setOpen] = useState(false)

  const navigation = [
    { name: 'Rankings', href: '/rankings', icon: Trophy, adminOnly: true },
    { name: 'Add Match', href: '/matches/new', icon: Plus, adminOnly: true },
    { name: 'Add Place', href: '/map/new', icon: MapPin },
    { name: 'Events', href: '/events', icon: Calendar, adminOnly: true },
    { name: 'Test', href: '/test', icon: TestTube, adminOnly: true },
    { name: 'Admin', href: '/admin/places', icon: Shield, adminOnly: true },
    { name: 'Sign In', href: '/auth/signin', icon: LogIn, guestOnly: true },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Sign Out', href: '#', icon: LogOut, action: 'signOut' },
  ]

  if (loading) return null

  return (
    <div className="fixed top-4 left-4 z-50">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="map-control-button !p-0 overflow-hidden">
            {profile?.avatar ? (
              <div className="relative h-full w-full">
                <Image
                  src={profile.avatar}
                  alt={profile.name ?? 'Profile'}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <User className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle menu</span>
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="pr-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Main navigation menu for Court Sports
          </SheetDescription>
          <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
            <span className="font-bold">Court Sports</span>
          </Link>
          <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
            <div className="flex flex-col space-y-3">
              {navigation.map((item) => {
                if ((item.name === 'Profile' || item.name === 'Sign Out') && !user) return null
                if (item.adminOnly && !isAdmin) return null
                if (item.guestOnly && user) return null
                if (item.authOnly && !user) return null

                if (item.action === 'signOut') {
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        signOut()
                        setOpen(false)
                      }}
                      className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary text-left"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </button>
                  )
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
                    onClick={() => setOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
