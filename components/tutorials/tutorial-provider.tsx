'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { TutorialPanel } from './tutorial-panel'
import { TutorialLauncher } from './tutorial-launcher'
import { QuizModal } from './quiz-modal'
import { ConfettiCelebration } from './confetti-celebration'
import { getTutorialConfig, getTutorialProgress } from '@/lib/tutorials/tutorial-configs'
import { toast } from 'sonner'

interface TutorialState {
  isActive: boolean
  currentPage: string
  completedPages: string[]
  earnedBadges: string[]
  tutorialProgress: number
  hasCompletedOnboarding: boolean
  showQuiz: boolean
  showCelebration: boolean
  currentBadge?: string
}

interface TutorialContextType {
  state: TutorialState
  startTutorial: (page: string) => void
  completeTutorial: () => void
  skipTutorial: () => void
  closeTutorial: () => void
  restartAllTutorials: () => void
}

const TutorialContext = createContext<TutorialContextType | null>(null)

export function useTutorial() {
  const context = useContext(TutorialContext)
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider')
  }
  return context
}

interface TutorialProviderProps {
  children: ReactNode
  userId: string
  hasCompletedOnboarding?: boolean
}

export function TutorialProvider({ 
  children, 
  userId, 
  hasCompletedOnboarding = false 
}: TutorialProviderProps) {
  const pathname = usePathname()
  const currentPage = pathname.split('/').pop() || 'dashboard'

  const [state, setState] = useState<TutorialState>({
    isActive: false,
    currentPage,
    completedPages: [],
    earnedBadges: [],
    tutorialProgress: 0,
    hasCompletedOnboarding,
    showQuiz: false,
    showCelebration: false,
    currentBadge: undefined
  })

  // Load tutorial state from localStorage (since we can't touch database)
  useEffect(() => {
    const savedState = localStorage.getItem(`tutorial-state-${userId}`)
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        
        setState(prev => ({
          ...prev,
          completedPages: parsed.completedPages || [],
          earnedBadges: parsed.earnedBadges || [], // Keep earned badges from tutorial completions
          tutorialProgress: getTutorialProgress(parsed.completedPages || [])
        }))
        
      } catch (error) {
        console.error('Failed to load tutorial state:', error)
      }
    }
  }, [userId])

  // Save tutorial state to localStorage
  const saveTutorialState = (updates: Partial<TutorialState>) => {
    const newState = { ...state, ...updates }
    setState(newState)
    
    localStorage.setItem(`tutorial-state-${userId}`, JSON.stringify({
      completedPages: newState.completedPages,
      earnedBadges: newState.earnedBadges,
      tutorialProgress: newState.tutorialProgress
    }))
  }

  // Auto-start tutorial for new users after onboarding - DISABLED
  // Users can manually start tutorials using the help button instead
  // useEffect(() => {
  //   if (hasCompletedOnboarding && state.completedPages.length === 0 && currentPage === 'dashboard') {
  //     // Auto-start dashboard tutorial for new users
  //     const timer = setTimeout(() => {
  //       startTutorial('dashboard')
  //     }, 2000) // Give user time to see the dashboard first
  //     
  //     return () => clearTimeout(timer)
  //   }
  // }, [hasCompletedOnboarding, currentPage, state.completedPages.length])

  const startTutorial = (page: string) => {
    const config = getTutorialConfig(page)
    if (!config) {
      toast.error(`No tutorial available for ${page}`)
      return
    }

    setState(prev => ({
      ...prev,
      isActive: true,
      currentPage: page
    }))
  }

  const completeTutorial = () => {
    // Start quiz after tutorial completion
    setState(prev => ({
      ...prev,
      isActive: false,
      showQuiz: true
    }))
  }

  const handleQuizComplete = (passed: boolean) => {
    setState(prev => ({ ...prev, showQuiz: false }))
    
    if (passed) {
      const config = getTutorialConfig(state.currentPage)
      if (config) {
        const newCompletedPages = [...state.completedPages, state.currentPage]
        const newEarnedBadges = [...state.earnedBadges, config.badge.id]
        
        // Immediately show celebration and save state
        setState(prev => ({
          ...prev,
          showCelebration: true,
          currentBadge: config.badge.id,
          completedPages: newCompletedPages,
          earnedBadges: newEarnedBadges,
          tutorialProgress: getTutorialProgress(newCompletedPages)
        }))
        
        // Save to localStorage
        localStorage.setItem(`tutorial-state-${userId}`, JSON.stringify({
          completedPages: newCompletedPages,
          earnedBadges: newEarnedBadges,
          tutorialProgress: getTutorialProgress(newCompletedPages)
        }))
        
        // Emit event for badge showcase to update
        window.dispatchEvent(new CustomEvent('tutorial-badge-earned', { 
          detail: { badgeId: config.badge.id, userId }
        }))

        // Hide celebration after 4 seconds and show success toast
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            showCelebration: false,
            currentBadge: undefined
          }))
          toast.success(`🎉 ${config.title} tutorial completed! Badge earned: ${config.badge.name}`)
        }, 4000)
      }
    } else {
      toast.info('Complete the quiz to earn your badge! You can retry anytime.')
    }
  }

  const skipTutorial = () => {
    setState(prev => ({ ...prev, isActive: false }))
    toast.info('Tutorial skipped. Use the help button to restart anytime!')
  }

  const closeTutorial = () => {
    // Clean up highlights when closing
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight')
    })
    setState(prev => ({ ...prev, isActive: false }))
  }

  const restartAllTutorials = () => {
    saveTutorialState({
      isActive: false,
      completedPages: [],
      earnedBadges: [], // Clear all tutorial badges
      tutorialProgress: 0
    })
    
    // Also clear any existing tutorial badges from localStorage
    localStorage.removeItem(`tutorial-state-${userId}`)
    
    toast.success('All tutorials reset! Badges are now earned through real financial actions, not tutorials.')
  }

  const currentConfig = getTutorialConfig(state.currentPage)

  const contextValue: TutorialContextType = {
    state,
    startTutorial,
    completeTutorial,
    skipTutorial,
    closeTutorial,
    restartAllTutorials
  }

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
      
      {/* Tutorial Launcher - always visible */}
      <TutorialLauncher
        onStartTutorial={startTutorial}
        onRestartAllTutorials={restartAllTutorials}
        earnedBadges={state.earnedBadges}
        completedTutorials={state.completedPages}
        position="bottom-left"
      />

      {/* Active Tutorial */}
      {state.isActive && currentConfig && (
        <TutorialPanel
          steps={currentConfig.steps}
          isActive={state.isActive}
          onComplete={completeTutorial}
          onSkip={skipTutorial}
          onClose={closeTutorial}
          title={currentConfig.title}
          subtitle={currentConfig.description}
        />
      )}

      {/* Quiz Modal */}
      {state.showQuiz && currentConfig && (
        <QuizModal
          isOpen={state.showQuiz}
          config={currentConfig}
          onComplete={handleQuizComplete}
          onClose={() => setState(prev => ({ ...prev, showQuiz: false }))}
          onSkip={() => {
            // Skip quiz but mark tutorial as completed without badge
            const newCompletedPages = [...state.completedPages, state.currentPage]
            setState(prev => ({
              ...prev,
              showQuiz: false,
              completedPages: newCompletedPages,
              tutorialProgress: getTutorialProgress(newCompletedPages)
            }))
            
            localStorage.setItem(`tutorial-state-${userId}`, JSON.stringify({
              completedPages: newCompletedPages,
              earnedBadges: state.earnedBadges,
              tutorialProgress: getTutorialProgress(newCompletedPages)
            }))
            
            toast.success(`${currentConfig.title} tutorial completed! Quiz skipped - badge can be earned later.`)
          }}
        />
      )}

      {/* Celebration */}
      {state.showCelebration && state.currentBadge && currentConfig && (
        <ConfettiCelebration
          badge={currentConfig.badge}
          onComplete={() => setState(prev => ({ 
            ...prev, 
            showCelebration: false, 
            currentBadge: undefined 
          }))}
        />
      )}
    </TutorialContext.Provider>
  )
}

// Hook for pages to trigger tutorial events
export function useTutorialEvents() {
  const { startTutorial } = useTutorial()
  
  return {
    startPageTutorial: (page: string) => startTutorial(page),
    triggerTutorialStep: (stepId: string) => {
      // Emit custom event for tutorial step completion
      window.dispatchEvent(new CustomEvent('tutorial-step-complete', { 
        detail: { stepId } 
      }))
    }
  }
}
