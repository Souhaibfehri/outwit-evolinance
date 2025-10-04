'use client'

import { Info } from 'lucide-react'
import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

interface InfoHintProps {
  title: string
  content: string
  learnMoreUrl?: string
  className?: string
  iconSize?: 'sm' | 'md' | 'lg'
}

export function InfoHint({ 
  title, 
  content, 
  learnMoreUrl, 
  className = '',
  iconSize = 'sm' 
}: InfoHintProps) {
  const [isOpen, setIsOpen] = useState(false)

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`p-1 h-auto text-muted-foreground hover:text-foreground ${className}`}
          aria-label={`Learn about ${title}`}
        >
          <Info className={iconSizes[iconSize]} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="top" align="center">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {content}
          </p>
          {learnMoreUrl && (
            <div className="pt-2 border-t">
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs"
                onClick={() => {
                  window.open(learnMoreUrl, '_blank', 'noopener,noreferrer')
                  setIsOpen(false)
                }}
              >
                Learn more →
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Predefined explanations for common financial terms
export const FINANCIAL_EXPLANATIONS = {
  rollover: {
    title: 'Rollover',
    content: 'When enabled, any unspent money in this category will carry over to next month instead of going back to "Ready to Assign". Great for irregular expenses like car maintenance or gifts.',
    learnMoreUrl: '/docs/budgeting#rollover'
  },
  
  readyToAssign: {
    title: 'Ready to Assign',
    content: 'This is your available money that hasn\'t been assigned to any category yet. It\'s calculated as: Income - Already Assigned. In zero-based budgeting, this should be $0 when you\'re done.',
    learnMoreUrl: '/docs/budgeting#ready-to-assign'
  },
  
  zeroBasedBudgeting: {
    title: 'Zero-Based Budgeting',
    content: 'Every dollar you earn gets assigned a specific job before you spend it. Your "Ready to Assign" should be $0, meaning all income is allocated to categories, savings, or debt payments.',
    learnMoreUrl: '/docs/budgeting#zero-based'
  },
  
  softBudgetLimit: {
    title: 'Soft Budget Limit',
    content: 'When enabled, you can assign more money than you have available, but you\'ll see a warning. When disabled (hard limit), you cannot over-assign at all.',
    learnMoreUrl: '/docs/budgeting#limits'
  },
  
  avalanche: {
    title: 'Debt Avalanche',
    content: 'Pay minimums on all debts, then put extra money toward the debt with the highest interest rate. This saves the most money in interest over time.',
    learnMoreUrl: '/docs/debt-payoff#avalanche'
  },
  
  snowball: {
    title: 'Debt Snowball',
    content: 'Pay minimums on all debts, then put extra money toward the smallest balance first. This gives you quick wins and psychological momentum.',
    learnMoreUrl: '/docs/debt-payoff#snowball'
  },
  
  apr: {
    title: 'APR (Annual Percentage Rate)',
    content: 'The yearly cost of borrowing money, expressed as a percentage. Higher APR means you pay more in interest. Credit cards typically have higher APRs than mortgages.',
    learnMoreUrl: '/docs/debt#apr'
  },
  
  minimumPayment: {
    title: 'Minimum Payment',
    content: 'The smallest amount you must pay each month to keep your account in good standing. Paying only the minimum means you\'ll pay much more in interest over time.',
    learnMoreUrl: '/docs/debt#minimum-payments'
  },
  
  fixedPayment: {
    title: 'Fixed Payment',
    content: 'A set amount you pay each month that doesn\'t change, like a car loan or mortgage. Different from minimum payments which can vary based on your balance.',
    learnMoreUrl: '/docs/debt#fixed-payments'
  },
  
  emergencyFund: {
    title: 'Emergency Fund',
    content: 'Money set aside for unexpected expenses like car repairs, medical bills, or job loss. Most experts recommend 3-6 months of expenses.',
    learnMoreUrl: '/docs/goals#emergency-fund'
  },
  
  savingsRate: {
    title: 'Savings Rate',
    content: 'The percentage of your income that you save or invest each month. Calculated as (Income - Expenses) / Income. A good target is 20% or more.',
    learnMoreUrl: '/docs/reports#savings-rate'
  },
  
  netWorth: {
    title: 'Net Worth',
    content: 'Your total assets (what you own) minus your total debts (what you owe). This is a key measure of your overall financial health.',
    learnMoreUrl: '/docs/reports#net-worth'
  },
  
  compoundInterest: {
    title: 'Compound Interest',
    content: 'When your investments earn returns, and those returns also earn returns. Einstein allegedly called it "the eighth wonder of the world." Time is your best friend here.',
    learnMoreUrl: '/docs/investing#compound-interest'
  }
} as const

export type FinancialTerm = keyof typeof FINANCIAL_EXPLANATIONS
