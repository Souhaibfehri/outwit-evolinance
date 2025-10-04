'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InfoHint, FINANCIAL_EXPLANATIONS } from '@/components/ui/info-hint'
import { 
  DollarSign, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BudgetSummary {
  expectedIncome: number
  totalAssigned: number
  totalSpent: number
  readyToAssign: number
  isOverAllocated: boolean
  allowOverAssign: boolean
}

interface BudgetHeaderProps {
  summary: BudgetSummary
  month: string
  onCreateDefaults: () => void
  onToggleOverAssign: (allow: boolean) => void
  hasCategories: boolean
}

export function BudgetHeader({ 
  summary, 
  month, 
  onCreateDefaults, 
  onToggleOverAssign,
  hasCategories 
}: BudgetHeaderProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })
  }

  const getReadyToAssignStatus = () => {
    if (summary.readyToAssign === 0) {
      return { color: 'text-green-600', message: 'Perfect! Zero-based ✨', icon: CheckCircle }
    } else if (summary.readyToAssign > 0) {
      return { color: 'text-blue-600', message: 'Unassigned money', icon: Target }
    } else {
      return { color: 'text-red-600', message: 'Over-allocated!', icon: AlertTriangle }
    }
  }

  const rtaStatus = getReadyToAssignStatus()
  const StatusIcon = rtaStatus.icon

  return (
    <div className="space-y-6">
      {/* Month Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget</h1>
          <p className="text-muted-foreground">
            {formatMonth(month)} - Zero-based budgeting
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!hasCategories && (
            <Button onClick={onCreateDefaults} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Default Categories
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Over-allocation Alert */}
      {summary.isOverAllocated && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between w-full">
            <div>
              <span className="font-medium">Budget Over-Allocated</span>
              <span className="ml-2">
                You've assigned {formatCurrency(Math.abs(summary.readyToAssign))} more than you have available.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">Allow over-assign:</span>
              <input
                type="checkbox"
                checked={summary.allowOverAssign}
                onChange={(e) => onToggleOverAssign(e.target.checked)}
                className="rounded"
              />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Budget Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Expected Income */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Income</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.expectedIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              From recurring sources
            </p>
          </CardContent>
        </Card>

        {/* Ready to Assign */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Ready to Assign</CardTitle>
              <InfoHint
                title={FINANCIAL_EXPLANATIONS.readyToAssign.title}
                content={FINANCIAL_EXPLANATIONS.readyToAssign.content}
                learnMoreUrl={FINANCIAL_EXPLANATIONS.readyToAssign.learnMoreUrl}
              />
            </div>
            <StatusIcon className={cn('h-4 w-4', rtaStatus.color)} />
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', rtaStatus.color)}>
              {formatCurrency(summary.readyToAssign)}
            </div>
            <p className="text-xs text-muted-foreground">
              {rtaStatus.message}
            </p>
          </CardContent>
        </Card>

        {/* Total Assigned */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(summary.totalAssigned)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>

        {/* Total Spent */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(summary.totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month so far
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Zero-Based Budget Explanation */}
      {summary.readyToAssign !== 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <InfoHint
                  title={FINANCIAL_EXPLANATIONS.zeroBasedBudgeting.title}
                  content={FINANCIAL_EXPLANATIONS.zeroBasedBudgeting.content}
                  learnMoreUrl={FINANCIAL_EXPLANATIONS.zeroBasedBudgeting.learnMoreUrl}
                  iconSize="md"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Zero-Based Budgeting Tip
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {summary.readyToAssign > 0 
                    ? `You have ${formatCurrency(summary.readyToAssign)} unassigned. Give every dollar a job by assigning it to categories, savings, or debt payments.`
                    : `You're over-allocated by ${formatCurrency(Math.abs(summary.readyToAssign))}. Reduce assignments or increase your expected income.`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
