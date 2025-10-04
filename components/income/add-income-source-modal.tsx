'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Calendar, Plus, Minus, Info } from 'lucide-react'
import { toast } from 'sonner'
import { 
  CreateIncomeSourceRequest, 
  IncomeType, 
  PaySchedule, 
  DeductionKind,
  getIncomeTypeLabel,
  getPayScheduleLabel,
  calculateNetIncome,
  generateUpcomingOccurrences
} from '@/lib/types/income'

interface AddIncomeSourceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const INCOME_TYPES: IncomeType[] = ['EMPLOYMENT', 'FREELANCE', 'BENEFIT', 'OTHER']
const PAY_SCHEDULES: PaySchedule[] = ['MONTHLY', 'SEMI_MONTHLY', 'BIWEEKLY', 'WEEKLY', 'CUSTOM']

const WEEKDAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

interface Deduction {
  label: string
  kind: DeductionKind
  value: number
}

export function AddIncomeSourceModal({ isOpen, onClose, onSuccess }: AddIncomeSourceModalProps) {
  const [formData, setFormData] = useState<CreateIncomeSourceRequest>({
    name: '',
    type: 'EMPLOYMENT',
    currency: 'USD',
    gross: 0,
    net: undefined,
    paySchedule: 'BIWEEKLY',
    anchorDate: new Date().toISOString().split('T')[0],
    dayOfMonth: 15,
    secondDay: undefined,
    weekday: 5, // Friday
    everyNWeeks: 2,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    autopost: true,
    notes: '',
    deductions: []
  })
  
  const [useGrossWithDeductions, setUseGrossWithDeductions] = useState(true)
  const [deductions, setDeductions] = useState<Deduction[]>([])
  const [loading, setLoading] = useState(false)
  const [previewDates, setPreviewDates] = useState<string[]>([])
  const [calculatedNet, setCalculatedNet] = useState<number>(0)

  // Calculate preview dates when schedule changes
  useEffect(() => {
    if (formData.name && formData.anchorDate) {
      try {
        const mockSource = {
          ...formData,
          id: 'preview',
          userId: 'preview',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        const occurrences = generateUpcomingOccurrences(mockSource, deductions.map(d => ({
          id: `deduction_${d.label}`,
          sourceId: 'preview',
          label: d.label,
          kind: d.kind,
          value: d.value
        })), 21) // Next 3 weeks
        
        setPreviewDates(occurrences.slice(0, 3).map(occ => occ.scheduledAt.split('T')[0]))
      } catch (error) {
        console.error('Error generating preview:', error)
        setPreviewDates([])
      }
    }
  }, [formData.paySchedule, formData.anchorDate, formData.dayOfMonth, formData.secondDay, formData.weekday, formData.everyNWeeks])

  // Calculate net income when gross or deductions change
  useEffect(() => {
    if (useGrossWithDeductions && formData.gross && formData.gross > 0) {
      const deductionData = deductions.map(d => ({
        id: `deduction_${d.label}`,
        sourceId: 'preview',
        label: d.label,
        kind: d.kind,
        value: d.value
      }))
      
      const net = calculateNetIncome(formData.gross, deductionData)
      setCalculatedNet(net)
      setFormData(prev => ({ ...prev, net }))
    } else if (!useGrossWithDeductions && formData.net) {
      setCalculatedNet(formData.net)
    }
  }, [useGrossWithDeductions, formData.gross, formData.net, deductions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Please enter a source name')
      return
    }

    if (useGrossWithDeductions && (!formData.gross || formData.gross <= 0)) {
      toast.error('Please enter a valid gross amount')
      return
    }

    if (!useGrossWithDeductions && (!formData.net || formData.net <= 0)) {
      toast.error('Please enter a valid net amount')
      return
    }

    setLoading(true)

    try {
      const submitData: CreateIncomeSourceRequest = {
        ...formData,
        deductions: useGrossWithDeductions ? deductions.map(d => ({
          label: d.label,
          kind: d.kind,
          value: d.value
        })) : []
      }

      // Clear net if using gross with deductions (let server calculate)
      if (useGrossWithDeductions) {
        delete submitData.net
      } else {
        delete submitData.gross
      }

      const response = await fetch('/api/income/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Income source created successfully!')
        onSuccess()
        
        // Reset form
        setFormData({
          name: '',
          type: 'EMPLOYMENT',
          currency: 'USD',
          gross: 0,
          net: undefined,
          paySchedule: 'BIWEEKLY',
          anchorDate: new Date().toISOString().split('T')[0],
          dayOfMonth: 15,
          weekday: 5,
          everyNWeeks: 2,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          autopost: true,
          notes: '',
          deductions: []
        })
        setDeductions([])
        setUseGrossWithDeductions(true)
      } else {
        toast.error(data.error || 'Failed to create income source')
      }
    } catch (error) {
      console.error('Error creating income source:', error)
      toast.error('Failed to create income source')
    } finally {
      setLoading(false)
    }
  }

  const addDeduction = () => {
    setDeductions(prev => [...prev, {
      label: '',
      kind: 'PERCENT',
      value: 0
    }])
  }

  const removeDeduction = (index: number) => {
    setDeductions(prev => prev.filter((_, i) => i !== index))
  }

  const updateDeduction = (index: number, field: keyof Deduction, value: any) => {
    setDeductions(prev => prev.map((deduction, i) => 
      i === index ? { ...deduction, [field]: value } : deduction
    ))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Add Income Source
          </DialogTitle>
          <DialogDescription>
            Set up a new income source with pay schedule and deductions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Source Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Acme Corp Salary"
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="type">Income Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: IncomeType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getIncomeTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Amount Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Amount Configuration</h3>
              <div className="flex items-center space-x-2">
                <Label htmlFor="gross-mode" className="text-sm">Use gross with deductions</Label>
                <Switch
                  id="gross-mode"
                  checked={useGrossWithDeductions}
                  onCheckedChange={setUseGrossWithDeductions}
                />
              </div>
            </div>

            {useGrossWithDeductions ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="gross">Gross Amount *</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="gross"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.gross || ''}
                      onChange={(e) => setFormData({ ...formData, gross: parseFloat(e.target.value) || 0 })}
                      className="pl-10"
                      placeholder="5000.00"
                      required
                    />
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Deductions (Optional)</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addDeduction}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Deduction
                    </Button>
                  </div>
                  
                  {deductions.map((deduction, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <Input
                        placeholder="Tax, Insurance, 401k..."
                        value={deduction.label}
                        onChange={(e) => updateDeduction(index, 'label', e.target.value)}
                        className="flex-1"
                      />
                      <Select
                        value={deduction.kind}
                        onValueChange={(value: DeductionKind) => updateDeduction(index, 'kind', value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENT">%</SelectItem>
                          <SelectItem value="FIXED">$</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="0"
                        step={deduction.kind === 'PERCENT' ? '0.1' : '0.01'}
                        value={deduction.value || ''}
                        onChange={(e) => updateDeduction(index, 'value', parseFloat(e.target.value) || 0)}
                        className="w-20"
                        placeholder="0"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeDeduction(index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Net Preview */}
                {calculatedNet > 0 && (
                  <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-green-700 dark:text-green-300">Calculated Net Amount:</span>
                        <span className="text-xl font-bold text-green-600">
                          {formatCurrency(calculatedNet)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div>
                <Label htmlFor="net">Net Amount *</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="net"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.net || ''}
                    onChange={(e) => setFormData({ ...formData, net: parseFloat(e.target.value) || 0 })}
                    className="pl-10"
                    placeholder="3500.00"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter the amount you actually receive after taxes and deductions
                </p>
              </div>
            )}
          </div>

          {/* Pay Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pay Schedule</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="schedule">Pay Schedule</Label>
                <Select 
                  value={formData.paySchedule} 
                  onValueChange={(value: PaySchedule) => setFormData({ ...formData, paySchedule: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAY_SCHEDULES.map((schedule) => (
                      <SelectItem key={schedule} value={schedule}>
                        {getPayScheduleLabel(schedule)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="anchor-date">Next Pay Date</Label>
                <Input
                  id="anchor-date"
                  type="date"
                  value={formData.anchorDate}
                  onChange={(e) => setFormData({ ...formData, anchorDate: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
            </div>

            {/* Schedule-specific fields */}
            {(formData.paySchedule === 'MONTHLY' || formData.paySchedule === 'SEMI_MONTHLY') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="day-of-month">Day of Month</Label>
                  <Input
                    id="day-of-month"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dayOfMonth || ''}
                    onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) || 15 })}
                    className="mt-1"
                  />
                </div>
                
                {formData.paySchedule === 'SEMI_MONTHLY' && (
                  <div>
                    <Label htmlFor="second-day">Second Pay Day</Label>
                    <Input
                      id="second-day"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.secondDay || ''}
                      onChange={(e) => setFormData({ ...formData, secondDay: parseInt(e.target.value) })}
                      className="mt-1"
                      placeholder="e.g., 30"
                    />
                  </div>
                )}
              </div>
            )}

            {(formData.paySchedule === 'WEEKLY' || formData.paySchedule === 'BIWEEKLY') && (
              <div>
                <Label htmlFor="weekday">Pay Day of Week</Label>
                <Select 
                  value={formData.weekday?.toString() || '5'} 
                  onValueChange={(value) => setFormData({ ...formData, weekday: parseInt(value) })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.paySchedule === 'CUSTOM' && (
              <div>
                <Label htmlFor="every-n-weeks">Every N Weeks</Label>
                <Input
                  id="every-n-weeks"
                  type="number"
                  min="1"
                  max="52"
                  value={formData.everyNWeeks || ''}
                  onChange={(e) => setFormData({ ...formData, everyNWeeks: parseInt(e.target.value) || 2 })}
                  className="mt-1"
                  placeholder="2"
                />
              </div>
            )}
          </div>

          {/* Preview */}
          {previewDates.length > 0 && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Next 3 Pay Dates
                  </h4>
                </div>
                <div className="flex gap-2">
                  {previewDates.map((date, index) => (
                    <Badge key={index} variant="outline" className="text-blue-700 bg-blue-100 border-blue-300">
                      {formatDate(date)}
                    </Badge>
                  ))}
                </div>
                {calculatedNet > 0 && (
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    Expected amount: <strong>{formatCurrency(calculatedNet)}</strong>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Settings</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autopost">Auto-post Expected Income</Label>
                <p className="text-xs text-gray-500">
                  Automatically create scheduled income entries
                </p>
              </div>
              <Switch
                id="autopost"
                checked={formData.autopost}
                onCheckedChange={(checked) => setFormData({ ...formData, autopost: checked })}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this income source..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        </form>

        <DialogFooter className="sticky bottom-0 bg-white dark:bg-gray-800 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim() || (useGrossWithDeductions ? !formData.gross : !formData.net)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
            ) : (
              <DollarSign className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Creating...' : 'Create Income Source'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
