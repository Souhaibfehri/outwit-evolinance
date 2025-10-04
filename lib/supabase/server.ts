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
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // AGGRESSIVE: Block ALL Supabase auth cookies to prevent size issues
              if (name.includes('supabase') || name.includes('auth') || name.includes('sb-')) {
                console.warn(`BLOCKING Supabase auth cookie: ${name} (${value?.length || 0} bytes) - client uses localStorage`)
                return // Don't set any Supabase auth cookies
              }
              
              // For any other cookies, enforce strict size limits
              if (value && value.length > 1000) {
                console.warn(`Skipping large cookie: ${name} (${value.length} bytes) - exceeds 1KB limit`)
                return
              }
              
              // Set minimal cookies with short expiry
              const minimalOptions = {
                ...options,
                maxAge: Math.min(options?.maxAge || 300, 300), // Max 5 minutes
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const,
                httpOnly: true,
                path: '/'
              }
              cookieStore.set(name, value, minimalOptions)
            })
          } catch (error) {
            console.error('Cookie setting error:', error)
          }
        },
      },
    }
  )
}