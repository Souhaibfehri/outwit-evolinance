'use client'

import { useState } from 'react'
import { Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

export interface InfoPillProps {
  term: string
  definition: string
  example?: string
  learnMoreUrl?: string
  variant?: 'default' | 'secondary' | 'outline'
}

export function InfoPill({ 
  term, 
  definition, 
  example, 
  learnMoreUrl, 
  variant = 'outline' 
}: InfoPillProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <Info className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <Badge variant={variant} className="text-xs font-medium">
              {term}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1"
              onClick={() => setOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {definition}
            </p>
            
            {example && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-200 font-medium mb-1">
                  Example:
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {example}
                </p>
              </div>
            )}
            
            {learnMoreUrl && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
                onClick={() => window.open(learnMoreUrl, '_blank')}
              >
                Learn more →
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Pre-defined educational content for common financial terms
export const DEBT_EDUCATION = {
  apr: {
    term: 'APR',
    definition: 'Annual Percentage Rate is the yearly cost of your debt, including interest and fees. Lower APR means less money paid over time.',
    example: 'A credit card with 24% APR costs $240 per year on every $1,000 of debt carried.',
    learnMoreUrl: 'https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-purchase-apr-and-a-promotional-apr-en-54/'
  },
  minimumPayment: {
    term: 'Minimum Payment',
    definition: 'The smallest amount you must pay each month to avoid late fees. Paying only the minimum extends payoff time significantly.',
    example: 'On a $5,000 credit card debt at 18% APR, minimum payments ($100) would take 7+ years and cost $3,000+ in interest.',
    learnMoreUrl: 'https://www.creditkarma.com/credit-cards/i/minimum-payment-calculator'
  },
  avalanche: {
    term: 'Debt Avalanche',
    definition: 'Pay minimums on all debts, then put extra money toward the highest interest rate debt first. Mathematically optimal - saves the most money.',
    example: 'Credit card (24% APR) gets extra payments before auto loan (6% APR), even if auto loan balance is higher.',
    learnMoreUrl: 'https://www.nerdwallet.com/article/finance/what-is-a-debt-avalanche'
  },
  snowball: {
    term: 'Debt Snowball',
    definition: 'Pay minimums on all debts, then put extra money toward the smallest balance first. Psychologically motivating with quick wins.',
    example: 'Pay off $500 store card first, then $2,000 credit card, then $15,000 auto loan - regardless of interest rates.',
    learnMoreUrl: 'https://www.ramseysolutions.com/debt/how-the-debt-snowball-method-works'
  },
  fixedVsRevolving: {
    term: 'Fixed vs Revolving',
    definition: 'Fixed debt has set payments and payoff dates (loans). Revolving debt lets you borrow repeatedly up to a limit (credit cards).',
    example: 'Auto loan: $300/month for 60 months. Credit card: minimum varies based on balance, no fixed end date.',
    learnMoreUrl: 'https://www.experian.com/blogs/ask-experian/revolving-vs-installment-credit/'
  }
} as const

// Utility component for easy use
export function DebtInfoPill({ concept }: { concept: keyof typeof DEBT_EDUCATION }) {
  const info = DEBT_EDUCATION[concept]
  return <InfoPill {...info} />
}
