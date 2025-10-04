// Budget v2 - Transactions as Source of Truth
// All computed values are derived, not persisted

export interface Account {
  id: string
  name: string
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'loan'
  on_budget: boolean
  balance: number
}

export interface Transaction {
  id: string
  date: string // ISO date
  account_id: string
  payee?: string
  memo?: string
  amount: number // signed: inflow > 0 to budget; outflow < 0 from budget
  type: 'inflow' | 'outflow' | 'transfer'
  category_id?: string | null // inflows usually null (to TA)
  inflow_to_budget?: boolean // true when this inflow increases TA
  related_txn_id?: string | null // link legs of transfers / splits
  splits?: Array<{
    category_id: string
    amount: number
    memo?: string
  }>
  cleared?: boolean
  planned?: boolean
}

export interface BudgetMonth {
  id: string
  month: string // 'YYYY-MM'
}

export interface BudgetEntry {
  id: string
  month_id: string
  category_id: string
  assigned: number // >= 0, the planned amount
}

export interface Category {
  id: string
  name: string
  group_id: string
  rollover_positive: 'carry' | 'return'
  rollover_negative: 'reduce_ta' | 'prompt'
  is_savings?: boolean // marks "Savings" envelopes
  target_type?: 'none' | 'monthly' | 'by_date' | 'target_balance'
  target_value?: number | null
  target_date?: string | null
  sort_index?: number
}

export interface Group {
  id: string
  name: string
  type?: 'person' | 'project' | 'other'
  sort_index?: number
  color?: string
}

export interface ScheduledItem {
  id: string
  type: 'bill' | 'goal' | 'debt' | 'investment' | 'income'
  category_id: string | null // income may be null
  amount: number
  cadence: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'quarterly' | 'yearly' | 'oneoff'
  next_due: string // ISO date
  auto_assign: boolean
  strategy?: 'fixed' | 'average' | 'percent_split' | 'priority'
  metadata?: Record<string, any> // {apr, target, method:'snowball'|'avalanche', net_or_gross:'net'|'gross'}
}

export interface PlannedTransaction {
  id: string
  scheduled_item_id: string
  date: string
  amount: number
  account_id?: string
  category_id?: string
}

// Derived computed values (never persisted)
export interface CategoryBalance {
  category_id: string
  month: string
  assigned: number // from budget_entries
  spent: number // computed from transactions
  available: number // assigned - spent + carryover
  carryover_from_prior: number
}

export interface MonthSummary {
  month: string
  to_allocate: number // TA
  total_assigned: number
  total_spent: number
  total_inflows: number
  categories: CategoryBalance[]
  overspends: CategoryBalance[] // categories with available < 0
}

export interface AutoAssignRule {
  id: string
  income_scheduled_item_id: string
  type: 'percent_split' | 'priority' | 'template'
  rules: Array<{
    category_id: string
    percent?: number // for percent_split
    min_amount?: number // for priority
    target_amount?: number // for priority
    fixed_amount?: number // for template
  }>
}

// Group calculations
export interface GroupBalance {
  group_id: string
  group_name: string
  group_type: string
  month: string
  assigned: number
  spent: number
  available: number
  min_required: number
  shortfall: number
  categories: CategoryBalance[]
}

// Savings runway calculations
export interface SavingsRunway {
  liquid_cash_now: number
  monthly_income_forecast: number
  monthly_bills_forecast: number
  variable_spend_forecast: number
  planned_contributions: number
  monthly_outflow_forecast: number
  monthly_net_forecast: number
  runway_months: number
  depletion_date?: string
  forecast_mode: 'planned_only' | 'planned_plus_average'
  warning_threshold_months: number
  is_critical: boolean
}

export interface CashFlowForecast {
  month: string
  projected_income: number
  projected_outflow: number
  projected_net: number
  confidence: 'high' | 'medium' | 'low'
  data_points: number
}

// Feature flag for gradual rollout
export const FEATURE_BUDGET_V2 = true // Internal code flag, NOT in .env

// Month utilities
export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getPreviousMonth(month: string): string {
  const [year, monthNum] = month.split('-').map(Number)
  const date = new Date(year, monthNum - 1, 1)
  date.setMonth(date.getMonth() - 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function getNextMonth(month: string): string {
  const [year, monthNum] = month.split('-').map(Number)
  const date = new Date(year, monthNum - 1, 1)
  date.setMonth(date.getMonth() + 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// Frequency normalization for display
export function normalizeToMonthly(amount: number, cadence: ScheduledItem['cadence']): number {
  switch (cadence) {
    case 'weekly': return amount * 52 / 12
    case 'biweekly': return amount * 26 / 12
    case 'semimonthly': return amount * 2
    case 'monthly': return amount
    case 'quarterly': return amount / 3
    case 'yearly': return amount / 12
    case 'oneoff': return 0 // One-time items don't contribute to monthly
    default: return amount
  }
}
