'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Download,
  Settings
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ForecastMonth, ForecastCategory, ForecastOptions } from '@/lib/forecast/engine'
import { formatCurrency } from '@/lib/budget/calcs'
import { getCurrentMonth } from '@/lib/types/budget-v2'

interface ForecastTimelineProps {
  initialForecast?: ForecastMonth[]
  onOverrideChange?: (month: string, categoryId: string | null, deltaAmount: number) => void
}

export function ForecastTimeline({ initialForecast = [], onOverrideChange }: ForecastTimelineProps) {
  const [forecast, setForecast] = useState<ForecastMonth[]>(initialForecast)
  const [loading, setLoading] = useState(false)
  const [showOverridesOnly, setShowOverridesOnly] = useState(false)
  const [editingCell, setEditingCell] = useState<{ month: string; categoryId: string | null } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [options, setOptions] = useState<ForecastOptions>({
    includeOverrides: true,
    seasonalityFactor: true,
    confidenceThreshold: 'moderate'
  })

  const currentMonth = getCurrentMonth()

  useEffect(() => {
    if (initialForecast.length === 0) {
      fetchForecast()
    }
  }, [])

  const fetchForecast = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        includeOverrides: options.includeOverrides.toString(),
        seasonalityFactor: options.seasonalityFactor.toString(),
        confidenceThreshold: options.confidenceThreshold
      })

      const response = await fetch(`/api/forecast?${params}`)
      const data = await response.json()

      if (data.success) {
        setForecast(data.forecast)
      } else {
        toast.error('Failed to load forecast')
      }
    } catch (error) {
      console.error('Error fetching forecast:', error)
      toast.error('Failed to load forecast')
    } finally {
      setLoading(false)
    }
  }

  const handleCellEdit = (month: string, categoryId: string | null, currentValue: number) => {
    setEditingCell({ month, categoryId })
    setEditValue(currentValue.toString())
  }

  const handleSaveEdit = async () => {
    if (!editingCell) return

    const deltaAmount = parseFloat(editValue) || 0
    
    try {
      const response = await fetch('/api/forecast/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: editingCell.month,
          categoryId: editingCell.categoryId,
          deltaAmount,
          note: `Manual adjustment: ${deltaAmount >= 0 ? '+' : ''}${formatCurrency(deltaAmount)}`
        })
      })

      const data = await response.json()

      if (data.success) {
        // Update local forecast
        setForecast(prev => prev.map(monthData => {
          if (monthData.month !== editingCell.month) return monthData

          if (editingCell.categoryId === null) {
            // Income override
            const newIncome = monthData.income + deltaAmount
            const newRTA = newIncome - monthData.totalAssigned
            return {
              ...monthData,
              income: newIncome,
              rta: newRTA,
              netCashFlow: newIncome - monthData.totalSpent
            }
          } else {
            // Category override
            const updatedCategories = monthData.categories.map(cat => {
              if (cat.categoryId === editingCell.categoryId) {
                return {
                  ...cat,
                  override: deltaAmount,
                  final: cat.baseline + deltaAmount
                }
              }
              return cat
            })

            const newTotalAssigned = updatedCategories.reduce((sum, cat) => sum + cat.final, 0)
            const newRTA = monthData.income - newTotalAssigned

            return {
              ...monthData,
              categories: updatedCategories,
              totalAssigned: newTotalAssigned,
              rta: newRTA
            }
          }
        }))

        onOverrideChange?.(editingCell.month, editingCell.categoryId, deltaAmount)
        toast.success('Override saved successfully')
      } else {
        toast.error('Failed to save override')
      }
    } catch (error) {
      console.error('Error saving override:', error)
      toast.error('Failed to save override')
    }

    setEditingCell(null)
    setEditValue('')
  }

  const handleCancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const groupedCategories = forecast.length > 0 ? 
    groupCategoriesByGroup(forecast[0].categories) : {}

  const futureMonths = forecast.filter(m => m.month > currentMonth)
  const pastMonths = forecast.filter(m => m.month <= currentMonth)

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

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                12-Month Forecast
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Predictive cashflow timeline with editable what-if scenarios
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchForecast}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={showOverridesOnly}
                  onCheckedChange={setShowOverridesOnly}
                />
                <label className="text-sm font-medium">Show Overrides Only</label>
              </div>
              
              <Select
                value={options.confidenceThreshold}
                onValueChange={(value: any) => 
                  setOptions(prev => ({ ...prev, confidenceThreshold: value }))
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="optimistic">Optimistic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                Past 6 months
              </Badge>
              <Badge variant="outline" className="text-blue-600">
                <Calendar className="h-3 w-3 mr-1" />
                Next 12 months
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Monthly Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(futureMonths.reduce((sum, m) => sum + m.income, 0) / futureMonths.length)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg RTA</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(futureMonths.reduce((sum, m) => sum + m.rta, 0) / futureMonths.length)}
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
                <p className="text-sm font-medium text-muted-foreground">Net Cashflow</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(futureMonths.reduce((sum, m) => sum + m.netCashFlow, 0))}
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
                <p className="text-sm font-medium text-muted-foreground">Active Overrides</p>
                <p className="text-2xl font-bold text-purple-600">
                  {forecast.reduce((count, month) => 
                    count + month.categories.filter(cat => cat.override !== undefined).length, 0
                  )}
                </p>
              </div>
              <Edit3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background">Category</TableHead>
                  {forecast.map(month => (
                    <TableHead key={month.month} className="text-center min-w-24">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {new Date(month.month + '-01').toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: '2-digit' 
                          })}
                        </span>
                        {month.month <= currentMonth && (
                          <Badge variant="outline" className="text-xs mt-1">Actual</Badge>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Income Row */}
                <TableRow className="bg-green-50 dark:bg-green-950/20">
                  <TableCell className="sticky left-0 bg-green-50 dark:bg-green-950/20 font-medium">
                    💰 Income
                  </TableCell>
                  {forecast.map(month => (
                    <TableCell key={month.month} className="text-center">
                      <ForecastCell
                        value={month.income}
                        month={month.month}
                        categoryId={null}
                        isEditing={editingCell?.month === month.month && editingCell?.categoryId === null}
                        editValue={editValue}
                        onEdit={handleCellEdit}
                        onSave={handleSaveEdit}
                        onCancel={handleCancelEdit}
                        onEditValueChange={setEditValue}
                        isReadOnly={month.month <= currentMonth}
                      />
                    </TableCell>
                  ))}
                </TableRow>

                {/* RTA Row */}
                <TableRow className="bg-orange-50 dark:bg-orange-950/20">
                  <TableCell className="sticky left-0 bg-orange-50 dark:bg-orange-950/20 font-medium">
                    🎯 Ready to Assign
                  </TableCell>
                  {forecast.map(month => (
                    <TableCell key={month.month} className="text-center">
                      <span className={`font-medium ${
                        month.rta < 0 ? 'text-red-600' : 
                        month.rta > 0 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(month.rta)}
                      </span>
                    </TableCell>
                  ))}
                </TableRow>

                {/* Category Groups */}
                {Object.entries(groupedCategories).map(([groupName, categories]) => (
                  <React.Fragment key={groupName}>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={forecast.length + 1} className="font-semibold text-sm">
                        📁 {groupName}
                      </TableCell>
                    </TableRow>
                    {categories.map(category => (
                      <TableRow key={category.categoryId}>
                        <TableCell className="sticky left-0 bg-background pl-6">
                          <div className="flex items-center gap-2">
                            <span>{category.categoryName}</span>
                            {category.confidence && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  category.confidence === 'high' ? 'text-green-600' :
                                  category.confidence === 'medium' ? 'text-yellow-600' : 'text-red-600'
                                }`}
                              >
                                {category.confidence}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        {forecast.map(month => {
                          const monthCategory = month.categories.find(c => c.categoryId === category.categoryId)
                          return (
                            <TableCell key={month.month} className="text-center">
                              <ForecastCell
                                value={monthCategory?.final || 0}
                                baseline={monthCategory?.baseline}
                                override={monthCategory?.override}
                                month={month.month}
                                categoryId={category.categoryId}
                                isEditing={editingCell?.month === month.month && editingCell?.categoryId === category.categoryId}
                                editValue={editValue}
                                onEdit={handleCellEdit}
                                onSave={handleSaveEdit}
                                onCancel={handleCancelEdit}
                                onEditValueChange={setEditValue}
                                isReadOnly={month.month <= currentMonth}
                                showOverridesOnly={showOverridesOnly}
                              />
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ForecastCellProps {
  value: number
  baseline?: number
  override?: number
  month: string
  categoryId: string | null
  isEditing: boolean
  editValue: string
  onEdit: (month: string, categoryId: string | null, currentValue: number) => void
  onSave: () => void
  onCancel: () => void
  onEditValueChange: (value: string) => void
  isReadOnly?: boolean
  showOverridesOnly?: boolean
}

function ForecastCell({
  value,
  baseline,
  override,
  month,
  categoryId,
  isEditing,
  editValue,
  onEdit,
  onSave,
  onCancel,
  onEditValueChange,
  isReadOnly = false,
  showOverridesOnly = false
}: ForecastCellProps) {
  const hasOverride = override !== undefined && override !== 0
  const displayValue = showOverridesOnly ? (override || 0) : value

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          className="w-20 h-8 text-xs text-center"
          type="number"
          step="0.01"
        />
        <Button size="sm" variant="ghost" onClick={onSave} className="h-6 w-6 p-0">
          <Save className="h-3 w-3 text-green-600" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-6 w-6 p-0">
          <X className="h-3 w-3 text-red-600" />
        </Button>
      </div>
    )
  }

  return (
    <div className="group relative">
      <button
        onClick={() => !isReadOnly && onEdit(month, categoryId, displayValue)}
        disabled={isReadOnly}
        className={`text-sm font-medium hover:bg-muted/50 px-2 py-1 rounded transition-colors ${
          hasOverride ? 'text-purple-600 font-semibold' : ''
        } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
      >
        {formatCurrency(displayValue)}
      </button>
      
      {hasOverride && (
        <div className="absolute -top-1 -right-1">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
        </div>
      )}
      
      {!isReadOnly && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit3 className="h-3 w-3 text-muted-foreground absolute top-0 right-0" />
        </div>
      )}
    </div>
  )
}

function groupCategoriesByGroup(categories: ForecastCategory[]): Record<string, ForecastCategory[]> {
  const grouped: Record<string, ForecastCategory[]> = {}
  
  categories.forEach(cat => {
    const groupName = cat.groupName || 'Uncategorized'
    if (!grouped[groupName]) {
      grouped[groupName] = []
    }
    grouped[groupName].push(cat)
  })
  
  return grouped
}
