import { DashboardClient } from './dashboard-client'
import { SimpleDashboard } from './simple-dashboard'

export default function DashboardPage() {
  return (
    <DashboardClient>
      <SimpleDashboard />
    </DashboardClient>
  )
}

export const metadata = {
  title: 'Dashboard - Outwit Budget',
  description: 'Your financial overview and key metrics'
}
