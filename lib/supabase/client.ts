import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  return createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      // FORCE localStorage instead of cookies to prevent 494 errors
      storage: typeof window !== 'undefined' ? {
        getItem: (key: string) => {
          try {
            return window.localStorage.getItem(key)
          } catch {
            return null
          }
        },
        setItem: (key: string, value: string) => {
          try {
            window.localStorage.setItem(key, value)
          } catch {
            // Ignore storage errors
          }
        },
        removeItem: (key: string) => {
          try {
            window.localStorage.removeItem(key)
          } catch {
            // Ignore storage errors
          }
        }
      } : undefined,
      
      // Disable cookie-based auth completely
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit' // Use implicit flow for smaller tokens
    }
  })
}