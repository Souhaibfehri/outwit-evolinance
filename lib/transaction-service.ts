// Transaction service with splits, transfers, and proper data integrity

export interface TransactionBase {
  id: string
  date: string
  merchant: string
  description?: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
  accountId: string
  categoryId: string
  budgetMonth: string
  note?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface SplitTransaction extends TransactionBase {
  splitGroupId: string
  splitParentId?: string
  splitAmount: number
  splitPercentage?: number
}

export interface TransferTransaction extends TransactionBase {
  transferPeerId: string
  transferToAccountId: string
  transferFromAccountId: string
}

export interface TransactionSplit {
  categoryId: string
  amount: number
  percentage?: number
  memo?: string
}

export interface CreateTransactionRequest {
  date: string
  merchant: string
  description?: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
  accountId: string
  categoryId?: string
  note?: string
  budgetMonth?: string
  splits?: TransactionSplit[]
  transferToAccountId?: string
}

/**
 * Calculate budget month from transaction date
 */
export function calculateBudgetMonth(
  transactionDate: string, 
  userSettings?: { monthEndOffset?: number }
): string {
  const date = new Date(transactionDate)
  const offset = userSettings?.monthEndOffset || 0
  
  // If offset is set, transactions near month end can be assigned to next month
  if (offset > 0) {
    const daysFromMonthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() - date.getDate()
    if (daysFromMonthEnd <= offset) {
      date.setMonth(date.getMonth() + 1)
    }
  }
  
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Validate split transaction
 */
export function validateSplits(
  totalAmount: number,
  splits: TransactionSplit[],
  splitType: 'percentage' | 'amount'
): { isValid: boolean; error?: string } {
  if (splits.length === 0) {
    return { isValid: false, error: 'At least one split is required' }
  }

  if (splitType === 'percentage') {
    const totalPercentage = splits.reduce((sum, split) => sum + (split.percentage || 0), 0)
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return { isValid: false, error: `Percentages must sum to 100% (currently ${totalPercentage.toFixed(1)}%)` }
    }
  } else {
    const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0)
    if (Math.abs(totalSplitAmount - totalAmount) > 0.01) {
      return { isValid: false, error: `Split amounts must sum to $${totalAmount.toFixed(2)} (currently $${totalSplitAmount.toFixed(2)})` }
    }
  }

  return { isValid: true }
}

/**
 * Create split transactions from a parent transaction
 */
export function createSplitTransactions(
  parentTransaction: CreateTransactionRequest,
  splits: TransactionSplit[],
  userId: string
): SplitTransaction[] {
  const splitGroupId = `split_${Date.now()}`
  const parentId = `txn_${Date.now()}`
  
  return splits.map((split, index) => ({
    id: `${parentId}_split_${index}`,
    date: parentTransaction.date,
    merchant: parentTransaction.merchant,
    description: split.memo || parentTransaction.description,
    amount: split.amount,
    type: parentTransaction.type,
    accountId: parentTransaction.accountId,
    categoryId: split.categoryId,
    budgetMonth: parentTransaction.budgetMonth || calculateBudgetMonth(parentTransaction.date),
    note: parentTransaction.note,
    userId,
    splitGroupId,
    splitParentId: parentId,
    splitAmount: split.amount,
    splitPercentage: split.percentage,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))
}

/**
 * Create transfer transaction pair
 */
export function createTransferTransactions(
  request: CreateTransactionRequest,
  userId: string
): TransferTransaction[] {
  if (!request.transferToAccountId) {
    throw new Error('Transfer requires destination account')
  }

  const transferId = `transfer_${Date.now()}`
  const outgoingId = `${transferId}_out`
  const incomingId = `${transferId}_in`

  const baseTransaction = {
    date: request.date,
    merchant: request.merchant,
    description: request.description || `Transfer to ${request.transferToAccountId}`,
    amount: request.amount,
    budgetMonth: request.budgetMonth || calculateBudgetMonth(request.date),
    note: request.note,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  return [
    {
      ...baseTransaction,
      id: outgoingId,
      type: 'expense' as const,
      amount: -Math.abs(request.amount), // Negative for outgoing
      accountId: request.accountId,
      categoryId: 'transfer_out',
      transferPeerId: incomingId,
      transferToAccountId: request.transferToAccountId,
      transferFromAccountId: request.accountId
    },
    {
      ...baseTransaction,
      id: incomingId,
      type: 'income' as const,
      amount: Math.abs(request.amount), // Positive for incoming
      accountId: request.transferToAccountId,
      categoryId: 'transfer_in',
      transferPeerId: outgoingId,
      transferToAccountId: request.transferToAccountId,
      transferFromAccountId: request.accountId
    }
  ]
}

/**
 * Update transaction and maintain data integrity
 */
export function updateTransaction(
  transactionId: string,
  updates: Partial<TransactionBase>,
  allTransactions: TransactionBase[]
): TransactionBase[] {
  return allTransactions.map(txn => {
    if (txn.id === transactionId) {
      return {
        ...txn,
        ...updates,
        updatedAt: new Date().toISOString()
      }
    }
    return txn
  })
}

/**
 * Delete transaction and handle splits/transfers
 */
export function deleteTransaction(
  transactionId: string,
  allTransactions: (TransactionBase | SplitTransaction | TransferTransaction)[]
): (TransactionBase | SplitTransaction | TransferTransaction)[] {
  const transaction = allTransactions.find(txn => txn.id === transactionId)
  if (!transaction) return allTransactions

  let toDelete = [transactionId]

  // If it's a split transaction, delete all splits in the group
  if ('splitGroupId' in transaction && transaction.splitGroupId) {
    const splitTransactions = allTransactions.filter(txn => 
      'splitGroupId' in txn && txn.splitGroupId === transaction.splitGroupId
    )
    toDelete = splitTransactions.map(txn => txn.id)
  }

  // If it's a transfer, delete the peer transaction
  if ('transferPeerId' in transaction && transaction.transferPeerId) {
    toDelete.push(transaction.transferPeerId)
  }

  return allTransactions.filter(txn => !toDelete.includes(txn.id))
}

/**
 * Get transactions for a specific month with proper filtering
 */
export function getTransactionsForMonth(
  month: string,
  allTransactions: TransactionBase[],
  excludeTransfers: boolean = false
): TransactionBase[] {
  return allTransactions.filter(txn => {
    const matchesMonth = txn.budgetMonth === month
    const isTransfer = txn.categoryId === 'transfer_in' || txn.categoryId === 'transfer_out'
    
    if (excludeTransfers && isTransfer) return false
    return matchesMonth
  })
}

/**
 * Calculate spending totals for budget reconciliation
 */
export function calculateSpendingTotals(
  transactions: TransactionBase[],
  month: string
): {
  totalIncome: number
  totalExpenses: number
  netAmount: number
  transactionCount: number
} {
  const monthTransactions = getTransactionsForMonth(month, transactions, true)

  const totalIncome = monthTransactions
    .filter(txn => txn.type === 'income')
    .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)

  const totalExpenses = monthTransactions
    .filter(txn => txn.type === 'expense')
    .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)

  return {
    totalIncome,
    totalExpenses,
    netAmount: totalIncome - totalExpenses,
    transactionCount: monthTransactions.length
  }
}
