/**
 * MOCK SUPABASE CLIENT
 * Completely bypasses real Supabase to prevent 494 errors
 */

import { mockAuth, MockUser } from '@/lib/auth/mock-auth'

// Mock data for different tables
const MOCK_DATA = {
  transactions: [],
  categories: [
    { id: '1', name: 'Groceries', group: 'Essentials', planned: 500, spent: 0 },
    { id: '2', name: 'Rent', group: 'Essentials', planned: 1200, spent: 0 },
    { id: '3', name: 'Entertainment', group: 'Lifestyle', planned: 200, spent: 0 }
  ],
  bills: [],
  goals: [],
  debts: []
}

export function createMockClient() {
  return {
    auth: {
      getUser: async () => mockAuth.getUser(),
      signInWithPassword: async (credentials: any) => mockAuth.signInWithPassword(credentials),
      signUp: async (credentials: any) => mockAuth.signUp(credentials),
      signOut: async () => mockAuth.signOut(),
      updateUser: async (updates: any) => mockAuth.updateUser(updates),
      getSession: async () => mockAuth.getSession(),
      onAuthStateChange: (callback: any) => mockAuth.onAuthStateChange(callback),
    },
    
    from: (table: string) => {
      const tableData = MOCK_DATA[table as keyof typeof MOCK_DATA] || []
      
      return {
        select: (columns = '*') => ({
          eq: (column: string, value: any) => ({
            single: () => Promise.resolve({ data: null, error: null }),
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
            order: (col: string, opts?: any) => ({
              then: (resolve: any) => resolve({ data: tableData, error: null })
            }),
            then: (resolve: any) => resolve({ data: tableData, error: null })
          }),
          order: (col: string, opts?: any) => ({
            then: (resolve: any) => resolve({ data: tableData, error: null })
          }),
          then: (resolve: any) => resolve({ data: tableData, error: null })
        }),
        
        insert: (data: any) => ({
          select: () => ({
            single: () => Promise.resolve({ data: Array.isArray(data) ? data[0] : data, error: null }),
            then: (resolve: any) => resolve({ data: Array.isArray(data) ? data[0] : data, error: null })
          }),
          then: (resolve: any) => resolve({ data: Array.isArray(data) ? data[0] : data, error: null })
        }),
        
        update: (data: any) => ({
          eq: (column: string, value: any) => ({
            select: () => ({
              single: () => Promise.resolve({ data: data, error: null }),
              then: (resolve: any) => resolve({ data: data, error: null })
            }),
            then: (resolve: any) => resolve({ data: data, error: null })
          }),
          then: (resolve: any) => resolve({ data: data, error: null })
        }),
        
        delete: () => ({
          eq: (column: string, value: any) => ({
            then: (resolve: any) => resolve({ data: null, error: null })
          }),
          then: (resolve: any) => resolve({ data: null, error: null })
        }),
        
        upsert: (data: any) => ({
          select: () => ({
            single: () => Promise.resolve({ data: Array.isArray(data) ? data[0] : data, error: null }),
            then: (resolve: any) => resolve({ data: Array.isArray(data) ? data[0] : data, error: null })
          }),
          then: (resolve: any) => resolve({ data: Array.isArray(data) ? data[0] : data, error: null })
        })
      }
    },
    
    rpc: (fn: string, params?: any) => ({
      then: (resolve: any) => resolve({ data: null, error: null })
    })
  }
}
