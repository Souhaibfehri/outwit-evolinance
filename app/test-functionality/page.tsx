'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, X, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'pending'
  message: string
}

export default function TestFunctionalityPage() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runTests = async () => {
    setIsRunning(true)
    const results: TestResult[] = []

    // Test 1: Budget API
    try {
      const response = await fetch('/api/budget')
      if (response.ok) {
        results.push({ name: 'Budget API', status: 'success', message: 'Working correctly' })
      } else {
        results.push({ name: 'Budget API', status: 'error', message: `HTTP ${response.status}` })
      }
    } catch (error) {
      results.push({ name: 'Budget API', status: 'error', message: 'Network error' })
    }

    // Test 2: Dashboard API
    try {
      const response = await fetch('/api/dashboard/summary')
      if (response.ok) {
        results.push({ name: 'Dashboard API', status: 'success', message: 'Working correctly' })
      } else {
        results.push({ name: 'Dashboard API', status: 'error', message: `HTTP ${response.status}` })
      }
    } catch (error) {
      results.push({ name: 'Dashboard API', status: 'error', message: 'Network error' })
    }

    // Test 3: Notifications API
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        results.push({ name: 'Notifications API', status: 'success', message: 'Working correctly' })
      } else {
        results.push({ name: 'Notifications API', status: 'error', message: `HTTP ${response.status}` })
      }
    } catch (error) {
      results.push({ name: 'Notifications API', status: 'error', message: 'Network error' })
    }

    // Test 4: Forecast API
    try {
      const response = await fetch('/api/forecast')
      if (response.ok) {
        results.push({ name: 'Forecast API', status: 'success', message: 'Working correctly' })
      } else {
        results.push({ name: 'Forecast API', status: 'error', message: `HTTP ${response.status}` })
      }
    } catch (error) {
      results.push({ name: 'Forecast API', status: 'error', message: 'Network error' })
    }

    // Test 5: Goals API
    try {
      const response = await fetch('/api/goals')
      if (response.ok) {
        results.push({ name: 'Goals API', status: 'success', message: 'Working correctly' })
      } else {
        results.push({ name: 'Goals API', status: 'error', message: `HTTP ${response.status}` })
      }
    } catch (error) {
      results.push({ name: 'Goals API', status: 'error', message: 'Network error' })
    }

    // Test 6: Bills API
    try {
      const response = await fetch('/api/bills')
      if (response.ok) {
        results.push({ name: 'Bills API', status: 'success', message: 'Working correctly' })
      } else {
        results.push({ name: 'Bills API', status: 'error', message: `HTTP ${response.status}` })
      }
    } catch (error) {
      results.push({ name: 'Bills API', status: 'error', message: 'Network error' })
    }

    setTests(results)
    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error': return <X className="h-4 w-4 text-red-600" />
      case 'pending': return <AlertTriangle className="h-4 w-4 text-orange-600" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-800">Working</Badge>
      case 'error': return <Badge variant="destructive">Error</Badge>
      case 'pending': return <Badge variant="secondary">Pending</Badge>
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Functionality Test</h1>
        <p className="text-muted-foreground">
          Test all major API endpoints and functionality
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Endpoint Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>

          {tests.length > 0 && (
            <div className="space-y-2">
              {tests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <p className="font-medium">{test.name}</p>
                      <p className="text-sm text-muted-foreground">{test.message}</p>
                    </div>
                  </div>
                  {getStatusBadge(test.status)}
                </div>
              ))}
            </div>
          )}

          {tests.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {tests.filter(t => t.status === 'success').length} of {tests.length} tests passed
                </span>
                <Badge variant="outline">
                  {((tests.filter(t => t.status === 'success').length / tests.length) * 100).toFixed(0)}% success rate
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Navigation Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/budget'}>
              Budget
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/forecast'}>
              Forecast
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/goals'}>
              Goals
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/bills'}>
              Bills
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/settings'}>
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
