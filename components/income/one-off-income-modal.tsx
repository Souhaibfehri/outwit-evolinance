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
import { DollarSign, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'

interface OneOffIncomeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function OneOffIncomeModal({ isOpen, onClose, onSuccess }: OneOffIncomeModalProps) {
  const [amount, setAmount] = useState(0)
  const [accountId, setAccountId] = useState('')
  const [category, setCategory] = useState('misc_income')
  const [budgetMonth, setBudgetMonth] = useState<'current' | 'next'>('current')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setLoading(true)

    try {
      // In production, would call API
      toast.success(`One-off income of $${amount.toLocaleString()} recorded successfully!`)
      onSuccess()
      
      // Reset form
      setAmount(0)
      setAccountId('')
      setNote('')
    } catch (error) {
      console.error('Error recording one-off income:', error)
      toast.error('Failed to record income')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-green-600" />
            Record One-Off Income
          </DialogTitle>
          <DialogDescription>
            Add a one-time income that's not part of your regular pay schedule
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount *</Label>
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
                placeholder="500.00"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="note">Description</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Freelance project, tax refund, bonus..."
              className="mt-1"
              rows={3}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || amount <= 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? 'Recording...' : 'Record Income'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
