import { createBrowserClient } from '@supabase/ssr'

export function createOptimizedClient() {
  // Provide fallback values for build time
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        // Use localStorage instead of cookies to avoid size limits
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
        
        // Optimize auth settings
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        sessionRefreshMargin: 60, // Refresh 1 minute before expiry
        
        // Disable cookies to prevent header size issues
        flowType: 'pkce' // Use PKCE flow instead of implicit
      },
      
      // Global settings to reduce payload size
      global: {
        headers: {
          'X-Client-Info': 'outwit-budget-optimized'
        }
      }
    }
  )
}
