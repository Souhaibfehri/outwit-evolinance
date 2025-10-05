'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { CostToBeMeCalculation } from '@/lib/targets/engine'
import { formatCurrency } from '@/lib/budget/calcs'

interface CostToBeMeProps {
  calculation: CostToBeMeCalculation
  className?: string
}

export function CostToBeMe({ calculation, className }: CostToBeMeProps) {
  const utilizationPercentage = calculation.expectedIncome > 0 ? 
    (calculation.totalNeeded / calculation.expectedIncome) * 100 : 0

  const isOverBudget = calculation.surplus < 0
  const hasUnderfunded = calculation.totalUnderfunded > 0

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-orange-600" />
          Cost to Be Me
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Comparison */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Expected Income</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(calculation.expectedIncome)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Target Needs</span>
            <span className="font-semibold text-blue-600">
              {formatCurrency(calculation.totalNeeded)}
            </span>
          </div>
          
          <div className="border-t pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Surplus/Deficit</span>
              <div className="flex items-center gap-1">
                {isOverBudget ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                )}
                <span className={`font-bold ${
                  isOverBudget ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatCurrency(Math.abs(calculation.surplus))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Income Utilization</span>
            <span className="font-medium">{utilizationPercentage.toFixed(1)}%</span>
          </div>
          <Progress 
            value={Math.min(100, utilizationPercentage)} 
            className="h-2"
          />
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          {isOverBudget && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Over Budget
            </Badge>
          )}
          
          {hasUnderfunded && (
            <Badge variant="secondary" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              {calculation.categories.filter(c => c.isUnderfunded).length} Underfunded
            </Badge>
          )}
          
          {!isOverBudget && !hasUnderfunded && (
            <Badge variant="outline" className="text-xs text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              All Targets Met
            </Badge>
          )}
        </div>

        {/* Underfunded Categories */}
        {hasUnderfunded && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Underfunded Categories
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {calculation.categories
                .filter(c => c.isUnderfunded)
                .slice(0, 5)
                .map(category => (
                  <div key={category.categoryId} className="flex items-center justify-between text-xs">
                    <span className="truncate flex-1 mr-2">{category.categoryName}</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(category.needed)}
                    </span>
                  </div>
                ))}
              {calculation.categories.filter(c => c.isUnderfunded).length > 5 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{calculation.categories.filter(c => c.isUnderfunded).length - 5} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Active Targets</div>
            <div className="font-semibold text-sm">
              {calculation.categories.filter(c => !c.isSnoozed).length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Total Target Amount</div>
            <div className="font-semibold text-sm">
              {formatCurrency(calculation.totalTargetAmount)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
