'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Info, ExternalLink } from 'lucide-react'
import { getJargonDefinition } from '@/lib/foxy/jargon'

interface JargonTooltipProps {
  term: string
  children?: React.ReactNode
  variant?: 'icon' | 'underline' | 'badge'
  size?: 'sm' | 'md' | 'lg'
}

export function JargonTooltip({ 
  term, 
  children, 
  variant = 'icon',
  size = 'sm'
}: JargonTooltipProps) {
  const [open, setOpen] = useState(false)
  const definition = getJargonDefinition(term)

  if (!definition) {
    // If no definition found, render children without tooltip
    return <>{children || term}</>
  }

  const TriggerComponent = () => {
    switch (variant) {
      case 'underline':
        return (
          <span className="border-b border-dotted border-blue-500 cursor-help text-blue-600 dark:text-blue-400">
            {children || term}
          </span>
        )
      case 'badge':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900">
            {children || term}
            <Info className="h-3 w-3" />
          </span>
        )
      default: // icon
        return (
          <Button
            variant="ghost"
            size="sm"
            className={`h-auto p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ${
              size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'
            }`}
          >
            <Info className={`${
              size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'
            }`} />
          </Button>
        )
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span className="inline-flex items-center">
          {variant === 'icon' ? (
            <>
              {children || term}
              <TriggerComponent />
            </>
          ) : (
            <TriggerComponent />
          )}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <span className="text-sm">🦊</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {definition.term}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Foxy explains
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {definition.definition}
          </p>
          
          {definition.example && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Example:</strong> {definition.example}
              </p>
            </div>
          )}
          
          {definition.learnMoreUrl && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <a
                href={definition.learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Learn more
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Convenience components for common jargon terms
export function RolloverTooltip({ children }: { children?: React.ReactNode }) {
  return <JargonTooltip term="rollover" variant="icon">{children}</JargonTooltip>
}

export function APRTooltip({ children }: { children?: React.ReactNode }) {
  return <JargonTooltip term="apr" variant="icon">{children}</JargonTooltip>
}

export function ReadyToAssignTooltip({ children }: { children?: React.ReactNode }) {
  return <JargonTooltip term="ready_to_assign" variant="icon">{children}</JargonTooltip>
}

export function ZeroBasedTooltip({ children }: { children?: React.ReactNode }) {
  return <JargonTooltip term="zero_based_budgeting" variant="underline">{children}</JargonTooltip>
}

export function SnowballTooltip({ children }: { children?: React.ReactNode }) {
  return <JargonTooltip term="snowball" variant="icon">{children}</JargonTooltip>
}

export function AvalancheTooltip({ children }: { children?: React.ReactNode }) {
  return <JargonTooltip term="avalanche" variant="icon">{children}</JargonTooltip>
}
