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
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Target, DollarSign, Calendar, Star, Bell } from 'lucide-react'
import { toast } from 'sonner'
import { CreateGoalRequest } from '@/lib/types/goals'

interface AddGoalModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const GOAL_TEMPLATES = [
  {
    name: 'Emergency Fund',
    targetAmount: 5000,
    priority: 5,
    description: 'Essential safety net for unexpected expenses'
  },
  {
    name: 'Vacation Fund',
    targetAmount: 2500,
    priority: 3,
    description: 'Save for that dream vacation'
  },
  {
    name: 'New Car Down Payment',
    targetAmount: 8000,
    priority: 4,
    description: 'Down payment for your next vehicle'
  },
  {
    name: 'Home Down Payment',
    targetAmount: 50000,
    priority: 5,
    description: 'Save for your first home'
  },
  {
    name: 'Wedding Fund',
    targetAmount: 15000,
    priority: 4,
    description: 'Plan your perfect wedding'
  },
  {
    name: 'Retirement Boost',
    targetAmount: 10000,
    priority: 3,
    description: 'Extra retirement savings'
  }
]

// Mock categories - would come from props in real implementation
const CATEGORIES = [
  { id: 'goal_funding', name: 'Goal Funding' },
  { id: 'savings', name: 'Savings' },
  { id: 'emergency', name: 'Emergency Fund' },
  { id: 'vacation', name: 'Vacation' },
  { id: 'car', name: 'Car Fund' },
  { id: 'home', name: 'Home Fund' }
]

// Mock accounts - would come from props in real implementation
const ACCOUNTS = [
  { id: 'checking_main', name: 'Main Checking' },
  { id: 'savings_main', name: 'High-Yield Savings' },
  { id: 'money_market', name: 'Money Market' }
]

export function AddGoalModal({ isOpen, onClose, onSuccess }: AddGoalModalProps) {
  const [formData, setFormData] = useState<CreateGoalRequest>({
    name: '',
    priority: 3,
    targetAmount: 0,
    currency: 'USD',
    targetDate: '',
    categoryId: '',
    fundingAccountId: '',
    notifyEnabled: true,
    notifyRules: {
      daysBefore: [30, 7],
      offPace: true,
      milestone: [25, 50, 75, 100]
    },
    plannedMonthlyAmount: 0
  })
  
  const [loading, setLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const handleTemplateSelect = (template: typeof GOAL_TEMPLATES[0]) => {
    setFormData(prev => ({
      ...prev,
      name: template.name,
      targetAmount: template.targetAmount,
      priority: template.priority
    }))
    setSelectedTemplate(template.name)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || formData.targetAmount <= 0) {
      toast.error('Please enter a goal name and target amount')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        onSuccess()
        
        // Reset form
        setFormData({
          name: '',
          priority: 3,
          targetAmount: 0,
          currency: 'USD',
          targetDate: '',
          categoryId: '',
          fundingAccountId: '',
          notifyEnabled: true,
          notifyRules: {
            daysBefore: [30, 7],
            offPace: true,
            milestone: [25, 50, 75, 100]
          },
          plannedMonthlyAmount: 0
        })
        setSelectedTemplate(null)
      } else {
        toast.error(data.error || 'Failed to create goal')
      }
    } catch (error) {
      console.error('Error creating goal:', error)
      toast.error('Failed to create goal')
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

  const getPriorityLabel = (priority: number) => {
    const labels = ['', 'Someday', 'Low', 'Medium', 'High', 'Critical']
    return labels[priority] || 'Medium'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Create New Goal
          </DialogTitle>
          <DialogDescription>
            Set up a new financial goal to track your progress
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Goal Templates */}
          <div>
            <Label className="text-base font-medium mb-3 block">
              Quick Start Templates
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {GOAL_TEMPLATES.map((template) => (
                <Card 
                  key={template.name}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedTemplate === template.name 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <div className="flex items-center gap-1">
                        {'⭐'.repeat(template.priority)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Target: {formatCurrency(template.targetAmount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {template.description}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Goal Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Goal Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Emergency Fund"
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="target-amount">Target Amount *</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="target-amount"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.targetAmount || ''}
                    onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })}
                    className="pl-10"
                    placeholder="5000"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority.toString()} 
                  onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ Critical</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ High</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ Medium</SelectItem>
                    <SelectItem value="2">⭐⭐ Low</SelectItem>
                    <SelectItem value="1">⭐ Someday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="target-date">Target Date (Optional)</Label>
                <Input
                  id="target-date"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Budget Category</Label>
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="funding-account">Default Funding Account</Label>
                <Select 
                  value={formData.fundingAccountId} 
                  onValueChange={(value) => setFormData({ ...formData, fundingAccountId: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNTS.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="monthly-plan">Planned Monthly Contribution (Optional)</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="monthly-plan"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.plannedMonthlyAmount || ''}
                  onChange={(e) => setFormData({ ...formData, plannedMonthlyAmount: parseFloat(e.target.value) || 0 })}
                  className="pl-10"
                  placeholder="200"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This will create a monthly plan for budget allocation
              </p>
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notifications</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-gray-600" />
                <div>
                  <Label htmlFor="notifications">Enable Notifications</Label>
                  <p className="text-xs text-gray-500">
                    Get notified about milestones and deadlines
                  </p>
                </div>
              </div>
              <Switch
                id="notifications"
                checked={formData.notifyEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, notifyEnabled: checked })}
              />
            </div>

            {formData.notifyEnabled && (
              <Card className="bg-gray-50 dark:bg-gray-800/50">
                <CardContent className="p-4">
                  <div className="text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked readOnly className="rounded" />
                      <span>Milestone achievements (25%, 50%, 75%, 100%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked readOnly className="rounded" />
                      <span>Off-pace warnings when behind schedule</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked readOnly className="rounded" />
                      <span>Reminders 30 and 7 days before target date</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </form>

        <DialogFooter className="sticky bottom-0 bg-white dark:bg-gray-800 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim() || formData.targetAmount <= 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
            ) : (
              <Target className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Creating...' : 'Create Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
