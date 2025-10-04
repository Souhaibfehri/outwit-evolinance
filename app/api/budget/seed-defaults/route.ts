import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const metadata = user.user_metadata || {}
    const existingGroups = metadata.category_groups || []
    const existingCategories = metadata.categories || []

    // Check if defaults already exist
    const hasDefaults = existingGroups.some((group: any) => group.isDefault) ||
                       existingCategories.some((cat: any) => cat.type === 'system')

    if (hasDefaults) {
      return NextResponse.json({
        success: false,
        error: 'Default categories already exist'
      }, { status: 400 })
    }

    // Create default groups
    const defaultGroups = [
      {
        id: `group_essentials_${Date.now()}`,
        userId: user.id,
        name: 'Essentials',
        icon: '🏠',
        sortOrder: 0,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `group_lifestyle_${Date.now() + 1}`,
        userId: user.id,
        name: 'Lifestyle',
        icon: '☕',
        sortOrder: 1,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `group_savings_${Date.now() + 2}`,
        userId: user.id,
        name: 'Savings & Goals',
        icon: '💰',
        sortOrder: 2,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `group_debts_${Date.now() + 3}`,
        userId: user.id,
        name: 'Debt Payments',
        icon: '💳',
        sortOrder: 3,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    // Create default categories
    const defaultCategories = [
      // Essentials
      {
        id: `cat_housing_${Date.now()}`,
        userId: user.id,
        name: 'Housing',
        groupId: defaultGroups[0].id,
        groupName: 'Essentials',
        priority: 1,
        rollover: false,
        sortOrder: 0,
        type: 'expense',
        monthlyBudgetCents: 0,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `cat_utilities_${Date.now() + 1}`,
        userId: user.id,
        name: 'Utilities',
        groupId: defaultGroups[0].id,
        groupName: 'Essentials',
        priority: 1,
        rollover: false,
        sortOrder: 1,
        type: 'expense',
        monthlyBudgetCents: 0,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `cat_groceries_${Date.now() + 2}`,
        userId: user.id,
        name: 'Groceries',
        groupId: defaultGroups[0].id,
        groupName: 'Essentials',
        priority: 1,
        rollover: false,
        sortOrder: 2,
        type: 'expense',
        monthlyBudgetCents: 0,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `cat_transportation_${Date.now() + 3}`,
        userId: user.id,
        name: 'Transportation',
        groupId: defaultGroups[0].id,
        groupName: 'Essentials',
        priority: 1,
        rollover: true,
        sortOrder: 3,
        type: 'expense',
        monthlyBudgetCents: 0,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      
      // Lifestyle
      {
        id: `cat_entertainment_${Date.now() + 4}`,
        userId: user.id,
        name: 'Entertainment',
        groupId: defaultGroups[1].id,
        groupName: 'Lifestyle',
        priority: 3,
        rollover: true,
        sortOrder: 0,
        type: 'expense',
        monthlyBudgetCents: 0,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `cat_dining_${Date.now() + 5}`,
        userId: user.id,
        name: 'Dining Out',
        groupId: defaultGroups[1].id,
        groupName: 'Lifestyle',
        priority: 3,
        rollover: false,
        sortOrder: 1,
        type: 'expense',
        monthlyBudgetCents: 0,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `cat_shopping_${Date.now() + 6}`,
        userId: user.id,
        name: 'Shopping',
        groupId: defaultGroups[1].id,
        groupName: 'Lifestyle',
        priority: 4,
        rollover: true,
        sortOrder: 2,
        type: 'expense',
        monthlyBudgetCents: 0,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      
      // Savings & Goals
      {
        id: `cat_emergency_${Date.now() + 7}`,
        userId: user.id,
        name: 'Emergency Fund',
        groupId: defaultGroups[2].id,
        groupName: 'Savings & Goals',
        priority: 1,
        rollover: true,
        sortOrder: 0,
        type: 'expense',
        monthlyBudgetCents: 0,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `cat_vacation_${Date.now() + 8}`,
        userId: user.id,
        name: 'Vacation Fund',
        groupId: defaultGroups[2].id,
        groupName: 'Savings & Goals',
        priority: 3,
        rollover: true,
        sortOrder: 1,
        type: 'expense',
        monthlyBudgetCents: 0,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      
      // Debt Payments
      {
        id: `cat_credit_cards_${Date.now() + 9}`,
        userId: user.id,
        name: 'Credit Card Payments',
        groupId: defaultGroups[3].id,
        groupName: 'Debt Payments',
        priority: 1,
        rollover: false,
        sortOrder: 0,
        type: 'expense',
        monthlyBudgetCents: 0,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `cat_loans_${Date.now() + 10}`,
        userId: user.id,
        name: 'Loan Payments',
        groupId: defaultGroups[3].id,
        groupName: 'Debt Payments',
        priority: 1,
        rollover: false,
        sortOrder: 1,
        type: 'expense',
        monthlyBudgetCents: 0,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    const result = await updateUserMetadata({
      ...metadata,
      category_groups: [...existingGroups, ...defaultGroups],
      categories: [...existingCategories, ...defaultCategories]
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Default categories created successfully',
      created: {
        groups: defaultGroups.length,
        categories: defaultCategories.length
      }
    })

  } catch (error) {
    console.error('Error seeding default categories:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create default categories'
    }, { status: 500 })
  }
}
