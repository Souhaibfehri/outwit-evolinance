import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { HelpCircle, TrendingDown, Snowflake } from 'lucide-react'

interface TooltipWrapperProps {
  children: React.ReactNode
  className?: string
}

export function AvalancheTooltip({ children, className = '' }: TooltipWrapperProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 cursor-help underline decoration-dotted ${className}`}>
            {children}
            <TrendingDown className="h-3 w-3 text-red-500" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="font-semibold">Debt Avalanche Method</div>
            <div className="text-sm">
              Pay minimums on all debts, then put extra money toward the debt with the 
              <strong> highest interest rate</strong>. This saves the most money on interest 
              over time, but may take longer to see individual debts disappear.
            </div>
            <div className="text-xs text-gray-500 mt-2">
              💡 Best for: Maximizing interest savings
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function SnowballTooltip({ children, className = '' }: TooltipWrapperProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 cursor-help underline decoration-dotted ${className}`}>
            {children}
            <Snowflake className="h-3 w-3 text-blue-500" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="font-semibold">Debt Snowball Method</div>
            <div className="text-sm">
              Pay minimums on all debts, then put extra money toward the debt with the 
              <strong> smallest balance</strong>. This provides quick wins and psychological 
              motivation as you eliminate debts faster.
            </div>
            <div className="text-xs text-gray-500 mt-2">
              💡 Best for: Building momentum and motivation
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function APRTooltip({ children, className = '' }: TooltipWrapperProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 cursor-help underline decoration-dotted ${className}`}>
            {children}
            <HelpCircle className="h-3 w-3 text-gray-500" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="font-semibold">Annual Percentage Rate (APR)</div>
            <div className="text-sm">
              The yearly cost of your debt, including interest and fees, expressed as a percentage. 
              Higher APRs cost more money over time.
            </div>
            <div className="text-xs text-gray-500 mt-2">
              💡 Find this on your credit card statement or loan documents
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
