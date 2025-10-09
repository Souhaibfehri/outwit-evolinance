import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  return createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      // Use localStorage to prevent cookie size issues
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
            // Limit value size to prevent localStorage issues
            const safeValue = value.length > 8192 ? value.substring(0, 8192) : value
            window.localStorage.setItem(key, safeValue)
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
      
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit'
    }
  })
}