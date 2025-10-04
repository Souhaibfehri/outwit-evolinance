'use client'

import { useDroppable } from '@dnd-kit/core'
import { ReactNode } from 'react'

interface DroppableGroupProps {
  id: string
  children: ReactNode
  className?: string
  disabled?: boolean
}

export function DroppableGroup({ id, children, className = '', disabled = false }: DroppableGroupProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    disabled
  })

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''} ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      {children}
    </div>
  )
}
