'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ReactNode } from 'react'
import { GripVertical } from 'lucide-react'

interface SortableItemProps {
  id: string
  children: ReactNode
  className?: string
  disabled?: boolean
}

export function SortableItem({ id, children, className = '', disabled = false }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? 'opacity-50 z-50' : ''}`}
      {...attributes}
    >
      <div className="flex items-center space-x-2">
        <button
          className={`flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'
          }`}
          {...listeners}
          disabled={disabled}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
