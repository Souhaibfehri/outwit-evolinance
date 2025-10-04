'use server'

import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { calcMonthSummary, validateAssignment, calcCarryOver } from '@/lib/budget/calcs'
import { z } from 'zod'

// Zod schemas for validation
const CreateGroupSchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().optional()
})

const RenameGroupSchema = z.object({
  groupId: z.string(),
  name: z.string().min(1).max(50)
})

const DeleteGroupSchema = z.object({
  groupId: z.string(),
  strategy: z.enum(['reassign', 'delete']),
  reassignToGroupId: z.string().optional()
})

const CreateCategorySchema = z.object({
  groupId: z.string().optional(),
  name: z.string().min(1).max(50),
  priority: z.number().min(1).max(5).default(3),
  rollover: z.boolean().default(false)
})

const UpdateCategorySchema = z.object({
  categoryId: z.string(),
  name: z.string().min(1).max(50).optional(),
  priority: z.number().min(1).max(5).optional(),
  rollover: z.boolean().optional(),
  groupId: z.string().optional()
})

const SetAssignedSchema = z.object({
  categoryId: z.string(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  newAmount: z.number().min(0)
})

const ReorderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    sortOrder: z.number(),
    groupId: z.string().optional()
  }))
})

// Helper to get current month string
function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// Helper to get user budget data
async function getUserBudgetData(userId: string, month: string) {
  const user = await getUserAndEnsure()
  if (!user) throw new Error('User not found')

  const metadata = user.user_metadata || {}
  const categoryGroups = metadata.category_groups || []
  const categories = metadata.categories || []
  const budgetMonths = metadata.budget_months || []
  const budgetItems = metadata.budget_items || []
  const recurringIncome = metadata.recurring_income || []
  const oneOffIncome = metadata.one_off_income || []

  // Find or create budget month
  let budgetMonth = budgetMonths.find((bm: any) => bm.userId === userId && bm.month === month)
  if (!budgetMonth) {
    budgetMonth = {
      id: Date.now().toString(),
      userId,
      month,
      expectedIncome: 0,
      allowOverAssign: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    budgetMonths.push(budgetMonth)
    await updateUserMetadata({ budget_months: budgetMonths })
  }

  return {
    user,
    categoryGroups,
    categories,
    budgetMonths,
    budgetItems,
    budgetMonth,
    recurringIncome,
    oneOffIncome
  }
}

export async function createGroup(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) return { success: false, error: 'User not found' }

    const data = CreateGroupSchema.parse({
      name: formData.get('name'),
      icon: formData.get('icon') || undefined
    })

    const metadata = user.user_metadata || {}
    const categoryGroups = metadata.category_groups || []

    // Check for duplicate names
    if (categoryGroups.some((g: any) => g.name === data.name && g.userId === user.id)) {
      return { success: false, error: 'Group name already exists' }
    }

    const newGroup = {
      id: Date.now().toString(),
      userId: user.id,
      name: data.name,
      icon: data.icon,
      sortOrder: categoryGroups.length,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    categoryGroups.push(newGroup)
    const result = await updateUserMetadata({ category_groups: categoryGroups })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, group: newGroup }
  } catch (error) {
    console.error('Error creating group:', error)
    return { success: false, error: 'Failed to create group' }
  }
}

export async function renameGroup(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) return { success: false, error: 'User not found' }

    const data = RenameGroupSchema.parse({
      groupId: formData.get('groupId'),
      name: formData.get('name')
    })

    const metadata = user.user_metadata || {}
    const categoryGroups = metadata.category_groups || []

    const groupIndex = categoryGroups.findIndex((g: any) => g.id === data.groupId && g.userId === user.id)
    if (groupIndex === -1) {
      return { success: false, error: 'Group not found' }
    }

    // Check for duplicate names (excluding current group)
    if (categoryGroups.some((g: any, i: number) => i !== groupIndex && g.name === data.name && g.userId === user.id)) {
      return { success: false, error: 'Group name already exists' }
    }

    categoryGroups[groupIndex] = {
      ...categoryGroups[groupIndex],
      name: data.name,
      updatedAt: new Date().toISOString()
    }

    const result = await updateUserMetadata({ category_groups: categoryGroups })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, group: categoryGroups[groupIndex] }
  } catch (error) {
    console.error('Error renaming group:', error)
    return { success: false, error: 'Failed to rename group' }
  }
}

export async function deleteGroup(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) return { success: false, error: 'User not found' }

    const data = DeleteGroupSchema.parse({
      groupId: formData.get('groupId'),
      strategy: formData.get('strategy'),
      reassignToGroupId: formData.get('reassignToGroupId') || undefined
    })

    const metadata = user.user_metadata || {}
    const categoryGroups = metadata.category_groups || []
    const categories = metadata.categories || []

    const groupIndex = categoryGroups.findIndex((g: any) => g.id === data.groupId && g.userId === user.id)
    if (groupIndex === -1) {
      return { success: false, error: 'Group not found' }
    }

    const groupCategories = categories.filter((c: any) => c.groupId === data.groupId)

    if (data.strategy === 'reassign') {
      if (!data.reassignToGroupId) {
        return { success: false, error: 'Reassign target group is required' }
      }

      // Reassign all categories to the new group
      groupCategories.forEach((category: any) => {
        const categoryIndex = categories.findIndex((c: any) => c.id === category.id)
        if (categoryIndex !== -1) {
          categories[categoryIndex] = {
            ...categories[categoryIndex],
            groupId: data.reassignToGroupId,
            updatedAt: new Date().toISOString()
          }
        }
      })
    } else {
      // Delete all categories in the group
      const categoryIds = groupCategories.map((c: any) => c.id)
      const remainingCategories = categories.filter((c: any) => !categoryIds.includes(c.id))
      metadata.categories = remainingCategories
    }

    // Remove the group
    categoryGroups.splice(groupIndex, 1)

    const result = await updateUserMetadata({
      category_groups: categoryGroups,
      categories: metadata.categories || categories
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, deletedCount: groupCategories.length }
  } catch (error) {
    console.error('Error deleting group:', error)
    return { success: false, error: 'Failed to delete group' }
  }
}

export async function createCategory(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) return { success: false, error: 'User not found' }

    const data = CreateCategorySchema.parse({
      groupId: formData.get('groupId') || undefined,
      name: formData.get('name'),
      priority: parseInt(formData.get('priority') as string) || 3,
      rollover: formData.get('rollover') === 'true'
    })

    const metadata = user.user_metadata || {}
    const categories = metadata.categories || []

    // Check for duplicate names
    if (categories.some((c: any) => c.name === data.name && c.userId === user.id)) {
      return { success: false, error: 'Category name already exists' }
    }

    const newCategory = {
      id: Date.now().toString(),
      userId: user.id,
      name: data.name,
      groupId: data.groupId,
      priority: data.priority,
      rollover: data.rollover,
      sortOrder: categories.filter((c: any) => c.groupId === data.groupId).length,
      archived: false,
      type: 'expense', // Default to expense
      monthlyBudgetCents: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    categories.push(newCategory)
    const result = await updateUserMetadata({ categories })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, category: newCategory }
  } catch (error) {
    console.error('Error creating category:', error)
    return { success: false, error: 'Failed to create category' }
  }
}

export async function setAssigned(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) return { success: false, error: 'User not found' }

    const data = SetAssignedSchema.parse({
      categoryId: formData.get('categoryId'),
      month: formData.get('month'),
      newAmount: parseFloat(formData.get('newAmount') as string)
    })

    const budgetData = await getUserBudgetData(user.id, data.month)
    const { budgetItems, budgetMonth } = budgetData

    // Find or create budget item
    let budgetItemIndex = budgetItems.findIndex(
      (bi: any) => bi.userId === user.id && bi.month === data.month && bi.categoryId === data.categoryId
    )

    let currentAssigned = 0
    if (budgetItemIndex !== -1) {
      currentAssigned = parseFloat(budgetItems[budgetItemIndex].assigned) || 0
    } else {
      // Create new budget item
      const newBudgetItem = {
        id: Date.now().toString(),
        userId: user.id,
        month: data.month,
        categoryId: data.categoryId,
        assigned: 0,
        spent: 0,
        leftoverFromPrev: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      budgetItems.push(newBudgetItem)
      budgetItemIndex = budgetItems.length - 1
    }

    // Calculate current month summary for validation
    const currentSummary = calcMonthSummary({
      month: data.month,
      userId: user.id,
      expectedIncome: budgetMonth.expectedIncome || 0,
      allowOverAssign: budgetMonth.allowOverAssign || false,
      categories: [], // Will be populated by calcMonthSummary
      recurringIncome: budgetData.recurringIncome,
      oneOffIncome: budgetData.oneOffIncome
    })

    // Validate assignment
    const validation = validateAssignment(
      currentAssigned,
      data.newAmount,
      data.categoryId,
      currentSummary,
      budgetMonth.allowOverAssign || false
    )

    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    // Update budget item
    budgetItems[budgetItemIndex] = {
      ...budgetItems[budgetItemIndex],
      assigned: data.newAmount,
      updatedAt: new Date().toISOString()
    }

    const result = await updateUserMetadata({ budget_items: budgetItems })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { 
      success: true, 
      budgetItem: budgetItems[budgetItemIndex],
      newRTA: validation.newRTA
    }
  } catch (error) {
    console.error('Error setting assigned amount:', error)
    return { success: false, error: 'Failed to set assigned amount' }
  }
}

export async function toggleRollover(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) return { success: false, error: 'User not found' }

    const categoryId = formData.get('categoryId') as string
    const rollover = formData.get('rollover') === 'true'

    const metadata = user.user_metadata || {}
    const categories = metadata.categories || []

    const categoryIndex = categories.findIndex((c: any) => c.id === categoryId && c.userId === user.id)
    if (categoryIndex === -1) {
      return { success: false, error: 'Category not found' }
    }

    categories[categoryIndex] = {
      ...categories[categoryIndex],
      rollover,
      updatedAt: new Date().toISOString()
    }

    const result = await updateUserMetadata({ categories })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, category: categories[categoryIndex] }
  } catch (error) {
    console.error('Error toggling rollover:', error)
    return { success: false, error: 'Failed to toggle rollover' }
  }
}

export async function setAllowOverAssign(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) return { success: false, error: 'User not found' }

    const month = formData.get('month') as string
    const allowOverAssign = formData.get('allowOverAssign') === 'true'

    const budgetData = await getUserBudgetData(user.id, month)
    const { budgetMonths, budgetMonth } = budgetData

    const monthIndex = budgetMonths.findIndex((bm: any) => bm.id === budgetMonth.id)
    if (monthIndex === -1) {
      return { success: false, error: 'Budget month not found' }
    }

    budgetMonths[monthIndex] = {
      ...budgetMonths[monthIndex],
      allowOverAssign,
      updatedAt: new Date().toISOString()
    }

    const result = await updateUserMetadata({ budget_months: budgetMonths })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, budgetMonth: budgetMonths[monthIndex] }
  } catch (error) {
    console.error('Error setting allow over-assign:', error)
    return { success: false, error: 'Failed to set allow over-assign' }
  }
}

export async function reorderCategories(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) return { success: false, error: 'User not found' }

    const data = ReorderSchema.parse({
      items: JSON.parse(formData.get('items') as string)
    })

    const metadata = user.user_metadata || {}
    const categories = metadata.categories || []

    // Update sort order and group assignments
    data.items.forEach((item) => {
      const categoryIndex = categories.findIndex((c: any) => c.id === item.id && c.userId === user.id)
      if (categoryIndex !== -1) {
        categories[categoryIndex] = {
          ...categories[categoryIndex],
          sortOrder: item.sortOrder,
          groupId: item.groupId,
          updatedAt: new Date().toISOString()
        }
      }
    })

    const result = await updateUserMetadata({ categories })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, updatedCount: data.items.length }
  } catch (error) {
    console.error('Error reordering categories:', error)
    return { success: false, error: 'Failed to reorder categories' }
  }
}

export async function reorderGroups(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) return { success: false, error: 'User not found' }

    const data = ReorderSchema.parse({
      items: JSON.parse(formData.get('items') as string)
    })

    const metadata = user.user_metadata || {}
    const categoryGroups = metadata.category_groups || []

    // Update sort order
    data.items.forEach((item) => {
      const groupIndex = categoryGroups.findIndex((g: any) => g.id === item.id && g.userId === user.id)
      if (groupIndex !== -1) {
        categoryGroups[groupIndex] = {
          ...categoryGroups[groupIndex],
          sortOrder: item.sortOrder,
          updatedAt: new Date().toISOString()
        }
      }
    })

    const result = await updateUserMetadata({ category_groups: categoryGroups })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, updatedCount: data.items.length }
  } catch (error) {
    console.error('Error reordering groups:', error)
    return { success: false, error: 'Failed to reorder groups' }
  }
}

export async function createDefaultCategories() {
  try {
    const user = await getUserAndEnsure()
    if (!user) return { success: false, error: 'User not found' }

    const metadata = user.user_metadata || {}
    const categoryGroups = metadata.category_groups || []
    const categories = metadata.categories || []

    // Check if defaults already exist
    const hasDefaults = categoryGroups.some((g: any) => g.isDefault && g.userId === user.id)
    if (hasDefaults) {
      return { success: false, error: 'Default categories already exist' }
    }

    // Default groups and categories
    const defaultData = [
      {
        group: { name: 'Essential Bills', icon: '🏠' },
        categories: ['Rent/Mortgage', 'Utilities', 'Phone', 'Internet', 'Insurance']
      },
      {
        group: { name: 'Food & Dining', icon: '🍽️' },
        categories: ['Groceries', 'Restaurants', 'Coffee & Snacks']
      },
      {
        group: { name: 'Transportation', icon: '🚗' },
        categories: ['Gas', 'Car Payment', 'Public Transit', 'Car Maintenance']
      },
      {
        group: { name: 'Personal', icon: '👤' },
        categories: ['Clothing', 'Personal Care', 'Entertainment', 'Subscriptions']
      },
      {
        group: { name: 'Savings & Goals', icon: '💰' },
        categories: ['Emergency Fund', 'Vacation', 'New Car', 'Retirement']
      }
    ]

    const newGroups: any[] = []
    const newCategories: any[] = []

    defaultData.forEach((section, groupIndex) => {
      const groupId = `default_group_${Date.now()}_${groupIndex}`
      
      const group = {
        id: groupId,
        userId: user.id,
        name: section.group.name,
        icon: section.group.icon,
        sortOrder: groupIndex,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      newGroups.push(group)

      section.categories.forEach((categoryName, categoryIndex) => {
        const category = {
          id: `default_cat_${Date.now()}_${groupIndex}_${categoryIndex}`,
          userId: user.id,
          name: categoryName,
          groupId,
          priority: 3,
          rollover: categoryName.includes('Emergency') || categoryName.includes('Savings'),
          sortOrder: categoryIndex,
          archived: false,
          type: 'expense',
          monthlyBudgetCents: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        newCategories.push(category)
      })
    })

    const result = await updateUserMetadata({
      category_groups: [...categoryGroups, ...newGroups],
      categories: [...categories, ...newCategories]
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { 
      success: true, 
      groupsCreated: newGroups.length,
      categoriesCreated: newCategories.length
    }
  } catch (error) {
    console.error('Error creating default categories:', error)
    return { success: false, error: 'Failed to create default categories' }
  }
}
