'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText, Database } from 'lucide-react'
import { toast } from 'sonner'
import { downloadCSV } from '@/lib/csv'

export function ExportControls() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleExport = async (type: string, format: string) => {
    setLoading(`${type}-${format}`)
    
    try {
      let url = ''
      let filename = ''
      
      switch (type) {
        case 'transactions':
          url = `/api/exports/transactions?format=${format}`
          filename = `transactions-${new Date().toISOString().split('T')[0]}.${format}`
          break
        case 'budget':
          url = `/api/exports/budget?format=${format}`
          filename = `budget-${new Date().toISOString().split('T')[0]}.${format}`
          break
        case 'bills':
          url = `/api/exports/bills?format=${format}`
          filename = `bills-${new Date().toISOString().split('T')[0]}.${format}`
          break
        case 'goals':
          url = `/api/exports/goals?format=${format}`
          filename = `goals-${new Date().toISOString().split('T')[0]}.${format}`
          break
        default:
          throw new Error('Unknown export type')
      }

      if (format === 'csv') {
        // For CSV, trigger download directly
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Export failed')
        }
        
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)
        
        toast.success(`${type} exported to CSV successfully!`)
      } else {
        // For JSON, show the data or download
        const response = await fetch(url)
        const result = await response.json()
        
        if (result.success) {
          // Download JSON file
          const blob = new Blob([JSON.stringify(result.data, null, 2)], { 
            type: 'application/json' 
          })
          const downloadUrl = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(downloadUrl)
          
          toast.success(`${type} exported to JSON successfully!`)
        } else {
          throw new Error(result.error)
        }
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error(`Failed to export ${type}`)
    } finally {
      setLoading(null)
    }
  }

  const isLoading = (type: string, format: string) => {
    return loading === `${type}-${format}`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Transactions */}
        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
          Transactions
        </div>
        <DropdownMenuItem 
          onClick={() => handleExport('transactions', 'csv')}
          disabled={isLoading('transactions', 'csv')}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          {isLoading('transactions', 'csv') ? 'Exporting...' : 'Export to CSV'}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('transactions', 'json')}
          disabled={isLoading('transactions', 'json')}
        >
          <Database className="h-4 w-4 mr-2" />
          {isLoading('transactions', 'json') ? 'Exporting...' : 'Export to JSON'}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Budget */}
        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
          Budget
        </div>
        <DropdownMenuItem 
          onClick={() => handleExport('budget', 'csv')}
          disabled={isLoading('budget', 'csv')}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          {isLoading('budget', 'csv') ? 'Exporting...' : 'Export to CSV'}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('budget', 'json')}
          disabled={isLoading('budget', 'json')}
        >
          <Database className="h-4 w-4 mr-2" />
          {isLoading('budget', 'json') ? 'Exporting...' : 'Export to JSON'}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Bills */}
        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
          Bills & Goals
        </div>
        <DropdownMenuItem 
          onClick={() => handleExport('bills', 'csv')}
          disabled={isLoading('bills', 'csv')}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          {isLoading('bills', 'csv') ? 'Exporting...' : 'Bills to CSV'}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('goals', 'csv')}
          disabled={isLoading('goals', 'csv')}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          {isLoading('goals', 'csv') ? 'Exporting...' : 'Goals to CSV'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
