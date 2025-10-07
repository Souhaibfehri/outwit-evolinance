import { createBrowserClient } from '@supabase/ssr'
import { createMockClient } from './mock-client'

export function createClient() {
  // MOCK MODE: Use mock client to completely bypass Supabase
  console.log('Using MOCK Supabase client to prevent 494 errors')
  return createMockClient() as any

  // Original code commented out to prevent 494 errors
  /*
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  return createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
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
            const truncatedValue = value.length > 10000 ? value.substring(0, 10000) : value
            window.localStorage.setItem(key, truncatedValue)
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
      autoRefreshToken: false,
      detectSessionInUrl: true,
      flowType: 'implicit',
      debug: false
    },
    
    global: {
      headers: {
        'X-Client-Info': 'outwit-budget-minimal'
      }
    }
  })
  */
}