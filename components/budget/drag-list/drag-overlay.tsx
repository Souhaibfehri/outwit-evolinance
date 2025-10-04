'use client'

import { DragOverlay as DndDragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core'
import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'

interface DragOverlayProps {
  children: ReactNode
}

const dropAnimationConfig = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
}

export function DragOverlay({ children }: DragOverlayProps) {
  return (
    <DndDragOverlay dropAnimation={dropAnimationConfig}>
      {children ? (
        <Card className="shadow-2xl border-2 border-blue-500 bg-white dark:bg-gray-800 opacity-95">
          {children}
        </Card>
      ) : null}
    </DndDragOverlay>
  )
}
