import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Provide safe defaults for local development
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  
  // Log warning if using placeholders in development
  if (process.env.NODE_ENV === 'development' && supabaseUrl.includes('placeholder')) {
    console.warn('🔧 Using placeholder Supabase credentials for local development')
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        // AGGRESSIVE OPTIMIZATION: Force localStorage to avoid cookies completely
        autoRefreshToken: false, // Disable auto-refresh to reduce token size
        persistSession: true,    // Keep session but in localStorage, not cookies
        detectSessionInUrl: true,
        sessionRefreshMargin: 300, // 5 minutes margin (shorter)
        flowType: 'implicit', // Use implicit flow (smaller than PKCE)
        
        // FORCE localStorage storage to completely bypass cookies
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
              // Store in localStorage - no size limits like cookies
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
      
      // Minimal global settings
      global: {
        headers: {
          'X-Client-Info': 'outwit-minimal'
        }
      }
    }
  )
}