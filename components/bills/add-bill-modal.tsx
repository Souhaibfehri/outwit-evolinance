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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, CreditCard, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { CreateBillRequest, FREQUENCY_LABELS } from '@/lib/types/bills'
import { getNextOccurrences, validateBillSchedule } from '@/lib/bill-scheduler'

interface AddBillModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editBill?: any // For edit mode
  categories: Array<{ id: string; name: string; groupName: string }>
  accounts: Array<{ id: string; name: string }>
}

export function AddBillModal({
  isOpen,
  onClose,
  onSuccess,
  editBill,
  categories,
  accounts
}: AddBillModalProps) {
  const [loading, setLoading] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [previewDates, setPreviewDates] = useState<string[]>([])

  const [formData, setFormData] = useState<CreateBillRequest>({
    name: '',
    amount: 0,
    currency: 'USD',
    categoryId: '',
    accountId: '',
    frequency: 'monthly',
    dayOfMonth: 1,
    dueTime: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    startsOn: new Date().toISOString().split('T')[0],
    autopayEnabled: false,
    autopayGraceDays: 0,
    businessDayRule: 'none'
  })

  // Load edit data
  useEffect(() => {
    if (editBill) {
      setFormData({
        name: editBill.name,
        amount: editBill.amount,
        currency: editBill.currency || 'USD',
        categoryId: editBill.categoryId,
        accountId: editBill.accountId || '',
        frequency: editBill.frequency,
        everyN: editBill.everyN,
        dayOfMonth: editBill.dayOfMonth,
        weekday: editBill.weekday,
        dueTime: editBill.dueTime || '09:00',
        timezone: editBill.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        startsOn: editBill.startsOn || new Date().toISOString().split('T')[0],
        endsOn: editBill.endsOn,
        autopayEnabled: editBill.autopayEnabled || false,
        autopayGraceDays: editBill.autopayGraceDays || 0,
        businessDayRule: editBill.businessDayRule || 'none',
        notes: editBill.notes
      })
    }
  }, [editBill])

  // Update preview when schedule changes
  useEffect(() => {
    if (formData.name && formData.amount > 0 && formData.startsOn) {
      try {
        const mockBill = {
          ...formData,
          id: 'preview',
          userId: 'preview',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        const nextOccurrences = getNextOccurrences(mockBill, new Date(), 3)
        setPreviewDates(nextOccurrences.map(date => date.toLocaleDateString()))
      } catch (error) {
        setPreviewDates([])
      }
    }
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate
    const validation = validateBillSchedule(formData)
    if (!validation.isValid) {
      toast.error(validation.errors[0])
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/bills', {
        method: editBill ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editBill ? { billId: editBill.id, updates: formData } : formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || 'Failed to save bill')
      }
    } catch (error) {
      console.error('Error saving bill:', error)
      toast.error('Failed to save bill')
    } finally {
      setLoading(false)
    }
  }

  const createNewCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name')
      return
    }

    const categoryId = `cat_${Date.now()}`
    
    // Add to local categories list and select it
    setFormData({ ...formData, categoryId })
    setShowNewCategory(false)
    setNewCategoryName('')
    
    toast.success('Category will be created with the bill')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-600" />
            {editBill ? 'Edit Bill' : 'Add New Bill'}
          </DialogTitle>
          <DialogDescription>
            {editBill ? 'Update your bill details' : 'Create a recurring bill with automatic scheduling'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Bill Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Electric Bill, Netflix"
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="mt-1"
                required
              />
            </div>
          </div>

          {/* Category and Account */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              {showNewCategory ? (
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name"
                  />
                  <Button type="button" size="sm" onClick={createNewCategory}>
                    Create
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowNewCategory(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 mt-1">
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} ({category.groupName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowNewCategory(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="account">Default Account (Optional)</Label>
              <Select value={formData.accountId || ''} onValueChange={(value) => setFormData({ ...formData, accountId: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No default account</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="frequency">Frequency *</Label>
                <Select value={formData.frequency} onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.frequency === 'monthly' && (
                <div>
                  <Label htmlFor="dayOfMonth">Day of Month</Label>
                  <Select 
                    value={formData.dayOfMonth?.toString() || '1'} 
                    onValueChange={(value) => setFormData({ ...formData, dayOfMonth: parseInt(value) })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                      <SelectItem value="-1">Last day of month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.frequency === 'customEveryNMonths' && (
                <div>
                  <Label htmlFor="everyN">Every N Months</Label>
                  <Input
                    id="everyN"
                    type="number"
                    min="1"
                    max="12"
                    value={formData.everyN || ''}
                    onChange={(e) => setFormData({ ...formData, everyN: parseInt(e.target.value) || 1 })}
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="startsOn">Starts On *</Label>
                <Input
                  id="startsOn"
                  type="date"
                  value={formData.startsOn}
                  onChange={(e) => setFormData({ ...formData, startsOn: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Auto-pay Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autopay">Auto-payment</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically mark as paid when due
                </p>
              </div>
              <Switch
                id="autopay"
                checked={formData.autopayEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, autopayEnabled: checked })}
              />
            </div>

            {formData.autopayEnabled && (
              <div>
                <Label htmlFor="graceDays">Grace Days</Label>
                <Input
                  id="graceDays"
                  type="number"
                  min="0"
                  max="7"
                  value={formData.autopayGraceDays || ''}
                  onChange={(e) => setFormData({ ...formData, autopayGraceDays: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Days before due date to process auto-payment
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this bill..."
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Preview */}
          {previewDates.length > 0 && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Next 3 Due Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {previewDates.map((date, index) => (
                    <Badge key={index} variant="outline" className="text-blue-700 border-blue-300">
                      {date}
                    </Badge>
                  ))}
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
            disabled={loading || !formData.name.trim() || formData.amount <= 0 || !formData.categoryId}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
            ) : null}
            {loading ? 'Saving...' : (editBill ? 'Update Bill' : 'Create Bill')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
