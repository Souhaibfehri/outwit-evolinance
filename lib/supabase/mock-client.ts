/**
 * MOCK SUPABASE CLIENT
 * Completely bypasses real Supabase to prevent 494 errors
 */

import { mockAuth, MockUser } from '@/lib/auth/mock-auth'

export function createMockClient() {
  return {
    auth: {
      getUser: () => mockAuth.getUser(),
      signInWithPassword: (credentials: any) => mockAuth.signInWithPassword(credentials),
      signUp: (credentials: any) => mockAuth.signUp(credentials),
      signOut: () => mockAuth.signOut(),
      updateUser: (updates: any) => mockAuth.updateUser(updates),
      getSession: () => mockAuth.getSession(),
      onAuthStateChange: (callback: any) => mockAuth.onAuthStateChange(callback),
    },
    
    from: (table: string) => ({
      select: (columns = '*') => ({
        eq: (column: string, value: any) => ({
          single: () => Promise.resolve({ data: null, error: null }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
          then: (resolve: any) => resolve({ data: [], error: null })
        }),
        then: (resolve: any) => resolve({ data: [], error: null })
      }),
      
      insert: (data: any) => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          then: (resolve: any) => resolve({ data: null, error: null })
        }),
        then: (resolve: any) => resolve({ data: null, error: null })
      }),
      
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
            then: (resolve: any) => resolve({ data: null, error: null })
          }),
          then: (resolve: any) => resolve({ data: null, error: null })
        }),
        then: (resolve: any) => resolve({ data: null, error: null })
      }),
      
      delete: () => ({
        eq: (column: string, value: any) => ({
          then: (resolve: any) => resolve({ data: null, error: null })
        }),
        then: (resolve: any) => resolve({ data: null, error: null })
      }),
      
      upsert: (data: any) => ({
        then: (resolve: any) => resolve({ data: null, error: null })
      })
    }),
    
    rpc: (fn: string, params?: any) => ({
      then: (resolve: any) => resolve({ data: null, error: null })
    })
  }
}
