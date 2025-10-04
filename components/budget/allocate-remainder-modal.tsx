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
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  PiggyBank, 
  Target, 
  TrendingUp, 
  Coffee, 
  Home,
  Calculator
} from 'lucide-react'
import { toast } from 'sonner'

interface AllocationOption {
  id: string
  name: string
  icon: any
  percentage: number
  color: string
}

interface AllocateRemainderModalProps {
  isOpen: boolean
  onClose: () => void
  readyToAssign: number
  categories: Array<{
    id: string
    name: string
    groupName: string
    currentAmount: number
  }>
  goals: Array<{
    id: string
    name: string
    targetAmount: number
    savedAmount: number
  }>
  onAllocate: (allocations: Record<string, number>) => void
}

export function AllocateRemainderModal({
  isOpen,
  onClose,
  readyToAssign,
  categories,
  goals,
  onAllocate
}: AllocateRemainderModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [customAllocations, setCustomAllocations] = useState<Record<string, number>>({})

  const presets = [
    {
      id: 'essentials',
      name: 'Essentials Focus',
      description: 'Prioritize necessities and build emergency fund',
      allocations: {
        essentials: 60,
        savings: 20,
        lifestyle: 20
      }
    },
    {
      id: 'balanced',
      name: 'Balanced Approach', 
      description: 'Equal focus on essentials, goals, and lifestyle',
      allocations: {
        essentials: 50,
        goals: 25,
        lifestyle: 25
      }
    },
    {
      id: 'aggressive_savings',
      name: 'Aggressive Savings',
      description: 'Maximize savings and goal contributions',
      allocations: {
        essentials: 40,
        savings: 40,
        goals: 20
      }
    },
    {
      id: 'equal_split',
      name: 'Equal Split',
      description: 'Distribute evenly across all categories',
      allocations: {}
    }
  ]

  const allocationTargets = [
    ...categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      type: 'category' as const,
      group: cat.groupName,
      current: cat.currentAmount,
      icon: getGroupIcon(cat.groupName)
    })),
    ...goals.map(goal => ({
      id: goal.id,
      name: goal.name,
      type: 'goal' as const,
      group: 'Goals',
      current: goal.savedAmount,
      target: goal.targetAmount,
      icon: Target
    }))
  ]

  const applyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId)
    if (!preset) return

    if (presetId === 'equal_split') {
      // Equal distribution
      const amountPerTarget = readyToAssign / allocationTargets.length
      const newAllocations: Record<string, number> = {}
      allocationTargets.forEach(target => {
        newAllocations[target.id] = Math.round(amountPerTarget * 100) / 100
      })
      setCustomAllocations(newAllocations)
    } else {
      // Preset percentages
      const newAllocations: Record<string, number> = {}
      
      Object.entries(preset.allocations).forEach(([groupType, percentage]) => {
        const groupTargets = allocationTargets.filter(target => 
          target.group.toLowerCase().includes(groupType) ||
          (groupType === 'lifestyle' && !['essentials', 'goals', 'savings'].some(essential => 
            target.group.toLowerCase().includes(essential)
          ))
        )
        
        const groupAmount = (readyToAssign * percentage) / 100
        const amountPerTarget = groupAmount / Math.max(1, groupTargets.length)
        
        groupTargets.forEach(target => {
          newAllocations[target.id] = Math.round(amountPerTarget * 100) / 100
        })
      })
      
      setCustomAllocations(newAllocations)
    }
    
    setSelectedPreset(presetId)
  }

  const updateCustomAllocation = (targetId: string, amount: number) => {
    setCustomAllocations(prev => ({
      ...prev,
      [targetId]: Math.max(0, amount)
    }))
    setSelectedPreset('custom')
  }

  const totalAllocated = Object.values(customAllocations).reduce((sum, amount) => sum + amount, 0)
  const remaining = readyToAssign - totalAllocated

  const handleConfirm = () => {
    if (Math.abs(remaining) > 0.01) {
      toast.error(`Please allocate all $${readyToAssign.toFixed(2)}. Remaining: $${remaining.toFixed(2)}`)
      return
    }

    onAllocate(customAllocations)
    onClose()
    toast.success('Budget allocated successfully!')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-orange-600" />
            Allocate Remainder: ${readyToAssign.toFixed(2)}
          </DialogTitle>
          <DialogDescription>
            Distribute your available budget across categories and goals
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presets">Quick Presets</TabsTrigger>
            <TabsTrigger value="custom">Custom Allocation</TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presets.map((preset) => (
                <Card 
                  key={preset.id}
                  className={`cursor-pointer transition-all ${
                    selectedPreset === preset.id 
                      ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => applyPreset(preset.id)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{preset.name}</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {preset.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(preset.allocations).map(([type, percentage]) => (
                        <div key={type} className="flex justify-between text-sm">
                          <span className="capitalize">{type}:</span>
                          <Badge variant="outline">{percentage}%</Badge>
                        </div>
                      ))}
                      {preset.id === 'equal_split' && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          ${(readyToAssign / allocationTargets.length).toFixed(2)} each
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allocationTargets.map((target) => {
                const Icon = target.icon
                const currentAllocation = customAllocations[target.id] || 0
                const maxAllocation = readyToAssign
                
                return (
                  <Card key={target.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <div className="flex-1">
                          <div className="font-medium">{target.name}</div>
                          <div className="text-xs text-gray-500">{target.group}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-orange-600">
                            ${currentAllocation.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Slider
                          value={[currentAllocation]}
                          onValueChange={([value]) => updateCustomAllocation(target.id, value)}
                          max={maxAllocation}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>$0</span>
                          <span>${maxAllocation.toFixed(0)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">Allocation Summary</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total allocated: ${totalAllocated.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className={`font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Remaining: ${remaining.toFixed(2)}
              </div>
              {Math.abs(remaining) > 0.01 && (
                <div className="text-xs text-gray-500">
                  {remaining > 0 ? 'Allocate remaining amount' : 'Reduce allocations'}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={Math.abs(remaining) > 0.01}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Apply Allocation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function getGroupIcon(groupName: string) {
  switch (groupName.toLowerCase()) {
    case 'essentials': return Home
    case 'lifestyle': return Coffee
    case 'savings': return PiggyBank
    case 'goals': return Target
    case 'investments': return TrendingUp
    default: return Target
  }
}
