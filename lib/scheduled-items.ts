// Unified Scheduled Items - Bills, Goals, Debts, Investments, Income

import { ScheduledItem, PlannedTransaction, AutoAssignRule } from '@/lib/types/budget-v2'

/**
 * Generate planned transactions from scheduled items
 */
export function generatePlannedTransactions(
  scheduledItems: ScheduledItem[],
  fromDate: string,
  toDate: string
): PlannedTransaction[] {
  const planned: PlannedTransaction[] = []

  scheduledItems.forEach(item => {
    const occurrences = calculateOccurrences(item, fromDate, toDate)
    
    occurrences.forEach(date => {
      planned.push({
        id: `planned_${item.id}_${date.replace(/-/g, '')}`,
        scheduled_item_id: item.id,
        date,
        amount: item.amount,
        account_id: getDefaultAccountForType(item.type),
        category_id: item.category_id
      })
    })
  })

  return planned.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Calculate occurrence dates for a scheduled item
 */
function calculateOccurrences(
  item: ScheduledItem,
  fromDate: string,
  toDate: string
): string[] {
  const occurrences: string[] = []
  const startDate = new Date(Math.max(new Date(fromDate).getTime(), new Date(item.next_due).getTime()))
  const endDate = new Date(toDate)
  
  let currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    occurrences.push(currentDate.toISOString().split('T')[0])
    
    // Calculate next occurrence based on cadence
    switch (item.cadence) {
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7)
        break
      case 'biweekly':
        currentDate.setDate(currentDate.getDate() + 14)
        break
      case 'semimonthly':
        currentDate.setDate(currentDate.getDate() + 15) // Approximate
        break
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1)
        break
      case 'quarterly':
        currentDate.setMonth(currentDate.getMonth() + 3)
        break
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + 1)
        break
      case 'oneoff':
        return occurrences // Only one occurrence
      default:
        currentDate.setMonth(currentDate.getMonth() + 1)
    }
  }

  return occurrences
}

/**
 * Get default account for scheduled item type
 */
function getDefaultAccountForType(type: ScheduledItem['type']): string {
  switch (type) {
    case 'bill': return 'checking_default'
    case 'goal': return 'savings_default'
    case 'debt': return 'checking_default'
    case 'investment': return 'investment_default'
    case 'income': return 'checking_default'
    default: return 'checking_default'
  }
}

/**
 * Create bill scheduled item
 */
export function createBillScheduledItem(
  name: string,
  amount: number,
  categoryId: string,
  cadence: ScheduledItem['cadence'],
  nextDue: string,
  autoAssign: boolean = true
): ScheduledItem {
  return {
    id: `bill_${Date.now()}`,
    type: 'bill',
    category_id: categoryId,
    amount: -Math.abs(amount), // Negative for outflow
    cadence,
    next_due: nextDue,
    auto_assign: autoAssign,
    strategy: 'fixed',
    metadata: {
      bill_name: name,
      auto_pay: false
    }
  }
}

/**
 * Create goal scheduled item
 */
export function createGoalScheduledItem(
  name: string,
  targetAmount: number,
  monthlyContribution: number,
  categoryId: string,
  nextDue: string
): ScheduledItem {
  return {
    id: `goal_${Date.now()}`,
    type: 'goal',
    category_id: categoryId,
    amount: -Math.abs(monthlyContribution), // Negative for outflow to goal
    cadence: 'monthly',
    next_due: nextDue,
    auto_assign: true,
    strategy: 'fixed',
    metadata: {
      goal_name: name,
      target_amount: targetAmount,
      current_saved: 0
    }
  }
}

/**
 * Create debt scheduled item
 */
export function createDebtScheduledItem(
  name: string,
  balance: number,
  minPayment: number,
  apr: number,
  categoryId: string,
  nextDue: string,
  strategy: 'snowball' | 'avalanche' = 'avalanche'
): ScheduledItem {
  return {
    id: `debt_${Date.now()}`,
    type: 'debt',
    category_id: categoryId,
    amount: -Math.abs(minPayment), // Negative for outflow
    cadence: 'monthly',
    next_due: nextDue,
    auto_assign: true,
    strategy: 'fixed',
    metadata: {
      debt_name: name,
      balance,
      apr,
      method: strategy,
      min_payment: minPayment
    }
  }
}

/**
 * Create investment scheduled item
 */
export function createInvestmentScheduledItem(
  name: string,
  monthlyContribution: number,
  categoryId: string,
  nextDue: string,
  strategy: 'fixed' | 'percent_split' = 'fixed'
): ScheduledItem {
  return {
    id: `investment_${Date.now()}`,
    type: 'investment',
    category_id: categoryId,
    amount: -Math.abs(monthlyContribution), // Negative for outflow
    cadence: 'monthly',
    next_due: nextDue,
    auto_assign: true,
    strategy,
    metadata: {
      investment_name: name,
      contribution_amount: monthlyContribution,
      net_or_gross: 'net'
    }
  }
}

/**
 * Create income scheduled item
 */
export function createIncomeScheduledItem(
  name: string,
  amount: number,
  cadence: ScheduledItem['cadence'],
  nextDue: string,
  autoAssignRuleId?: string
): ScheduledItem {
  return {
    id: `income_${Date.now()}`,
    type: 'income',
    category_id: null, // Income goes to TA
    amount: Math.abs(amount), // Positive for inflow
    cadence,
    next_due: nextDue,
    auto_assign: !!autoAssignRuleId,
    strategy: autoAssignRuleId ? 'percent_split' : undefined,
    metadata: {
      income_source: name,
      auto_assign_rule_id: autoAssignRuleId,
      net_or_gross: 'net'
    }
  }
}

/**
 * Apply auto-assign rule when income is posted
 */
export function applyAutoAssignRule(
  rule: AutoAssignRule,
  incomeAmount: number,
  month: string
): BudgetEntry[] {
  const assignments: BudgetEntry[] = []
  let remainingAmount = incomeAmount

  rule.rules.forEach(ruleItem => {
    let assignAmount = 0

    switch (rule.type) {
      case 'percent_split':
        assignAmount = incomeAmount * (ruleItem.percent || 0) / 100
        break
      case 'priority':
        assignAmount = Math.min(
          remainingAmount, 
          ruleItem.min_amount || ruleItem.target_amount || 0
        )
        break
      case 'template':
        assignAmount = Math.min(remainingAmount, ruleItem.fixed_amount || 0)
        break
    }

    if (assignAmount > 0) {
      assignments.push({
        id: `assignment_${Date.now()}_${ruleItem.category_id}`,
        month_id: month,
        category_id: ruleItem.category_id,
        assigned: assignAmount
      })
      
      remainingAmount -= assignAmount
    }
  })

  return assignments
}

/**
 * Process month close with rollover rules
 */
export function processMonthClose(
  monthSummary: MonthSummary,
  categories: Category[]
): {
  nextMonthTA: number
  carryoverAdjustments: Array<{
    category_id: string
    carryover_amount: number
    action: 'carry' | 'return' | 'reduce_ta' | 'prompt'
  }>
} {
  let nextMonthTA = 0
  const carryoverAdjustments: any[] = []

  monthSummary.categories.forEach(categoryBalance => {
    const category = categories.find(cat => cat.id === categoryBalance.category_id)
    if (!category) return

    if (categoryBalance.available > 0) {
      // Positive balance
      if (category.rollover_positive === 'return') {
        nextMonthTA += categoryBalance.available
        carryoverAdjustments.push({
          category_id: categoryBalance.category_id,
          carryover_amount: categoryBalance.available,
          action: 'return'
        })
      } else {
        // 'carry' - stays in category for next month
        carryoverAdjustments.push({
          category_id: categoryBalance.category_id,
          carryover_amount: categoryBalance.available,
          action: 'carry'
        })
      }
    } else if (categoryBalance.available < 0) {
      // Negative balance (overspend)
      if (category.rollover_negative === 'reduce_ta') {
        nextMonthTA += categoryBalance.available // Negative reduces TA
        carryoverAdjustments.push({
          category_id: categoryBalance.category_id,
          carryover_amount: categoryBalance.available,
          action: 'reduce_ta'
        })
      } else {
        // 'prompt' - requires user action
        carryoverAdjustments.push({
          category_id: categoryBalance.category_id,
          carryover_amount: categoryBalance.available,
          action: 'prompt'
        })
      }
    }
  })

  return {
    nextMonthTA,
    carryoverAdjustments
  }
}
