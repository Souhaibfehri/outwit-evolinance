'use client'

import { useEffect } from 'react'
import { useFoxyEvents } from '@/components/foxy/foxy-provider'

interface DashboardClientProps {
  children: React.ReactNode
}

export function DashboardClient({ children }: DashboardClientProps) {
  const { emit } = useFoxyEvents()

  useEffect(() => {
    // Emit dashboard view event for Foxy
    emit('view_dashboard')
  }, [emit])

  return <>{children}</>
}
