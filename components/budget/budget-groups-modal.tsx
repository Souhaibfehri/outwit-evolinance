'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Folder,
  FolderPlus,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface CategoryGroup {
  id: string
  name: string
  color: string
  sortOrder: number
  categoryCount: number
}

interface Category {
  id: string
  name: string
  groupId?: string
  groupName?: string
}

interface BudgetGroupsModalProps {
  isOpen: boolean
  onClose: () => void
  groups: CategoryGroup[]
  categories: Category[]
  onGroupsUpdate: () => void
}

const groupColors = [
  { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
  { name: 'Green', value: 'green', class: 'bg-green-500' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
  { name: 'Red', value: 'red', class: 'bg-red-500' },
  { name: 'Teal', value: 'teal', class: 'bg-teal-500' },
  { name: 'Pink', value: 'pink', class: 'bg-pink-500' },
  { name: 'Indigo', value: 'indigo', class: 'bg-indigo-500' }
]

export function BudgetGroupsModal({ 
  isOpen, 
  onClose, 
  groups, 
  categories, 
  onGroupsUpdate 
}: BudgetGroupsModalProps) {
  const [mode, setMode] = useState<'view' | 'create' | 'edit'>('view')
  const [editingGroup, setEditingGroup] = useState<CategoryGroup | null>(null)
  const [newGroup, setNewGroup] = useState({
    name: '',
    color: 'blue'
  })

  const resetForm = () => {
    setNewGroup({ name: '', color: 'blue' })
    setEditingGroup(null)
    setMode('view')
  }

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      toast.error('Please enter a group name')
      return
    }

    try {
      const response = await fetch('/api/budget/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroup.name,
          color: newGroup.color,
          sortOrder: groups.length
        })
      })

      if (response.ok) {
        toast.success('Group created successfully!')
        resetForm()
        onGroupsUpdate()
      } else {
        throw new Error('Failed to create group')
      }
    } catch (error) {
      console.error('Error creating group:', error)
      toast.error('Failed to create group. Please try again.')
    }
  }

  const handleEditGroup = async () => {
    if (!editingGroup || !newGroup.name.trim()) {
      toast.error('Please enter a group name')
      return
    }

    try {
      const response = await fetch('/api/budget/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingGroup.id,
          name: newGroup.name,
          color: newGroup.color
        })
      })

      if (response.ok) {
        toast.success('Group updated successfully!')
        resetForm()
        onGroupsUpdate()
      } else {
        throw new Error('Failed to update group')
      }
    } catch (error) {
      console.error('Error updating group:', error)
      toast.error('Failed to update group. Please try again.')
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? Categories will be moved to "Uncategorized".')) {
      return
    }

    try {
      const response = await fetch('/api/budget/groups', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: groupId })
      })

      if (response.ok) {
        toast.success('Group deleted successfully!')
        onGroupsUpdate()
      } else {
        throw new Error('Failed to delete group')
      }
    } catch (error) {
      console.error('Error deleting group:', error)
      toast.error('Failed to delete group. Please try again.')
    }
  }

  const startEdit = (group: CategoryGroup) => {
    setEditingGroup(group)
    setNewGroup({ name: group.name, color: group.color })
    setMode('edit')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-600" />
              <DialogTitle>Manage Budget Groups</DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Organize your budget categories into groups for better organization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode selector */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'view' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { resetForm(); setMode('view') }}
            >
              <Folder className="h-4 w-4 mr-2" />
              View Groups
            </Button>
            <Button
              variant={mode === 'create' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { resetForm(); setMode('create') }}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {/* View Groups */}
            {mode === 'view' && (
              <motion.div
                key="view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                {groups.length === 0 ? (
                  <div className="text-center py-8">
                    <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No groups created yet</p>
                    <Button
                      onClick={() => setMode('create')}
                      className="mt-4"
                    >
                      Create Your First Group
                    </Button>
                  </div>
                ) : (
                  groups.map((group) => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full bg-${group.color}-500`} />
                        <div>
                          <div className="font-medium">{group.name}</div>
                          <div className="text-sm text-gray-500">
                            {group.categoryCount || 0} categories
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(group)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGroup(group.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {/* Create/Edit Group */}
            {(mode === 'create' || mode === 'edit') && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {mode === 'create' ? 'Create New Group' : 'Edit Group'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Group Name</Label>
                      <Input
                        value={newGroup.name}
                        onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                        placeholder="e.g., Essential Bills, Lifestyle, Savings"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Color</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {groupColors.map((color) => (
                          <Button
                            key={color.value}
                            variant={newGroup.color === color.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setNewGroup({ ...newGroup, color: color.value })}
                            className="flex items-center gap-2"
                          >
                            <div className={`w-3 h-3 rounded-full ${color.class}`} />
                            {color.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={mode === 'create' ? handleCreateGroup : handleEditGroup}
                        disabled={!newGroup.name.trim()}
                        className="flex-1"
                      >
                        {mode === 'create' ? 'Create Group' : 'Update Group'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setMode('view')}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick stats */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {groups.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Groups Created
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {categories.filter(c => !c.groupId).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Uncategorized
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
