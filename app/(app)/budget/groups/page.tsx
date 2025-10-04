'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { AppCard } from '@/components/ui/app-card'
import { 
  Plus,
  Folder,
  Edit,
  Trash2,
  GripVertical,
  Home,
  Car,
  Utensils,
  ShoppingCart,
  Zap,
  Heart,
  Gamepad2,
  Target,
  AlertCircle,
  Check
} from 'lucide-react'
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'

interface CategoryGroup {
  id: string
  name: string
  icon: string
  isEssential: boolean
  isDefault: boolean
  sortOrder: number
  categoryCount: number
}

interface Category {
  id: string
  name: string
  groupId: string
  priority: number
  rollover: boolean
  sortOrder: number
  archived: boolean
  monthlyBudget: number
}

const ICON_OPTIONS = [
  { value: 'Home', label: 'Home', icon: Home },
  { value: 'Car', label: 'Transportation', icon: Car },
  { value: 'Utensils', label: 'Food', icon: Utensils },
  { value: 'ShoppingCart', label: 'Shopping', icon: ShoppingCart },
  { value: 'Zap', label: 'Utilities', icon: Zap },
  { value: 'Heart', label: 'Health', icon: Heart },
  { value: 'Gamepad2', label: 'Entertainment', icon: Gamepad2 },
  { value: 'Target', label: 'Goals', icon: Target },
  { value: 'Folder', label: 'General', icon: Folder }
]

// Sortable Group Component
function SortableGroup({ group, onEdit, onDelete }: { 
  group: CategoryGroup, 
  onEdit: (group: CategoryGroup) => void,
  onDelete: (groupId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: group.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const IconComponent = ICON_OPTIONS.find(opt => opt.value === group.icon)?.icon || Folder

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
        >
          <GripVertical className="h-4 w-4 text-slate-400" />
        </div>
        
        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700">
          <IconComponent className="h-5 w-5" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{group.name}</h3>
            {group.isDefault && (
              <Badge variant="secondary" className="text-xs">Default</Badge>
            )}
            {group.isEssential && (
              <Badge variant="outline" className="text-xs text-green-700 border-green-300">Essential</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {group.categoryCount} categories
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(group)}
            className="text-slate-500 hover:text-slate-700"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {!group.isDefault && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(group.id)}
              className="text-slate-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GroupsManagementPage() {
  const [groups, setGroups] = useState<CategoryGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<CategoryGroup | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Folder',
    isEssential: false
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      // Mock data for now - would fetch from /api/budget/groups
      const mockGroups: CategoryGroup[] = [
        {
          id: '1',
          name: 'Essential Bills',
          icon: 'Home',
          isEssential: true,
          isDefault: true,
          sortOrder: 0,
          categoryCount: 5
        },
        {
          id: '2',
          name: 'Food & Dining',
          icon: 'Utensils',
          isEssential: true,
          isDefault: true,
          sortOrder: 1,
          categoryCount: 3
        },
        {
          id: '3',
          name: 'Transportation',
          icon: 'Car',
          isEssential: true,
          isDefault: true,
          sortOrder: 2,
          categoryCount: 2
        },
        {
          id: '4',
          name: 'Entertainment',
          icon: 'Gamepad2',
          isEssential: false,
          isDefault: false,
          sortOrder: 3,
          categoryCount: 4
        },
        {
          id: '5',
          name: 'Health & Wellness',
          icon: 'Heart',
          isEssential: false,
          isDefault: false,
          sortOrder: 4,
          categoryCount: 2
        }
      ]
      
      await new Promise(resolve => setTimeout(resolve, 500))
      setGroups(mockGroups.sort((a, b) => a.sortOrder - b.sortOrder))
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setGroups((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        
        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // Update sort orders
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          sortOrder: index
        }))
        
        // In production, would call API to persist new order
        toast.success('Group order updated')
        return updatedItems
      })
    }
  }

  const openGroupEditor = (group?: CategoryGroup) => {
    if (group) {
      setEditingGroup(group)
      setFormData({
        name: group.name,
        icon: group.icon,
        isEssential: group.isEssential
      })
    } else {
      setEditingGroup(null)
      setFormData({
        name: '',
        icon: 'Folder',
        isEssential: false
      })
    }
    setIsModalOpen(true)
  }

  const handleSaveGroup = async () => {
    try {
      if (editingGroup) {
        // Update existing group
        setGroups(prev => prev.map(group => 
          group.id === editingGroup.id 
            ? { ...group, ...formData }
            : group
        ))
        toast.success('Group updated successfully!')
      } else {
        // Create new group
        const newGroup: CategoryGroup = {
          id: Date.now().toString(),
          ...formData,
          isDefault: false,
          sortOrder: groups.length,
          categoryCount: 0
        }
        setGroups(prev => [...prev, newGroup])
        toast.success('Group created successfully!')
      }

      setIsModalOpen(false)
      setEditingGroup(null)
    } catch (error) {
      toast.error('Failed to save group')
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const group = groups.find(g => g.id === groupId)
      if (group?.categoryCount && group.categoryCount > 0) {
        toast.error('Cannot delete group with categories. Move categories first.')
        return
      }

      setGroups(prev => prev.filter(group => group.id !== groupId))
      toast.success('Group deleted successfully!')
    } catch (error) {
      toast.error('Failed to delete group')
    }
  }

  const IconComponent = ICON_OPTIONS.find(opt => opt.value === formData.icon)?.icon || Folder

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/budget" className="hover:text-foreground">Budget</Link>
            <span>/</span>
            <span>Groups</span>
          </nav>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Manage Groups
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Organize your budget categories into groups and set priorities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/budget">
            <Button variant="outline" size="sm" className="card-hover">
              Back to Budget
            </Button>
          </Link>
          <Button onClick={() => openGroupEditor()} className="btn-primary rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            New Group
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <AppCard
        title="How Groups Work"
        icon={AlertCircle}
        status="info"
      >
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            Drag and drop to reorder groups - this affects how they appear in your budget
          </p>
          <p className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            Mark groups as "Essential" to prioritize them in Quick Catch-Up distributions
          </p>
          <p className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            Default groups cannot be deleted but can be customized
          </p>
          <p className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            Categories must be moved before deleting a group
          </p>
        </div>
      </AppCard>

      {/* Groups List */}
      <AppCard
        title="Your Groups"
        subtitle={`${groups.length} groups`}
        icon={Folder}
        elevated
      >
        {loading ? (
          <GroupsListSkeleton />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={groups.map(g => g.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {groups.map((group) => (
                  <SortableGroup
                    key={group.id}
                    group={group}
                    onEdit={openGroupEditor}
                    onDelete={handleDeleteGroup}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </AppCard>

      {/* Group Editor Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconComponent className="h-5 w-5" />
              {editingGroup ? 'Edit Group' : 'Create New Group'}
            </DialogTitle>
            <DialogDescription>
              {editingGroup ? 'Update group settings and organization.' : 'Create a new group to organize your budget categories.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Food & Dining"
              />
            </div>
            
            <div>
              <Label htmlFor="group-icon">Icon</Label>
              <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an icon" />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((option) => {
                    const Icon = option.icon
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="group-essential">Essential Group</Label>
                <p className="text-sm text-muted-foreground">
                  Essential groups are prioritized in Quick Catch-Up distributions
                </p>
              </div>
              <Switch
                id="group-essential"
                checked={formData.isEssential}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEssential: checked }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveGroup}
              className="btn-primary"
              disabled={!formData.name}
            >
              {editingGroup ? 'Update Group' : 'Create Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GroupsListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 border rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-muted rounded animate-pulse" />
            <div className="w-9 h-9 bg-muted rounded-xl animate-pulse" />
            <div className="flex-1">
              <div className="h-5 w-32 bg-muted rounded animate-pulse mb-2" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-muted rounded animate-pulse" />
              <div className="h-8 w-8 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
