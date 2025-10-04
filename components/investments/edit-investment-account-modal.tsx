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
import { Edit, PiggyBank } from 'lucide-react'
import { toast } from 'sonner'

interface EditInvestmentAccountModalProps {
  isOpen: boolean
  onClose: () => void
  accountId: string
  onSuccess: () => void
}

export function EditInvestmentAccountModal({ isOpen, onClose, accountId, onSuccess }: EditInvestmentAccountModalProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      toast.success('Investment account updated successfully!')
      onSuccess()
    } catch (error) {
      toast.error('Failed to update investment account')
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
            Edit Investment Account
          </DialogTitle>
          <DialogDescription>
            Update your investment account details
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 text-center">
          <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">Edit Account</h3>
          <p className="text-muted-foreground text-sm">
            Full edit functionality coming soon
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            Update Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
