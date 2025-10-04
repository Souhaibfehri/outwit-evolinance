'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InfoPopover } from '@/components/ui/info-popover'
import { 
  Home, 
  Zap, 
  Wifi, 
  Phone, 
  Car, 
  Shield, 
  Tv, 
  Baby,
  GraduationCap,
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft,
  Search,
  CreditCard
} from 'lucide-react'
import { upsertOnboarding } from '../actions'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Bill {
  id: string
  name: string
  amount: number
  frequency: string
  dueDate: string
  category: string
  rollover: boolean
  icon?: string
}

interface BillsData {
  bills: Bill[]
}

// Common bills library with icons
const billsLibrary = [
  { name: 'Rent/Mortgage', category: 'Essentials', icon: 'Home', group: 'Housing' },
  { name: 'Electric Bill', category: 'Essentials', icon: 'Zap', group: 'Utilities' },
  { name: 'Water Bill', category: 'Essentials', icon: 'Zap', group: 'Utilities' },
  { name: 'Gas Bill', category: 'Essentials', icon: 'Zap', group: 'Utilities' },
  { name: 'Internet', category: 'Essentials', icon: 'Wifi', group: 'Utilities' },
  { name: 'Phone Bill', category: 'Essentials', icon: 'Phone', group: 'Utilities' },
  { name: 'Car Insurance', category: 'Essentials', icon: 'Shield', group: 'Insurance' },
  { name: 'Health Insurance', category: 'Essentials', icon: 'Shield', group: 'Insurance' },
  { name: 'Car Payment', category: 'Transport', icon: 'Car', group: 'Transportation' },
  { name: 'Netflix', category: 'Lifestyle', icon: 'Tv', group: 'Streaming' },
  { name: 'Spotify', category: 'Lifestyle', icon: 'Tv', group: 'Streaming' },
  { name: 'Amazon Prime', category: 'Lifestyle', icon: 'Tv', group: 'Streaming' },
  { name: 'Gym Membership', category: 'Lifestyle', icon: 'Zap', group: 'Health' },
  { name: 'Childcare', category: 'Essentials', icon: 'Baby', group: 'Family' },
  { name: 'Student Loan', category: 'Debts', icon: 'GraduationCap', group: 'Education' }
]

const iconMap: Record<string, any> = {
  Home, Zap, Wifi, Phone, Car, Shield, Tv, Baby, GraduationCap
}

export default function BillsStep() {
  const router = useRouter()
  const [formData, setFormData] = useState<BillsData>({
    bills: []
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customBill, setCustomBill] = useState<Bill>({
    id: '',
    name: '',
    amount: 0,
    frequency: 'monthly',
    dueDate: '',
    category: 'Essentials',
    rollover: false
  })

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('onboarding-bills')
    if (saved) {
      try {
        setFormData(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved bills data:', error)
      }
    }
  }, [])

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('onboarding-bills', JSON.stringify(formData))
      saveProgress()
    }, 1000)

    return () => clearTimeout(timer)
  }, [formData])

  const saveProgress = async () => {
    const formDataObj = new FormData()
    formDataObj.append('step', '2')
    formDataObj.append('payload', JSON.stringify(formData))
    
    await upsertOnboarding(formDataObj)
  }

  const addBillFromLibrary = (libraryBill: typeof billsLibrary[0]) => {
    const newBill: Bill = {
      id: Date.now().toString(),
      name: libraryBill.name,
      amount: 0,
      frequency: 'monthly',
      dueDate: '',
      category: libraryBill.category,
      rollover: false,
      icon: libraryBill.icon
    }
    setFormData({
      ...formData,
      bills: [...formData.bills, newBill]
    })
  }

  const addCustomBill = () => {
    setCustomBill({
      id: Date.now().toString(),
      name: '',
      amount: 0,
      frequency: 'monthly',
      dueDate: '',
      category: 'Essentials',
      rollover: false
    })
    setShowCustomModal(true)
  }

  const saveCustomBill = async () => {
    if (!customBill.name.trim() || customBill.amount <= 0) {
      toast.error('Please enter a bill name and amount')
      return
    }

    try {
      setFormData({
        ...formData,
        bills: [...formData.bills, customBill]
      })
      
      // Auto-save progress
      await saveProgress()
      
      setShowCustomModal(false)
      toast.success('Custom bill added successfully!')
    } catch (error) {
      console.error('Error adding custom bill:', error)
      toast.error('Failed to add custom bill')
    }
  }

  const updateBill = (id: string, updates: Partial<Bill>) => {
    setFormData({
      ...formData,
      bills: formData.bills.map(bill => 
        bill.id === id ? { ...bill, ...updates } : bill
      )
    })
  }

  const removeBill = (id: string) => {
    setFormData({
      ...formData,
      bills: formData.bills.filter(bill => bill.id !== id)
    })
  }

  const handleContinue = async () => {
    setIsLoading(true)
    try {
      await saveProgress()
      router.push('/onboarding/debts')
    } catch (error) {
      console.error('Error saving bills:', error)
      toast.error('Failed to save progress')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/onboarding/income')
  }

  const handleSaveAndExit = async () => {
    await saveProgress()
    router.push('/dashboard')
  }

  const filteredLibrary = billsLibrary.filter(bill =>
    bill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.group.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
          <CreditCard className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bills & Subscriptions
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Add your recurring expenses. We'll help you budget for them and never miss a payment.
        </p>
      </div>

      {/* Bills Library */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Common Bills Library</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredLibrary.map((bill) => {
              const Icon = iconMap[bill.icon] || CreditCard
              const isAdded = formData.bills.some(b => b.name === bill.name)
              
              return (
                <Button
                  key={bill.name}
                  variant="outline"
                  onClick={() => !isAdded && addBillFromLibrary(bill)}
                  disabled={isAdded}
                  className={`h-auto p-4 flex flex-col items-center space-y-2 ${
                    isAdded ? 'opacity-50' : 'hover:bg-orange-50 dark:hover:bg-orange-900/20'
                  }`}
                >
                  <Icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{bill.name}</div>
                    <div className="text-xs text-gray-500">{bill.group}</div>
                  </div>
                  {isAdded && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs">
                      Added
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button onClick={addCustomBill} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Bill
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Added Bills */}
      {formData.bills.length > 0 && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Your Bills ({formData.bills.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.bills.map((bill) => {
              const Icon = bill.icon ? iconMap[bill.icon] : CreditCard
              
              return (
                <div key={bill.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div className="flex items-center space-x-2">
                      {Icon && <Icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />}
                      <Input
                        placeholder="Bill name"
                        value={bill.name}
                        onChange={(e) => updateBill(bill.id, { name: e.target.value })}
                      />
                    </div>
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={bill.amount || ''}
                      onChange={(e) => updateBill(bill.id, { amount: parseFloat(e.target.value) || 0 })}
                    />
                    <Select 
                      value={bill.frequency} 
                      onValueChange={(value) => updateBill(bill.id, { frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      placeholder="Due date"
                      value={bill.dueDate}
                      onChange={(e) => updateBill(bill.id, { dueDate: e.target.value })}
                    />
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={bill.rollover}
                        onCheckedChange={(checked) => updateBill(bill.id, { rollover: checked })}
                      />
                      <InfoPopover title="Rollover" className="text-xs">
                        If you don't spend it this month, we'll carry it to next month's budget for this category.
                      </InfoPopover>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBill(bill.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
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

      {/* Custom Bill Modal */}
      <Dialog open={showCustomModal} onOpenChange={setShowCustomModal}>
        <DialogContent className="max-w-lg w-[92vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Custom Bill</DialogTitle>
            <DialogDescription>
              Create a custom recurring expense that's not in our library
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="custom-name">Bill Name *</Label>
              <Input
                id="custom-name"
                value={customBill.name}
                onChange={(e) => setCustomBill({ ...customBill, name: e.target.value })}
                placeholder="e.g., Netflix, Gym Membership"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="custom-amount">Monthly Amount *</Label>
              <Input
                id="custom-amount"
                type="number"
                min="0"
                step="0.01"
                value={customBill.amount || ''}
                onChange={(e) => setCustomBill({ ...customBill, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="custom-frequency">Frequency</Label>
              <Select 
                value={customBill.frequency} 
                onValueChange={(value) => setCustomBill({ ...customBill, frequency: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="custom-category">Category</Label>
              <Select 
                value={customBill.category} 
                onValueChange={(value) => setCustomBill({ ...customBill, category: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Essentials">Essentials</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                  <SelectItem value="Transportation">Transportation</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="custom-due">Due Date (optional)</Label>
              <Input
                id="custom-due"
                type="date"
                value={customBill.dueDate}
                onChange={(e) => setCustomBill({ ...customBill, dueDate: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter className="sticky bottom-0 bg-white dark:bg-gray-800 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowCustomModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={saveCustomBill}
              disabled={!customBill.name.trim() || customBill.amount <= 0}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Add Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
