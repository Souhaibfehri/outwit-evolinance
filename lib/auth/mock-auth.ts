/**
 * MOCK AUTHENTICATION SYSTEM
 * Completely bypasses Supabase to prevent 494 errors
 */

export interface MockUser {
  id: string
  email: string
  name: string
  metadata: any
}

export interface MockSession {
  user: MockUser
  access_token: string
  refresh_token: string
  expires_at: number
}

// Mock user data
const MOCK_USER: MockUser = {
  id: 'mock-user-123',
  email: 'user@example.com',
  name: 'Demo User',
  metadata: {
    onboarding_done: true,
    migrated_to_database: true,
    currency: 'USD',
    timezone: 'UTC'
  }
}

// Mock session
const MOCK_SESSION: MockSession = {
  user: MOCK_USER,
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
}

export class MockAuthService {
  private static instance: MockAuthService
  private session: MockSession | null = null

  static getInstance(): MockAuthService {
    if (!MockAuthService.instance) {
      MockAuthService.instance = new MockAuthService()
    }
    return MockAuthService.instance
  }

  constructor() {
    // Initialize with mock session
    this.session = MOCK_SESSION
  }

  async getUser(): Promise<{ data: { user: MockUser | null }, error: any }> {
    return Promise.resolve({
      data: { user: this.session?.user || null },
      error: null
    })
  }

  async signInWithPassword(credentials: { email: string; password: string }) {
    // Always return success for demo purposes
    this.session = MOCK_SESSION
    return Promise.resolve({
      data: { user: MOCK_USER, session: MOCK_SESSION },
      error: null
    })
  }

  async signUp(credentials: { email: string; password: string }) {
    // Always return success for demo purposes
    this.session = MOCK_SESSION
    return Promise.resolve({
      data: { user: MOCK_USER, session: MOCK_SESSION },
      error: null
    })
  }

  async signOut() {
    this.session = null
    return Promise.resolve({ error: null })
  }

  async updateUser(updates: any) {
    if (this.session) {
      this.session.user = { ...this.session.user, ...updates }
    }
    return Promise.resolve({
      data: { user: this.session?.user || null },
      error: null
    })
  }

  getSession() {
    return Promise.resolve({
      data: { session: this.session },
      error: null
    })
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    // Mock auth state change
    callback('SIGNED_IN', this.session)
    
    // Return unsubscribe function
    return () => {}
  }
}

// Export singleton instance
export const mockAuth = MockAuthService.getInstance()
