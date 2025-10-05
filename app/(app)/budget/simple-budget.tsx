'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  DollarSign, 
  Plus, 
  TrendingUp,
  AlertCircle,
  Settings,
  PiggyBank,
  Target
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/budget/calcs'

interface SimpleBudgetData {
  currentMonth: string
  expectedIncome: number
  totalAssigned: number
  totalSpent: number
  readyToAssign: number
  categories: Array<{
    id: string
    name: string
    assigned: number
    spent: number
    available: number
    groupName: string
  }>
}

export function SimpleBudget() {
  const [budgetData, setBudgetData] = useState<SimpleBudgetData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBudgetData()
  }, [])

  const fetchBudgetData = async () => {
    try {
      const response = await fetch('/api/budget')
      const data = await response.json()
      
      if (data.success) {
        // Transform the data to our simple format
        const categories = (data.categories || []).map((cat: any) => {
          const budgetItem = (data.budgetItems || []).find((item: any) => 
            item.categoryId === cat.id
          )
          const assigned = budgetItem ? parseFloat(budgetItem.assigned) || 0 : 0
          const spent = budgetItem ? parseFloat(budgetItem.spent) || 0 : 0
          
          return {
            id: cat.id,
            name: cat.name,
            assigned,
            spent,
            available: assigned - spent,
            groupName: cat.groupName || 'Other'
          }
        })

        setBudgetData({
          currentMonth: data.budgetMonth?.month || getCurrentMonth(),
          expectedIncome: data.budgetMonth?.expectedIncome || 0,
          totalAssigned: categories.reduce((sum: number, cat: any) => sum + cat.assigned, 0),
          totalSpent: categories.reduce((sum: number, cat: any) => sum + cat.spent, 0),
          readyToAssign: (data.budgetMonth?.expectedIncome || 0) - categories.reduce((sum: number, cat: any) => sum + cat.assigned, 0),
          categories
        })
      } else {
        toast.error('Failed to load budget data')
      }
    } catch (error) {
      console.error('Error fetching budget:', error)
      toast.error('Failed to load budget')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDefaults = async () => {
    try {
      const response = await fetch('/api/budget/seed-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        toast.success('Default categories created!')
        fetchBudgetData()
      } else {
        toast.error('Failed to create categories')
      }
    } catch (error) {
      console.error('Error creating defaults:', error)
      toast.error('Failed to create categories')
    }
  }

  const handleAssignFunds = async (categoryId: string, amount: number) => {
    try {
      const response = await fetch('/api/budget/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          month: budgetData?.currentMonth,
          amount
        })
      })
      
      if (response.ok) {
        toast.success('Funds assigned successfully')
        fetchBudgetData()
      } else {
        toast.error('Failed to assign funds')
      }
    } catch (error) {
      console.error('Error assigning funds:', error)
      toast.error('Failed to assign funds')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!budgetData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Budget</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading your budget data.
          </p>
          <Button onClick={fetchBudgetData}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const rtaStatus = budgetData.readyToAssign > 0 ? 'needs_allocation' : 
                   budgetData.readyToAssign < 0 ? 'over_allocated' : 'zero_based'

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ready to Assign</p>
                <p className={`text-2xl font-bold ${
                  rtaStatus === 'needs_allocation' ? 'text-orange-600' :
                  rtaStatus === 'over_allocated' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {formatCurrency(Math.abs(budgetData.readyToAssign))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {rtaStatus === 'needs_allocation' ? 'Needs allocation' :
                   rtaStatus === 'over_allocated' ? 'Over-allocated' : 'Zero-based ✓'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expected Income</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(budgetData.expectedIncome)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Assigned</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(budgetData.totalAssigned)}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-gray-600">
                  {formatCurrency(budgetData.totalSpent)}
                </p>
              </div>
              <PiggyBank className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Budget Categories</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCreateDefaults}>
                <Plus className="h-4 w-4 mr-2" />
                Create Defaults
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {budgetData.categories.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Categories Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create budget categories to start tracking your spending
              </p>
              <Button onClick={handleCreateDefaults} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Default Categories
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {budgetData.categories.map(category => (
                <div key={category.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        category.available < 0 ? 'bg-red-500' :
                        category.available < category.assigned * 0.1 ? 'bg-orange-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <h4 className="font-medium">{category.name}</h4>
                        <p className="text-sm text-muted-foreground">{category.groupName}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-semibold ${
                        category.available < 0 ? 'text-red-600' :
                        category.available < category.assigned * 0.1 ? 'text-orange-600' : 'text-blue-600'
                      }`}>
                        {formatCurrency(category.available)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(category.spent)} of {formatCurrency(category.assigned)}
                      </p>
                    </div>
                  </div>
                  
                  {category.assigned > 0 && (
                    <div className="mt-3">
                      <Progress 
                        value={Math.min(100, (category.spent / category.assigned) * 100)} 
                        className="h-2"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const amount = prompt(`Assign amount to ${category.name}:`)
                        if (amount) {
                          handleAssignFunds(category.id, parseFloat(amount))
                        }
                      }}
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      Assign
                    </Button>
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

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
