'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { database } from '@/lib/supabase/database'
import { User, Mail, Trophy, Calendar, Edit2, Save, X, Plus, TestTube, Shield, LogOut, ChevronRight, MessageSquare, Info } from 'lucide-react'
import Link from 'next/link'

const NAV_ITEMS = [
  { name: 'Rankings', href: '/rankings', icon: Trophy, adminOnly: true },
  { name: 'Add Match', href: '/matches/new', icon: Plus, adminOnly: true },
  { name: 'Events', href: '/events', icon: Calendar, adminOnly: true },
  { name: 'Test', href: '/test', icon: TestTube, adminOnly: true },
  { name: 'Admin', href: '/admin/places', icon: Shield, adminOnly: true },
  { name: 'My Stats', href: '/profile/stats', icon: Trophy, adminOnly: true },
]

export default function ProfilePage() {
  const { user, profile, loading, isAdmin, signOut } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(profile?.name || '')

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { name?: string; avatar?: string }) => {
      if (!user) throw new Error('No user found')
      const { data, error } = await database.profiles.updateProfile(user.id, updates)
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      setIsEditing(false)
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleSaveName = () => {
    if (editName.trim() && editName !== profile?.name) {
      updateProfileMutation.mutate({ name: editName.trim() })
    } else {
      setIsEditing(false)
    }
  }

  if (loading) {
    return (
      <div className="container px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card><CardContent className="p-6"><div className="h-24 animate-pulse bg-muted rounded" /></CardContent></Card>
          <Card><CardContent className="p-6"><div className="h-20 animate-pulse bg-muted rounded" /></CardContent></Card>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="container px-4 py-12 max-w-sm mx-auto space-y-6">
        {/* Placeholder avatar */}
        <div className="flex justify-center">
          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        {/* Auth card */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Sign in to have full access to all features</h2>
              <p className="text-sm text-muted-foreground">
                Save places as favorites and add or edit places for the community.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button asChild className="w-full">
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Nav list */}
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col divide-y">
              <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors text-left">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span>Give feedback</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </button>
              <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors text-left">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span>About the app</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const visibleNavItems = NAV_ITEMS.filter(item => !(item.adminOnly && !isAdmin))

  return (
    <div className="container px-4 py-8 overflow-x-hidden">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Links */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col divide-y">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 py-3 text-sm font-medium hover:text-primary transition-colors"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.name}</span>
                  {item.adminOnly && (
                    <span className="ml-auto text-xs text-muted-foreground">[admin]</span>
                  )}
                </Link>
              ))}
              <button
                onClick={() => signOut()}
                className="flex items-center gap-3 py-3 text-sm font-medium hover:text-primary transition-colors text-left"
              >
                <LogOut className="h-4 w-4 text-muted-foreground" />
                <span>Sign Out</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar || undefined} alt={profile.name} />
                <AvatarFallback className="text-2xl">
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 space-y-4">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-2xl font-bold h-auto py-1 min-w-0"
                    />
                    <Button className="shrink-0" onClick={handleSaveName}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      className="shrink-0"
                      variant="outline"
                      onClick={() => {
                        setEditName(profile.name)
                        setIsEditing(false)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 min-w-0">
                    <h1 className="text-3xl font-bold truncate min-w-0">{profile.name}</h1>
                    <Button
                      variant="outline"
                      className="shrink-0"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span className="font-semibold">Account Information</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Email Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={user.email || ''} disabled />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div>
                <Label>Member Since</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
