'use client'

import { useState } from 'react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { DollarSign, Plus, Calendar } from 'lucide-react'
import { InfoHint } from '@/components/ui/info-hint'
import { toast } from 'sonner'

interface AddBillModalProps {
  children: React.ReactNode
}

export function AddBillModal({ children }: AddBillModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isRecurring, setIsRecurring] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    categoryId: '',
    accountId: '',
    frequency: 'monthly',
    interval: 1,
    byMonthDay: '',
    nextDue: new Date().toISOString().split('T')[0]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const billData = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        categoryId: formData.categoryId || undefined,
        accountId: formData.accountId || undefined,
        nextDue: new Date(formData.nextDue).toISOString(),
        recurrence: isRecurring ? {
          frequency: formData.frequency,
          interval: formData.interval,
          byMonthDay: formData.byMonthDay ? parseInt(formData.byMonthDay) : undefined,
          startDate: new Date(formData.nextDue).toISOString(),
          timezone: 'UTC'
        } : undefined
      }

      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Bill created successfully!')
        setOpen(false)
        window.location.reload() // Refresh the page to show new bill
        
        // Reset form
        setFormData({
          name: '',
          amount: '',
          categoryId: '',
          accountId: '',
          frequency: 'monthly',
          interval: 1,
          byMonthDay: '',
          nextDue: new Date().toISOString().split('T')[0]
        })
        setIsRecurring(true)
      } else {
        toast.error(result.error || 'Failed to create bill')
      }
    } catch (error) {
      console.error('Error creating bill:', error)
      toast.error('Failed to create bill')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-lg w-[92vw] max-h-[80vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background border-b pb-4 mb-4 z-10">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Bill
          </DialogTitle>
          <DialogDescription>
            Create a new recurring bill to track due dates and payments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bill Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Bill Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Electric Bill, Rent, Netflix"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                name: e.target.value
              }))}
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  amount: e.target.value
                }))}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                categoryId: value
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Category</SelectItem>
                {/* In a real app, these would be loaded from user's categories */}
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="rent">Rent & Housing</SelectItem>
                <SelectItem value="subscriptions">Subscriptions</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="loans">Loans & Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Account */}
          <div className="space-y-2">
            <Label htmlFor="account">Default Account</Label>
            <Select
              value={formData.accountId}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                accountId: value
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Default Account</SelectItem>
                <SelectItem value="checking">Checking Account</SelectItem>
                <SelectItem value="credit">Credit Card</SelectItem>
                <SelectItem value="savings">Savings Account</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recurring Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="recurring">Recurring Bill</Label>
              <InfoHint
                title="Recurring Bills"
                content="Recurring bills automatically calculate the next due date after you mark them as paid. One-time bills won't repeat."
              />
            </div>
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          {/* Recurrence Settings */}
          {isRecurring && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium text-sm">Recurrence Settings</h4>
              
              {/* Frequency */}
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    frequency: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="semi-annual">Semi-annual</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Monthly Day */}
              {formData.frequency === 'monthly' && (
                <div className="space-y-2">
                  <Label htmlFor="monthDay">Day of Month (Optional)</Label>
                  <Input
                    id="monthDay"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="e.g., 15 for 15th of each month"
                    value={formData.byMonthDay}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      byMonthDay: e.target.value
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use the same day as the first due date
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Next Due Date */}
          <div className="space-y-2">
            <Label htmlFor="nextDue">
              {isRecurring ? 'First Due Date' : 'Due Date'} *
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="nextDue"
                type="date"
                value={formData.nextDue}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  nextDue: e.target.value
                }))}
                className="pl-10"
                required
              />
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-background border-t pt-4 mt-4 z-10 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Bill'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
