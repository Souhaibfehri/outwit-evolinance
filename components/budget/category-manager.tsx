'use client'

import { useState } from 'react'
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  GripVertical, 
  Edit, 
  Trash2, 
  Link as LinkIcon,
  DollarSign,
  Target
} from 'lucide-react'
import { toast } from 'sonner'
import { RolloverTooltip } from '@/components/foxy/jargon-tooltip'

interface Category {
  id: string
  name: string
  groupId: string
  groupName: string
  plannedAmount: number
  spentAmount: number
  rolloverEnabled: boolean
  rolloverFromPrior: number
  linkedBillId?: string
  linkedBillName?: string
  nextDueDate?: string
  priority: number
  sortOrder: number
}

interface CategoryGroup {
  id: string
  name: string
  icon: string
  sortOrder: number
  categories: Category[]
}

interface CategoryManagerProps {
  groups: CategoryGroup[]
  onUpdateCategory: (categoryId: string, updates: Partial<Category>) => void
  onAddCategory: (groupId: string, category: Omit<Category, 'id'>) => void
  onDeleteCategory: (categoryId: string) => void
  onReorderCategories: (groupId: string, categoryIds: string[]) => void
  onLinkBill: (categoryId: string) => void
  readyToAssign: number
}

function SortableCategory({ 
  category, 
  onUpdate, 
  onDelete, 
  onLinkBill 
}: { 
  category: Category
  onUpdate: (updates: Partial<Category>) => void
  onDelete: () => void
  onLinkBill: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(category.name)
  const [editAmount, setEditAmount] = useState(category.plannedAmount)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const leftover = category.plannedAmount - category.spentAmount + category.rolloverFromPrior
  const progressPercentage = category.plannedAmount > 0 
    ? Math.min(100, (category.spentAmount / category.plannedAmount) * 100)
    : 0

  const saveEdit = () => {
    if (editName.trim() && editAmount >= 0) {
      onUpdate({
        name: editName.trim(),
        plannedAmount: editAmount
      })
      setIsEditing(false)
      toast.success('Category updated')
    }
  }

  const cancelEdit = () => {
    setEditName(category.name)
    setEditAmount(category.plannedAmount)
    setIsEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 text-sm"
                placeholder="Category name"
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editAmount || ''}
                onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                className="h-8 text-sm w-24"
                placeholder="Amount"
              />
              <Button size="sm" onClick={saveEdit}>Save</Button>
              <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
            </div>
          ) : (
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {category.name}
                </h4>
                {category.linkedBillId && (
                  <Badge variant="outline" className="text-xs">
                    <LinkIcon className="h-3 w-3 mr-1" />
                    Bill
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Planned: ${category.plannedAmount.toFixed(2)}</span>
                <span>Spent: ${category.spentAmount.toFixed(2)}</span>
                <span className={leftover >= 0 ? 'text-green-600' : 'text-red-600'}>
                  Left: ${leftover.toFixed(2)}
                </span>
              </div>
              {category.plannedAmount > 0 && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      progressPercentage <= 100 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, progressPercentage)}%` }}
                  />
                </div>
              )}
              {category.nextDueDate && (
                <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Next due: {new Date(category.nextDueDate).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor={`rollover-${category.id}`} className="text-xs">
              <RolloverTooltip>Rollover</RolloverTooltip>
            </Label>
            <Switch
              id={`rollover-${category.id}`}
              checked={category.rolloverEnabled}
              onCheckedChange={(checked) => onUpdate({ rolloverEnabled: checked })}
            />
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onLinkBill}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function CategoryManager({
  groups,
  onUpdateCategory,
  onAddCategory,
  onDeleteCategory,
  onReorderCategories,
  onLinkBill,
  readyToAssign
}: CategoryManagerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find which group the dragged item belongs to
    const sourceGroup = groups.find(group => 
      group.categories.some(cat => cat.id === activeId)
    )

    if (!sourceGroup) return

    const oldIndex = sourceGroup.categories.findIndex(cat => cat.id === activeId)
    const newIndex = sourceGroup.categories.findIndex(cat => cat.id === overId)

    if (oldIndex !== newIndex) {
      const newOrder = arrayMove(sourceGroup.categories, oldIndex, newIndex)
      onReorderCategories(sourceGroup.id, newOrder.map(cat => cat.id))
    }
  }

  const addNewCategory = (groupId: string) => {
    const newCategory: Omit<Category, 'id'> = {
      name: 'New Category',
      groupId,
      groupName: groups.find(g => g.id === groupId)?.name || '',
      plannedAmount: 0,
      spentAmount: 0,
      rolloverEnabled: false,
      rolloverFromPrior: 0,
      priority: 3,
      sortOrder: 0
    }
    onAddCategory(groupId, newCategory)
  }

  return (
    <div className="space-y-6">
      {/* Ready to Assign Header */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Ready to Assign
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Available to budget this month
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                ${readyToAssign.toFixed(2)}
              </div>
              {readyToAssign < 0 && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Over-allocated
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Groups */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {groups.map((group) => (
          <Card key={group.id} className="bg-white dark:bg-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xl">{group.icon}</span>
                  {group.name}
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNewCategory(group.id)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SortableContext 
                items={group.categories.map(cat => cat.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {group.categories.map((category) => (
                    <SortableCategory
                      key={category.id}
                      category={category}
                      onUpdate={(updates) => onUpdateCategory(category.id, updates)}
                      onDelete={() => onDeleteCategory(category.id)}
                      onLinkBill={() => onLinkBill(category.id)}
                    />
                  ))}
                  {group.categories.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No categories in this group</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addNewCategory(group.id)}
                        className="mt-2"
                      >
                        Add First Category
                      </Button>
                    </div>
                  )}
                </div>
              </SortableContext>
            </CardContent>
          </Card>
        ))}
      </DndContext>
    </div>
  )
}
