'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ExternalLink, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { formatCurrency } from '@/lib/budget/calcs'

interface HeatmapCell {
  month: string
  categoryId: string
  categoryName: string
  status: 'funded' | 'needs' | 'overspent' | 'forecast_risk' | 'no_data'
  assigned: number
  spent: number
  available: number
  utilization: number // percentage
}

interface BudgetHeatmapProps {
  data: HeatmapCell[]
  className?: string
}

export function BudgetHeatmap({ data, className }: BudgetHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null)

  // Group data by category and month
  const categories = Array.from(new Set(data.map(cell => cell.categoryName)))
  const months = Array.from(new Set(data.map(cell => cell.month))).sort()

  const getCellData = (categoryName: string, month: string): HeatmapCell | null => {
    return data.find(cell => cell.categoryName === categoryName && cell.month === month) || null
  }

  const getCellColor = (status: HeatmapCell['status']): string => {
    switch (status) {
      case 'funded': return 'bg-blue-500'
      case 'needs': return 'bg-orange-500'
      case 'overspent': return 'bg-red-500'
      case 'forecast_risk': return 'bg-purple-500'
      case 'no_data': return 'bg-gray-200 dark:bg-gray-700'
      default: return 'bg-gray-200 dark:bg-gray-700'
    }
  }

  const getStatusLabel = (status: HeatmapCell['status']): string => {
    switch (status) {
      case 'funded': return 'Fully Funded'
      case 'needs': return 'Needs Funding'
      case 'overspent': return 'Overspent'
      case 'forecast_risk': return 'Forecast Risk'
      case 'no_data': return 'No Data'
      default: return 'Unknown'
    }
  }

  if (data.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Budget Data</h3>
        <p className="text-muted-foreground">
          Start budgeting to see your heatmap visualization
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Legend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Funded</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>Needs</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Overspent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span>Risk</span>
          </div>
        </div>
        
        <Badge variant="outline" className="text-xs">
          {categories.length} categories × {months.length} months
        </Badge>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <TooltipProvider>
          <div className="inline-block min-w-full">
            {/* Month Headers */}
            <div className="flex">
              <div className="w-32 flex-shrink-0"></div> {/* Category name space */}
              {months.map(month => (
                <div key={month} className="w-12 text-center text-xs font-medium p-1">
                  {new Date(month + '-01').toLocaleDateString('en-US', { 
                    month: 'short',
                    year: '2-digit'
                  })}
                </div>
              ))}
            </div>

            {/* Category Rows */}
            <div className="space-y-1">
              {categories.map((categoryName, categoryIndex) => (
                <motion.div
                  key={categoryName}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: categoryIndex * 0.05 }}
                  className="flex items-center"
                >
                  {/* Category Name */}
                  <div className="w-32 flex-shrink-0 text-xs font-medium truncate pr-2">
                    {categoryName}
                  </div>

                  {/* Month Cells */}
                  <div className="flex gap-1">
                    {months.map(month => {
                      const cellData = getCellData(categoryName, month)
                      return (
                        <Tooltip key={month}>
                          <TooltipTrigger asChild>
                            <button
                              className={`w-10 h-6 rounded transition-all hover:scale-110 ${
                                getCellColor(cellData?.status || 'no_data')
                              } ${
                                selectedCell?.categoryName === categoryName && selectedCell?.month === month
                                  ? 'ring-2 ring-orange-600 ring-offset-1'
                                  : ''
                              }`}
                              onClick={() => setSelectedCell(cellData)}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <div className="font-medium">{categoryName}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(month + '-01').toLocaleDateString('en-US', { 
                                  month: 'long', 
                                  year: 'numeric' 
                                })}
                              </div>
                              {cellData && (
                                <>
                                  <div className="text-xs">
                                    Status: <span className="font-medium">{getStatusLabel(cellData.status)}</span>
                                  </div>
                                  <div className="text-xs">
                                    Assigned: <span className="font-medium">{formatCurrency(cellData.assigned)}</span>
                                  </div>
                                  <div className="text-xs">
                                    Spent: <span className="font-medium">{formatCurrency(cellData.spent)}</span>
                                  </div>
                                  <div className="text-xs">
                                    Available: <span className={`font-medium ${
                                      cellData.available >= 0 ? 'text-blue-600' : 'text-red-600'
                                    }`}>
                                      {formatCurrency(cellData.available)}
                                    </span>
                                  </div>
                                  {cellData.utilization > 0 && (
                                    <div className="text-xs">
                                      Utilization: <span className="font-medium">{cellData.utilization.toFixed(1)}%</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </TooltipProvider>
      </div>

      {/* Selected Cell Details */}
      {selectedCell && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-muted rounded-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold">{selectedCell.categoryName}</h4>
              <p className="text-sm text-muted-foreground">
                {new Date(selectedCell.month + '-01').toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
            <Badge variant={
              selectedCell.status === 'funded' ? 'default' :
              selectedCell.status === 'needs' ? 'secondary' :
              selectedCell.status === 'overspent' ? 'destructive' :
              selectedCell.status === 'forecast_risk' ? 'outline' : 'outline'
            }>
              {getStatusLabel(selectedCell.status)}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Assigned</p>
              <p className="font-semibold">{formatCurrency(selectedCell.assigned)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Spent</p>
              <p className="font-semibold">{formatCurrency(selectedCell.spent)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Available</p>
              <p className={`font-semibold ${
                selectedCell.available >= 0 ? 'text-blue-600' : 'text-red-600'
              }`}>
                {formatCurrency(selectedCell.available)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-muted-foreground">
              Click to view detailed breakdown
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/budget?month=${selectedCell.month}&category=${selectedCell.categoryId}`}>
                <ExternalLink className="h-3 w-3 mr-1" />
                View Details
              </Link>
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
