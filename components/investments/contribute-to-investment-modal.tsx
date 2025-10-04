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
import { DollarSign, TrendingUp, Target, ArrowRightLeft, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { InvestmentAccountWithDetails, InvestSource, getInvestSourceLabel } from '@/lib/types/investments'

interface ContributeToInvestmentModalProps {
  isOpen: boolean
  onClose: () => void
  account?: InvestmentAccountWithDetails
  onSuccess: (accountId: string, amount: number, source: InvestSource, accountSourceId?: string, note?: string) => void
}

const CONTRIBUTION_SOURCES: Array<{
  id: InvestSource
  name: string
  description: string
  icon: any
  requiresAccount?: boolean
}> = [
  {
    id: 'RTA',
    name: 'Ready-to-Assign',
    description: 'Use unallocated budget money (creates expense)',
    icon: Target,
    requiresAccount: false
  },
  {
    id: 'TRANSFER',
    name: 'Account Transfer',
    description: 'Transfer money from an account (no budget impact)',
    icon: ArrowRightLeft,
    requiresAccount: true
  },
  {
    id: 'ONE_OFF',
    name: 'One-off Income',
    description: 'Add income and immediately allocate to investment',
    icon: PlusCircle,
    requiresAccount: false
  }
]

// Mock accounts
const ACCOUNTS = [
  { id: 'checking_main', name: 'Main Checking', balance: 5420 },
  { id: 'savings_main', name: 'High-Yield Savings', balance: 12850 }
]

export function ContributeToInvestmentModal({ isOpen, onClose, account, onSuccess }: ContributeToInvestmentModalProps) {
  const [amount, setAmount] = useState<number>(0)
  const [source, setSource] = useState<InvestSource>('RTA')
  const [accountSourceId, setAccountSourceId] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [loading, setLoading] = useState(false)

  if (!account) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (amount <= 0) {
      toast.error('Please enter a contribution amount')
      return
    }

    const selectedSource = CONTRIBUTION_SOURCES.find(s => s.id === source)
    if (selectedSource?.requiresAccount && !accountSourceId) {
      toast.error('Please select an account for this contribution type')
      return
    }

    setLoading(true)

    try {
      await onSuccess(account.id, amount, source, accountSourceId || undefined, note || undefined)
      
      // Reset form
      setAmount(0)
      setSource('RTA')
      setAccountSourceId('')
      setNote('')
    } catch (error) {
      console.error('Error contributing to investment:', error)
      toast.error('Failed to record contribution')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const selectedSourceInfo = CONTRIBUTION_SOURCES.find(s => s.id === source)
  const selectedAccount = ACCOUNTS.find(a => a.id === accountSourceId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Contribute to {account.name}
          </DialogTitle>
          <DialogDescription>
            Add money to your investment account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contribution Amount */}
          <div>
            <Label htmlFor="amount">Contribution Amount *</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="pl-10"
                placeholder="500.00"
                required
              />
            </div>
            
            {/* Quick Amount Buttons */}
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAmount(100)}
              >
                $100
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAmount(500)}
              >
                $500
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAmount(1000)}
              >
                $1,000
              </Button>
            </div>
          </div>

          {/* Funding Source */}
          <div>
            <Label htmlFor="source">Funding Source *</Label>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {CONTRIBUTION_SOURCES.map((sourceOption) => {
                const IconComponent = sourceOption.icon
                const isSelected = source === sourceOption.id
                
                return (
                  <Card 
                    key={sourceOption.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                    onClick={() => setSource(sourceOption.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {sourceOption.name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {sourceOption.description}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Account Selection (if required) */}
          {selectedSourceInfo?.requiresAccount && (
            <div>
              <Label htmlFor="account">Select Account *</Label>
              <Select value={accountSourceId} onValueChange={setAccountSourceId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose account" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNTS.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{acc.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {formatCurrency(acc.balance)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedAccount && amount > selectedAccount.balance && (
                <div className="text-sm text-red-600 mt-1">
                  ⚠️ Insufficient balance (${selectedAccount.balance.toLocaleString()} available)
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="note">Notes (Optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this contribution..."
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
            disabled={loading || amount <= 0 || (selectedSourceInfo?.requiresAccount && !accountSourceId)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? 'Processing...' : 'Add Contribution'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
