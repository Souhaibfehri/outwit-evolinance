'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LogoutHandler({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthChange = (event: string, session: any) => {
      if (event === 'SIGNED_OUT') {
        // Clear all onboarding and tutorial state from localStorage
        localStorage.removeItem(`tutorial-state-${userId}`)
        localStorage.removeItem(`onboarding-profile`)
        localStorage.removeItem(`onboarding-income`)
        localStorage.removeItem(`onboarding-bills`)
        localStorage.removeItem(`onboarding-debts`)
        localStorage.removeItem(`onboarding-goals`)
        
        // Clear any other user-specific localStorage items
        Object.keys(localStorage).forEach(key => {
          if (key.includes(userId)) {
            localStorage.removeItem(key)
          }
        })
        
        router.replace('/login')
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange)

    return () => subscription.unsubscribe()
  }, [userId, router, supabase.auth])

  return null // This component only handles side effects
}
