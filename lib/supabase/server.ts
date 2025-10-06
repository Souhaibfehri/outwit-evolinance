import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

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
          // DEFINITIVE FIX: Block ALL large cookies to prevent 494 errors
          if (value && value.length > 2000) {
            logger.warn(`Blocking large cookie: ${name} (${value.length} bytes) - exceeds 2KB limit`, 'SUPABASE')
            return
          }
          
          // Set cookies with very strict limits
          const safeOptions = {
            ...options,
            maxAge: Math.min(options?.maxAge || 1800, 1800), // Max 30 minutes
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