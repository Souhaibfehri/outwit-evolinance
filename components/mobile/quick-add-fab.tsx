'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus, 
  DollarSign, 
  Calendar,
  Tag,
  Building,
  Zap,
  Clock
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface QuickAddTransaction {
  amount: string
  merchant: string
  categoryId: string
  accountId: string
  type: 'INCOME' | 'EXPENSE'
  date: string
}

interface QuickAddMemory {
  lastUsedPayees: string[]
  lastUsedCategories: string[]
  lastUsedAccounts: string[]
  frequentCombinations: Array<{
    merchant: string
    categoryId: string
    accountId: string
    frequency: number
  }>
}

interface QuickAddFABProps {
  categories: any[]
  accounts: any[]
  onTransactionAdded: (transaction: any) => void
  className?: string
}

export function QuickAddFAB({ 
  categories, 
  accounts, 
  onTransactionAdded, 
  className 
}: QuickAddFABProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [transaction, setTransaction] = useState<QuickAddTransaction>({
    amount: '',
    merchant: '',
    categoryId: '',
    accountId: '',
    type: 'EXPENSE',
    date: new Date().toISOString().split('T')[0]
  })
  const [memory, setMemory] = useState<QuickAddMemory>({
    lastUsedPayees: [],
    lastUsedCategories: [],
    lastUsedAccounts: [],
    frequentCombinations: []
  })
  const [suggestions, setSuggestions] = useState<{
    payees: string[]
    categories: any[]
    accounts: any[]
  }>({
    payees: [],
    categories: [],
    accounts: []
  })

  useEffect(() => {
    // Load memory from localStorage
    const savedMemory = localStorage.getItem('quick-add-memory')
    if (savedMemory) {
      try {
        setMemory(JSON.parse(savedMemory))
      } catch (error) {
        console.error('Failed to load quick-add memory:', error)
      }
    }
  }, [])

  useEffect(() => {
    // Update suggestions based on current input and memory
    updateSuggestions()
  }, [transaction.merchant, memory])

  const updateSuggestions = () => {
    // Payee suggestions
    const payeeSuggestions = transaction.merchant.length > 0
      ? memory.lastUsedPayees.filter(payee => 
          payee.toLowerCase().includes(transaction.merchant.toLowerCase())
        ).slice(0, 5)
      : memory.lastUsedPayees.slice(0, 5)

    // Category suggestions based on merchant
    const categorySuggestions = transaction.merchant.length > 0
      ? memory.frequentCombinations
          .filter(combo => combo.merchant.toLowerCase().includes(transaction.merchant.toLowerCase()))
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 3)
          .map(combo => categories.find(cat => cat.id === combo.categoryId))
          .filter(Boolean)
      : categories.filter(cat => memory.lastUsedCategories.includes(cat.id)).slice(0, 3)

    // Account suggestions
    const accountSuggestions = accounts.filter(acc => 
      memory.lastUsedAccounts.includes(acc.id)
    ).slice(0, 3)

    setSuggestions({
      payees: payeeSuggestions,
      categories: categorySuggestions,
      accounts: accountSuggestions
    })
  }

  const handleSubmit = async () => {
    if (!transaction.amount || !transaction.merchant || !transaction.categoryId || !transaction.accountId) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      // Check if online
      const isOnline = navigator.onLine

      if (!isOnline) {
        // Add to offline queue
        addToOfflineQueue(transaction)
        toast.success('Transaction saved offline. Will sync when online.')
      } else {
        // Submit immediately
        await submitTransaction(transaction)
        toast.success('Transaction added successfully')
      }

      // Update memory
      updateMemory(transaction)
      
      // Reset form
      setTransaction({
        amount: '',
        merchant: '',
        categoryId: '',
        accountId: '',
        type: 'EXPENSE',
        date: new Date().toISOString().split('T')[0]
      })
      
      setIsOpen(false)
      onTransactionAdded(transaction)

    } catch (error) {
      console.error('Error adding transaction:', error)
      toast.error('Failed to add transaction')
    }
  }

  const submitTransaction = async (txn: QuickAddTransaction) => {
    const formData = new FormData()
    formData.append('amount', txn.amount)
    formData.append('merchant', txn.merchant)
    formData.append('categoryId', txn.categoryId)
    formData.append('accountId', txn.accountId)
    formData.append('type', txn.type)
    formData.append('date', txn.date)

    const response = await fetch('/api/transactions', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Failed to submit transaction')
    }

    return response.json()
  }

  const addToOfflineQueue = (txn: QuickAddTransaction) => {
    const queue = JSON.parse(localStorage.getItem('offline-transaction-queue') || '[]')
    queue.push({
      ...txn,
      id: `offline_${Date.now()}`,
      createdAt: new Date().toISOString()
    })
    localStorage.setItem('offline-transaction-queue', JSON.stringify(queue))
  }

  const updateMemory = (txn: QuickAddTransaction) => {
    const newMemory: QuickAddMemory = {
      lastUsedPayees: [
        txn.merchant,
        ...memory.lastUsedPayees.filter(p => p !== txn.merchant)
      ].slice(0, 10),
      lastUsedCategories: [
        txn.categoryId,
        ...memory.lastUsedCategories.filter(c => c !== txn.categoryId)
      ].slice(0, 10),
      lastUsedAccounts: [
        txn.accountId,
        ...memory.lastUsedAccounts.filter(a => a !== txn.accountId)
      ].slice(0, 5),
      frequentCombinations: updateFrequentCombinations(memory.frequentCombinations, txn)
    }

    setMemory(newMemory)
    localStorage.setItem('quick-add-memory', JSON.stringify(newMemory))
  }

  const updateFrequentCombinations = (
    combinations: QuickAddMemory['frequentCombinations'],
    txn: QuickAddTransaction
  ) => {
    const existing = combinations.find(combo => 
      combo.merchant === txn.merchant && 
      combo.categoryId === txn.categoryId &&
      combo.accountId === txn.accountId
    )

    if (existing) {
      existing.frequency++
      return combinations.sort((a, b) => b.frequency - a.frequency).slice(0, 20)
    } else {
      return [
        ...combinations,
        {
          merchant: txn.merchant,
          categoryId: txn.categoryId,
          accountId: txn.accountId,
          frequency: 1
        }
      ].sort((a, b) => b.frequency - a.frequency).slice(0, 20)
    }
  }

  return (
    <>
      {/* FAB Button */}
      <motion.div
        className={`fixed bottom-6 right-6 z-50 ${className}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="lg"
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full shadow-lg bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Plus className="h-6 w-6" />
        </Button>
        
        {/* Offline Indicator */}
        {!navigator.onLine && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center"
          >
            <span className="text-xs text-white">!</span>
          </motion.div>
        )}
      </motion.div>

      {/* Quick Add Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              Quick Add Transaction
            </DialogTitle>
            <DialogDescription>
              Fast transaction entry with smart suggestions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={transaction.amount}
                  onChange={(e) => setTransaction(prev => ({ ...prev, amount: e.target.value }))}
                  className="pl-10 text-lg font-medium"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>

            {/* Merchant with Suggestions */}
            <div className="space-y-2">
              <Label htmlFor="merchant">Merchant/Payee</Label>
              <Input
                id="merchant"
                value={transaction.merchant}
                onChange={(e) => setTransaction(prev => ({ ...prev, merchant: e.target.value }))}
                placeholder="Where did you spend?"
              />
              
              {/* Payee Suggestions */}
              {suggestions.payees.length > 0 && transaction.merchant.length === 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground mr-2">Recent:</span>
                  {suggestions.payees.slice(0, 3).map(payee => (
                    <Button
                      key={payee}
                      variant="outline"
                      size="sm"
                      onClick={() => setTransaction(prev => ({ ...prev, merchant: payee }))}
                      className="text-xs h-6"
                    >
                      {payee}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Category with Smart Suggestions */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={transaction.categoryId}
                onValueChange={(value) => setTransaction(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {/* Suggested Categories First */}
                  {suggestions.categories.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                        Suggested for "{transaction.merchant}"
                      </div>
                      {suggestions.categories.map(category => (
                        <SelectItem key={`suggested_${category.id}`} value={category.id}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-orange-600" />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                      <div className="border-t my-1" />
                    </>
                  )}
                  
                  {/* All Categories */}
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Account */}
            <div className="space-y-2">
              <Label>Account</Label>
              <Select
                value={transaction.accountId}
                onValueChange={(value) => setTransaction(prev => ({ ...prev, accountId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <Building className="h-3 w-3" />
                        {account.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant={transaction.type === 'EXPENSE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTransaction(prev => ({ ...prev, type: 'EXPENSE' }))}
                className="flex-1"
              >
                Expense
              </Button>
              <Button
                variant={transaction.type === 'INCOME' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTransaction(prev => ({ ...prev, type: 'INCOME' }))}
                className="flex-1"
              >
                Income
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Offline Queue Manager
export function useOfflineQueue() {
  const [queueSize, setQueueSize] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Check queue size on mount
    updateQueueSize()

    // Listen for online/offline events
    const handleOnline = () => {
      processOfflineQueue()
    }

    const handleOffline = () => {
      toast.info('You\'re offline. Transactions will be saved locally and synced when online.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const updateQueueSize = () => {
    const queue = JSON.parse(localStorage.getItem('offline-transaction-queue') || '[]')
    setQueueSize(queue.length)
  }

  const processOfflineQueue = async () => {
    if (isProcessing) return

    setIsProcessing(true)
    const queue = JSON.parse(localStorage.getItem('offline-transaction-queue') || '[]')

    if (queue.length === 0) {
      setIsProcessing(false)
      return
    }

    let processed = 0
    let failed = 0

    for (const transaction of queue) {
      try {
        const formData = new FormData()
        formData.append('amount', transaction.amount)
        formData.append('merchant', transaction.merchant)
        formData.append('categoryId', transaction.categoryId)
        formData.append('accountId', transaction.accountId)
        formData.append('type', transaction.type)
        formData.append('date', transaction.date)

        const response = await fetch('/api/transactions', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          processed++
        } else {
          failed++
        }
      } catch (error) {
        console.error('Error processing offline transaction:', error)
        failed++
      }
    }

    // Clear processed transactions
    if (processed > 0) {
      localStorage.removeItem('offline-transaction-queue')
      setQueueSize(0)
      toast.success(`${processed} offline transactions synced successfully`)
    }

    if (failed > 0) {
      toast.error(`${failed} transactions failed to sync`)
    }

    setIsProcessing(false)
  }

  return {
    queueSize,
    isProcessing,
    processQueue: processOfflineQueue
  }
}

// Offline Queue Indicator
export function OfflineQueueIndicator() {
  const { queueSize, isProcessing, processQueue } = useOfflineQueue()

  if (queueSize === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-24 right-6 z-40"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={processQueue}
        disabled={isProcessing}
        className="bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
      >
        <Clock className="h-4 w-4 mr-2" />
        {isProcessing ? 'Syncing...' : `${queueSize} offline`}
      </Button>
    </motion.div>
  )
}
