'use client'

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/budget/calcs'

interface NetWorthDataPoint {
  date: string
  netWorth: number
  assets: number
  liabilities: number
}

interface NetWorthChartProps {
  data: NetWorthDataPoint[]
  timeframe: '3m' | '6m' | '12m'
  className?: string
}

export function NetWorthChart({ data, timeframe, className }: NetWorthChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No net worth data available</p>
        </div>
      </div>
    )
  }

  // Filter data based on timeframe
  const now = new Date()
  const cutoffDate = new Date()
  
  switch (timeframe) {
    case '3m':
      cutoffDate.setMonth(now.getMonth() - 3)
      break
    case '6m':
      cutoffDate.setMonth(now.getMonth() - 6)
      break
    case '12m':
      cutoffDate.setMonth(now.getMonth() - 12)
      break
  }

  const filteredData = data.filter(point => 
    new Date(point.date) >= cutoffDate
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (filteredData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <TrendingDown className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No data for {timeframe} timeframe
          </p>
        </div>
      </div>
    )
  }

  // Calculate trend
  const firstValue = filteredData[0].netWorth
  const lastValue = filteredData[filteredData.length - 1].netWorth
  const trend = lastValue >= firstValue ? 'up' : 'down'
  const trendPercentage = firstValue !== 0 ? ((lastValue - firstValue) / Math.abs(firstValue)) * 100 : 0

  // Format data for chart
  const chartData = filteredData.map(point => ({
    ...point,
    displayDate: formatDateForChart(point.date, timeframe)
  }))

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Trend Indicator */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          {trend === 'up' ? (
            <TrendingUp className="h-3 w-3 text-blue-600" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-600" />
          )}
          <span className={`font-medium ${
            trend === 'up' ? 'text-blue-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? '+' : ''}{trendPercentage.toFixed(1)}%
          </span>
        </div>
        <span className="text-muted-foreground">
          {timeframe} trend
        </span>
      </div>

      {/* Chart */}
      <div className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis 
              dataKey="displayDate" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => formatCurrencyShort(value)}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as NetWorthDataPoint
                  return (
                    <div className="bg-background border rounded-lg shadow-lg p-3">
                      <p className="font-medium text-sm mb-2">{label}</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Net Worth:</span>
                          <span className="font-semibold">{formatCurrency(data.netWorth)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Assets:</span>
                          <span className="text-blue-600">{formatCurrency(data.assets)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Liabilities:</span>
                          <span className="text-red-600">{formatCurrency(data.liabilities)}</span>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Line
              type="monotone"
              dataKey="netWorth"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ fill: '#f97316', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 4, stroke: '#f97316', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function formatDateForChart(date: string, timeframe: '3m' | '6m' | '12m'): string {
  const d = new Date(date)
  
  switch (timeframe) {
    case '3m':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    case '6m':
      return d.toLocaleDateString('en-US', { month: 'short' })
    case '12m':
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    default:
      return d.toLocaleDateString('en-US', { month: 'short' })
  }
}

function formatCurrencyShort(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value.toFixed(0)}`
}
