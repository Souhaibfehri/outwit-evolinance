import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'
import { createMockClient } from './mock-client'

export async function createClient() {
  // MOCK MODE: Use mock client to completely bypass Supabase
  logger.info('Using MOCK Supabase client to prevent 494 errors', 'SUPABASE')
  return createMockClient() as any

  // Original code commented out to prevent 494 errors
  /*
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll(cookiesToSet) {
        logger.warn(`BLOCKING ALL COOKIES: ${cookiesToSet.length} cookies blocked to prevent 494`, 'SUPABASE')
      },
    },
  })
  */
}