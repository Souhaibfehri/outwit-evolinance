'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Confetti } from '../components/confetti'
import { 
  CheckCircle, 
  DollarSign, 
  CreditCard, 
  Target, 
  TrendingDown,
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  BarChart3
} from 'lucide-react'
import { completeOnboarding } from '../actions'
import { toast } from 'sonner'

interface ReviewData {
  profile: any
  income: any
  bills: any
  debts: any
  goals: any
}

export default function ReviewStep() {
  const router = useRouter()
  const [reviewData, setReviewData] = useState<ReviewData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // Load all saved data for review
  useEffect(() => {
    const profile = localStorage.getItem('onboarding-profile')
    const income = localStorage.getItem('onboarding-income')
    const bills = localStorage.getItem('onboarding-bills')
    const debts = localStorage.getItem('onboarding-debts')
    const goals = localStorage.getItem('onboarding-goals')

    try {
      setReviewData({
        profile: profile ? JSON.parse(profile) : {},
        income: income ? JSON.parse(income) : { recurring: [], oneOff: [] },
        bills: bills ? JSON.parse(bills) : { bills: [] },
        debts: debts ? JSON.parse(debts) : { debts: [] },
        goals: goals ? JSON.parse(goals) : { goals: [] }
      })
    } catch (error) {
      console.error('Error loading review data:', error)
    }
  }, [])

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      const result = await completeOnboarding(formData)
      
      if (result.success) {
        setShowConfetti(true)
        toast.success('🎉 Onboarding completed! Welcome to Outwit Budget!')
        
        // Clear localStorage
        localStorage.removeItem('onboarding-profile')
        localStorage.removeItem('onboarding-income')
        localStorage.removeItem('onboarding-bills')
        localStorage.removeItem('onboarding-debts')
        localStorage.removeItem('onboarding-goals')
        
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else {
        toast.error(result.error || 'Failed to complete onboarding')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast.error('Failed to complete onboarding')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/onboarding/goals')
  }

  if (!reviewData) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    )
  }

  // Calculate totals
  const monthlyIncome = reviewData.income.recurring?.reduce((total: number, income: any) => {
    if (!income.active) return total
    switch (income.frequency) {
      case 'weekly': return total + (income.amount * 4.33)
      case 'biweekly': return total + (income.amount * 2.17)
      case 'semimonthly': return total + (income.amount * 2)
      case 'monthly': return total + income.amount
      default: return total + income.amount
    }
  }, 0) || 0

  const monthlyBills = reviewData.bills.bills?.reduce((total: number, bill: any) => {
    switch (bill.frequency) {
      case 'weekly': return total + (bill.amount * 4.33)
      case 'biweekly': return total + (bill.amount * 2.17)
      case 'monthly': return total + bill.amount
      default: return total + bill.amount
    }
  }, 0) || 0

  const totalDebtPayments = reviewData.debts.debts?.reduce((total: number, debt: any) => {
    return total + (debt.minPayment || debt.fixedPayment || 0)
  }, 0) || 0

  const readyToAssign = monthlyIncome - monthlyBills - totalDebtPayments

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          You're All Set! 🎉
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Your financial foundation is ready. Let's review what you've set up.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <CardContent className="p-6 text-center">
            <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <h3 className="font-semibold text-green-800 dark:text-green-200">Monthly Income</h3>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              ${monthlyIncome.toFixed(2)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {reviewData.income.recurring?.length || 0} sources
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <CardContent className="p-6 text-center">
            <CreditCard className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <h3 className="font-semibold text-blue-800 dark:text-blue-200">Monthly Bills</h3>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              ${monthlyBills.toFixed(2)}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {reviewData.bills.bills?.length || 0} bills
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <CardContent className="p-6 text-center">
            <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
            <h3 className="font-semibold text-red-800 dark:text-red-200">Debt Payments</h3>
            <p className="text-2xl font-bold text-red-900 dark:text-red-100">
              ${totalDebtPayments.toFixed(2)}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              {reviewData.debts.debts?.length || 0} debts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800">
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <h3 className="font-semibold text-purple-800 dark:text-purple-200">Goals Set</h3>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {reviewData.goals.goals?.length || 0}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              financial goals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ready to Assign */}
      <Card className={`max-w-2xl mx-auto ${
        readyToAssign >= 0 
          ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
          : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
      }`}>
        <CardContent className="p-8 text-center">
          <BarChart3 className={`h-12 w-12 mx-auto mb-4 ${
            readyToAssign >= 0 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
          }`} />
          <h3 className={`text-xl font-bold mb-2 ${
            readyToAssign >= 0 ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'
          }`}>
            Ready to Assign: ${Math.abs(readyToAssign).toFixed(2)}
          </h3>
          <p className={`text-sm ${
            readyToAssign >= 0 
              ? 'text-green-700 dark:text-green-300' 
              : 'text-yellow-700 dark:text-yellow-300'
          }`}>
            {readyToAssign >= 0 
              ? "Great! You have money ready to assign to categories in your budget."
              : "Your fixed expenses exceed your income. We'll help you adjust your budget."
            }
          </p>
        </CardContent>
      </Card>

      {/* First Badge */}
      <Card className="max-w-2xl mx-auto bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-xl font-bold text-orange-800 dark:text-orange-200 mb-2">
            🏆 Budget Boss - Setup Complete!
          </h3>
          <p className="text-orange-700 dark:text-orange-300">
            You've earned your first badge! Your financial foundation is ready.
          </p>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/budget')}
            className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-900/40"
          >
            Fine-tune Budget
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isLoading}
            className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white px-8"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      <Confetti 
        active={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />
    </div>
  )
}
