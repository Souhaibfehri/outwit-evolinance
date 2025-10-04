'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Target, Plus } from 'lucide-react'

interface AllocationTemplatesTabProps {
  onRefresh: () => void
}

export function AllocationTemplatesTab({ onRefresh }: AllocationTemplatesTabProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Allocation Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Allocation Templates Coming Soon</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Create templates to automatically assign income to budget categories
            </p>
            <Button disabled>
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
