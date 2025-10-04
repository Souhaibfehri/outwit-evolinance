'use server'

import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { z } from 'zod'

// Transaction Schema
const TransactionSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  merchant: z.string().min(1, 'Description is required'),
  categoryId: z.string().optional(),
  accountId: z.string().min(1, 'Account is required'),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amountCents: z.number().min(0, 'Amount must be positive'),
  note: z.string().optional(),
})

// Account Schema
const AccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.string().min(1, 'Account type is required'),
  balanceCents: z.number().default(0),
})

export async function createTransaction(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const categoryId = formData.get('categoryId') as string
    const accountId = formData.get('accountId') as string
    
    const data = {
      date: formData.get('date') as string,
      merchant: formData.get('merchant') as string,
      categoryId: categoryId === 'uncategorized' ? undefined : categoryId,
      accountId: accountId === 'no-accounts' ? '' : accountId,
      type: formData.get('type') as 'INCOME' | 'EXPENSE' | 'TRANSFER',
      amountCents: Math.round(parseFloat(formData.get('amount') as string || '0') * 100),
      note: formData.get('note') as string || undefined,
    }

    const validatedData = TransactionSchema.parse(data)

    // Get existing transactions
    const existingTransactions = user.user_metadata?.transactions || []
    
    // Create new transaction with ID
    const newTransaction = {
      id: Date.now().toString(),
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedTransactions = [...existingTransactions, newTransaction]

    // Update account balance
    const accounts = user.user_metadata?.accounts || []
    const updatedAccounts = accounts.map((account: any) => {
      if (account.id === validatedData.accountId) {
        const balanceChange = validatedData.type === 'INCOME' 
          ? validatedData.amountCents 
          : -validatedData.amountCents
        return {
          ...account,
          balanceCents: account.balanceCents + balanceChange,
          updatedAt: new Date().toISOString(),
        }
      }
      return account
    })

    // Update budget spending if it's an expense with a category
    let updatedBudgetEntries = user.user_metadata?.budget_entries || []
    if (validatedData.type === 'EXPENSE' && validatedData.categoryId) {
      const transactionDate = new Date(validatedData.date)
      const month = transactionDate.getMonth() + 1
      const year = transactionDate.getFullYear()
      
      updatedBudgetEntries = updatedBudgetEntries.map((entry: any) => {
        if (entry.categoryId === validatedData.categoryId && 
            entry.month === month && 
            entry.year === year) {
          return {
            ...entry,
            spentCents: (entry.spentCents || 0) + validatedData.amountCents,
            updatedAt: new Date().toISOString(),
          }
        }
        return entry
      })
    }

    const result = await updateUserMetadata({
      transactions: updatedTransactions,
      accounts: updatedAccounts,
      budget_entries: updatedBudgetEntries,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Transaction created successfully!', transaction: newTransaction }
  } catch (error) {
    console.error('Error creating transaction:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors?.map(e => e.message).join(', ') || 'Validation error' }
    }
    return { success: false, error: 'Failed to create transaction' }
  }
}

export async function updateTransaction(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const id = formData.get('id') as string
    const data = {
      date: formData.get('date') as string,
      merchant: formData.get('merchant') as string,
      categoryId: formData.get('categoryId') as string || undefined,
      accountId: formData.get('accountId') as string,
      type: formData.get('type') as 'INCOME' | 'EXPENSE' | 'TRANSFER',
      amountCents: Math.round(parseFloat(formData.get('amount') as string || '0') * 100),
      note: formData.get('note') as string || undefined,
    }

    const validatedData = TransactionSchema.parse(data)

    // Get existing transactions
    const existingTransactions = user.user_metadata?.transactions || []
    const oldTransaction = existingTransactions.find((t: any) => t.id === id)
    
    if (!oldTransaction) {
      return { success: false, error: 'Transaction not found' }
    }

    // Update the transaction
    const updatedTransactions = existingTransactions.map((transaction: any) => 
      transaction.id === id 
        ? {
            ...transaction,
            ...validatedData,
            updatedAt: new Date().toISOString(),
          }
        : transaction
    )

    // Update account balances (reverse old transaction, apply new one)
    const accounts = user.user_metadata?.accounts || []
    const updatedAccounts = accounts.map((account: any) => {
      let balanceChange = 0
      
      // Reverse old transaction
      if (account.id === oldTransaction.accountId) {
        balanceChange -= oldTransaction.type === 'INCOME' 
          ? oldTransaction.amountCents 
          : -oldTransaction.amountCents
      }
      
      // Apply new transaction
      if (account.id === validatedData.accountId) {
        balanceChange += validatedData.type === 'INCOME' 
          ? validatedData.amountCents 
          : -validatedData.amountCents
      }
      
      if (balanceChange !== 0) {
        return {
          ...account,
          balanceCents: account.balanceCents + balanceChange,
          updatedAt: new Date().toISOString(),
        }
      }
      return account
    })

    const result = await updateUserMetadata({
      transactions: updatedTransactions,
      accounts: updatedAccounts,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Transaction updated successfully!' }
  } catch (error) {
    console.error('Error updating transaction:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors?.map(e => e.message).join(', ') || 'Validation error' }
    }
    return { success: false, error: 'Failed to update transaction' }
  }
}

export async function deleteTransaction(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const id = formData.get('id') as string

    // Get existing transactions
    const existingTransactions = user.user_metadata?.transactions || []
    const transactionToDelete = existingTransactions.find((t: any) => t.id === id)
    
    if (!transactionToDelete) {
      return { success: false, error: 'Transaction not found' }
    }

    // Remove the transaction
    const updatedTransactions = existingTransactions.filter((transaction: any) => transaction.id !== id)

    // Update account balance (reverse the transaction)
    const accounts = user.user_metadata?.accounts || []
    const updatedAccounts = accounts.map((account: any) => {
      if (account.id === transactionToDelete.accountId) {
        const balanceChange = transactionToDelete.type === 'INCOME' 
          ? -transactionToDelete.amountCents 
          : transactionToDelete.amountCents
        return {
          ...account,
          balanceCents: account.balanceCents + balanceChange,
          updatedAt: new Date().toISOString(),
        }
      }
      return account
    })

    // Update budget spending if it was an expense with a category
    let updatedBudgetEntries = user.user_metadata?.budget_entries || []
    if (transactionToDelete.type === 'EXPENSE' && transactionToDelete.categoryId) {
      const transactionDate = new Date(transactionToDelete.date)
      const month = transactionDate.getMonth() + 1
      const year = transactionDate.getFullYear()
      
      updatedBudgetEntries = updatedBudgetEntries.map((entry: any) => {
        if (entry.categoryId === transactionToDelete.categoryId && 
            entry.month === month && 
            entry.year === year) {
          return {
            ...entry,
            spentCents: Math.max(0, (entry.spentCents || 0) - transactionToDelete.amountCents),
            updatedAt: new Date().toISOString(),
          }
        }
        return entry
      })
    }

    const result = await updateUserMetadata({
      transactions: updatedTransactions,
      accounts: updatedAccounts,
      budget_entries: updatedBudgetEntries,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Transaction deleted successfully!' }
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return { success: false, error: 'Failed to delete transaction' }
  }
}

export async function createAccount(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const data = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      balanceCents: Math.round(parseFloat(formData.get('balance') as string || '0') * 100),
    }

    const validatedData = AccountSchema.parse(data)

    // Get existing accounts
    const existingAccounts = user.user_metadata?.accounts || []
    
    // Check for duplicate name
    if (existingAccounts.some((acc: any) => acc.name.toLowerCase() === validatedData.name.toLowerCase())) {
      return { success: false, error: 'Account name already exists' }
    }

    // Add new account with ID
    const newAccount = {
      id: Date.now().toString(),
      ...validatedData,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedAccounts = [...existingAccounts, newAccount]

    const result = await updateUserMetadata({
      accounts: updatedAccounts,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Account created successfully!', account: newAccount }
  } catch (error) {
    console.error('Error creating account:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors?.map(e => e.message).join(', ') || 'Validation error' }
    }
    return { success: false, error: 'Failed to create account' }
  }
}

export async function importCSV(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const csvFile = formData.get('csvFile') as File
    const accountId = formData.get('accountId') as string
    const dateFormat = formData.get('dateFormat') as string || 'MM/DD/YYYY'
    
    if (!csvFile || csvFile.size === 0) {
      return { success: false, error: 'Please select a CSV file' }
    }

    if (!accountId) {
      return { success: false, error: 'Please select an account' }
    }

    const csvText = await csvFile.text()
    const lines = csvText.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return { success: false, error: 'CSV file must have at least a header row and one data row' }
    }

    // Parse CSV (simple implementation)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const transactions = []
    let importedCount = 0
    let skippedCount = 0

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        
        // Try to map common CSV formats
        const dateIndex = headers.findIndex(h => h.includes('date'))
        const amountIndex = headers.findIndex(h => h.includes('amount') || h.includes('debit') || h.includes('credit'))
        const descriptionIndex = headers.findIndex(h => h.includes('description') || h.includes('merchant') || h.includes('payee'))
        
        if (dateIndex === -1 || amountIndex === -1 || descriptionIndex === -1) {
          skippedCount++
          continue
        }

        const dateStr = values[dateIndex]
        const amountStr = values[amountIndex]
        const description = values[descriptionIndex]

        // Parse date (basic implementation)
        let date: Date
        try {
          date = new Date(dateStr)
          if (isNaN(date.getTime())) {
            throw new Error('Invalid date')
          }
        } catch {
          skippedCount++
          continue
        }

        // Parse amount
        const amount = parseFloat(amountStr.replace(/[^0-9.-]/g, ''))
        if (isNaN(amount)) {
          skippedCount++
          continue
        }

        const transaction = {
          id: `import_${Date.now()}_${i}`,
          date: date.toISOString().split('T')[0],
          merchant: description,
          accountId,
          type: amount >= 0 ? 'INCOME' : 'EXPENSE',
          amountCents: Math.abs(Math.round(amount * 100)),
          note: `Imported from CSV`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        transactions.push(transaction)
        importedCount++
      } catch (error) {
        skippedCount++
        continue
      }
    }

    if (importedCount === 0) {
      return { success: false, error: 'No valid transactions found in CSV file' }
    }

    // Add transactions to user data
    const existingTransactions = user.user_metadata?.transactions || []
    const updatedTransactions = [...existingTransactions, ...transactions]

    const result = await updateUserMetadata({
      transactions: updatedTransactions,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { 
      success: true, 
      message: `Successfully imported ${importedCount} transactions${skippedCount > 0 ? ` (${skippedCount} skipped)` : ''}`,
      imported: importedCount,
      skipped: skippedCount
    }
  } catch (error) {
    console.error('Error importing CSV:', error)
    return { success: false, error: 'Failed to import CSV file' }
  }
}

export async function exportTransactions() {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const transactions = user.user_metadata?.transactions || []
    const categories = user.user_metadata?.budget_categories || []
    const accounts = user.user_metadata?.accounts || []

    // Create CSV content
    const headers = ['Date', 'Description', 'Category', 'Account', 'Type', 'Amount', 'Note']
    const csvContent = [
      headers.join(','),
      ...transactions.map((transaction: any) => {
        const category = categories.find((cat: any) => cat.id === transaction.categoryId)
        const account = accounts.find((acc: any) => acc.id === transaction.accountId)
        
        return [
          transaction.date,
          `"${transaction.merchant}"`,
          category ? `"${category.name}"` : 'Uncategorized',
          account ? `"${account.name}"` : 'Unknown',
          transaction.type,
          (transaction.amountCents / 100).toFixed(2),
          transaction.note ? `"${transaction.note}"` : ''
        ].join(',')
      })
    ].join('\n')

    return { 
      success: true, 
      data: csvContent,
      filename: `outwit-budget-transactions-${new Date().toISOString().split('T')[0]}.csv`
    }
  } catch (error) {
    console.error('Error exporting transactions:', error)
    return { success: false, error: 'Failed to export transactions' }
  }
}
