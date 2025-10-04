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
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  DollarSign, 
  Calendar, 
  CreditCard, 
  ArrowRightLeft, 
  PlusCircle,
  Coins,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'
import { GoalWithProgress, ContributionSource, getContributionSourceLabel } from '@/lib/types/goals'

interface ContributeModalProps {
  isOpen: boolean
  onClose: () => void
  goal?: GoalWithProgress
  onSuccess: (goalId: string, amount: number, source: ContributionSource, accountId?: string, note?: string) => void
}

// Mock accounts - would come from props in real implementation
const ACCOUNTS = [
  { id: 'checking_main', name: 'Main Checking', balance: 5420 },
  { id: 'savings_main', name: 'High-Yield Savings', balance: 12850 },
  { id: 'money_market', name: 'Money Market', balance: 8200 }
]

const CONTRIBUTION_SOURCES: Array<{
  id: ContributionSource
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
    description: 'Add income and immediately allocate to goal',
    icon: PlusCircle,
    requiresAccount: false
  },
  {
    id: 'QUICK_CATCH_UP',
    name: 'Quick Catch-up',
    description: 'Extra contribution to catch up on target',
    icon: Zap,
    requiresAccount: false
  }
]

export function ContributeModal({ isOpen, onClose, goal, onSuccess }: ContributeModalProps) {
  const [amount, setAmount] = useState<number>(0)
  const [source, setSource] = useState<ContributionSource>('RTA')
  const [accountId, setAccountId] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [loading, setLoading] = useState(false)

  if (!goal) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (amount <= 0) {
      toast.error('Please enter a contribution amount')
      return
    }

    const selectedSource = CONTRIBUTION_SOURCES.find(s => s.id === source)
    if (selectedSource?.requiresAccount && !accountId) {
      toast.error('Please select an account for this contribution type')
      return
    }

    setLoading(true)

    try {
      await onSuccess(goal.id, amount, source, accountId || undefined, note || undefined)
      
      // Reset form
      setAmount(0)
      setSource('RTA')
      setAccountId('')
      setNote('')
    } catch (error) {
      console.error('Error contributing to goal:', error)
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

  const newSavedAmount = goal.savedAmount + amount
  const newProgressPercent = goal.targetAmount > 0 ? Math.min(100, (newSavedAmount / goal.targetAmount) * 100) : 0
  const remainingAmount = Math.max(0, goal.targetAmount - newSavedAmount)
  const willComplete = newProgressPercent >= 100

  const selectedSourceInfo = CONTRIBUTION_SOURCES.find(s => s.id === source)
  const selectedAccount = ACCOUNTS.find(a => a.id === accountId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Contribute to {goal.name}
          </DialogTitle>
          <DialogDescription>
            Add money to your goal and track your progress
          </DialogDescription>
        </DialogHeader>

        {/* Current Goal Status */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium text-blue-900 dark:text-blue-100">
                  Current Progress
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {formatCurrency(goal.savedAmount)} of {formatCurrency(goal.targetAmount)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {goal.progressPercent.toFixed(1)}%
                </div>
                <div className="text-xs text-blue-600">
                  {formatCurrency(goal.targetAmount - goal.savedAmount)} remaining
                </div>
              </div>
            </div>
            <Progress value={goal.progressPercent} className="h-2" />
          </CardContent>
        </Card>

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
                placeholder="100.00"
                required
              />
            </div>
            
            {/* Quick Amount Buttons */}
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAmount(50)}
              >
                $50
              </Button>
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
                onClick={() => setAmount(remainingAmount)}
                disabled={remainingAmount <= 0}
              >
                Complete Goal ({formatCurrency(remainingAmount)})
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
                        {isSelected && (
                          <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        )}
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
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose account" />
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

          {/* Contribution Preview */}
          {amount > 0 && (
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium text-green-900 dark:text-green-100">
                    Contribution Preview
                  </h4>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">New saved amount:</span>
                    <span className="font-medium text-green-900 dark:text-green-100">
                      {formatCurrency(newSavedAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">New progress:</span>
                    <span className="font-medium text-green-900 dark:text-green-100">
                      {newProgressPercent.toFixed(1)}%
                    </span>
                  </div>
                  {!willComplete && (
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-green-300">Remaining:</span>
                      <span className="font-medium text-green-900 dark:text-green-100">
                        {formatCurrency(remainingAmount)}
                      </span>
                    </div>
                  )}
                </div>

                {willComplete && (
                  <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700 text-center">
                    <div className="text-green-800 dark:text-green-200 font-medium">
                      🎉 This contribution will complete your goal!
                    </div>
                  </div>
                )}

                <div className="mt-3">
                  <Progress value={newProgressPercent} className="h-3" />
                </div>
              </CardContent>
            </Card>
          )}
        </form>

        <DialogFooter className="sticky bottom-0 bg-white dark:bg-gray-800 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || amount <= 0 || (selectedSourceInfo?.requiresAccount && !accountId)}
            className={willComplete 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "bg-blue-600 hover:bg-blue-700 text-white"
            }
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
            ) : willComplete ? (
              <Target className="h-4 w-4 mr-2" />
            ) : (
              <DollarSign className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Processing...' : willComplete ? 'Complete Goal!' : 'Add Contribution'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
