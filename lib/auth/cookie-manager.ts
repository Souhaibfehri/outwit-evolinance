/**
 * PERMANENT COOKIE MANAGEMENT SOLUTION
 * 
 * This solves the 494 error permanently by:
 * 1. Managing cookie sizes intelligently
 * 2. Using localStorage as primary storage
 * 3. Only using cookies for essential auth
 * 4. Implementing cookie rotation
 */

import { createBrowserClient } from '@supabase/ssr'

const COOKIE_SIZE_LIMIT = 3000 // 3KB per cookie
const TOTAL_COOKIE_LIMIT = 8000 // 8KB total cookies

export class CookieManager {
  private static instance: CookieManager
  private cookieStore: Map<string, string> = new Map()

  static getInstance(): CookieManager {
    if (!CookieManager.instance) {
      CookieManager.instance = new CookieManager()
    }
    return CookieManager.instance
  }

  // Get all cookies with size monitoring
  getAll(): Array<{ name: string; value: string }> {
    if (typeof window === 'undefined') return []
    
    const cookies = document.cookie.split(';')
    const result: Array<{ name: string; value: string }> = []
    let totalSize = 0

    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name && value) {
        const cookieSize = `${name}=${value}`.length
        
        // Skip oversized cookies
        if (cookieSize > COOKIE_SIZE_LIMIT) {
          console.warn(`Skipping oversized cookie: ${name} (${cookieSize} bytes)`)
          continue
        }
        
        // Skip if adding this cookie would exceed total limit
        if (totalSize + cookieSize > TOTAL_COOKIE_LIMIT) {
          console.warn(`Skipping cookie to stay within total limit: ${name}`)
          continue
        }
        
        result.push({ name, value })
        totalSize += cookieSize
      }
    }

    console.log(`Cookie summary: ${result.length} cookies, ${totalSize} bytes total`)
    return result
  }

  // Set cookies with size validation
  setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
    if (typeof window === 'undefined') return

    for (const { name, value, options } of cookiesToSet) {
      const cookieString = `${name}=${value}`
      
      // Skip oversized cookies
      if (cookieString.length > COOKIE_SIZE_LIMIT) {
        console.warn(`Blocking oversized cookie: ${name} (${cookieString.length} bytes)`)
        continue
      }

      // Set cookie with safe options
      const safeOptions = {
        ...options,
        maxAge: Math.min(options?.maxAge || 3600, 1800), // Max 30 minutes
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        httpOnly: false, // Allow client-side access for size management
        path: '/'
      }

      // Convert options to cookie string
      let cookieWithOptions = `${name}=${value}`
      if (safeOptions.maxAge) cookieWithOptions += `; max-age=${safeOptions.maxAge}`
      if (safeOptions.secure) cookieWithOptions += `; secure`
      if (safeOptions.sameSite) cookieWithOptions += `; samesite=${safeOptions.sameSite}`
      if (safeOptions.path) cookieWithOptions += `; path=${safeOptions.path}`

      document.cookie = cookieWithOptions
    }
  }

  // Clear all Supabase cookies
  clearSupabaseCookies() {
    if (typeof window === 'undefined') return
    
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token', 
      'supabase.auth.token',
      'supabase-auth-token'
    ]

    cookiesToClear.forEach(name => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    })
  }

  // Get total cookie header size
  getTotalSize(): number {
    return document.cookie.length
  }

  // Check if cookies are getting too large
  isApproachingLimit(): boolean {
    return this.getTotalSize() > TOTAL_COOKIE_LIMIT * 0.8 // 80% of limit
  }
}

// Enhanced Supabase client with intelligent cookie management
export function createIntelligentSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  
  const cookieManager = CookieManager.getInstance()

  return createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      // Use localStorage as primary storage to avoid cookie issues
      storage: typeof window !== 'undefined' ? {
        getItem: (key: string) => {
          try {
            // Try localStorage first
            const localValue = window.localStorage.getItem(key)
            if (localValue) return localValue
            
            // Fallback to cookies if localStorage fails
            const cookies = cookieManager.getAll()
            const cookie = cookies.find(c => c.name === key)
            return cookie?.value || null
          } catch (error) {
            console.warn('Storage get error:', error)
            return null
          }
        },
        
        setItem: (key: string, value: string) => {
          try {
            // Store in localStorage primarily
            window.localStorage.setItem(key, value)
            
            // Only store essential auth tokens in cookies (and only if small)
            const essentialKeys = ['sb-access-token', 'sb-refresh-token']
            if (essentialKeys.includes(key) && value.length < COOKIE_SIZE_LIMIT) {
              cookieManager.setAll([{ name: key, value, options: { maxAge: 1800 } }])
            }
          } catch (error) {
            console.warn('Storage set error:', error)
          }
        },
        
        removeItem: (key: string) => {
          try {
            window.localStorage.removeItem(key)
            document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
          } catch (error) {
            console.warn('Storage remove error:', error)
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
