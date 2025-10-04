import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { HelpCircle, RotateCcw } from 'lucide-react'
import Link from 'next/link'

interface RolloverTooltipProps {
  children: React.ReactNode
  className?: string
}

export function RolloverTooltip({ children, className = '' }: RolloverTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 cursor-help underline decoration-dotted ${className}`}>
            {children}
            <RotateCcw className="h-3 w-3 text-orange-500" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4">
          <div className="space-y-3">
            <div className="font-semibold flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-orange-500" />
              Category Rollover
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <strong>When ON:</strong> Unspent money moves to next month's budget for this category. 
                Overspending reduces next month's Ready-to-Assign.
              </div>
              
              <div>
                <strong>When OFF:</strong> Month closes clean with no carryover. 
                Unspent money returns to Ready-to-Assign.
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
              <div className="text-sm">
                <div className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                  Example:
                </div>
                <div className="text-orange-700 dark:text-orange-300">
                  Groceries budget: $400<br/>
                  Spent: $350<br/>
                  <strong>Rollover ON:</strong> $50 → Next month's Groceries<br/>
                  <strong>Rollover OFF:</strong> $50 → Ready-to-Assign
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 border-t pt-2">
              <Link href="/help/rollover" className="text-orange-600 hover:text-orange-700">
                Learn more about rollover →
              </Link>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
