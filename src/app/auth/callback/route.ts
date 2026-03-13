import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // console.log('[auth/callback] GET called, code present:', !!code, 'origin:', origin)

  if (code) {
    const response = NextResponse.redirect(`${origin}/`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const all = request.cookies.getAll()
            // console.log('[auth/callback] getAll cookies:', all.map(c => c.name))
            return all
          },
          setAll(cookiesToSet) {
            // console.log('[auth/callback] setAll cookies:', cookiesToSet.map(c => c.name))
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    // console.log('[auth/callback] exchangeCodeForSession result:', {
    //   userId: data?.user?.id,
    //   email: data?.user?.email,
    //   error: error?.message,
    // })

    if (!error) {
      // console.log('[auth/callback] success, redirecting to /')
      return response
    }

    console.error('[auth/callback] exchange failed:', error)
  }

  console.warn('[auth/callback] falling back to error redirect')
  return NextResponse.redirect(`${origin}/auth/signin?error=auth_callback_error`)
}
