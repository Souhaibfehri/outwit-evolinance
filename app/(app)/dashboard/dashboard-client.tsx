'use client'

import { useEffect } from 'react'

interface DashboardClientProps {
  children: React.ReactNode
}

export function DashboardClient({ children }: DashboardClientProps) {
  useEffect(() => {
    // Simple dashboard view tracking without Foxy dependency
    console.log('Dashboard viewed')
  }, [])

  return <>{children}</>
}
