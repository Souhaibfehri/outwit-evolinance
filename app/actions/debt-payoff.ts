'use server'

import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { z } from 'zod'

// Debt Schema
const DebtSchema = z.object({
  name: z.string().min(1, 'Debt name is required'),
  balance: z.number().min(0, 'Balance must be positive'),
  interest: z.number().min(0).max(100, 'Interest rate must be between 0-100%'),
  minPayment: z.number().min(0, 'Minimum payment must be positive').default(0),
})

// Debt Payoff Calculation Schema
const PayoffCalculationSchema = z.object({
  extraPayment: z.number().min(0, 'Extra payment must be positive').default(0),
  method: z.enum(['avalanche', 'snowball']),
})

export async function addDebt(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const data = {
      name: formData.get('name') as string,
      balance: parseFloat(formData.get('balance') as string) || 0,
      interest: parseFloat(formData.get('interest') as string) || 0,
      minPayment: parseFloat(formData.get('minPayment') as string) || 0,
    }

    const validatedData = DebtSchema.parse(data)

    // Get existing debts
    const existingDebts = user.user_metadata?.onboarding_data?.debts || []
    
    // Add new debt with ID
    const newDebt = {
      id: Date.now().toString(),
      name: validatedData.name,
      balance: Math.round(validatedData.balance * 100), // Convert to cents
      interest: validatedData.interest,
      minPayment: Math.round(validatedData.minPayment * 100), // Convert to cents
      createdAt: new Date().toISOString(),
    }

    const updatedDebts = [...existingDebts, newDebt]

    // Update onboarding data with new debts
    const onboardingData = user.user_metadata?.onboarding_data || {}
    const result = await updateUserMetadata({
      onboarding_data: {
        ...onboardingData,
        debts: updatedDebts,
      }
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Debt added successfully!', debt: newDebt }
  } catch (error) {
    console.error('Error adding debt:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors?.map(e => e.message).join(', ') || 'Validation error' }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add debt' }
  }
}

export async function updateDebt(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const id = formData.get('id') as string
    const data = {
      name: formData.get('name') as string,
      balance: parseFloat(formData.get('balance') as string) || 0,
      interest: parseFloat(formData.get('interest') as string) || 0,
      minPayment: parseFloat(formData.get('minPayment') as string) || 0,
    }

    const validatedData = DebtSchema.parse(data)

    // Get existing debts
    const existingDebts = user.user_metadata?.onboarding_data?.debts || []
    
    // Update the debt
    const updatedDebts = existingDebts.map((debt: any) => 
      debt.id === id 
        ? {
            ...debt,
            name: validatedData.name,
            balance: Math.round(validatedData.balance * 100),
            interest: validatedData.interest,
            minPayment: Math.round(validatedData.minPayment * 100),
            updatedAt: new Date().toISOString(),
          }
        : debt
    )

    // Update onboarding data
    const onboardingData = user.user_metadata?.onboarding_data || {}
    const result = await updateUserMetadata({
      onboarding_data: {
        ...onboardingData,
        debts: updatedDebts,
      }
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Debt updated successfully!' }
  } catch (error) {
    console.error('Error updating debt:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors?.map(e => e.message).join(', ') || 'Validation error' }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update debt' }
  }
}

export async function deleteDebt(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const id = formData.get('id') as string

    // Get existing debts
    const existingDebts = user.user_metadata?.onboarding_data?.debts || []
    
    // Remove the debt
    const updatedDebts = existingDebts.filter((debt: any) => debt.id !== id)

    // Update onboarding data
    const onboardingData = user.user_metadata?.onboarding_data || {}
    const result = await updateUserMetadata({
      onboarding_data: {
        ...onboardingData,
        debts: updatedDebts,
      }
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Debt deleted successfully!' }
  } catch (error) {
    console.error('Error deleting debt:', error)
    return { success: false, error: 'Failed to delete debt' }
  }
}

export async function calculatePayoffPlan(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const data = {
      extraPayment: parseFloat(formData.get('extraPayment') as string || '0'),
      method: formData.get('method') as 'avalanche' | 'snowball',
    }

    const validatedData = PayoffCalculationSchema.parse(data)
    const debts = user.user_metadata?.onboarding_data?.debts || []

    if (debts.length === 0) {
      return { success: false, error: 'No debts to calculate payoff for' }
    }

    // Calculate payoff plan
    const payoffPlan = calculateDebtPayoffPlan(debts, validatedData.extraPayment, validatedData.method)

    return { 
      success: true, 
      payoffPlan,
      method: validatedData.method,
      extraPayment: validatedData.extraPayment
    }
  } catch (error) {
    console.error('Error calculating payoff plan:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors?.map(e => e.message).join(', ') || 'Validation error' }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to calculate payoff plan' }
  }
}

// Helper function to calculate debt payoff plan
function calculateDebtPayoffPlan(debts: any[], extraPayment: number, method: 'avalanche' | 'snowball') {
  // Convert extra payment to cents
  const extraPaymentCents = Math.round(extraPayment * 100)
  
  // Create working copy of debts
  let workingDebts = debts.map(debt => ({
    ...debt,
    remainingBalance: debt.balance,
    monthlyPayment: debt.minPayment,
  }))

  // Sort debts based on method
  if (method === 'avalanche') {
    // Highest interest rate first
    workingDebts.sort((a, b) => b.interest - a.interest)
  } else {
    // Smallest balance first
    workingDebts.sort((a, b) => a.remainingBalance - b.remainingBalance)
  }

  const payoffSchedule = []
  let currentMonth = 1
  let totalInterestPaid = 0
  let remainingExtraPayment = extraPaymentCents

  while (workingDebts.some(debt => debt.remainingBalance > 0) && currentMonth <= 600) { // Max 50 years
    const monthData = {
      month: currentMonth,
      payments: [] as any[],
      totalPayment: 0,
      totalInterest: 0,
      remainingDebt: 0,
    }

    // Calculate interest and minimum payments for all debts
    workingDebts.forEach(debt => {
      if (debt.remainingBalance > 0) {
        const monthlyInterest = Math.round((debt.remainingBalance * debt.interest / 100) / 12)
        const principalPayment = Math.min(debt.monthlyPayment - monthlyInterest, debt.remainingBalance)
        
        debt.remainingBalance -= principalPayment
        totalInterestPaid += monthlyInterest
        
        monthData.payments.push({
          debtName: debt.name,
          payment: debt.monthlyPayment,
          interest: monthlyInterest,
          principal: principalPayment,
          remainingBalance: debt.remainingBalance,
        })
        
        monthData.totalPayment += debt.monthlyPayment
        monthData.totalInterest += monthlyInterest
      }
    })

    // Apply extra payment to the first debt in the sorted order
    if (remainingExtraPayment > 0) {
      const targetDebt = workingDebts.find(debt => debt.remainingBalance > 0)
      if (targetDebt) {
        const extraToApply = Math.min(remainingExtraPayment, targetDebt.remainingBalance)
        targetDebt.remainingBalance -= extraToApply
        
        // Update the payment record
        const paymentRecord = monthData.payments.find(p => p.debtName === targetDebt.name)
        if (paymentRecord) {
          paymentRecord.payment += extraToApply
          paymentRecord.principal += extraToApply
          paymentRecord.remainingBalance = targetDebt.remainingBalance
        }
        
        monthData.totalPayment += extraToApply
      }
    }

    // Calculate remaining total debt
    monthData.remainingDebt = workingDebts.reduce((sum, debt) => sum + debt.remainingBalance, 0)
    
    payoffSchedule.push(monthData)
    currentMonth++

    // Remove paid off debts and redistribute their minimum payments as extra payment
    const paidOffDebts = workingDebts.filter(debt => debt.remainingBalance <= 0)
    paidOffDebts.forEach(debt => {
      remainingExtraPayment += debt.monthlyPayment
    })
    workingDebts = workingDebts.filter(debt => debt.remainingBalance > 0)
  }

  // Calculate summary statistics
  const totalMonths = payoffSchedule.length
  const totalPayments = payoffSchedule.reduce((sum, month) => sum + month.totalPayment, 0)
  const payoffDate = new Date()
  payoffDate.setMonth(payoffDate.getMonth() + totalMonths)

  return {
    method,
    totalMonths,
    totalPayments,
    totalInterestPaid,
    payoffDate: payoffDate.toISOString(),
    monthlySchedule: payoffSchedule.slice(0, 12), // First year only for display
    summary: {
      totalDebt: debts.reduce((sum, debt) => sum + debt.balance, 0),
      totalMinPayments: debts.reduce((sum, debt) => sum + debt.minPayment, 0),
      extraPayment: extraPaymentCents,
      interestSaved: 0, // Would need to calculate vs minimum payments only
    }
  }
}
