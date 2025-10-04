'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { FoxyLauncher } from './foxy-launcher'
import { FoxyPanel } from './foxy-panel'
import { TourOverlay } from './tour-overlay'
import { BadgeToast } from './badge-toast'
import { foxyEvents, FoxyEvent } from '@/lib/foxy/events'
import { TUTORIAL_STEPS } from '@/lib/foxy/tutorial-steps'
import { BADGES } from '@/lib/foxy/badges'

interface CoachState {
  mode: 'tutorial' | 'coach'
  tutorialProgress: number
  completedStepIds: string[]
  unlockedBadges: string[]
  streakDays: number
  coachEnabled: boolean
  hintsEnabled: boolean
  celebrationsEnabled: boolean
}

interface FoxyContextType {
  state: CoachState
  isLoading: boolean
  isPanelOpen: boolean
  currentStep: any
  newBadge: any
  
  // Actions
  openPanel: () => void
  closePanel: () => void
  switchMode: (mode: 'tutorial' | 'coach') => void
  completeStep: (stepId: string) => void
  skipStep: (stepId: string) => void
  restartTutorial: () => void
  dismissBadge: () => void
  emitEvent: (event: FoxyEvent, metadata?: Record<string, any>) => void
}

const FoxyContext = createContext<FoxyContextType | null>(null)

export function useFoxy() {
  const context = useContext(FoxyContext)
  if (!context) {
    throw new Error('useFoxy must be used within FoxyProvider')
  }
  return context
}

interface FoxyProviderProps {
  children: ReactNode
  userId: string
  initialState?: Partial<CoachState>
}

export function FoxyProvider({ children, userId, initialState }: FoxyProviderProps) {
  const [state, setState] = useState<CoachState>({
    mode: 'coach', // DISABLED: Start in coach mode, not tutorial mode
    tutorialProgress: 100, // Mark tutorial as completed to prevent auto-start
    completedStepIds: [],
    unlockedBadges: [],
    streakDays: 0,
    coachEnabled: true,
    hintsEnabled: true,
    celebrationsEnabled: true,
    ...initialState
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [newBadge, setNewBadge] = useState<any>(null)

  // Load initial coach state
  useEffect(() => {
    loadCoachState()
  }, [userId])

  const loadCoachState = async () => {
    try {
      const response = await fetch('/api/coach/state')
      if (response.ok) {
        const data = await response.json()
        setState(prev => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error('Failed to load coach state:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveCoachState = async (updates: Partial<CoachState>) => {
    try {
      await fetch('/api/coach/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
    } catch (error) {
      console.error('Failed to save coach state:', error)
    }
  }

  const getCurrentStep = () => {
    // DISABLED: No auto-tutorial steps
    // Users get tutorials through the new tutorial system instead
    return null
    
    // if (state.mode !== 'tutorial' || state.tutorialProgress >= 100) return null
    // 
    // const nextStep = TUTORIAL_STEPS.find(step => 
    //   !state.completedStepIds.includes(step.id)
    // )
    // 
    // if (!nextStep) return null
    //
    // return {
    //   ...nextStep,
    //   totalSteps: TUTORIAL_STEPS.length
    // }
  }

  const completeStep = async (stepId: string) => {
    const newCompletedSteps = [...state.completedStepIds, stepId]
    const newProgress = Math.floor((newCompletedSteps.length / TUTORIAL_STEPS.length) * 100)
    
    const updates = {
      completedStepIds: newCompletedSteps,
      tutorialProgress: newProgress,
      mode: newProgress >= 100 ? 'coach' as const : state.mode
    }

    setState(prev => ({ ...prev, ...updates }))
    await saveCoachState(updates)

    // DISABLED: Auto-badge unlocking for steps
    // Users should earn badges through meaningful actions, not just tutorial completion
    // const step = TUTORIAL_STEPS.find(s => s.id === stepId)
    // if (step?.config?.badge) {
    //   await unlockBadge(step.config.badge)
    // }

    // DISABLED: Tutorial completion badge
    // if (newProgress >= 100) {
    //   await unlockBadge('trailblazer')
    // }
  }

  const skipStep = async (stepId: string) => {
    await completeStep(stepId) // Skipping counts as completion
  }

  const switchMode = async (mode: 'tutorial' | 'coach') => {
    const updates = { mode }
    setState(prev => ({ ...prev, ...updates }))
    await saveCoachState(updates)
  }

  const restartTutorial = async () => {
    const updates = {
      mode: 'tutorial' as const,
      tutorialProgress: 0,
      completedStepIds: []
    }
    setState(prev => ({ ...prev, ...updates }))
    await saveCoachState(updates)
  }

  const unlockBadge = async (badgeId: string) => {
    if (state.unlockedBadges.includes(badgeId)) return

    const badge = BADGES.find(b => b.id === badgeId)
    if (!badge) return

    const newBadges = [...state.unlockedBadges, badgeId]
    setState(prev => ({ ...prev, unlockedBadges: newBadges }))
    await saveCoachState({ unlockedBadges: newBadges })

    // Show celebration
    if (state.celebrationsEnabled) {
      setNewBadge(badge)
    }
  }

  const emitEvent = async (event: FoxyEvent, metadata?: Record<string, any>) => {
    await foxyEvents.emit(event, userId, metadata)
    
    // DISABLED: Auto-badge unlocking for events
    // Users should earn badges through significant achievements, not simple actions
    // for (const badge of BADGES) {
    //   if (badge.unlockRule.event === event && !state.unlockedBadges.includes(badge.id)) {
    //     // Check threshold if required
    //     if (badge.unlockRule.threshold) {
    //       // In a real app, you'd track counts in the database
    //       // For now, we'll just unlock on first occurrence
    //       continue
    //     }
    //     
    //     await unlockBadge(badge.id)
    //   }
    // }
  }

  const currentStep = getCurrentStep()

  const contextValue: FoxyContextType = {
    state,
    isLoading,
    isPanelOpen,
    currentStep,
    newBadge,
    
    openPanel: () => setIsPanelOpen(true),
    closePanel: () => setIsPanelOpen(false),
    switchMode,
    completeStep,
    skipStep,
    restartTutorial,
    dismissBadge: () => setNewBadge(null),
    emitEvent
  }

  return (
    <FoxyContext.Provider value={contextValue}>
      {children}
      
      {/* Foxy UI Components */}
      {state.coachEnabled && !isLoading && (
        <>
          <FoxyLauncher
            onOpen={() => setIsPanelOpen(true)}
            isOpen={isPanelOpen}
            tutorialProgress={state.tutorialProgress}
            hasNewMessage={false} // Would be determined by new coach messages
            unreadCount={0} // Would be determined by unread messages
          />

          <FoxyPanel
            isOpen={isPanelOpen}
            onClose={() => setIsPanelOpen(false)}
            mode={state.mode}
            tutorialProgress={state.tutorialProgress}
            currentStep={currentStep}
            unlockedBadges={state.unlockedBadges}
            onSwitchMode={switchMode}
            onCompleteStep={completeStep}
            onSkipStep={skipStep}
            onRestartTutorial={restartTutorial}
          />

          {/* Tour overlay for tutorial mode */}
          {state.mode === 'tutorial' && currentStep && (
            <TourOverlay
              isActive={true}
              targetSelector={currentStep.targetSelector || ''}
              title={currentStep.title}
              content={currentStep.copy}
              step={currentStep.order}
              totalSteps={currentStep.totalSteps}
              onNext={() => completeStep(currentStep.id)}
              onSkip={currentStep.skippable ? () => skipStep(currentStep.id) : undefined}
              onClose={() => setIsPanelOpen(false)}
              showSkip={currentStep.skippable}
            />
          )}

          {/* Badge celebration toast */}
          <BadgeToast
            badge={newBadge}
            onClose={() => setNewBadge(null)}
          />
        </>
      )}
    </FoxyContext.Provider>
  )
}

// Hook for emitting events from components
export function useFoxyEvents() {
  const { emitEvent } = useFoxy()
  return { emit: emitEvent }
}
