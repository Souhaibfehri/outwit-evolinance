import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // EMERGENCY FIX: Block ALL large cookies to prevent 494 errors
          if (value && value.length > 2000) {
            console.warn(`EMERGENCY FIX: Blocking large cookie: ${name} (${value.length} bytes)`)
            return
          }
          
          // Set cookies with very conservative limits
          const safeOptions = {
            ...options,
            maxAge: Math.min(options?.maxAge || 900, 900), // Max 15 minutes
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            httpOnly: true,
            path: '/'
          }
          cookieStore.set(name, value, safeOptions)
        })
      },
    },
  })
}