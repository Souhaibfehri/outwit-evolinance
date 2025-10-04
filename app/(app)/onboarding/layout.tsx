'use client'

import { ReactNode } from 'react'
import { OnboardingStepper } from './components/onboarding-stepper'
import { CoachCard } from './components/coach-card'

interface OnboardingLayoutProps {
  children: ReactNode
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <OnboardingStepper />
            <div className="mt-8">
              {children}
            </div>
          </div>

          {/* Coach Sidebar */}
          <div className="lg:col-span-1">
            <CoachCard />
          </div>
        </div>
      </div>
    </div>
  )
}
