'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  TrendingUp, 
  DollarSign,
  BarChart3
} from 'lucide-react'
import { formatCurrency } from '@/lib/budget/calcs'

interface SimpleForecastData {
  month: string
  income: number
  expenses: number
  rta: number
  netCashFlow: number
}

export function SimpleForecast() {
  const [forecastData, setForecastData] = useState<SimpleForecastData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    generateSimpleForecast()
  }, [])

  const generateSimpleForecast = () => {
    // Generate 12 months of simple forecast data
    const data: SimpleForecastData[] = []
    const currentDate = new Date()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate)
      date.setMonth(date.getMonth() + i)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      // Simple mock data - in real app this would come from API
      const baseIncome = 5000 + (Math.random() * 1000 - 500)
      const baseExpenses = 4200 + (Math.random() * 800 - 400)
      const rta = baseIncome - baseExpenses
      
      data.push({
        month,
        income: baseIncome,
        expenses: baseExpenses,
        rta,
        netCashFlow: baseIncome - baseExpenses
      })
    }
    
    setForecastData(data)
    setLoading(false)
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

  const avgIncome = forecastData.reduce((sum, d) => sum + d.income, 0) / forecastData.length
  const avgRTA = forecastData.reduce((sum, d) => sum + d.rta, 0) / forecastData.length
  const totalNetCashFlow = forecastData.reduce((sum, d) => sum + d.netCashFlow, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Monthly Income</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(avgIncome)}
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
                <p className="text-sm font-medium text-muted-foreground">Avg Ready to Assign</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(avgRTA)}
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
                <p className="text-sm font-medium text-muted-foreground">12-Month Net Flow</p>
                <p className={`text-2xl font-bold ${
                  totalNetCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {formatCurrency(totalNetCashFlow)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            12-Month Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Month</th>
                  <th className="text-right p-2 font-medium">Income</th>
                  <th className="text-right p-2 font-medium">Expenses</th>
                  <th className="text-right p-2 font-medium">Ready to Assign</th>
                  <th className="text-right p-2 font-medium">Net Cash Flow</th>
                </tr>
              </thead>
              <tbody>
                {forecastData.map((month, index) => (
                  <tr key={month.month} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">
                      {new Date(month.month + '-01').toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="p-2 text-right text-blue-600 font-medium">
                      {formatCurrency(month.income)}
                    </td>
                    <td className="p-2 text-right text-gray-600">
                      {formatCurrency(month.expenses)}
                    </td>
                    <td className={`p-2 text-right font-medium ${
                      month.rta >= 0 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(month.rta)}
                    </td>
                    <td className={`p-2 text-right font-medium ${
                      month.netCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(month.netCashFlow)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Note */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            <span>
              This is a simplified forecast view. Advanced features like scenario planning and 
              editable projections will be available in future updates.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
