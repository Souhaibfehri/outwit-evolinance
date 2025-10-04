// Enhanced CSV utility functions with import/export capabilities

export interface CSVExportOptions {
  filename: string
  headers?: string[]
  dateRange?: {
    from: Date
    to: Date
  }
  filters?: Record<string, any>
}

export interface CSVImportResult {
  success: boolean
  imported: number
  errors: Array<{ row: number, message: string }>
  duplicates: number
  data?: any[]
}

// Enhanced CSV export function
export function toCSV(data: any[], headers?: string[]): string {
  if (data.length === 0) return ''
  
  const keys = headers || Object.keys(data[0])
  const csvHeaders = keys.join(',')
  const csvRows = data.map(row => 
    keys.map(key => {
      const value = row[key]
      // Handle different data types
      if (value === null || value === undefined) return ''
      if (value instanceof Date) return value.toISOString().split('T')[0]
      if (typeof value === 'number') return value.toString()
      if (typeof value === 'boolean') return value ? 'Yes' : 'No'
      
      // Escape commas and quotes for strings
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(',')
  )
  
  return [csvHeaders, ...csvRows].join('\n')
}

// Enhanced download function with metadata
export function downloadCSV(data: any[], options: CSVExportOptions): void {
  const csv = toCSV(data, options.headers)
  
  // Add metadata header
  const metadata = [
    `# Outwit Budget Export`,
    `# Generated: ${new Date().toISOString()}`,
    `# Records: ${data.length}`,
    options.dateRange ? `# Date Range: ${options.dateRange.from.toISOString().split('T')[0]} to ${options.dateRange.to.toISOString().split('T')[0]}` : '',
    `#`,
    csv
  ].filter(Boolean).join('\n')
  
  const blob = new Blob([metadata], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', options.filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

// Specific export functions for each module
export function exportTransactionsCSV(transactions: any[], options: Partial<CSVExportOptions> = {}) {
  const headers = ['Date', 'Merchant', 'Category', 'Account', 'Type', 'Amount', 'Note']
  const data = transactions.map(t => ({
    Date: t.date,
    Merchant: t.merchant || t.description,
    Category: t.categoryName || t.category,
    Account: t.accountName || t.account,
    Type: t.type,
    Amount: t.amountCents ? t.amountCents / 100 : t.amount,
    Note: t.note || ''
  }))
  
  downloadCSV(data, {
    filename: `transactions-${new Date().toISOString().split('T')[0]}.csv`,
    headers,
    ...options
  })
}

export function exportBillsCSV(bills: any[], options: Partial<CSVExportOptions> = {}) {
  const headers = ['Name', 'Amount', 'Category', 'Frequency', 'Next Due', 'Last Paid', 'Active']
  const data = bills.map(b => ({
    Name: b.name,
    Amount: b.amount,
    Category: b.categoryName || b.category,
    Frequency: b.frequency || 'Monthly',
    'Next Due': b.nextDue,
    'Last Paid': b.lastPaid || '',
    Active: b.active
  }))
  
  downloadCSV(data, {
    filename: `bills-${new Date().toISOString().split('T')[0]}.csv`,
    headers,
    ...options
  })
}

export function exportGoalsCSV(goals: any[], options: Partial<CSVExportOptions> = {}) {
  const headers = ['Name', 'Target', 'Saved', 'Progress', 'Target Date', 'Priority', 'Notifications']
  const data = goals.map(g => ({
    Name: g.name,
    Target: g.targetCents ? g.targetCents / 100 : g.target,
    Saved: g.savedCents ? g.savedCents / 100 : g.saved,
    Progress: g.targetCents ? ((g.savedCents / g.targetCents) * 100).toFixed(1) + '%' : '0%',
    'Target Date': g.targetDate || '',
    Priority: g.priority || 3,
    Notifications: g.notify ? 'Yes' : 'No'
  }))
  
  downloadCSV(data, {
    filename: `goals-${new Date().toISOString().split('T')[0]}.csv`,
    headers,
    ...options
  })
}

export function exportInvestmentsCSV(investments: any[], options: Partial<CSVExportOptions> = {}) {
  const headers = ['Name', 'Type', 'Monthly Contribution', 'Expected Return', 'Risk Level', 'Auto Invest', 'Started']
  const data = investments.map(i => ({
    Name: i.name,
    Type: i.type,
    'Monthly Contribution': i.monthlyContributionCents ? i.monthlyContributionCents / 100 : i.monthlyContribution,
    'Expected Return': i.expectedReturnPercent ? i.expectedReturnPercent + '%' : i.expectedReturn,
    'Risk Level': i.riskLevel || 'Medium',
    'Auto Invest': i.autoInvest ? 'Yes' : 'No',
    Started: i.startDate || i.createdAt
  }))
  
  downloadCSV(data, {
    filename: `investments-${new Date().toISOString().split('T')[0]}.csv`,
    headers,
    ...options
  })
}

// Generate CSV templates
export function downloadTransactionTemplate() {
  const templateData = [
    {
      Date: '2024-01-15',
      Merchant: 'Grocery Store',
      Category: 'Groceries',
      Account: 'Checking',
      Type: 'EXPENSE',
      Amount: -127.50,
      Note: 'Weekly shopping'
    },
    {
      Date: '2024-01-16',
      Merchant: 'Salary Deposit',
      Category: 'Income',
      Account: 'Checking',
      Type: 'INCOME',
      Amount: 3000.00,
      Note: 'Monthly salary'
    }
  ]
  
  downloadCSV(templateData, {
    filename: 'transaction-template.csv'
  })
}

export function downloadBillTemplate() {
  const templateData = [
    {
      Name: 'Electric Bill',
      Amount: 125.00,
      Category: 'Utilities',
      Frequency: 'Monthly',
      'Next Due': '2024-02-01',
      'Last Paid': '2024-01-01',
      Active: 'Yes'
    }
  ]
  
  downloadCSV(templateData, {
    filename: 'bills-template.csv'
  })
}
