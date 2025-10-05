'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  Plus, 
  Trash2, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Percent,
  AlertTriangle,
  CheckCircle,
  Globe
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { 
  Scenario, 
  ScenarioAdjustment, 
  GlobalShock,
  createScenarioTemplates,
  createGlobalShockTemplates,
  validateScenario
} from '@/lib/scenarios/engine'
import { formatCurrency } from '@/lib/budget/calcs'

interface ScenarioEditorProps {
  isOpen: boolean
  onClose: () => void
  existingScenario?: Scenario
  categories: any[]
  onSave: (scenario: Omit<Scenario, 'id' | 'createdAt' | 'forecast'>) => void
}

export function ScenarioEditor({
  isOpen,
  onClose,
  existingScenario,
  categories,
  onSave
}: ScenarioEditorProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [adjustments, setAdjustments] = useState<ScenarioAdjustment[]>([])
  const [globalShocks, setGlobalShocks] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])

  const availableShocks = createGlobalShockTemplates()

  useEffect(() => {
    if (existingScenario) {
      setName(existingScenario.name)
      setDescription(existingScenario.description)
      setAdjustments([...existingScenario.adjustments])
      setGlobalShocks([...existingScenario.globalShocks])
    } else {
      // Reset for new scenario
      setName('')
      setDescription('')
      setAdjustments([])
      setGlobalShocks([])
    }
    setErrors([])
    setWarnings([])
  }, [existingScenario, isOpen])

  const handleAddAdjustment = () => {
    setAdjustments(prev => [...prev, {
      categoryId: categories[0]?.id || null,
      adjustmentType: 'percentage',
      value: 0,
      note: ''
    }])
  }

  const handleUpdateAdjustment = (index: number, updates: Partial<ScenarioAdjustment>) => {
    setAdjustments(prev => prev.map((adj, i) => 
      i === index ? { ...adj, ...updates } : adj
    ))
  }

  const handleRemoveAdjustment = (index: number) => {
    setAdjustments(prev => prev.filter((_, i) => i !== index))
  }

  const handleToggleGlobalShock = (shockId: string) => {
    setGlobalShocks(prev => 
      prev.includes(shockId) 
        ? prev.filter(id => id !== shockId)
        : [...prev, shockId]
    )
  }

  const handleSave = () => {
    const scenario = {
      name: name.trim(),
      type: 'custom' as const,
      description: description.trim(),
      baseMonth: getCurrentMonth(),
      adjustments,
      globalShocks
    }

    const validation = validateScenario(scenario)
    setErrors(validation.errors)
    setWarnings(validation.warnings)

    if (!validation.isValid) {
      return
    }

    onSave(scenario)
    onClose()
    toast.success('Scenario saved successfully')
  }

  const loadTemplate = (templateType: 'base' | 'optimistic' | 'stress') => {
    const templates = createScenarioTemplates()
    const template = templates.find(t => t.type === templateType)
    
    if (template) {
      setName(template.name)
      setDescription(template.description)
      setAdjustments([...template.adjustments])
      setGlobalShocks([...template.globalShocks])
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingScenario ? 'Edit Scenario' : 'Create New Scenario'}
          </DialogTitle>
          <DialogDescription>
            Create what-if scenarios to test different financial situations
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
            <TabsTrigger value="shocks">Global Shocks</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            {/* Quick Templates */}
            <div className="space-y-2">
              <Label>Quick Templates</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => loadTemplate('base')}>
                  Base Scenario
                </Button>
                <Button variant="outline" size="sm" onClick={() => loadTemplate('optimistic')}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Optimistic
                </Button>
                <Button variant="outline" size="sm" onClick={() => loadTemplate('stress')}>
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Stress Test
                </Button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scenario-name">Scenario Name</Label>
                <Input
                  id="scenario-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Job Loss Scenario"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scenario-description">Description</Label>
                <Textarea
                  id="scenario-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this scenario tests..."
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="adjustments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Category Adjustments</h3>
              <Button variant="outline" size="sm" onClick={handleAddAdjustment}>
                <Plus className="h-3 w-3 mr-1" />
                Add Adjustment
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {adjustments.map((adjustment, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Adjustment {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAdjustment(index)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Category Selection */}
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={adjustment.categoryId || 'income'}
                          onValueChange={(value) => 
                            handleUpdateAdjustment(index, { 
                              categoryId: value === 'income' ? null : value 
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-3 w-3 text-green-600" />
                                Income
                              </div>
                            </SelectItem>
                            {categories.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Adjustment Type */}
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={adjustment.adjustmentType}
                          onValueChange={(value: 'percentage' | 'fixed_amount') =>
                            handleUpdateAdjustment(index, { adjustmentType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">
                              <div className="flex items-center gap-2">
                                <Percent className="h-3 w-3" />
                                Percentage
                              </div>
                            </SelectItem>
                            <SelectItem value="fixed_amount">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-3 w-3" />
                                Fixed Amount
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Value Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>
                          {adjustment.adjustmentType === 'percentage' ? 'Percentage Change' : 'Amount Change'}
                        </Label>
                        <span className="text-sm font-medium">
                          {adjustment.adjustmentType === 'percentage' 
                            ? `${adjustment.value >= 0 ? '+' : ''}${adjustment.value}%`
                            : `${adjustment.value >= 0 ? '+' : ''}${formatCurrency(adjustment.value)}`
                          }
                        </span>
                      </div>
                      <Slider
                        value={[adjustment.value]}
                        onValueChange={(value) => handleUpdateAdjustment(index, { value: value[0] })}
                        min={adjustment.adjustmentType === 'percentage' ? -50 : -1000}
                        max={adjustment.adjustmentType === 'percentage' ? 50 : 1000}
                        step={adjustment.adjustmentType === 'percentage' ? 1 : 10}
                        className="w-full"
                      />
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                      <Label>Note (Optional)</Label>
                      <Input
                        value={adjustment.note || ''}
                        onChange={(e) => handleUpdateAdjustment(index, { note: e.target.value })}
                        placeholder="Reason for this adjustment..."
                        className="text-xs"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {adjustments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No adjustments added yet</p>
                  <p className="text-xs">Click "Add Adjustment" to create what-if changes</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="shocks" className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Global Economic Shocks</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Apply predefined economic scenarios that affect multiple categories
              </p>
            </div>

            <div className="space-y-3">
              {availableShocks.map(shock => (
                <div
                  key={shock.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    globalShocks.includes(shock.id)
                      ? 'border-orange-300 bg-orange-50 dark:bg-orange-950/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleToggleGlobalShock(shock.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 ${
                        globalShocks.includes(shock.id) ? 'text-orange-600' : 'text-gray-400'
                      }`} />
                      <span className="font-medium text-sm">{shock.name}</span>
                    </div>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {shock.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {shock.adjustments.map((adj, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {adj.adjustmentType === 'percentage' 
                          ? `${adj.value >= 0 ? '+' : ''}${adj.value}%`
                          : `${adj.value >= 0 ? '+' : ''}${formatCurrency(adj.value)}`
                        }
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Validation Messages */}
        {(errors.length > 0 || warnings.length > 0) && (
          <div className="space-y-2">
            {errors.map((error, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            ))}
            {warnings.map((warning, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                {warning}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Save Scenario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
