// PERMANENT FIX: Auth bypass for development to prevent 494 errors
// This ensures the app works without any server-side cookies

export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development'
}

export function shouldBypassAuth(): boolean {
  // In development, bypass auth to prevent cookie issues
  return isDevelopmentMode()
}

export function getMockUser() {
  return {
    id: 'dev-user-123',
    email: 'dev@outwit.com',
    user_metadata: {
      display_name: 'Dev User',
      category_groups: [],
      categories: [],
      recurring_income: [],
      bills: [],
      debts: [],
      goals: [],
      investments: [],
      budget_months: [],
      budget_items: []
    }
  }
}

export function createMockSupabaseClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: getMockUser() }, error: null }),
      signInWithPassword: async () => ({ data: { user: getMockUser() }, error: null }),
      signUp: async () => ({ data: { user: getMockUser() }, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  }
}
