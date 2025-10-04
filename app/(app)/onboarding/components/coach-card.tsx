'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, MessageCircle, Lightbulb, Target, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const coachTips = {
  profile: {
    title: "Welcome aboard! 👋",
    content: "This quick setup helps us personalize your experience. Don't worry - you can change everything later!",
    tip: "Pro tip: Choose your local timezone for accurate payment reminders."
  },
  income: {
    title: "Money coming in 💰",
    content: "Include all income sources, even irregular ones. We'll help you build a buffer for variable income.",
    tip: "Freelancer? No fixed paycheck? That's totally fine - we'll help you budget with irregular income."
  },
  bills: {
    title: "Your regular expenses 📋",
    content: "Add bills you pay regularly. We'll help you never miss a payment and budget for them automatically.",
    tip: "Tip: Enable rollover for categories where leftover money should carry to next month."
  },
  debts: {
    title: "Debt freedom strategy 🎯",
    content: "We'll help you choose between Avalanche (save on interest) or Snowball (quick wins) strategies.",
    tip: "Credit cards have minimum payments. Loans have fixed payments. We handle both differently."
  },
  goals: {
    title: "Your financial dreams ✨",
    content: "Set priorities and we'll help you reach your goals faster with smart auto-saving suggestions.",
    tip: "Emergency fund first? Great choice! Aim for 3-6 months of expenses for peace of mind."
  },
  review: {
    title: "You're all set! 🎉",
    content: "Your financial foundation is ready. Time to start assigning every dollar a job!",
    tip: "Remember: In zero-based budgeting, Income - Outgo = Zero. Every dollar has a purpose."
  }
}

const badges = [
  { key: 'first_step', title: 'First Step', icon: Star, unlocked: true },
  { key: 'income_ready', title: 'Income Ready', icon: Target, unlocked: false },
  { key: 'debt_ready', title: 'Debt Ready', icon: Target, unlocked: false },
  { key: 'goal_setter', title: 'Goal Setter', icon: Target, unlocked: false },
  { key: 'setup_complete', title: 'Setup Complete', icon: Star, unlocked: false }
]

interface CoachCardProps {
  currentStep?: string
}

export function CoachCard({ currentStep = 'profile' }: CoachCardProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [unlockedBadges, setUnlockedBadges] = useState(['first_step'])

  const currentTip = coachTips[currentStep as keyof typeof coachTips] || coachTips.profile

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 lg:relative lg:bottom-auto lg:right-auto"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Show Coach
      </Button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Coach Tips */}
      <Card className="bg-orange-50/50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Your Budget Coach
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0 text-orange-400 hover:text-orange-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <h3 className="font-semibold text-orange-900 dark:text-orange-100">
            {currentTip.title}
          </h3>
          <p className="text-sm text-orange-800 dark:text-orange-200">
            {currentTip.content}
          </p>
          <div className="p-3 bg-orange-100/50 dark:bg-orange-900/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <Lightbulb className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
              <p className="text-xs text-orange-700 dark:text-orange-300">
                {currentTip.tip}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Your Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2">
            {badges.map((badge) => {
              const isUnlocked = unlockedBadges.includes(badge.key)
              const Icon = badge.icon
              
              return (
                <motion.div
                  key={badge.key}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: isUnlocked ? 1 : 0.5 }}
                  className={`flex items-center space-x-2 p-2 rounded-lg ${
                    isUnlocked 
                      ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                      : 'bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${
                    isUnlocked 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-400'
                  }`} />
                  <span className={`text-xs font-medium ${
                    isUnlocked 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {badge.title}
                  </span>
                  {isUnlocked && (
                    <Badge className="ml-auto bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs">
                      ✓
                    </Badge>
                  )}
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Quick Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
            <p>• You can pause and resume anytime</p>
            <p>• All amounts can be edited later</p>
            <p>• Skip steps if you're not ready</p>
            <p>• We'll help with smart defaults</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
