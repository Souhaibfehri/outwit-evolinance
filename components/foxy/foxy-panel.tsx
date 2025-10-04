'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Send, 
  Trophy,
  MessageCircle
} from 'lucide-react'
import { OutwitLogo } from '@/components/ui/outwit-logo'

interface FoxyPanelProps {
  isOpen: boolean
  onClose: () => void
  unlockedBadges: string[]
  mode?: 'tutorial' | 'coach'
  tutorialProgress?: number
  currentStep?: any
  onSwitchMode?: (mode: 'tutorial' | 'coach') => void
  onCompleteStep?: (stepId: string) => void
  onSkipStep?: (stepId: string) => void
  onRestartTutorial?: () => void
}


interface ChatMessage {
  id: string
  role: 'assistant' | 'user'
  content: string
  timestamp: Date
  toolCalls?: any[]
}

export function FoxyPanel({
  isOpen,
  onClose,
  unlockedBadges
}: FoxyPanelProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Call Foxy API
      const response = await fetch('/api/coach/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          mode: 'coach',
          context: {}
        })
      })

      const data = await response.json()
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        toolCalls: data.toolCalls
      }

      setChatMessages(prev => [...prev, assistantMessage])

      // Execute any tool calls
      if (data.toolCalls) {
        for (const toolCall of data.toolCalls) {
          await executeToolCall(toolCall)
        }
      }
    } catch (error) {
      console.error('Failed to send message to Foxy:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment! 🦊',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const executeToolCall = async (toolCall: any) => {
    // Execute tool calls (navigate, openModal, etc.)
    switch (toolCall.name) {
      case 'navigate':
        window.location.href = toolCall.args.route
        break
      case 'openModal':
        // Trigger modal opening
        const event = new CustomEvent('foxy-open-modal', { detail: toolCall.args })
        window.dispatchEvent(event)
        break
      default:
        console.log('Unknown tool call:', toolCall)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <OutwitLogo size={32} showText={false} />
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Foxy Coach
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your AI Financial Coach
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content - Coach Only */}
            <div className="flex-1 flex flex-col">
              <CoachChat
                messages={chatMessages}
                inputMessage={inputMessage}
                onInputChange={setInputMessage}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                messagesEndRef={messagesEndRef}
              />
            </div>

            {/* Footer with badges */}
            {unlockedBadges.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Recent Badges
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {unlockedBadges.slice(-3).map(badgeId => (
                    <Badge key={badgeId} variant="outline" className="text-xs">
                      {badgeId.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}


function CoachChat({
  messages,
  inputMessage,
  onInputChange,
  onSendMessage,
  isLoading,
  messagesEndRef
}: {
  messages: ChatMessage[]
  inputMessage: string
  onInputChange: (value: string) => void
  onSendMessage: () => void
  isLoading: boolean
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🦊</div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Coach Mode Active
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ask me about your finances, or I'll share insights based on your data!
            </p>
          </div>
        )}

        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
              message.role === 'user'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
            }`}>
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">🦊</span>
                  <span className="text-xs font-medium opacity-70">Foxy</span>
                </div>
              )}
              <p className="text-sm">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">🦊</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Ask Foxy about your finances..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSendMessage()
              }
            }}
            disabled={isLoading}
          />
          <Button 
            onClick={onSendMessage} 
            disabled={!inputMessage.trim() || isLoading}
            size="sm"
            className="btn-primary"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Foxy provides educational insights, not financial advice
        </p>
      </div>
    </div>
  )
}
