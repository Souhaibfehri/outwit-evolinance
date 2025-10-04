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
import { Edit, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface EditIncomeSourceModalProps {
  isOpen: boolean
  onClose: () => void
  sourceId: string
  onSuccess: () => void
}

export function EditIncomeSourceModal({ isOpen, onClose, sourceId, onSuccess }: EditIncomeSourceModalProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Placeholder for edit functionality
      toast.success('Income source updated successfully!')
      onSuccess()
    } catch (error) {
      toast.error('Failed to update income source')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            Edit Income Source
          </DialogTitle>
          <DialogDescription>
            Update your income source details and schedule
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 text-center">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">Edit Income Source</h3>
          <p className="text-muted-foreground text-sm">
            Full edit functionality coming soon
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            Update Source
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
