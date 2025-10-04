'use client'

import { ReactNode } from 'react'

interface HeaderSizeGuardProps {
  children: ReactNode
}

export function HeaderSizeGuard({ children }: HeaderSizeGuardProps) {
  // COMPLETELY BYPASSED: This component now does absolutely nothing
  // All header size checking and redirects have been disabled to prevent loops
  console.log('HeaderSizeGuard: COMPLETELY BYPASSED - no checks, no redirects')
  
  // Just render children immediately
  return <>{children}</>
}

export default HeaderSizeGuard
