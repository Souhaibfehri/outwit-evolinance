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
          // PERMANENT FIX: Return empty array to prevent server-side cookie accumulation
          return []
        },
        setAll(cookiesToSet) {
          // PERMANENT FIX: Block ALL cookie setting on server-side
          // This forces all authentication to use client-side localStorage only
          console.log(`BLOCKING ${cookiesToSet.length} server-side cookies - using client-side auth only`)
          return // Don't set any cookies on server-side
        },
      },
    }
  )
}