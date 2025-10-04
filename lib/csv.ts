// Shared CSV utilities for exports and imports

export interface CSVColumn {
  key: string
  label: string
  transform?: (value: any) => string
}

/**
 * Convert data to CSV string
 */
export function toCSV<T extends Record<string, any>>(
  data: T[],
  columns: CSVColumn[]
): string {
  if (!data.length) return ''

  // Create header row
  const headers = columns.map(col => `"${col.label}"`).join(',')
  
  // Create data rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key]
      
      // Apply transform if provided
      if (col.transform) {
        value = col.transform(value)
      }
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        value = ''
      }
      
      // Convert to string and escape quotes
      const stringValue = String(value).replace(/"/g, '""')
      
      // Wrap in quotes
      return `"${stringValue}"`
    }).join(',')
  })
  
  return [headers, ...rows].join('\n')
}

/**
 * Download CSV file in browser
 */
export function downloadCSV(
  filename: string,
  csvContent: string,
  mimeType: string = 'text/csv;charset=utf-8;'
): void {
  if (typeof window === 'undefined') {
    console.warn('downloadCSV can only be used in browser environment')
    return
  }

  const blob = new Blob([csvContent], { type: mimeType })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Format currency values for CSV
 */
export function formatCurrency(cents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(cents / 100)
}

/**
 * Format dates for CSV
 */
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (format === 'long') {
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  return d.toLocaleDateString('en-US')
}

/**
 * Format percentage for CSV
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Predefined column sets for common exports
 */
export const CSV_COLUMNS = {
  transactions: [
    { key: 'date', label: 'Date', transform: (val: string) => formatDate(val) },
    { key: 'merchant', label: 'Description' },
    { key: 'categoryName', label: 'Category' },
    { key: 'type', label: 'Type' },
    { key: 'amountCents', label: 'Amount', transform: (val: number) => formatCurrency(val) },
    { key: 'accountName', label: 'Account' },
    { key: 'note', label: 'Note' }
  ] as CSVColumn[],

  bills: [
    { key: 'name', label: 'Bill Name' },
    { key: 'amount', label: 'Amount', transform: (val: number) => formatCurrency(val * 100) },
    { key: 'nextDue', label: 'Next Due', transform: (val: string) => formatDate(val) },
    { key: 'categoryName', label: 'Category' },
    { key: 'frequency', label: 'Frequency' },
    { key: 'active', label: 'Active', transform: (val: boolean) => val ? 'Yes' : 'No' }
  ] as CSVColumn[],

  income: [
    { key: 'name', label: 'Income Source' },
    { key: 'amountCents', label: 'Amount', transform: (val: number) => formatCurrency(val) },
    { key: 'schedule', label: 'Frequency' },
    { key: 'nextDate', label: 'Next Payment', transform: (val: string) => formatDate(val) },
    { key: 'active', label: 'Active', transform: (val: boolean) => val ? 'Yes' : 'No' }
  ] as CSVColumn[],

  goals: [
    { key: 'name', label: 'Goal Name' },
    { key: 'target', label: 'Target Amount', transform: (val: number) => formatCurrency(val) },
    { key: 'saved', label: 'Current Amount', transform: (val: number) => formatCurrency(val) },
    { key: 'progress', label: 'Progress', transform: (val: number) => formatPercentage(val) },
    { key: 'targetDate', label: 'Target Date', transform: (val: string) => val ? formatDate(val) : 'Not set' }
  ] as CSVColumn[],

  debts: [
    { key: 'name', label: 'Debt Name' },
    { key: 'balance', label: 'Balance', transform: (val: number) => formatCurrency(val * 100) },
    { key: 'rate', label: 'APR', transform: (val: number) => formatPercentage(val * 100, 2) },
    { key: 'minPayment', label: 'Minimum Payment', transform: (val: number) => val ? formatCurrency(val * 100) : 'N/A' },
    { key: 'paymentType', label: 'Payment Type' }
  ] as CSVColumn[],

  budgetSummary: [
    { key: 'month', label: 'Month' },
    { key: 'expectedIncome', label: 'Expected Income', transform: (val: number) => formatCurrency(val * 100) },
    { key: 'totalAssigned', label: 'Total Assigned', transform: (val: number) => formatCurrency(val * 100) },
    { key: 'totalSpent', label: 'Total Spent', transform: (val: number) => formatCurrency(val * 100) },
    { key: 'readyToAssign', label: 'Ready to Assign', transform: (val: number) => formatCurrency(val * 100) }
  ] as CSVColumn[],

  investments: [
    { key: 'name', label: 'Investment Name' },
    { key: 'amount', label: 'Contribution Amount', transform: (val: number) => formatCurrency(val * 100) },
    { key: 'frequency', label: 'Frequency' },
    { key: 'expectedAPR', label: 'Expected APR', transform: (val: number) => formatPercentage(val * 100, 2) },
    { key: 'nextDate', label: 'Next Contribution', transform: (val: string) => formatDate(val) }
  ] as CSVColumn[]
}

/**
 * Parse CSV content to array of objects
 */
export function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) return []

  // Parse header
  const headers = parseCSVLine(lines[0])
  
  // Parse data rows
  const data: Record<string, string>[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === headers.length) {
      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      data.push(row)
    }
  }
  
  return data
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0
  
  while (i < line.length) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i += 2
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        i++
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current)
      current = ''
      i++
    } else {
      current += char
      i++
    }
  }
  
  // Add the last field
  result.push(current)
  
  return result
}

/**
 * Validate CSV import data
 */
export function validateCSVImport(
  data: Record<string, string>[],
  requiredColumns: string[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (data.length === 0) {
    errors.push('CSV file is empty')
    return { isValid: false, errors }
  }
  
  // Check for required columns
  const firstRow = data[0]
  const availableColumns = Object.keys(firstRow)
  
  for (const required of requiredColumns) {
    if (!availableColumns.includes(required)) {
      errors.push(`Missing required column: ${required}`)
    }
  }
  
  // Check for data consistency
  const columnCount = availableColumns.length
  data.forEach((row, index) => {
    if (Object.keys(row).length !== columnCount) {
      errors.push(`Row ${index + 1} has inconsistent number of columns`)
    }
  })
  
  return { isValid: errors.length === 0, errors }
}
