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
import { BarChart3, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { InvestmentAccountWithDetails } from '@/lib/types/investments'

interface RecordValueModalProps {
  isOpen: boolean
  onClose: () => void
  account?: InvestmentAccountWithDetails
  onSuccess: (accountId: string, value: number, asOf: string) => void
}

export function RecordValueModal({ isOpen, onClose, account, onSuccess }: RecordValueModalProps) {
  const [value, setValue] = useState<number>(0)
  const [asOf, setAsOf] = useState<string>(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  if (!account) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (value <= 0) {
      toast.error('Please enter a valid market value')
      return
    }

    setLoading(true)

    try {
      await onSuccess(account.id, value, asOf)
      
      // Reset form
      setValue(0)
      setAsOf(new Date().toISOString().split('T')[0])
    } catch (error) {
      console.error('Error recording market value:', error)
      toast.error('Failed to record market value')
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Record Market Value
          </DialogTitle>
          <DialogDescription>
            Update the current market value for {account.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="value">Current Market Value *</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="value"
                type="number"
                min="0"
                step="0.01"
                value={value || ''}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                className="pl-10"
                placeholder="12500.00"
                required
              />
            </div>
            {account.currentValue && (
              <p className="text-xs text-gray-500 mt-1">
                Previous value: {formatCurrency(account.currentValue)}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="as-of">As of Date</Label>
            <Input
              id="as-of"
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
              className="mt-1"
              required
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || value <= 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Recording...' : 'Record Value'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
