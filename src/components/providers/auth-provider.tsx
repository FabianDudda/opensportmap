'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { Profile } from '@/lib/supabase/types'
import { database } from '@/lib/supabase/database'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  error: string | null
  signOut: () => Promise<void>
  retry: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isAdmin: false,
  error: null,
  signOut: async () => {},
  retry: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Effect 1: Subscribe to auth state changes.
  // IMPORTANT: Never make Supabase API calls (e.g. database queries) inside
  // onAuthStateChange — the client holds an internal auth lock during the callback,
  // which causes any concurrent Supabase queries to hang indefinitely.
  // Only update React state here; profile fetching is handled in Effect 2 below.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] State change event:', event, session?.user ? `user: ${session.user.email}` : 'no user')

        setSession(session)
        setUser(session?.user ?? null)

        // If there's no user, we're done — mark loading complete.
        // If there IS a user, Effect 2 will fetch the profile and set loading=false.
        if (!session?.user) {
          setProfile(null)
          setError(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Effect 2: Fetch profile whenever the authenticated user changes.
  // This runs after React has processed the auth state change and the Supabase
  // client's internal auth lock has been released, so the query won't hang.
  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    database.profiles.getProfile(user.id)
      .then((userProfile) => {
        if (cancelled) return
        console.log('[Auth] User logged in:', { id: user.id, email: user.email })
        setProfile(userProfile)
        setError(null)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to fetch profile:', err)
        setError('Failed to load user profile. Some features may not work properly.')
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const retry = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Error getting session:', sessionError)
        setError('Failed to restore your session. Please sign in again.')
        setLoading(false)
        return
      }

      setSession(session)
      setUser(session?.user ?? null)

      if (!session?.user) {
        setProfile(null)
        setLoading(false)
      }
      // If user exists, Effect 2 will handle profile fetch and set loading=false
    } catch (err) {
      console.error('[Auth] Retry error:', err)
      setError('Failed to initialize authentication. Please refresh the page.')
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        setError('Failed to sign out. Please try again.')
      }
    } catch (err) {
      console.error('Sign out error:', err)
      setError('Failed to sign out. Please try again.')
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    isAdmin: profile?.user_role === 'admin',
    error,
    signOut,
    retry,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
