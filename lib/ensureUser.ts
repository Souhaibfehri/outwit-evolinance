import { createClient } from '@/lib/supabase/server'

export interface User {
  id: string
  email: string
  name: string
  user_metadata?: any
  profile: {
    onboardingDone: boolean
    onboardingStep: number
    currency: string
    paySchedule: 'WEEKLY' | 'BIWEEKLY' | 'SEMIMONTHLY' | 'MONTHLY'
  }
}

export async function ensureUser(): Promise<User | null> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return null

    // Use Supabase Auth user metadata to track onboarding
    // This bypasses the Prisma connection issue temporarily
    const onboardingDone = authUser.user_metadata?.onboarding_done || false
    const onboardingStep = authUser.user_metadata?.onboarding_step || 0

    return {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email.split('@')[0],
      user_metadata: authUser.user_metadata,
      profile: {
        onboardingDone,
        onboardingStep,
        currency: authUser.user_metadata?.currency || 'USD',
        paySchedule: authUser.user_metadata?.pay_schedule || 'MONTHLY'
      }
    }
  } catch (error) {
    console.error('Error in ensureUser:', error)
    return null
  }
}

export async function getUserAndEnsure() {
  return await ensureUser()
}

// Helper function to update user metadata in Supabase Auth
export async function updateUserMetadata(updates: Record<string, any>) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({
      data: updates
    })
    
    if (error) {
      console.error('Error updating user metadata:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error updating user metadata:', error)
    return { success: false, error: 'Failed to update user metadata' }
  }
}