'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { InfoPopover } from '@/components/ui/info-popover'
import { 
  Target, 
  Shield, 
  Plane, 
  Car, 
  Home, 
  GraduationCap,
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft,
  Star,
  Calendar
} from 'lucide-react'
import { upsertOnboarding } from '../actions'
import { toast } from 'sonner'

interface Goal {
  id: string
  name: string
  target: number
  deadline: string
  priority: number
  autoSave: number
}

interface GoalsData {
  goals: Goal[]
}

const suggestedGoals = [
  { 
    name: 'Emergency Fund', 
    icon: Shield, 
    description: 'Aim for 3-6 months of expenses',
    quickAmounts: [1000, 3000, 5000, 10000],
    priority: 1,
    autoSave: 200
  },
  { 
    name: 'Vacation', 
    icon: Plane, 
    description: 'Your next getaway',
    quickAmounts: [1000, 2500, 5000, 10000],
    priority: 3,
    autoSave: 100
  },
  { 
    name: 'New Car', 
    icon: Car, 
    description: 'Down payment or full purchase',
    quickAmounts: [2000, 5000, 10000, 20000],
    priority: 3,
    autoSave: 300
  },
  { 
    name: 'Home Down Payment', 
    icon: Home, 
    description: 'Typically 10-20% of home price',
    quickAmounts: [10000, 25000, 50000, 100000],
    priority: 2,
    autoSave: 500
  },
  { 
    name: 'Education Fund', 
    icon: GraduationCap, 
    description: 'College or professional development',
    quickAmounts: [5000, 10000, 25000, 50000],
    priority: 2,
    autoSave: 200
  }
]

export default function GoalsStep() {
  const router = useRouter()
  const [formData, setFormData] = useState<GoalsData>({
    goals: []
  })
  const [isLoading, setIsLoading] = useState(false)

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('onboarding-goals')
    if (saved) {
      try {
        setFormData(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved goals data:', error)
      }
    }
  }, [])

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('onboarding-goals', JSON.stringify(formData))
      saveProgress()
    }, 1000)

    return () => clearTimeout(timer)
  }, [formData])

  const saveProgress = async () => {
    const formDataObj = new FormData()
    formDataObj.append('step', '4')
    formDataObj.append('payload', JSON.stringify(formData))
    
    await upsertOnboarding(formDataObj)
  }

  const addGoalFromTemplate = async (template: typeof suggestedGoals[0], quickAmount?: number) => {
    try {
      const newGoal: Goal = {
        id: Date.now().toString(),
        name: template.name,
        target: quickAmount || 0,
        deadline: '',
        priority: template.priority,
        autoSave: template.autoSave
      }
      setFormData({
        ...formData,
        goals: [...formData.goals, newGoal]
      })
      
      // Auto-save progress
      await saveProgress()
      
      toast.success(`${template.name} goal added! Set your target amount and deadline.`)
    } catch (error) {
      console.error('Error adding goal:', error)
      toast.error('Failed to add goal')
    }
  }

  const addCustomGoal = async () => {
    try {
      const newGoal: Goal = {
        id: Date.now().toString(),
        name: '',
        target: 0,
        deadline: '',
        priority: 3,
        autoSave: 0
      }
      setFormData({
        ...formData,
        goals: [...formData.goals, newGoal]
      })
      
      // Auto-save progress
      await saveProgress()
      
      toast.success('Custom goal added! Fill in the details.')
    } catch (error) {
      console.error('Error adding goal:', error)
      toast.error('Failed to add goal')
    }
  }

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setFormData({
      ...formData,
      goals: formData.goals.map(goal => 
        goal.id === id ? { ...goal, ...updates } : goal
      )
    })
  }

  const removeGoal = (id: string) => {
    setFormData({
      ...formData,
      goals: formData.goals.filter(goal => goal.id !== id)
    })
  }

  const handleContinue = async () => {
    setIsLoading(true)
    try {
      await saveProgress()
      router.push('/onboarding/review')
    } catch (error) {
      console.error('Error saving goals:', error)
      toast.error('Failed to save progress')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/onboarding/debts')
  }

  const handleSaveAndExit = async () => {
    await saveProgress()
    router.push('/dashboard')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
          <Target className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Financial Goals
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          What are you saving for? Set priorities and we'll help you reach your goals faster.
        </p>
      </div>

      {/* Suggested Goals */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Popular Goals</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click to add with smart defaults, or create your own below
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestedGoals.map((template) => {
            const Icon = template.icon
            const isAdded = formData.goals.some(g => g.name === template.name)
            
            return (
              <div key={template.name} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {template.description}
                      </p>
                    </div>
                  </div>
                  {isAdded && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      Added
                    </Badge>
                  )}
                </div>
                
                {!isAdded && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {template.quickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => addGoalFromTemplate(template, amount)}
                        className="text-xs"
                      >
                        ${amount.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          
          <Button onClick={addCustomGoal} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Goal
          </Button>
        </CardContent>
      </Card>

      {/* Added Goals */}
      {formData.goals.length > 0 && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Your Goals ({formData.goals.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.goals.map((goal) => (
              <div key={goal.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <Input
                    placeholder="Goal name"
                    value={goal.name}
                    onChange={(e) => updateGoal(goal.id, { name: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Target amount"
                    value={goal.target || ''}
                    onChange={(e) => updateGoal(goal.id, { target: parseFloat(e.target.value) || 0 })}
                  />
                  <Input
                    type="date"
                    placeholder="Target date"
                    value={goal.deadline}
                    onChange={(e) => updateGoal(goal.id, { deadline: e.target.value })}
                  />
                  
                  {/* Priority Stars */}
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => updateGoal(goal.id, { priority })}
                        className="p-1"
                      >
                        <Star 
                          className={`h-4 w-4 ${
                            priority <= goal.priority 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300 dark:text-gray-600'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGoal(goal.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Auto-save suggestion */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm text-gray-600 dark:text-gray-300">
                      Auto-save suggestion (monthly):
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={goal.autoSave || ''}
                      onChange={(e) => updateGoal(goal.id, { autoSave: parseFloat(e.target.value) || 0 })}
                      className="w-24"
                    />
                    <InfoPopover title="Auto-save Suggestion">
                      We can suggest this amount when you're assigning money to goals in your budget.
                    </InfoPopover>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            variant="ghost"
            onClick={handleSaveAndExit}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Save & Exit
          </Button>
        </div>

        <Button
          onClick={handleContinue}
          disabled={isLoading}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
