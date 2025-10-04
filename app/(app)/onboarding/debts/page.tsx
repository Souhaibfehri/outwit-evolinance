'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InfoPopover } from '@/components/ui/info-popover'
import { 
  CreditCard, 
  GraduationCap, 
  Car, 
  Home, 
  FileText,
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft,
  TrendingDown,
  Calculator
} from 'lucide-react'
import { upsertOnboarding } from '../actions'
import { toast } from 'sonner'
import { AvalancheTooltip, SnowballTooltip, APRTooltip } from '@/components/ui/debt-tooltips'

interface Debt {
  id: string
  name: string
  type: string
  balance: number
  apr: number
  paymentType: 'minimum_only' | 'fixed_installment'
  minPayment?: number
  fixedPayment?: number
}

interface DebtsData {
  debts: Debt[]
}

const debtTypes = [
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard, defaultPaymentType: 'minimum_only' },
  { value: 'personal_loan', label: 'Personal Loan', icon: FileText, defaultPaymentType: 'fixed_installment' },
  { value: 'student_loan', label: 'Student Loan', icon: GraduationCap, defaultPaymentType: 'fixed_installment' },
  { value: 'auto_loan', label: 'Auto Loan', icon: Car, defaultPaymentType: 'fixed_installment' },
  { value: 'mortgage', label: 'Mortgage', icon: Home, defaultPaymentType: 'fixed_installment' },
  { value: 'other', label: 'Other', icon: FileText, defaultPaymentType: 'minimum_only' }
]

export default function DebtsStep() {
  const router = useRouter()
  const [formData, setFormData] = useState<DebtsData>({
    debts: []
  })
  const [isLoading, setIsLoading] = useState(false)

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('onboarding-debts')
    if (saved) {
      try {
        setFormData(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved debts data:', error)
      }
    }
  }, [])

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('onboarding-debts', JSON.stringify(formData))
      saveProgress()
    }, 1000)

    return () => clearTimeout(timer)
  }, [formData])

  const saveProgress = async () => {
    const formDataObj = new FormData()
    formDataObj.append('step', '3')
    formDataObj.append('payload', JSON.stringify(formData))
    
    await upsertOnboarding(formDataObj)
  }

  const addDebt = (type?: string) => {
    const debtType = debtTypes.find(dt => dt.value === type) || debtTypes[0]
    const newDebt: Debt = {
      id: Date.now().toString(),
      name: '',
      type: debtType.value,
      balance: 0,
      apr: 0,
      paymentType: debtType.defaultPaymentType,
      minPayment: debtType.defaultPaymentType === 'minimum_only' ? 0 : undefined,
      fixedPayment: debtType.defaultPaymentType === 'fixed_installment' ? 0 : undefined
    }
    setFormData({
      ...formData,
      debts: [...formData.debts, newDebt]
    })
  }

  const updateDebt = (id: string, updates: Partial<Debt>) => {
    setFormData({
      ...formData,
      debts: formData.debts.map(debt => 
        debt.id === id ? { ...debt, ...updates } : debt
      )
    })
  }

  const removeDebt = (id: string) => {
    setFormData({
      ...formData,
      debts: formData.debts.filter(debt => debt.id !== id)
    })
  }

  const handleContinue = async () => {
    setIsLoading(true)
    try {
      await saveProgress()
      router.push('/onboarding/goals')
    } catch (error) {
      console.error('Error saving debts:', error)
      toast.error('Failed to save progress')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/onboarding/bills')
  }

  const handleSaveAndExit = async () => {
    await saveProgress()
    router.push('/dashboard')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
          <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Debt Accounts
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Let's tackle your debts strategically. We'll help you choose between Avalanche and Snowball strategies.
        </p>
      </div>

      {/* Strategy Explainer */}
      <Card className="max-w-4xl mx-auto bg-blue-50/50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                🏔️ <AvalancheTooltip>Avalanche Strategy</AvalancheTooltip>
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Pay minimums on all debts, then attack the highest interest rate first. 
                <strong> Saves the most money</strong> in interest over time.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                ⛄ <SnowballTooltip>Snowball Strategy</SnowballTooltip>
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Pay minimums on all debts, then attack the smallest balance first. 
                <strong> Quick psychological wins</strong> to build momentum.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debt Types */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Add Your Debts</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a debt type to get started with smart defaults
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {debtTypes.map((debtType) => {
              const Icon = debtType.icon
              
              return (
                <Button
                  key={debtType.value}
                  variant="outline"
                  onClick={() => addDebt(debtType.value)}
                  className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                >
                  <Icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                  <span className="font-medium text-sm">{debtType.label}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Added Debts */}
      {formData.debts.length > 0 && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Your Debts ({formData.debts.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.debts.map((debt) => {
              const debtType = debtTypes.find(dt => dt.value === debt.type)
              const Icon = debtType?.icon || FileText
              
              return (
                <div key={debt.id} className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Debt Name</Label>
                        <div className="flex items-center space-x-2 mt-2">
                          <Icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          <Input
                            placeholder="e.g., Chase Freedom Card"
                            value={debt.name}
                            onChange={(e) => updateDebt(debt.id, { name: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Current Balance</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={debt.balance || ''}
                          onChange={(e) => updateDebt(debt.id, { balance: parseFloat(e.target.value) || 0 })}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">
                          <APRTooltip>Interest Rate (APR %)</APRTooltip>
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={debt.apr || ''}
                          onChange={(e) => updateDebt(debt.id, { apr: parseFloat(e.target.value) || 0 })}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    {/* Payment Type */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Label className="text-gray-700 dark:text-gray-300">Payment Type</Label>
                        <InfoPopover title="Minimum vs Fixed Payment">
                          <strong>Minimum payment:</strong> Credit cards usually have a minimum required payment that changes based on balance.<br/><br/>
                          <strong>Fixed installment:</strong> Loans (like car, student, mortgage) typically have a fixed monthly payment that doesn't change.
                        </InfoPopover>
                      </div>
                      <Select 
                        value={debt.paymentType} 
                        onValueChange={(value: 'minimum_only' | 'fixed_installment') => {
                          updateDebt(debt.id, { 
                            paymentType: value,
                            minPayment: value === 'minimum_only' ? (debt.minPayment || 0) : undefined,
                            fixedPayment: value === 'fixed_installment' ? (debt.fixedPayment || 0) : undefined
                          })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimum_only">Minimum Payment (Credit Cards)</SelectItem>
                          <SelectItem value="fixed_installment">Fixed Installment (Loans)</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Payment Amount Input */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {debt.paymentType === 'minimum_only' ? (
                          <div>
                            <Label className="text-gray-700 dark:text-gray-300">
                              Current Minimum Payment
                            </Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={debt.minPayment || ''}
                              onChange={(e) => updateDebt(debt.id, { minPayment: parseFloat(e.target.value) || 0 })}
                              className="mt-2"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Check your latest statement
                            </p>
                          </div>
                        ) : (
                          <div>
                            <Label className="text-gray-700 dark:text-gray-300">
                              Monthly Payment
                            </Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={debt.fixedPayment || ''}
                              onChange={(e) => updateDebt(debt.id, { fixedPayment: parseFloat(e.target.value) || 0 })}
                              className="mt-2"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Fixed monthly payment amount
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDebt(debt.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Debt
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Add Debt */}
      {formData.debts.length === 0 && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No debts to add?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Lucky you! You can skip this step and move on to setting up your financial goals.
            </p>
            <Button onClick={() => addDebt()} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add a Debt
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
