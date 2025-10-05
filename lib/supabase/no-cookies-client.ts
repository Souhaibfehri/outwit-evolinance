// NUCLEAR OPTION: Completely cookie-free Supabase client
// This prevents ANY cookie accumulation that could cause 494 errors

import { createBrowserClient } from '@supabase/ssr'

export function createNoCookiesClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
    {
      // NUCLEAR: Completely disable cookie handling
      cookies: {
        getAll() {
          return [] // Never return any cookies
        },
        setAll() {
          // Never set any cookies
          return
        },
      },
      auth: {
        // Force localStorage only
        autoRefreshToken: false,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'implicit',
        storage: typeof window !== 'undefined' ? {
          getItem: (key: string) => {
            try {
              return window.localStorage.getItem(`sb-${key}`)
            } catch {
              return null
            }
          },
          setItem: (key: string, value: string) => {
            try {
              window.localStorage.setItem(`sb-${key}`, value)
            } catch (error) {
              console.warn('localStorage error:', error)
            }
          },
          removeItem: (key: string) => {
            try {
              window.localStorage.removeItem(`sb-${key}`)
            } catch (error) {
              console.warn('localStorage error:', error)
            }
          }
        } : undefined,
      },
      global: {
        headers: {
          'X-Client-Info': 'outwit-no-cookies'
        }
      }
    }
  )
}
