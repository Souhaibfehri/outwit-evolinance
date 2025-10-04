'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SpendingData {
  month: string
  categories: Array<{
    name: string
    amount: number
    color: string
  }>
  total: number
}

export function SpendingChart() {
  const [data, setData] = useState<SpendingData[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMonths, setViewMonths] = useState(6)

  useEffect(() => {
    async function fetchSpendingData() {
      try {
        // Mock data for now - would fetch from /api/reports/spending
        const mockData: SpendingData[] = [
          {
            month: '2024-01',
            categories: [
              { name: 'Housing', amount: 1200, color: '#ef4444' },
              { name: 'Groceries', amount: 450, color: '#f97316' },
              { name: 'Transportation', amount: 300, color: '#eab308' },
              { name: 'Entertainment', amount: 200, color: '#22c55e' },
              { name: 'Utilities', amount: 150, color: '#3b82f6' }
            ],
            total: 2300
          },
          {
            month: '2023-12',
            categories: [
              { name: 'Housing', amount: 1200, color: '#ef4444' },
              { name: 'Groceries', amount: 520, color: '#f97316' },
              { name: 'Transportation', amount: 280, color: '#eab308' },
              { name: 'Entertainment', amount: 350, color: '#22c55e' },
              { name: 'Utilities', amount: 180, color: '#3b82f6' }
            ],
            total: 2530
          },
          {
            month: '2023-11',
            categories: [
              { name: 'Housing', amount: 1200, color: '#ef4444' },
              { name: 'Groceries', amount: 480, color: '#f97316' },
              { name: 'Transportation', amount: 320, color: '#eab308' },
              { name: 'Entertainment', amount: 180, color: '#22c55e' },
              { name: 'Utilities', amount: 160, color: '#3b82f6' }
            ],
            total: 2340
          }
        ]

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        setData(mockData)
      } catch (error) {
        console.error('Error fetching spending data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSpendingData()
  }, [viewMonths])

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
      month: 'short',
      year: 'numeric'
    })
  }

  const maxTotal = Math.max(...data.map(d => d.total))

  if (loading) {
    return <SpendingChartSkeleton />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Spending by Category
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMonths === 3 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMonths(3)}
            >
              3M
            </Button>
            <Button
              variant={viewMonths === 6 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMonths(6)}
            >
              6M
            </Button>
            <Button
              variant={viewMonths === 12 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMonths(12)}
            >
              12M
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No spending data</h3>
            <p className="text-muted-foreground text-sm">
              Add some transactions to see your spending patterns.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Chart Area */}
            <div className="space-y-4">
              {data.slice(0, viewMonths).reverse().map((monthData) => (
                <div key={monthData.month} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {formatMonth(monthData.month)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(monthData.total)}
                    </span>
                  </div>
                  
                  {/* Stacked Bar */}
                  <div className="h-8 bg-muted rounded-lg overflow-hidden flex">
                    {monthData.categories.map((category) => {
                      const percentage = (category.amount / monthData.total) * 100
                      return (
                        <div
                          key={category.name}
                          className="h-full flex items-center justify-center text-xs text-white font-medium"
                          style={{
                            backgroundColor: category.color,
                            width: `${percentage}%`,
                            minWidth: percentage > 10 ? 'auto' : '0'
                          }}
                          title={`${category.name}: ${formatCurrency(category.amount)} (${percentage.toFixed(1)}%)`}
                        >
                          {percentage > 15 && category.name}
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Category Details */}
                  <div className="flex flex-wrap gap-2">
                    {monthData.categories.map((category) => (
                      <Badge
                        key={category.name}
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: category.color }}
                      >
                        {category.name}: {formatCurrency(category.amount)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Category Legend</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {data[0]?.categories.map((category) => (
                  <div key={category.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm">{category.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SpendingChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          <div className="flex items-center gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 w-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-8 bg-muted rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
