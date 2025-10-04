'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InfoPopover } from '@/components/ui/info-popover'
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft,
  Calendar,
  Repeat,
  Star,
  HelpCircle
} from 'lucide-react'
import { upsertOnboarding, estimateNextPayDate } from '../actions'
import { toast } from 'sonner'

interface RecurringIncome {
  id: string
  name: string
  amount: number
  frequency: string
  nextPayDate: string
  active: boolean
}

interface OneOffIncome {
  id: string
  name: string
  amount: number
  date: string
}

interface Benefits {
  retirement401k: number
  employerMatch: number
  preTaxDeductions: number
}

interface IncomeData {
  recurring: RecurringIncome[]
  oneOff: OneOffIncome[]
  benefits: Benefits
  isFreelancer: boolean
}

export default function IncomeStep() {
  const router = useRouter()
  const [formData, setFormData] = useState<IncomeData>({
    recurring: [],
    oneOff: [],
    benefits: {
      retirement401k: 0,
      employerMatch: 0,
      preTaxDeductions: 0
    },
    isFreelancer: false
  })
  const [isLoading, setIsLoading] = useState(false)

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('onboarding-income')
    if (saved) {
      try {
        setFormData(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved income data:', error)
      }
    }
  }, [])

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('onboarding-income', JSON.stringify(formData))
      saveProgress()
    }, 1000)

    return () => clearTimeout(timer)
  }, [formData])

  const saveProgress = async () => {
    const formDataObj = new FormData()
    formDataObj.append('step', '1')
    formDataObj.append('payload', JSON.stringify(formData))
    
    await upsertOnboarding(formDataObj)
  }

  const addRecurringIncome = async () => {
    try {
      const nextPayDate = await estimateNextPayDate('monthly')
      const newIncome: RecurringIncome = {
        id: Date.now().toString(),
        name: '',
        amount: 0,
        frequency: 'monthly',
        nextPayDate: nextPayDate.toISOString().split('T')[0],
        active: true
      }
      setFormData({
        ...formData,
        recurring: [...formData.recurring, newIncome]
      })
      
      // Auto-save progress
      await saveProgress()
      
      toast.success('New income source added! Fill in the details.')
    } catch (error) {
      console.error('Error adding income:', error)
      toast.error('Failed to add income source')
    }
  }

  const updateRecurringIncome = (id: string, updates: Partial<RecurringIncome>) => {
    setFormData({
      ...formData,
      recurring: formData.recurring.map(income => 
        income.id === id ? { ...income, ...updates } : income
      )
    })
  }

  const removeRecurringIncome = (id: string) => {
    setFormData({
      ...formData,
      recurring: formData.recurring.filter(income => income.id !== id)
    })
  }

  const addOneOffIncome = () => {
    const newIncome: OneOffIncome = {
      id: Date.now().toString(),
      name: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0]
    }
    setFormData({
      ...formData,
      oneOff: [...formData.oneOff, newIncome]
    })
  }

  const updateOneOffIncome = (id: string, updates: Partial<OneOffIncome>) => {
    setFormData({
      ...formData,
      oneOff: formData.oneOff.map(income => 
        income.id === id ? { ...income, ...updates } : income
      )
    })
  }

  const removeOneOffIncome = (id: string) => {
    setFormData({
      ...formData,
      oneOff: formData.oneOff.filter(income => income.id !== id)
    })
  }

  const handleContinue = async () => {
    // Validation: either have recurring income or be marked as freelancer
    if (formData.recurring.length === 0 && !formData.isFreelancer) {
      toast.error('Please add at least one income source or mark yourself as freelancer')
      return
    }

    setIsLoading(true)
    try {
      await saveProgress()
      router.push('/onboarding/bills')
    } catch (error) {
      console.error('Error saving income:', error)
      toast.error('Failed to save progress')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/onboarding/profile')
  }

  const handleSaveAndExit = async () => {
    await saveProgress()
    router.push('/dashboard')
  }

  // Calculate estimated monthly income
  const estimatedMonthly = formData.recurring.reduce((total, income) => {
    if (!income.active) return total
    
    switch (income.frequency) {
      case 'weekly': return total + (income.amount * 4.33)
      case 'biweekly': return total + (income.amount * 2.17)
      case 'semimonthly': return total + (income.amount * 2)
      case 'monthly': return total + income.amount
      case 'quarterly': return total + (income.amount / 3)
      case 'annual': return total + (income.amount / 12)
      default: return total + income.amount
    }
  }, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Your Income Sources
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Tell us about all the money coming in. Include everything - we'll help you budget for irregular income too.
        </p>
      </div>

      {/* Freelancer Toggle */}
      <Card className="max-w-2xl mx-auto bg-blue-50/50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  I don't have a fixed paycheck
                </h3>
                <InfoPopover title="Freelancer/Contractor Income">
                  Perfect for contractors, freelancers, or anyone with irregular income. 
                  We'll help you build a buffer and budget with variable earnings.
                </InfoPopover>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Contractor, freelancer, or irregular income
              </p>
            </div>
            <Switch
              checked={formData.isFreelancer}
              onCheckedChange={(checked) => setFormData({ ...formData, isFreelancer: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recurring Income */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Repeat className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span>Recurring Income</span>
                <InfoPopover title="What counts as recurring?">
                  Salary, retainers, contract payments, investment distributions, rental income, 
                  or any regular payment you receive.
                </InfoPopover>
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                We'll auto-estimate the monthly total
              </p>
            </div>
            <Button onClick={addRecurringIncome} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Income
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.recurring.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <DollarSign className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                {formData.isFreelancer 
                  ? "No recurring income? That's fine! Use one-off income below."
                  : "Add your first income source to get started"
                }
              </p>
            </div>
          ) : (
            formData.recurring.map((income) => (
              <div key={income.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Input
                  placeholder="Income name"
                  value={income.name}
                  onChange={(e) => updateRecurringIncome(income.id, { name: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={income.amount || ''}
                  onChange={(e) => updateRecurringIncome(income.id, { amount: parseFloat(e.target.value) || 0 })}
                />
                <Select 
                  value={income.frequency} 
                  onValueChange={(value) => updateRecurringIncome(income.id, { 
                    frequency: value,
                    nextPayDate: estimateNextPayDate(value).toISOString().split('T')[0]
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="semimonthly">Semi-monthly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={income.nextPayDate}
                  onChange={(e) => updateRecurringIncome(income.id, { nextPayDate: e.target.value })}
                />
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={income.active}
                    onCheckedChange={(checked) => updateRecurringIncome(income.id, { active: checked })}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRecurringIncome(income.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
          
          {/* Monthly Estimate */}
          {estimatedMonthly > 0 && (
            <div className="bg-green-50/50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200/50 dark:border-green-800/50">
              <div className="flex items-center justify-between">
                <span className="font-medium text-green-800 dark:text-green-200">
                  Estimated Monthly Income:
                </span>
                <span className="text-xl font-bold text-green-900 dark:text-green-100">
                  ${estimatedMonthly.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* One-off Income */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span>One-off Income</span>
                <InfoPopover title="One-off Income Examples">
                  Bonuses, tax refunds, side gig payments, gifts, freelance projects, 
                  or any irregular income you receive.
                </InfoPopover>
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Bonuses, tax refunds, side gigs, etc.
              </p>
            </div>
            <Button onClick={addOneOffIncome} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add One-off
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.oneOff.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <Star className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No one-off income? Skip this for now - you can add it later.
              </p>
            </div>
          ) : (
            formData.oneOff.map((income) => (
              <div key={income.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Input
                  placeholder="e.g., Tax refund"
                  value={income.name}
                  onChange={(e) => updateOneOffIncome(income.id, { name: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={income.amount || ''}
                  onChange={(e) => updateOneOffIncome(income.id, { amount: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  type="date"
                  value={income.date}
                  onChange={(e) => updateOneOffIncome(income.id, { date: e.target.value })}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOneOffIncome(income.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Benefits & Deductions (Optional) */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>Benefits & Deductions (Optional)</span>
            <InfoPopover title="Benefits & Deductions">
              Track your retirement contributions and employer matching for a complete financial picture. 
              This helps with tax planning and retirement goal tracking.
            </InfoPopover>
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            For complete financial tracking (can skip for now)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-gray-700 dark:text-gray-300">
                401(k) Contribution %
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="0"
                value={formData.benefits.retirement401k || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  benefits: {
                    ...formData.benefits,
                    retirement401k: parseFloat(e.target.value) || 0
                  }
                })}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-gray-700 dark:text-gray-300">
                Employer Match %
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="0"
                value={formData.benefits.employerMatch || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  benefits: {
                    ...formData.benefits,
                    employerMatch: parseFloat(e.target.value) || 0
                  }
                })}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-gray-700 dark:text-gray-300">
                Other Pre-tax Deductions
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={formData.benefits.preTaxDeductions || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  benefits: {
                    ...formData.benefits,
                    preTaxDeductions: parseFloat(e.target.value) || 0
                  }
                })}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skip Option */}
      {formData.recurring.length === 0 && !formData.isFreelancer && (
        <Card className="max-w-2xl mx-auto bg-yellow-50/50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Not sure yet?
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
              You can skip this step and add income sources later from the Income page.
            </p>
            <Button 
              variant="outline" 
              onClick={handleContinue}
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-900/40"
            >
              Skip for now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            variant="ghost"
            onClick={handleSaveAndExit}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Save & Exit
          </Button>
        </div>

        <Button
          onClick={handleContinue}
          disabled={isLoading}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
