'use client'

import { useEffect } from 'react'
import { useFoxyEvents } from '@/components/foxy/foxy-provider'

interface DebtsClientProps {
  children: React.ReactNode
}

export function DebtsClient({ children }: DebtsClientProps) {
  const { emit } = useFoxyEvents()

  useEffect(() => {
    // Emit view event when debts page loads
    emit('view_debts')
  }, [emit])

  // Listen for debt simulator usage
  useEffect(() => {
    const handleSimulatorRun = () => {
      emit('run_debt_sim', { method: 'avalanche' })
    }

    // Listen for custom events from the debt simulator
    window.addEventListener('debt-simulator-run', handleSimulatorRun)
    
    return () => {
      window.removeEventListener('debt-simulator-run', handleSimulatorRun)
    }
  }, [emit])

  return <>{children}</>
}
