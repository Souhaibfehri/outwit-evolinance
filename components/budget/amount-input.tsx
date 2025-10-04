'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

interface AmountInputProps {
  value: number
  onSave: (value: number) => void
  onCancel: () => void
  maxValue?: number
  showMaxWarning?: boolean
  placeholder?: string
  className?: string
}

export function AmountInput({ 
  value, 
  onSave, 
  onCancel, 
  maxValue,
  showMaxWarning = true,
  placeholder = "0.00",
  className = "" 
}: AmountInputProps) {
  const [inputValue, setInputValue] = useState(value.toFixed(2))
  const [hasError, setHasError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  const handleSave = () => {
    const numValue = parseFloat(inputValue) || 0
    
    // Check if exceeds max value
    if (maxValue !== undefined && numValue > maxValue && showMaxWarning) {
      setHasError(true)
      return
    }
    
    onSave(numValue)
  }

  const isOverMax = maxValue !== undefined && parseFloat(inputValue) > maxValue

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="number"
          step="0.01"
          min="0"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setHasError(false)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-24 text-right ${
            hasError || (isOverMax && showMaxWarning)
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
              : ''
          }`}
        />
        {isOverMax && showMaxWarning && (
          <div className="absolute -bottom-6 left-0 text-xs text-red-600 dark:text-red-400">
            Exceeds ${maxValue?.toFixed(2)}
          </div>
        )}
      </div>
      
      <Button
        size="sm"
        onClick={handleSave}
        className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
        disabled={hasError}
      >
        <Check className="h-4 w-4" />
        <span className="sr-only">Save amount</span>
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={onCancel}
        className="h-8 w-8 p-0"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Cancel</span>
      </Button>
    </div>
  )
}
