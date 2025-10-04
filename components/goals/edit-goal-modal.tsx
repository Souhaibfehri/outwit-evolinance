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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Edit, Target, DollarSign, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Goal, GoalWithProgress, UpdateGoalRequest } from '@/lib/types/goals'

interface EditGoalModalProps {
  isOpen: boolean
  onClose: () => void
  goalId: string
  onSuccess: () => void
}

export function EditGoalModal({ isOpen, onClose, goalId, onSuccess }: EditGoalModalProps) {
  const [goal, setGoal] = useState<GoalWithProgress | null>(null)
  const [formData, setFormData] = useState<UpdateGoalRequest>({})
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [surplusWarning, setSurplusWarning] = useState<{surplus: number, message: string} | null>(null)

  useEffect(() => {
    if (isOpen && goalId) {
      fetchGoal()
    }
  }, [isOpen, goalId])

  const fetchGoal = async () => {
    try {
      const response = await fetch(`/api/goals/${goalId}`)
      const data = await response.json()
      
      if (response.ok) {
        setGoal(data.goal)
        setFormData({
          name: data.goal.name,
          priority: data.goal.priority,
          targetAmount: data.goal.targetAmount,
          targetDate: data.goal.targetDate,
          categoryId: data.goal.categoryId,
          fundingAccountId: data.goal.fundingAccountId,
          notifyEnabled: data.goal.notifyEnabled,
          status: data.goal.status
        })
      } else {
        toast.error('Failed to load goal details')
        onClose()
      }
    } catch (error) {
      console.error('Error fetching goal:', error)
      toast.error('Failed to load goal details')
      onClose()
    } finally {
      setFetchLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name?.trim() || (formData.targetAmount !== undefined && formData.targetAmount <= 0)) {
      toast.error('Please enter valid goal details')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        
        if (data.surplusHandling) {
          toast.info(`Surplus of $${data.surplusHandling.surplus.toLocaleString()} returned to Ready-to-Assign`, {
            duration: 5000
          })
        }
        
        onSuccess()
      } else {
        toast.error(data.error || 'Failed to update goal')
      }
    } catch (error) {
      console.error('Error updating goal:', error)
      toast.error('Failed to update goal')
    } finally {
      setLoading(false)
    }
  }

  // Check for surplus when target amount changes
  useEffect(() => {
    if (goal && formData.targetAmount !== undefined && formData.targetAmount < goal.savedAmount) {
      const surplus = goal.savedAmount - formData.targetAmount
      setSurplusWarning({
        surplus,
        message: `Target amount is lower than current saved amount ($${goal.savedAmount.toLocaleString()}). Surplus of $${surplus.toLocaleString()} will be returned to Ready-to-Assign.`
      })
    } else {
      setSurplusWarning(null)
    }
  }, [formData.targetAmount, goal?.savedAmount])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (fetchLoading || !goal) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            Edit Goal: {goal.name}
          </DialogTitle>
          <DialogDescription>
            Update your goal details and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Status */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-blue-900 dark:text-blue-100">
                    Current Progress
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    {formatCurrency(goal.savedAmount)} saved
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {goal.progressPercent.toFixed(1)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Goal Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target-amount">Target Amount *</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="target-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.targetAmount || ''}
                    onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority?.toString() || '3'} 
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
            </div>

            <div>
              <Label htmlFor="target-date">Target Date</Label>
              <Input
                id="target-date"
                type="date"
                value={formData.targetDate || ''}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status || goal.status} 
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-6">
                <div>
                  <Label htmlFor="notifications">Notifications</Label>
                </div>
                <Switch
                  id="notifications"
                  checked={formData.notifyEnabled ?? goal.notifyEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, notifyEnabled: checked })}
                />
              </div>
            </div>
          </div>

          {/* Surplus Warning */}
          {surplusWarning && (
            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                      Target Amount Warning
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">
                      {surplusWarning.message}
                    </div>
                  </div>
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
            disabled={loading || !formData.name?.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
            ) : (
              <Target className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Updating...' : 'Update Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
