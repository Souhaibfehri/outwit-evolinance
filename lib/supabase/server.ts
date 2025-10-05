import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          // NUCLEAR OPTION: Never return any cookies
          return []
        },
        setAll(cookiesToSet) {
          // NUCLEAR OPTION: Block ALL cookie setting permanently
          console.log(`NUCLEAR: Blocking ${cookiesToSet.length} server-side cookies permanently`)
          return // Never set any cookies
        },
      },
    }
  )
}