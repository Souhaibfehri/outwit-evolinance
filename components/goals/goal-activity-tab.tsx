'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Calendar, DollarSign } from 'lucide-react'
import { GoalWithProgress, getContributionSourceLabel } from '@/lib/types/goals'

interface GoalActivityTabProps {
  goals: GoalWithProgress[]
}

export function GoalActivityTab({ goals }: GoalActivityTabProps) {
  // Flatten all contributions from all goals
  const allContributions = goals.flatMap(goal => 
    goal.contributions.map(contrib => ({
      ...contrib,
      goalName: goal.name
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Goal Activity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allContributions.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No Activity Yet</h3>
              <p className="text-muted-foreground text-sm">
                Start contributing to your goals to see activity here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allContributions.map((contribution) => (
                <div 
                  key={contribution.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {contribution.goalName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {formatDate(contribution.date)}
                        <Badge variant="outline" className="text-xs">
                          {getContributionSourceLabel(contribution.source)}
                        </Badge>
                      </div>
                      {contribution.note && (
                        <div className="text-xs text-gray-500 mt-1">
                          {contribution.note}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      +{formatCurrency(contribution.amount)}
                    </div>
                    {contribution.transactionId && (
                      <div className="text-xs text-gray-500">
                        Txn: {contribution.transactionId.slice(-8)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
