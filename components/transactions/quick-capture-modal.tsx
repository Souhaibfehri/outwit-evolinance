'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Zap, 
  DollarSign, 
  Calendar, 
  PieChart,
  AlertCircle,
  CheckCircle,
  Sparkles,
  RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface QuickCaptureModalProps {
  children: React.ReactNode
  onComplete?: () => void
}

interface CategoryDistribution {
  categoryId: string
  categoryName: string
  percentage: number
  amount: number
}

interface SuggestedDistribution {
  categoryId: string
  categoryName: string
  percentage: number
  suggestedAmount: number
}

export function QuickCaptureModal({ children, onComplete }: QuickCaptureModalProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestedDistribution[]>([])
  
  // Form data
  const [dateRange, setDateRange] = useState('7')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [distribution, setDistribution] = useState<CategoryDistribution[]>([])
  const [accountId, setAccountId] = useState('')
  const [note, setNote] = useState('')

  // Load suggestions when modal opens
  useEffect(() => {
    if (open && step === 1) {
      loadSuggestions()
    }
  }, [open, step])

  const loadSuggestions = async () => {
    try {
      const response = await fetch(`/api/transactions/quick-capture?days=${dateRange}`)
      const result = await response.json()
      
      if (result.success) {
        setSuggestions(result.suggestions || [])
      }
    } catch (error) {
      console.error('Error loading suggestions:', error)
    }
  }

  const getDateRange = () => {
    const to = new Date()
    const from = new Date()
    
    if (dateRange === 'custom') {
      return {
        from: customFrom,
        to: customTo
      }
    }
    
    const days = parseInt(dateRange)
    from.setDate(from.getDate() - days)
    
    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0]
    }
  }

  const initializeDistribution = () => {
    const amount = parseFloat(totalAmount) || 0
    
    const newDistribution = suggestions.map(suggestion => ({
      categoryId: suggestion.categoryId,
      categoryName: suggestion.categoryName,
      percentage: suggestion.percentage,
      amount: (amount * suggestion.percentage) / 100
    }))

    setDistribution(newDistribution)
  }

  const updateDistribution = (index: number, percentage: number) => {
    const newDistribution = [...distribution]
    const amount = parseFloat(totalAmount) || 0
    
    newDistribution[index].percentage = percentage
    newDistribution[index].amount = (amount * percentage) / 100
    
    setDistribution(newDistribution)
  }

  const normalizeDistribution = () => {
    const total = distribution.reduce((sum, item) => sum + item.percentage, 0)
    if (total === 0) return

    const normalized = distribution.map(item => ({
      ...item,
      percentage: Math.round((item.percentage / total) * 100),
      amount: (parseFloat(totalAmount) * item.percentage / total) || 0
    }))

    setDistribution(normalized)
    toast.success('Distribution normalized to 100%')
  }

  const useSmartSplit = () => {
    if (suggestions.length === 0) return
    
    const amount = parseFloat(totalAmount) || 0
    const smartDistribution = suggestions.map(suggestion => ({
      categoryId: suggestion.categoryId,
      categoryName: suggestion.categoryName,
      percentage: suggestion.percentage,
      amount: (amount * suggestion.percentage) / 100
    }))

    setDistribution(smartDistribution)
    toast.success('Applied smart spending distribution')
  }

  const useEssentialsOnly = () => {
    const essentialCategories = ['Groceries', 'Utilities', 'Transportation', 'Housing']
    const filtered = distribution.filter(item => 
      essentialCategories.some(essential => 
        item.categoryName.toLowerCase().includes(essential.toLowerCase())
      )
    )

    if (filtered.length === 0) return

    const equalPercentage = Math.floor(100 / filtered.length)
    const amount = parseFloat(totalAmount) || 0

    const essentialsDistribution = filtered.map((item, index) => ({
      ...item,
      percentage: index === 0 ? equalPercentage + (100 % filtered.length) : equalPercentage,
      amount: (amount * equalPercentage) / 100
    }))

    setDistribution(essentialsDistribution)
    toast.success('Applied essentials-only distribution')
  }

  const clearDistribution = () => {
    setDistribution([])
    toast.success('Distribution cleared')
  }

  const handleSubmit = async () => {
    if (!totalAmount || distribution.length === 0) {
      toast.error('Please enter an amount and set up distribution')
      return
    }

    const totalPercentage = distribution.reduce((sum, item) => sum + item.percentage, 0)
    if (totalPercentage < 95 || totalPercentage > 105) {
      toast.error('Distribution must add up to approximately 100%')
      return
    }

    setLoading(true)

    try {
      const { from, to } = getDateRange()
      
      const response = await fetch('/api/transactions/quick-capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalAmount: parseFloat(totalAmount),
          periodFrom: from,
          periodTo: to,
          method: 'manual',
          distribution: distribution.map(item => ({
            categoryId: item.categoryId,
            percentage: item.percentage,
            amount: item.amount
          })),
          accountId: accountId || undefined,
          note: note || undefined
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Quick capture completed! Created ${result.transactionsCreated} transactions.`)
        setOpen(false)
        onComplete?.()
        
        // Reset form
        setStep(1)
        setTotalAmount('')
        setDistribution([])
        setNote('')
      } else {
        toast.error(result.error || 'Failed to create quick capture')
      }
    } catch (error) {
      console.error('Error creating quick capture:', error)
      toast.error('Failed to create quick capture')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const totalPercentage = distribution.reduce((sum, item) => sum + item.percentage, 0)
  const isValidDistribution = totalPercentage >= 95 && totalPercentage <= 105

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Quick Catch-Up
          </DialogTitle>
          <DialogDescription>
            Quickly add approximate spending for a period when you were away from budgeting.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            {/* Step 1: Date Range */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <Label className="text-base font-medium">Choose Time Period</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: '7', label: 'Last 7 days' },
                  { value: '14', label: 'Last 14 days' },
                  { value: '30', label: 'Last 30 days' },
                  { value: 'custom', label: 'Custom range' }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={dateRange === option.value ? 'default' : 'outline'}
                    onClick={() => setDateRange(option.value)}
                    className="justify-start"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              {dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="from">From</Label>
                    <Input
                      id="from"
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="to">To</Label>
                    <Input
                      id="to"
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Total Amount */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <Label className="text-base font-medium">Total Amount Spent</Label>
              </div>
              
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="pl-10 text-lg"
                />
              </div>
              
              <p className="text-sm text-muted-foreground">
                Enter the approximate total amount you spent during this period.
              </p>
            </div>

            <DialogFooter>
              <Button
                onClick={() => {
                  initializeDistribution()
                  setStep(2)
                }}
                disabled={!totalAmount || parseFloat(totalAmount) <= 0}
              >
                Next: Distribute Spending
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* Step 2: Distribution */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                <Label className="text-base font-medium">Distribute by Category</Label>
              </div>
              <Badge variant={isValidDistribution ? 'default' : 'destructive'}>
                {totalPercentage}%
              </Badge>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={useSmartSplit}>
                <Sparkles className="h-3 w-3 mr-1" />
                Smart Split
              </Button>
              <Button size="sm" variant="outline" onClick={useEssentialsOnly}>
                Essentials Only
              </Button>
              <Button size="sm" variant="outline" onClick={normalizeDistribution}>
                Normalize to 100%
              </Button>
              <Button size="sm" variant="outline" onClick={clearDistribution}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>

            {/* Distribution Sliders */}
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {distribution.map((item, index) => (
                <Card key={item.categoryId}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.categoryName}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.percentage}%</Badge>
                          <span className="font-mono text-sm">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      </div>
                      <Slider
                        value={[item.percentage]}
                        onValueChange={([value]) => updateDistribution(index, value)}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {!isValidDistribution && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  Distribution should add up to 100% (currently {totalPercentage}%)
                </span>
              </div>
            )}

            {/* Optional Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Input
                id="note"
                placeholder="e.g., Weekend trip expenses"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !isValidDistribution}
              >
                {loading ? 'Creating...' : 'Create Transactions'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
