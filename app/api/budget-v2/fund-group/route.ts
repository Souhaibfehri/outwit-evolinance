import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { 
  selectGroupRollup,
  selectTA,
  selectMinRequiredByCategory
} from '@/lib/budget-v2-selectors'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { action, groupId, month, amount, categoryIds } = await request.json()

    const metadata = user.user_metadata || {}
    const transactions = metadata.transactions_v2 || []
    const budgetEntries = metadata.budget_entries || []
    const categories = metadata.categories_v2 || []
    const scheduledItems = metadata.scheduled_items || []
    const groups = metadata.groups || []

    if (action === 'fund_minimum') {
      // Fund Group Minimum
      const groupRollup = selectGroupRollup(
        transactions, budgetEntries, categories, scheduledItems, groups, month, groupId
      )

      if (groupRollup.shortfall <= 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'Group is already fully funded',
          changes: []
        })
      }

      const currentTA = selectTA(transactions, budgetEntries, categories, month)
      const availableToFund = Math.min(currentTA, groupRollup.shortfall)

      if (availableToFund <= 0) {
        return NextResponse.json({ 
          error: 'Insufficient To-Allocate funds',
          shortfall: groupRollup.shortfall,
          ta_available: currentTA
        }, { status: 400 })
      }

      // Calculate funding per category based on minimum requirements
      const groupCategories = categories.filter(cat => cat.group_id === groupId)
      const updatedEntries = [...budgetEntries]
      const changes: any[] = []
      let remainingToFund = availableToFund

      groupCategories.forEach(category => {
        const minRequired = selectMinRequiredByCategory(scheduledItems, month, category.id)
        const currentAssigned = selectAssignedByCategory(budgetEntries, month, category.id)
        const shortfall = Math.max(0, minRequired - currentAssigned)

        if (shortfall > 0 && remainingToFund > 0) {
          const fundAmount = Math.min(shortfall, remainingToFund)
          const newAssigned = currentAssigned + fundAmount

          // Update or create budget entry
          const existingIndex = updatedEntries.findIndex(entry => 
            entry.month_id === month && entry.category_id === category.id
          )

          if (existingIndex >= 0) {
            updatedEntries[existingIndex] = {
              ...updatedEntries[existingIndex],
              assigned: newAssigned
            }
          } else {
            updatedEntries.push({
              id: `entry_${Date.now()}_${category.id}`,
              month_id: month,
              category_id: category.id,
              assigned: newAssigned
            })
          }

          changes.push({
            category_id: category.id,
            category_name: category.name,
            old_assigned: currentAssigned,
            new_assigned: newAssigned,
            funded_amount: fundAmount
          })

          remainingToFund -= fundAmount
        }
      })

      // Save to user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...metadata,
          budget_entries: updatedEntries
        }
      })

      if (updateError) {
        console.error('Failed to fund group minimum:', updateError)
        return NextResponse.json({ error: 'Failed to fund group' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `Funded ${groupRollup.group_name} minimum requirements`,
        total_funded: availableToFund - remainingToFund,
        changes
      })

    } else if (action === 'use_savings') {
      // Use Savings - unassign from savings categories back to TA
      if (!categoryIds || categoryIds.length === 0) {
        return NextResponse.json({ error: 'No savings categories specified' }, { status: 400 })
      }

      const updatedEntries = [...budgetEntries]
      const changes: any[] = []
      let totalUnassigned = 0

      categoryIds.forEach((categoryId: string) => {
        const category = categories.find(cat => cat.id === categoryId)
        if (!category?.is_savings) return

        const currentAssigned = selectAssignedByCategory(budgetEntries, month, categoryId)
        const unassignAmount = Math.min(currentAssigned, amount || currentAssigned)

        if (unassignAmount > 0) {
          const newAssigned = currentAssigned - unassignAmount

          // Update budget entry
          const existingIndex = updatedEntries.findIndex(entry => 
            entry.month_id === month && entry.category_id === categoryId
          )

          if (existingIndex >= 0) {
            updatedEntries[existingIndex] = {
              ...updatedEntries[existingIndex],
              assigned: newAssigned
            }
          }

          changes.push({
            category_id: categoryId,
            category_name: category.name,
            old_assigned: currentAssigned,
            new_assigned: newAssigned,
            unassigned_amount: unassignAmount
          })

          totalUnassigned += unassignAmount
        }
      })

      if (totalUnassigned === 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'No savings to unassign',
          changes: []
        })
      }

      // Save to user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...metadata,
          budget_entries: updatedEntries
        }
      })

      if (updateError) {
        console.error('Failed to use savings:', updateError)
        return NextResponse.json({ error: 'Failed to use savings' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `$${totalUnassigned.toFixed(2)} moved from savings to To-Allocate`,
        total_unassigned: totalUnassigned,
        changes
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error processing group funding:', error)
    return NextResponse.json({ error: 'Failed to process group funding' }, { status: 500 })
  }
}
