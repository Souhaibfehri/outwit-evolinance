// Bills data model and contracts

export interface Bill {
  id: string
  userId: string
  name: string
  amount: number
  currency: string
  categoryId: string
  accountId?: string // Optional default pay-from account
  frequency: 'monthly' | 'weekly' | 'biweekly' | 'quarterly' | 'semiannual' | 'annual' | 'customEveryNMonths' | 'customCron'
  everyN?: number // For customEveryNMonths
  dayOfMonth?: number // 1-31 or -1 for "last"
  weekday?: number // 0-6 for weekly bills
  dueTime: string // HH:mm format
  timezone: string
  startsOn: string // ISO date
  endsOn?: string // ISO date, nullable
  autopayEnabled: boolean
  autopayGraceDays: number
  businessDayRule: 'none' | 'next_business_day'
  notes?: string
  createdAt: string
  updatedAt: string
  archivedAt?: string
}

export interface BillOccurrence {
  id: string
  billId: string
  dueDate: string // ISO datetime
  status: 'upcoming' | 'overdue' | 'paid' | 'skipped'
  paidTxId?: string
  amountOverride?: number
  createdAt: string
}

export interface BillPayment {
  id: string
  billId: string
  txId: string
  paidAt: string
  amount: number
  accountId: string
  note?: string
}

export interface NotificationSetting {
  id: string
  userId: string
  billId?: string // Null for global settings
  remindDaysBefore: number[]
  channels: {
    inapp: boolean
    email: boolean
  }
}

export interface BillKPIs {
  upcomingCount: number
  overdueCount: number
  thisMonthTotal: number
  autopayCount: number
  dueSoonCount: number
  nextDueDate?: string
}

export interface BillListItem {
  id: string
  name: string
  amount: number
  currency: string
  categoryName: string
  nextDueDate: string
  status: 'upcoming' | 'overdue' | 'paid' | 'due_today'
  daysUntilDue: number
  frequency: string
  frequencyDisplay: string
  autopayEnabled: boolean
  linkedCategoryId: string
  canPay: boolean
  isRecurring: boolean
}

export interface CreateBillRequest {
  name: string
  amount: number
  currency?: string
  categoryId: string
  accountId?: string
  frequency: Bill['frequency']
  everyN?: number
  dayOfMonth?: number
  weekday?: number
  dueTime?: string
  timezone?: string
  startsOn: string
  endsOn?: string
  autopayEnabled?: boolean
  autopayGraceDays?: number
  businessDayRule?: Bill['businessDayRule']
  notes?: string
}

export interface PayBillRequest {
  billId: string
  amount?: number // Override amount
  date?: string // Override date
  accountId?: string // Override account
  note?: string
  markAsPaid: boolean
}

export interface QuickCatchUpRequest {
  dateRange: {
    from: string
    to: string
  }
  selectedBills: string[]
  paymentMethod: 'individual' | 'aggregate_by_category'
  accountId: string
  notes?: string
}

// Frequency display helpers
export const FREQUENCY_LABELS: Record<Bill['frequency'], string> = {
  monthly: 'Monthly',
  weekly: 'Weekly', 
  biweekly: 'Bi-weekly',
  quarterly: 'Quarterly',
  semiannual: 'Semi-annual',
  annual: 'Annual',
  customEveryNMonths: 'Custom',
  customCron: 'Custom Schedule'
}

// Business day helpers
export const WEEKDAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]

export const BUSINESS_DAYS = [1, 2, 3, 4, 5] // Monday-Friday
