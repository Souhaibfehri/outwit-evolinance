'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { 
  Target, 
  Calendar as CalendarIcon, 
  DollarSign,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { 
  TargetType, 
  TargetCadence, 
  CategoryTarget, 
  validateTarget,
  getTargetDisplayText,
  calculateMonthlyContribution
} from '@/lib/targets/engine'
import { formatCurrency } from '@/lib/budget/calcs'

interface TargetModalProps {
  isOpen: boolean
  onClose: () => void
  category: any
  currentBalance: number
  onSave: (target: Partial<CategoryTarget>) => void
}

export function TargetModal({ 
  isOpen, 
  onClose, 
  category, 
  currentBalance,
  onSave 
}: TargetModalProps) {
  const [targetEnabled, setTargetEnabled] = useState(category?.targetEnabled || false)
  const [targetType, setTargetType] = useState<TargetType>(category?.targetType || 'none')
  const [targetAmount, setTargetAmount] = useState(category?.targetAmount?.toString() || '')
  const [targetDate, setTargetDate] = useState<Date | undefined>(
    category?.targetDate ? new Date(category.targetDate) : undefined
  )
  const [targetCadence, setTargetCadence] = useState<TargetCadence>(
    category?.targetCadence || 'monthly'
  )
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (category) {
      setTargetEnabled(category.targetEnabled || false)
      setTargetType(category.targetType || 'none')
      setTargetAmount(category.targetAmount?.toString() || '')
      setTargetDate(category.targetDate ? new Date(category.targetDate) : undefined)
      setTargetCadence(category.targetCadence || 'monthly')
    }
  }, [category])

  const handleSave = () => {
    const target: Partial<CategoryTarget> = {
      categoryId: category.id,
      categoryName: category.name,
      targetEnabled,
      targetType: targetEnabled ? targetType : 'none',
      targetAmount: targetEnabled ? parseFloat(targetAmount) || 0 : 0,
      targetDate: targetDate?.toISOString(),
      targetCadence
    }

    const validation = validateTarget(target)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    onSave(target)
    onClose()
    toast.success('Target updated successfully')
  }

  const handleSnooze = () => {
    const endOfMonth = new Date()
    endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0) // Last day of current month
    
    onSave({
      categoryId: category.id,
      snoozedUntil: endOfMonth.toISOString()
    })
    onClose()
    toast.success('Target snoozed until end of month')
  }

  const monthlyContribution = targetType === 'have_balance_by' && targetDate && targetAmount ? 
    calculateMonthlyContribution(parseFloat(targetAmount), currentBalance, targetDate.toISOString()) : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-600" />
            Set Target for {category?.name}
          </DialogTitle>
          <DialogDescription>
            Configure YNAB-style targets to automate your budgeting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Balance Info */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Balance</span>
              <span className={`font-semibold ${
                currentBalance >= 0 ? 'text-blue-600' : 'text-red-600'
              }`}>
                {formatCurrency(currentBalance)}
              </span>
            </div>
          </div>

          {/* Enable Target Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="target-enabled" className="text-sm font-medium">
                Enable Target
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically calculate funding needs
              </p>
            </div>
            <Switch
              id="target-enabled"
              checked={targetEnabled}
              onCheckedChange={setTargetEnabled}
            />
          </div>

          {targetEnabled && (
            <>
              {/* Target Type Selection */}
              <div className="space-y-2">
                <Label>Target Type</Label>
                <Select value={targetType} onValueChange={(value: TargetType) => setTargetType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="refill_up_to">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium">Refill up to</div>
                          <div className="text-xs text-muted-foreground">
                            Maintain a specific balance
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="set_aside_another">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium">Set aside another</div>
                          <div className="text-xs text-muted-foreground">
                            Regular savings amount
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="have_balance_by">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-purple-600" />
                        <div>
                          <div className="font-medium">Have balance by</div>
                          <div className="text-xs text-muted-foreground">
                            Reach amount by specific date
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Amount */}
              <div className="space-y-2">
                <Label htmlFor="target-amount">Target Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="target-amount"
                    type="number"
                    step="0.01"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Cadence for Set Aside Another */}
              {targetType === 'set_aside_another' && (
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={targetCadence} onValueChange={(value: TargetCadence) => setTargetCadence(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Target Date for Have Balance By */}
              {targetType === 'have_balance_by' && (
                <div className="space-y-2">
                  <Label>Target Date</Label>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {targetDate ? format(targetDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={targetDate}
                        onSelect={(date) => {
                          setTargetDate(date)
                          setIsDatePickerOpen(false)
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {monthlyContribution > 0 && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-sm">
                      <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                        <Clock className="h-3 w-3" />
                        Monthly contribution needed: <strong>{formatCurrency(monthlyContribution)}</strong>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Target Preview */}
              {targetType !== 'none' && targetAmount && (
                <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        Target Preview
                      </div>
                      <div className="text-xs text-orange-700 dark:text-orange-300">
                        {getTargetDisplayText({
                          categoryId: category.id,
                          categoryName: category.name,
                          targetType,
                          targetAmount: parseFloat(targetAmount) || 0,
                          targetDate: targetDate?.toISOString(),
                          targetCadence,
                          targetEnabled: true
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            {targetEnabled && (
              <Button variant="outline" onClick={handleSnooze} className="flex-1 sm:flex-none">
                <Clock className="h-4 w-4 mr-2" />
                Snooze This Month
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 sm:flex-none">
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Target
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
