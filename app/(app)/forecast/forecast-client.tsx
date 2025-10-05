'use client'

import { useState, useEffect } from 'react'
import { ForecastTimeline } from '@/components/forecast/forecast-timeline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  Settings,
  Save,
  FileText,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { ForecastMonth } from '@/lib/forecast/engine'

export function ForecastPageClient() {
  const [forecast, setForecast] = useState<ForecastMonth[]>([])
  const [loading, setLoading] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    fetchForecast()
  }, [])

  const fetchForecast = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/forecast')
      const data = await response.json()

      if (data.success) {
        setForecast(data.forecast)
      } else {
        toast.error('Failed to load forecast')
      }
    } catch (error) {
      console.error('Error fetching forecast:', error)
      toast.error('Failed to load forecast')
    } finally {
      setLoading(false)
    }
  }

  const handleOverrideChange = (month: string, categoryId: string | null, deltaAmount: number) => {
    setHasUnsavedChanges(true)
    // The ForecastTimeline component handles the API call and local state update
  }

  const handleSaveScenario = async () => {
    try {
      const response = await fetch('/api/forecast/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Scenario ${new Date().toLocaleDateString()}`,
          baseMonth: new Date().toISOString().substring(0, 7),
          data: forecast
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Scenario saved successfully')
        setHasUnsavedChanges(false)
      } else {
        toast.error('Failed to save scenario')
      }
    } catch (error) {
      console.error('Error saving scenario:', error)
      toast.error('Failed to save scenario')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      {hasUnsavedChanges && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  You have unsaved changes to your forecast
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={fetchForecast}>
                  Discard Changes
                </Button>
                <Button size="sm" onClick={handleSaveScenario}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Scenario
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Forecast View */}
      <Tabs defaultValue="timeline" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Scenarios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-6">
          <ForecastTimeline 
            initialForecast={forecast}
            onOverrideChange={handleOverrideChange}
          />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <ForecastTrends forecast={forecast} />
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          <ForecastScenarios />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ForecastTrends({ forecast }: { forecast: ForecastMonth[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          Forecast Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Trend Analysis Coming Soon</h3>
          <p className="text-muted-foreground">
            Visual charts and trend analysis will be available in the next update.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function ForecastScenarios() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-orange-600" />
          Saved Scenarios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Saved Scenarios</h3>
          <p className="text-muted-foreground mb-4">
            Create and save different forecast scenarios to compare outcomes.
          </p>
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Current as Scenario
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
