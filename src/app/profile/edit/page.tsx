'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { database } from '@/lib/supabase/database'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function EditProfilePage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [name, setName] = useState(profile?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { name?: string }) => {
      if (!user) throw new Error('No user found')
      const { data, error } = await database.profiles.updateProfile(user.id, updates)
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' })
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    },
    onError: (error: Error) => {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
    },
  })

  const updateEmailMutation = useMutation({
    mutationFn: async (newEmail: string) => {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast({ title: 'Confirmation sent', description: 'Check your new email address to confirm the change.' })
    },
    onError: (error: Error) => {
      toast({ title: 'Email update failed', description: error.message, variant: 'destructive' })
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast({ title: 'Password updated', description: 'Your password has been changed.' })
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (error: Error) => {
      toast({ title: 'Password update failed', description: error.message, variant: 'destructive' })
    },
  })

  if (!user || !profile) {
    return (
      <div className="container px-4 py-8 overflow-x-hidden">
        <div className="max-w-xl mx-auto">
          <p className="text-muted-foreground">Sign in to edit your profile.</p>
        </div>
      </div>
    )
  }

  const hasNameChanges = name.trim() !== profile.name
  const hasEmailChanges = email.trim() !== user.email
  const passwordsMatch = newPassword === confirmPassword
  const canSavePassword = newPassword.length >= 6 && passwordsMatch

  return (
    <div className="container px-4 py-8 overflow-x-hidden">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
        </div>

        {/* Member since */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="text-sm">Member since {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </CardContent>
        </Card>

        {/* Account info */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label>Display Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
                placeholder="Your name"
              />
            </div>

            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
              {hasEmailChanges && (
                <p className="text-xs text-muted-foreground mt-1">
                  A confirmation link will be sent to your new email address.
                </p>
              )}
            </div>

            <Button
              className="w-full"
              disabled={(!hasNameChanges && !hasEmailChanges) || updateProfileMutation.isPending || updateEmailMutation.isPending}
              onClick={() => {
                if (hasNameChanges) updateProfileMutation.mutate({ name: name.trim() })
                if (hasEmailChanges) updateEmailMutation.mutate(email.trim())
              }}
            >
              {(updateProfileMutation.isPending || updateEmailMutation.isPending) ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Change password */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1"
                placeholder="Min. 6 characters"
              />
            </div>

            <div>
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
                placeholder="Repeat new password"
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-destructive mt-1">Passwords do not match.</p>
              )}
            </div>

            <Button
              className="w-full"
              disabled={!canSavePassword || updatePasswordMutation.isPending}
              onClick={() => updatePasswordMutation.mutate(newPassword)}
            >
              {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
