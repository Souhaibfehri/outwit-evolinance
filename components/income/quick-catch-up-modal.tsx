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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, Zap, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { IncomeSourceWithOccurrences } from '@/lib/types/income'

interface QuickCatchUpModalProps {
  isOpen: boolean
  onClose: () => void
  sources: IncomeSourceWithOccurrences[]
  onSuccess: () => void
}

export function QuickCatchUpModal({ isOpen, onClose, sources, onSuccess }: QuickCatchUpModalProps) {
  const [sourceId, setSourceId] = useState('')
  const [totalAmount, setTotalAmount] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [accountId, setAccountId] = useState('checking_main')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (totalAmount <= 0) {
      toast.error('Please enter a valid total amount')
      return
    }

    if (!sourceId) {
      toast.error('Please select an income source')
      return
    }

    if (!startDate || !endDate) {
      toast.error('Please select start and end dates')
      return
    }

    setLoading(true)

    try {
      // In production, would call API to split amount across date range
      toast.success(`Quick catch-up of $${totalAmount.toLocaleString()} recorded successfully!`)
      onSuccess()
      
      // Reset form
      setSourceId('')
      setTotalAmount(0)
      setStartDate('')
      setEndDate('')
    } catch (error) {
      console.error('Error recording catch-up income:', error)
      toast.error('Failed to record catch-up income')
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Quick Catch-Up Income
          </DialogTitle>
          <DialogDescription>
            Record multiple missed income payments as a lump sum
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="source">Income Source *</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select income source" />
              </SelectTrigger>
              <SelectContent>
                {sources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="total-amount">Total Amount *</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="total-amount"
                type="number"
                min="0"
                step="0.01"
                value={totalAmount || ''}
                onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                className="pl-10"
                placeholder="2500.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date *</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date *</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
                required
              />
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || totalAmount <= 0 || !sourceId || !startDate || !endDate}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {loading ? 'Processing...' : 'Record Catch-Up'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
