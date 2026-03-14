import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/types'

const adminSupabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(request: Request) {
  // Verify the caller is an authenticated admin
  const serverClient = await createServerClient()
  const { data: { user }, error: authError } = await serverClient.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await serverClient
    .from('profiles')
    .select('user_role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.user_role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { placeId, address } = body
  if (!placeId || !address) {
    return NextResponse.json({ error: 'placeId and address are required' }, { status: 400 })
  }

  const { error } = await adminSupabase
    .from('places')
    .update(address)
    .eq('id', placeId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
