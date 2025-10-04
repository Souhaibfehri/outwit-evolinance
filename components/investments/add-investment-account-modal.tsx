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
import { Switch } from '@/components/ui/switch'
import { PiggyBank, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { CreateInvestmentAccountRequest, InvestType, getInvestmentTypeLabel } from '@/lib/types/investments'

interface AddInvestmentAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const INVESTMENT_TYPES: InvestType[] = ['BROKERAGE', 'RETIREMENT', 'SAVINGS', 'CRYPTO', 'OTHER']

export function AddInvestmentAccountModal({ isOpen, onClose, onSuccess }: AddInvestmentAccountModalProps) {
  const [formData, setFormData] = useState<CreateInvestmentAccountRequest>({
    name: '',
    type: 'BROKERAGE',
    currency: 'USD',
    trackHoldings: false,
    currentValue: 0
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Please enter an account name')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/investments/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Investment account created successfully!')
        onSuccess()
        
        // Reset form
        setFormData({
          name: '',
          type: 'BROKERAGE',
          currency: 'USD',
          trackHoldings: false,
          currentValue: 0
        })
      } else {
        toast.error(data.error || 'Failed to create investment account')
      }
    } catch (error) {
      console.error('Error creating investment account:', error)
      toast.error('Failed to create investment account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-green-600" />
            Add Investment Account
          </DialogTitle>
          <DialogDescription>
            Create a new investment account to track contributions and growth
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Account Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Fidelity 401k, Vanguard IRA"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Account Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: InvestType) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVESTMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getInvestmentTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="current-value">Current Value (Optional)</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="current-value"
                type="number"
                min="0"
                step="0.01"
                value={formData.currentValue || ''}
                onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) || 0 })}
                className="pl-10"
                placeholder="10000.00"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="track-holdings">Track Market Value</Label>
              <p className="text-xs text-gray-500">
                Record periodic market values for performance tracking
              </p>
            </div>
            <Switch
              id="track-holdings"
              checked={formData.trackHoldings}
              onCheckedChange={(checked) => setFormData({ ...formData, trackHoldings: checked })}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
