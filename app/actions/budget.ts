'use server'

import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { z } from 'zod'

// Budget Category Schema
const CategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  groupName: z.string().optional(),
  monthlyBudgetCents: z.number().min(0, 'Budget amount must be positive').default(0),
  rollover: z.boolean().default(true),
})

// Budget Entry Schema
const BudgetEntrySchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  assignedCents: z.number().min(0, 'Assigned amount must be positive'),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
})

export async function createCategory(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const data = {
      name: formData.get('name') as string,
      groupName: formData.get('groupName') as string,
      monthlyBudgetCents: Math.round(parseFloat(formData.get('monthlyBudget') as string || '0') * 100),
      rollover: formData.get('rollover') !== 'off',
    }

    const validatedData = CategorySchema.parse(data)

    // Get existing categories
    const existingCategories = user.user_metadata?.budget_categories || []
    
    // Check for duplicate name
    if (existingCategories.some((cat: any) => cat.name.toLowerCase() === validatedData.name.toLowerCase())) {
      return { success: false, error: 'Category name already exists' }
    }

    // Add new category with ID
    const newCategory = {
      id: Date.now().toString(),
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedCategories = [...existingCategories, newCategory]

    const result = await updateUserMetadata({
      budget_categories: updatedCategories,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Category created successfully!', category: newCategory }
  } catch (error) {
    console.error('Error creating category:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues?.map(e => e.message).join(', ') || 'Validation error' }
    }
    return { success: false, error: 'Failed to create category' }
  }
}

export async function updateCategory(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const id = formData.get('id') as string
    const data = {
      name: formData.get('name') as string,
      groupName: formData.get('groupName') as string,
      monthlyBudgetCents: Math.round(parseFloat(formData.get('monthlyBudget') as string || '0') * 100),
      rollover: formData.get('rollover') !== 'off',
    }

    const validatedData = CategorySchema.parse(data)

    // Get existing categories
    const existingCategories = user.user_metadata?.budget_categories || []
    
    // Check for duplicate name (excluding current category)
    if (existingCategories.some((cat: any) => cat.id !== id && cat.name.toLowerCase() === validatedData.name.toLowerCase())) {
      return { success: false, error: 'Category name already exists' }
    }

    // Update the category
    const updatedCategories = existingCategories.map((cat: any) => 
      cat.id === id 
        ? {
            ...cat,
            ...validatedData,
            updatedAt: new Date().toISOString(),
          }
        : cat
    )

    const result = await updateUserMetadata({
      budget_categories: updatedCategories,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Category updated successfully!' }
  } catch (error) {
    console.error('Error updating category:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues?.map(e => e.message).join(', ') || 'Validation error' }
    }
    return { success: false, error: 'Failed to update category' }
  }
}

export async function deleteCategory(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const id = formData.get('id') as string

    // Get existing categories and budget entries
    const existingCategories = user.user_metadata?.budget_categories || []
    const existingEntries = user.user_metadata?.budget_entries || []
    
    // Remove the category
    const updatedCategories = existingCategories.filter((cat: any) => cat.id !== id)
    
    // Remove all budget entries for this category
    const updatedEntries = existingEntries.filter((entry: any) => entry.categoryId !== id)

    const result = await updateUserMetadata({
      budget_categories: updatedCategories,
      budget_entries: updatedEntries,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Category deleted successfully!' }
  } catch (error) {
    console.error('Error deleting category:', error)
    return { success: false, error: 'Failed to delete category' }
  }
}

export async function setBudgetAmount(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const categoryId = formData.get('categoryId') as string
    const assignedCents = Math.round(parseFloat(formData.get('amount') as string || '0') * 100)
    const month = parseInt(formData.get('month') as string || new Date().getMonth().toString()) + 1
    const year = parseInt(formData.get('year') as string || new Date().getFullYear().toString())

    const data = {
      categoryId,
      assignedCents,
      month,
      year,
    }

    const validatedData = BudgetEntrySchema.parse(data)

    // Get existing budget entries
    const existingEntries = user.user_metadata?.budget_entries || []
    
    // Find existing entry for this category/month/year
    const existingEntryIndex = existingEntries.findIndex((entry: any) => 
      entry.categoryId === categoryId && entry.month === month && entry.year === year
    )

    let updatedEntries
    if (existingEntryIndex >= 0) {
      // Update existing entry
      updatedEntries = existingEntries.map((entry: any, index: number) => 
        index === existingEntryIndex 
          ? {
              ...entry,
              assignedCents: validatedData.assignedCents,
              updatedAt: new Date().toISOString(),
            }
          : entry
      )
    } else {
      // Create new entry
      const newEntry = {
        id: Date.now().toString(),
        ...validatedData,
        spentCents: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      updatedEntries = [...existingEntries, newEntry]
    }

    const result = await updateUserMetadata({
      budget_entries: updatedEntries,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Budget amount updated successfully!' }
  } catch (error) {
    console.error('Error setting budget amount:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues?.map(e => e.message).join(', ') || 'Validation error' }
    }
    return { success: false, error: 'Failed to update budget amount' }
  }
}

export async function assignAllIncome(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const month = parseInt(formData.get('month') as string || new Date().getMonth().toString()) + 1
    const year = parseInt(formData.get('year') as string || new Date().getFullYear().toString())

    // Calculate total monthly income
    const recurringIncome = user.user_metadata?.recurring_income || []
    const oneOffIncome = user.user_metadata?.oneoff_income || []
    
    let totalIncome = 0
    
    // Add recurring income
    recurringIncome.forEach((income: any) => {
      if (!income.active) return
      
      const amount = income.amountCents || 0
      switch (income.frequency) {
        case 'weekly':
          totalIncome += amount * 4.33
          break
        case 'biweekly':
          totalIncome += amount * 2.17
          break
        case 'semimonthly':
          totalIncome += amount * 2
          break
        case 'monthly':
          totalIncome += amount
          break
      }
    })

    // Add one-off income for the selected month
    oneOffIncome.forEach((income: any) => {
      const incomeDate = new Date(income.date)
      if (incomeDate.getMonth() + 1 === month && incomeDate.getFullYear() === year) {
        totalIncome += income.amountCents || 0
      }
    })

    // Get existing budget entries for this month
    const existingEntries = user.user_metadata?.budget_entries || []
    const currentAssigned = existingEntries
      .filter((entry: any) => entry.month === month && entry.year === year)
      .reduce((sum: number, entry: any) => sum + (entry.assignedCents || 0), 0)

    const readyToAssign = totalIncome - currentAssigned

    return { 
      success: true, 
      totalIncome: totalIncome,
      currentAssigned: currentAssigned,
      readyToAssign: readyToAssign,
      message: `You have $${(readyToAssign / 100).toFixed(2)} ready to assign`
    }
  } catch (error) {
    console.error('Error calculating assignable income:', error)
    return { success: false, error: 'Failed to calculate assignable income' }
  }
}

export async function createDefaultCategories() {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Default categories for zero-based budgeting
    const defaultCategories = [
      // Essential Categories
      { name: 'Housing', groupName: 'Essentials', monthlyBudgetCents: 0, rollover: false },
      { name: 'Utilities', groupName: 'Essentials', monthlyBudgetCents: 0, rollover: false },
      { name: 'Groceries', groupName: 'Essentials', monthlyBudgetCents: 0, rollover: true },
      { name: 'Transportation', groupName: 'Essentials', monthlyBudgetCents: 0, rollover: true },
      { name: 'Insurance', groupName: 'Essentials', monthlyBudgetCents: 0, rollover: false },
      
      // Lifestyle Categories
      { name: 'Dining Out', groupName: 'Lifestyle', monthlyBudgetCents: 0, rollover: true },
      { name: 'Entertainment', groupName: 'Lifestyle', monthlyBudgetCents: 0, rollover: true },
      { name: 'Shopping', groupName: 'Lifestyle', monthlyBudgetCents: 0, rollover: true },
      { name: 'Personal Care', groupName: 'Lifestyle', monthlyBudgetCents: 0, rollover: true },
      
      // Savings Categories
      { name: 'Emergency Fund', groupName: 'Savings', monthlyBudgetCents: 0, rollover: true },
      { name: 'Retirement', groupName: 'Savings', monthlyBudgetCents: 0, rollover: true },
      { name: 'Vacation', groupName: 'Savings', monthlyBudgetCents: 0, rollover: true },
    ]

    const categoriesWithIds = defaultCategories.map((cat, index) => ({
      id: (Date.now() + index).toString(),
      ...cat,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))

    const result = await updateUserMetadata({
      budget_categories: categoriesWithIds,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Default categories created successfully!' }
  } catch (error) {
    console.error('Error creating default categories:', error)
    return { success: false, error: 'Failed to create default categories' }
  }
}
