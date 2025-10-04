'use client'

import { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { DollarSign, Calendar, CreditCard, Info, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { DebtListItem } from '@/lib/types/debts'
import { calculatePaymentAllocation } from '@/lib/debt-payoff-engine'

interface MakePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  debtId: string
  debt?: DebtListItem
  onSuccess: (debtId: string, amount: number, accountId: string) => void
}

export function MakePaymentModal({
  isOpen,
  onClose,
  debtId,
  debt,
  onSuccess
}: MakePaymentModalProps) {
  const [amount, setAmount] = useState(debt?.minPayment || 0)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [accountId, setAccountId] = useState('')
  const [assignToMonth, setAssignToMonth] = useState<'current' | 'next'>('current')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [allocation, setAllocation] = useState<{
    interest: number
    principal: number
    fees: number
  } | null>(null)

  // Mock accounts - would come from props in real implementation
  const accounts = [
    { id: 'checking_main', name: 'Main Checking', type: 'checking' },
    { id: 'savings_main', name: 'Savings Account', type: 'savings' }
  ]

  useEffect(() => {
    if (debt && amount > 0) {
      // Calculate payment allocation preview
      const mockDebt = {
        id: debt.id,
        userId: 'current',
        name: debt.name,
        type: debt.type as any,
        currency: 'USD',
        principalBalance: debt.balance,
        apr: debt.apr,
        minPayment: debt.minPayment,
        startDate: new Date().toISOString(),
        timezone: 'UTC',
        autopayEnabled: debt.autopayEnabled,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const alloc = calculatePaymentAllocation(mockDebt, amount)
      setAllocation(alloc)
    }
  }, [debt, amount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!debt || amount <= 0 || !accountId) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      onSuccess(debtId, amount, accountId)
    } catch (error) {
      console.error('Error making payment:', error)
      toast.error('Failed to record payment')
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

  const newBalance = debt ? Math.max(0, debt.balance - (allocation?.principal || 0)) : 0
  const isPayoff = newBalance <= 0.01

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[92vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Make Payment: {debt?.name}
          </DialogTitle>
          <DialogDescription>
            Record a payment and update your debt balance
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Payment Amount *</Label>
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
                  onClick={() => setAmount(debt?.minPayment || 0)}
                >
                  Min: {formatCurrency(debt?.minPayment || 0)}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setAmount(debt?.balance || 0)}
                >
                  Pay Off
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="date">Payment Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1"
                required
              />
            </div>
          </div>

          {/* Account and Month Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="account">Pay From Account *</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="month-assign">Assign to Budget Month</Label>
              <Select value={assignToMonth} onValueChange={(value: any) => setAssignToMonth(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Month</SelectItem>
                  <SelectItem value="next">Next Month</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Choose next month for late payments or holiday timing
              </p>
            </div>
          </div>

          {/* Payment Allocation Preview */}
          {allocation && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Payment Breakdown
                  </h4>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(allocation.interest)}
                    </div>
                    <div className="text-xs text-red-700 dark:text-red-300">
                      Interest
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(allocation.principal)}
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-300">
                      Principal
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrency(newBalance)}
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      New Balance
                    </div>
                  </div>
                </div>

                {isPayoff && (
                  <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700 text-center">
                    <div className="text-green-800 dark:text-green-200 font-medium">
                      🎉 This payment will pay off your debt completely!
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="note">Notes (Optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Additional notes about this payment..."
              className="mt-1"
              rows={3}
            />
          </div>
        </form>

        <DialogFooter className="sticky bottom-0 bg-white dark:bg-gray-800 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || amount <= 0 || !accountId}
            className={isPayoff 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "bg-blue-600 hover:bg-blue-700 text-white"
            }
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
            ) : isPayoff ? (
              <Trophy className="h-4 w-4 mr-2" />
            ) : (
              <DollarSign className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Processing...' : isPayoff ? 'Pay Off Debt!' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
