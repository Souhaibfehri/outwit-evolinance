import { createBrowserClient } from '@supabase/ssr'

export function createLocalStorageClient() {
  // Provide fallback values for build time
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        // Force localStorage instead of cookies to avoid size limits
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        sessionRefreshMargin: 300,
        flowType: 'pkce',
        
        // Use localStorage exclusively
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
              // Don't use cookies at all
            } catch (error) {
              console.warn('localStorage error:', error)
            }
          },
          removeItem: (key: string) => {
            try {
              window.localStorage.removeItem(key)
            } catch (error) {
              console.warn('localStorage error:', error)
            }
          }
        } : undefined,
      }
    }
  )
}
