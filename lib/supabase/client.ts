import { createIntelligentSupabaseClient } from '@/lib/auth/cookie-manager'

export function createClient() {
  return createIntelligentSupabaseClient()
}