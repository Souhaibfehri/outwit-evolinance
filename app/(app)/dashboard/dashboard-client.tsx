'use client'

import { useEffect } from 'react'

interface DashboardClientProps {
  children: React.ReactNode
}

export function DashboardClient({ children }: DashboardClientProps) {
  useEffect(() => {
    // Try to emit dashboard view event, but don't fail if Foxy isn't available
    try {
      // This will work if Foxy provider is available, otherwise it's ignored
      const { useFoxyEvents } = require('@/components/foxy/foxy-provider')
      const { emit } = useFoxyEvents()
      emit('view_dashboard')
    } catch (error) {
      // Foxy not available - that's fine, just log normally
      console.log('Dashboard viewed')
    }
  }, [])

  return <>{children}</>
}
