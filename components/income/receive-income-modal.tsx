'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, Calendar, CheckCircle, Info } from 'lucide-react'
import { toast } from 'sonner'
import { IncomeOccurrence } from '@/lib/types/income'

interface ReceiveIncomeModalProps {
  isOpen: boolean
  onClose: () => void
  occurrenceId: string
  occurrence?: IncomeOccurrence
  onSuccess: (occurrenceId: string, amount: number, accountId: string, budgetMonth: 'current' | 'next', note?: string) => void
}

// Mock accounts - would come from props in real implementation
const ACCOUNTS = [
  { id: 'checking_main', name: 'Main Checking', balance: 5420 },
  { id: 'savings_main', name: 'High-Yield Savings', balance: 12850 }
]

export function ReceiveIncomeModal({
  isOpen,
  onClose,
  occurrenceId,
  occurrence,
  onSuccess
}: ReceiveIncomeModalProps) {
  const [amount, setAmount] = useState(occurrence?.net || 0)
  const [accountId, setAccountId] = useState('checking_main')
  const [budgetMonth, setBudgetMonth] = useState<'current' | 'next'>('current')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  if (!occurrence) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!accountId) {
      toast.error('Please select an account')
      return
    }

    setLoading(true)

    try {
      await onSuccess(occurrenceId, amount, accountId, budgetMonth, note || undefined)
    } catch (error) {
      console.error('Error receiving income:', error)
      toast.error('Failed to receive income')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Receive Income
          </DialogTitle>
          <DialogDescription>
            Record that you received this scheduled income
          </DialogDescription>
        </DialogHeader>

        {/* Occurrence Details */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">Scheduled Date:</span>
                <span className="font-medium">{formatDate(occurrence.scheduledAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">Expected Amount:</span>
                <span className="font-medium">{formatCurrency(occurrence.net)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">Budget Month:</span>
                <span className="font-medium">{occurrence.budgetMonth}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Actual Amount */}
          <div>
            <Label htmlFor="amount">Actual Amount Received *</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="pl-10"
                placeholder="0.00"
                required
              />
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAmount(occurrence.net)}
              >
                Use Expected ({formatCurrency(occurrence.net)})
              </Button>
            </div>
          </div>

          {/* Account Selection */}
          <div>
            <Label htmlFor="account">Deposit Into Account *</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNTS.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{account.name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {formatCurrency(account.balance)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Budget Month Assignment */}
          <div>
            <Label htmlFor="budget-month">Assign to Budget Month</Label>
            <Select value={budgetMonth} onValueChange={(value: any) => setBudgetMonth(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Month</SelectItem>
                <SelectItem value="next">Next Month</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Choose next month for late payments or end-of-month timing
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="note">Notes (Optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any additional notes about this income..."
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Impact Preview */}
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-green-600" />
                <h4 className="font-medium text-green-900 dark:text-green-100">
                  Budget Impact
                </h4>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">Ready-to-Assign will increase by:</span>
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">Budget month:</span>
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {budgetMonth === 'current' ? 'Current' : 'Next'} Month
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>

        <DialogFooter className="sticky bottom-0 bg-white dark:bg-gray-800 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || amount <= 0 || !accountId}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Processing...' : 'Receive Income'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
