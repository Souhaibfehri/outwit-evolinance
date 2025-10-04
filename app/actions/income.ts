'use server'

import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { z } from 'zod'

// Recurring Income Schema
const RecurringIncomeSchema = z.object({
  name: z.string().min(1, 'Income name is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  frequency: z.enum(['weekly', 'biweekly', 'semimonthly', 'monthly']),
  nextDate: z.string().min(1, 'Next payment date is required'),
  active: z.boolean().default(true),
})

// One-off Income Schema
const OneOffIncomeSchema = z.object({
  name: z.string().min(1, 'Income name is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  note: z.string().optional(),
})

export async function addRecurringIncome(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const data = {
      name: formData.get('name') as string,
      amount: parseFloat(formData.get('amount') as string),
      frequency: formData.get('frequency') as string,
      nextDate: formData.get('nextDate') as string,
      active: formData.get('active') !== 'off',
    }

    const validatedData = RecurringIncomeSchema.parse(data)

    // Get existing recurring income
    const existingIncome = user.user_metadata?.recurring_income || []
    
    // Add new income with ID
    const newIncome = {
      id: Date.now().toString(),
      ...validatedData,
      amountCents: Math.round(validatedData.amount * 100),
      createdAt: new Date().toISOString(),
    }

    const updatedIncome = [...existingIncome, newIncome]

    const result = await updateUserMetadata({
      recurring_income: updatedIncome,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Recurring income added successfully!' }
  } catch (error) {
    console.error('Error adding recurring income:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors?.map(e => e.message).join(', ') || 'Validation error' }
    }
    return { success: false, error: 'Failed to add recurring income' }
  }
}

export async function updateRecurringIncome(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const id = formData.get('id') as string
    const data = {
      name: formData.get('name') as string,
      amount: parseFloat(formData.get('amount') as string),
      frequency: formData.get('frequency') as string,
      nextDate: formData.get('nextDate') as string,
      active: formData.get('active') !== 'off',
    }

    const validatedData = RecurringIncomeSchema.parse(data)

    // Get existing recurring income
    const existingIncome = user.user_metadata?.recurring_income || []
    
    // Update the income item
    const updatedIncome = existingIncome.map((income: any) => 
      income.id === id 
        ? {
            ...income,
            ...validatedData,
            amountCents: Math.round(validatedData.amount * 100),
            updatedAt: new Date().toISOString(),
          }
        : income
    )

    const result = await updateUserMetadata({
      recurring_income: updatedIncome,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Recurring income updated successfully!' }
  } catch (error) {
    console.error('Error updating recurring income:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors?.map(e => e.message).join(', ') || 'Validation error' }
    }
    return { success: false, error: 'Failed to update recurring income' }
  }
}

export async function deleteRecurringIncome(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const id = formData.get('id') as string

    // Get existing recurring income
    const existingIncome = user.user_metadata?.recurring_income || []
    
    // Remove the income item
    const updatedIncome = existingIncome.filter((income: any) => income.id !== id)

    const result = await updateUserMetadata({
      recurring_income: updatedIncome,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Recurring income deleted successfully!' }
  } catch (error) {
    console.error('Error deleting recurring income:', error)
    return { success: false, error: 'Failed to delete recurring income' }
  }
}

export async function addOneOffIncome(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const data = {
      name: formData.get('name') as string,
      amount: parseFloat(formData.get('amount') as string),
      date: formData.get('date') as string,
      note: formData.get('note') as string,
    }

    const validatedData = OneOffIncomeSchema.parse(data)

    // Get existing one-off income
    const existingIncome = user.user_metadata?.oneoff_income || []
    
    // Add new income with ID
    const newIncome = {
      id: Date.now().toString(),
      ...validatedData,
      amountCents: Math.round(validatedData.amount * 100),
      createdAt: new Date().toISOString(),
    }

    const updatedIncome = [...existingIncome, newIncome]

    const result = await updateUserMetadata({
      oneoff_income: updatedIncome,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'One-off income added successfully!' }
  } catch (error) {
    console.error('Error adding one-off income:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors?.map(e => e.message).join(', ') || 'Validation error' }
    }
    return { success: false, error: 'Failed to add one-off income' }
  }
}

export async function updateOneOffIncome(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const id = formData.get('id') as string
    const data = {
      name: formData.get('name') as string,
      amount: parseFloat(formData.get('amount') as string),
      date: formData.get('date') as string,
      note: formData.get('note') as string,
    }

    const validatedData = OneOffIncomeSchema.parse(data)

    // Get existing one-off income
    const existingIncome = user.user_metadata?.oneoff_income || []
    
    // Update the income item
    const updatedIncome = existingIncome.map((income: any) => 
      income.id === id 
        ? {
            ...income,
            ...validatedData,
            amountCents: Math.round(validatedData.amount * 100),
            updatedAt: new Date().toISOString(),
          }
        : income
    )

    const result = await updateUserMetadata({
      oneoff_income: updatedIncome,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'One-off income updated successfully!' }
  } catch (error) {
    console.error('Error updating one-off income:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors?.map(e => e.message).join(', ') || 'Validation error' }
    }
    return { success: false, error: 'Failed to update one-off income' }
  }
}

export async function deleteOneOffIncome(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const id = formData.get('id') as string

    // Get existing one-off income
    const existingIncome = user.user_metadata?.oneoff_income || []
    
    // Remove the income item
    const updatedIncome = existingIncome.filter((income: any) => income.id !== id)

    const result = await updateUserMetadata({
      oneoff_income: updatedIncome,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'One-off income deleted successfully!' }
  } catch (error) {
    console.error('Error deleting one-off income:', error)
    return { success: false, error: 'Failed to delete one-off income' }
  }
}

