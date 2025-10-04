'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { PieChart } from 'lucide-react'

interface CategoryData {
  name: string
  amount: number
  percentage: number
  color: string
  trend: 'up' | 'down' | 'stable'
  change: number
}

export function CategoryBreakdown() {
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategoryData() {
      try {
        // Mock data for now - would fetch from /api/reports/categories
        const mockCategories: CategoryData[] = [
          {
            name: 'Housing',
            amount: 1200,
            percentage: 38.5,
            color: '#ef4444',
            trend: 'stable',
            change: 0.5
          },
          {
            name: 'Groceries',
            amount: 450,
            percentage: 14.4,
            color: '#f97316',
            trend: 'down',
            change: -5.2
          },
          {
            name: 'Transportation',
            amount: 380,
            percentage: 12.2,
            color: '#eab308',
            trend: 'up',
            change: 8.1
          },
          {
            name: 'Entertainment',
            amount: 320,
            percentage: 10.3,
            color: '#22c55e',
            trend: 'up',
            change: 15.3
          },
          {
            name: 'Utilities',
            amount: 280,
            percentage: 9.0,
            color: '#3b82f6',
            trend: 'stable',
            change: -1.2
          },
          {
            name: 'Shopping',
            amount: 220,
            percentage: 7.1,
            color: '#8b5cf6',
            trend: 'down',
            change: -12.5
          },
          {
            name: 'Dining Out',
            amount: 180,
            percentage: 5.8,
            color: '#ec4899',
            trend: 'up',
            change: 3.7
          },
          {
            name: 'Other',
            amount: 85,
            percentage: 2.7,
            color: '#6b7280',
            trend: 'stable',
            change: 0.8
          }
        ]

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        setCategories(mockCategories)
      } catch (error) {
        console.error('Error fetching category data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategoryData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-red-600'
      case 'down': return 'text-green-600'
      default: return 'text-muted-foreground'
    }
  }

  const getTrendSymbol = (trend: string, change: number) => {
    if (Math.abs(change) < 2) return '→'
    return trend === 'up' ? '↗' : '↘'
  }

  if (loading) {
    return <CategoryBreakdownSkeleton />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Category Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No category data</h3>
            <p className="text-muted-foreground text-sm">
              Add transactions with categories to see the breakdown.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pie Chart Representation */}
            <div className="relative h-4 bg-muted rounded-full overflow-hidden">
              {categories.reduce((acc, category, index) => {
                const segments = [...acc]
                const startPercentage = segments.reduce((sum, seg) => sum + seg.percentage, 0)
                
                segments.push(
                  <div
                    key={category.name}
                    className="absolute h-full"
                    style={{
                      backgroundColor: category.color,
                      left: `${startPercentage}%`,
                      width: `${category.percentage}%`
                    }}
                    title={`${category.name}: ${category.percentage.toFixed(1)}%`}
                  />
                )
                
                return segments
              }, [] as React.ReactElement[])}
            </div>

            {/* Category List */}
            <div className="space-y-3">
              {categories.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <Progress 
                      value={category.percentage} 
                      className="flex-1 max-w-32"
                      style={{ 
                        backgroundColor: `${category.color}20`,
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(category.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {category.percentage.toFixed(1)}%
                      </p>
                    </div>
                    
                    <div className={`flex items-center text-xs ${getTrendColor(category.trend)}`}>
                      <span className="mr-1">
                        {getTrendSymbol(category.trend, category.change)}
                      </span>
                      <span>
                        {Math.abs(category.change).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Monthly Spending</span>
                <span className="font-medium">
                  {formatCurrency(categories.reduce((sum, cat) => sum + cat.amount, 0))}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CategoryBreakdownSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded-full animate-pulse" />
          
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-muted rounded-full animate-pulse" />
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-2 w-32 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="h-4 w-16 bg-muted rounded animate-pulse mb-1" />
                    <div className="h-3 w-8 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-8 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
