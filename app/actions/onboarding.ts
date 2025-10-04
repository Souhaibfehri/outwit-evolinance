'use server'

import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { z } from 'zod'

const OnboardingDataSchema = z.object({
  name: z.string().min(1).default('User'),
  currency: z.string().default('USD'),
  payFrequency: z.string().default('monthly'),
  netPay: z.string().default('0').transform(val => Math.round(parseFloat(val || '0') * 100)), // Convert to cents
  nextPaycheck: z.string().default('').transform(val => val ? new Date(val) : new Date()),
  otherIncome: z.string().optional().transform(val => val ? Math.round(parseFloat(val) * 100) : 0),
  bills: z.array(z.object({
    name: z.string(),
    amount: z.number().transform(val => Math.round(val * 100)), // Convert to cents
    frequency: z.string(),
    category: z.string(),
  })).default([]),
  debts: z.array(z.object({
    name: z.string(),
    balance: z.number().transform(val => Math.round(val * 100)), // Convert to cents
    interest: z.number(),
    minPayment: z.number().transform(val => Math.round(val * 100)), // Convert to cents
  })).default([]),
  goals: z.array(z.object({
    name: z.string(),
    target: z.number().transform(val => Math.round(val * 100)), // Convert to cents
    deadline: z.string().optional(),
    priority: z.number(),
  })).default([]),
})

export async function completeOnboarding(formData: any) {
  try {
    const user = await getUserAndEnsure()
    
    if (!user) {
      throw new Error('User not found')
    }

    // Validate the form data
    const validatedData = OnboardingDataSchema.parse(formData)

    // Map pay frequency to enum
    const payScheduleMap: Record<string, 'WEEKLY' | 'BIWEEKLY' | 'SEMIMONTHLY' | 'MONTHLY'> = {
      'weekly': 'WEEKLY',
      'biweekly': 'BIWEEKLY', 
      'semimonthly': 'SEMIMONTHLY',
      'monthly': 'MONTHLY'
    }

    // Save onboarding data to Supabase Auth user metadata
    const metadataUpdate = {
      name: validatedData.name,
      onboarding_done: true,
      onboarding_step: 6,
      currency: validatedData.currency,
      pay_schedule: payScheduleMap[validatedData.payFrequency] || 'MONTHLY',
      base_take_home: validatedData.netPay,
      next_pay_date: validatedData.nextPaycheck.toISOString(),
      onboarding_data: {
        bills: validatedData.bills,
        debts: validatedData.debts,
        goals: validatedData.goals,
        other_income: validatedData.otherIncome,
      }
    }

    const result = await updateUserMetadata(metadataUpdate)

    if (!result.success) {
      throw new Error(result.error || 'Failed to save onboarding data')
    }

    console.log('✅ Onboarding completed and saved to Supabase Auth:', {
      userId: user.id,
      email: user.email,
      name: validatedData.name,
      payFrequency: validatedData.payFrequency,
      netPay: validatedData.netPay,
      goals: validatedData.goals.length,
      debts: validatedData.debts.length,
      bills: validatedData.bills.length
    })

    return { 
      success: true, 
      message: 'Onboarding completed successfully!',
      data: validatedData
    }
  } catch (error) {
    console.error('Error completing onboarding:', error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Invalid form data: ' + error.errors?.map(e => e.message).join(', ') || 'Validation error' 
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}