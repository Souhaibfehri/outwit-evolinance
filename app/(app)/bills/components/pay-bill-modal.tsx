'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface Bill {
  id: string
  name: string
  amount: number
  categoryName: string
  accountName: string
  nextDue: string
}

interface PayBillModalProps {
  bill: Bill
  onPaid: () => void
  children: React.ReactNode
}

export function PayBillModal({ bill, onPaid, children }: PayBillModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    paidAmount: bill.amount,
    paidDate: new Date().toISOString().split('T')[0],
    accountId: '',
    note: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/bills/${bill.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paidAmount: formData.paidAmount,
          paidDate: new Date(formData.paidDate).toISOString(),
          accountId: formData.accountId || undefined,
          note: formData.note || undefined
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Bill marked as paid successfully!')
        setOpen(false)
        onPaid()
        
        // Reset form
        setFormData({
          paidAmount: bill.amount,
          paidDate: new Date().toISOString().split('T')[0],
          accountId: '',
          note: ''
        })
      } else {
        toast.error(result.error || 'Failed to pay bill')
      }
    } catch (error) {
      console.error('Error paying bill:', error)
      toast.error('Failed to pay bill')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Pay Bill
          </DialogTitle>
          <DialogDescription>
            Mark "{bill.name}" as paid and create a transaction.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bill Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{bill.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {bill.categoryName} • Due: {new Date(bill.nextDue).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-lg">{formatCurrency(bill.amount)}</p>
                <p className="text-xs text-muted-foreground">{bill.accountName}</p>
              </div>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.paidAmount}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  paidAmount: parseFloat(e.target.value) || 0
                }))}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Payment Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.paidDate}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                paidDate: e.target.value
              }))}
              required
            />
          </div>

          {/* Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="account">Account (Optional)</Label>
            <Select
              value={formData.accountId}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                accountId: value
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Use default account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Use default account</SelectItem>
                {/* In a real app, these would be loaded from user's accounts */}
                <SelectItem value="checking">Checking Account</SelectItem>
                <SelectItem value="credit">Credit Card</SelectItem>
                <SelectItem value="savings">Savings Account</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Add a note about this payment..."
              value={formData.note}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                note: e.target.value
              }))}
              rows={2}
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Mark as Paid'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
