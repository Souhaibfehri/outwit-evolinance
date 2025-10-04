'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  XCircle, 
  Trophy, 
  RotateCcw,
  Lightbulb,
  ArrowRight
} from 'lucide-react'
import { TutorialConfig } from '@/lib/tutorials/tutorial-configs'

interface QuizModalProps {
  isOpen: boolean
  config: TutorialConfig
  onComplete: (passed: boolean) => void
  onClose: () => void
  onSkip?: () => void
}

export function QuizModal({ isOpen, config, onComplete, onClose, onSkip }: QuizModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [showQuizConfirmation, setShowQuizConfirmation] = useState(true)
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false)

  // ESC key support
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey)
      return () => document.removeEventListener('keydown', handleEscKey)
    }
  }, [isOpen, onClose])

  const currentQuestion = config.quiz[currentQuestionIndex]
  const totalQuestions = config.quiz.length
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestionIndex] = answer
    setSelectedAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // Calculate score
      const correctAnswers = config.quiz.filter((q, index) => 
        selectedAnswers[index] === q.answer
      ).length
      
      const finalScore = Math.floor((correctAnswers / totalQuestions) * 100)
      setScore(finalScore)
      setShowResults(true)
    }
  }

  const handleRetry = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswers([])
    setShowResults(false)
    setScore(0)
  }

  const handleComplete = () => {
    const passed = score >= 70 // 70% passing grade
    onComplete(passed)
    
    // Reset for next time
    setCurrentQuestionIndex(0)
    setSelectedAnswers([])
    setShowResults(false)
    setScore(0)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-2xl"
        >
          <Card className="bg-white dark:bg-gray-800 border-2 border-orange-200 dark:border-orange-800">
            <CardHeader className="text-center relative">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Close quiz (ESC)"
              >
                <XCircle className="h-5 w-5" />
              </Button>
              
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {config.title} Quiz
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400">
                Test your knowledge to earn the {config.badge.name} badge!
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {showQuizConfirmation ? (
                /* Quiz Confirmation */
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto">
                    <Lightbulb className="h-8 w-8 text-blue-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Ready for a Quick Quiz?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Test your knowledge with {totalQuestions} questions to earn the <strong>{config.badge.name}</strong> badge!
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      You need 70% to pass. Don't worry - you can retake it anytime!
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={() => setShowQuizConfirmation(false)} 
                      className="btn-primary flex-1"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Take Quiz
                    </Button>
                    {onSkip && (
                      <Button 
                        variant="outline" 
                        onClick={() => setShowSkipConfirmation(true)}
                        className="flex-1"
                      >
                        Skip Quiz
                      </Button>
                    )}
                  </div>
                </div>
              ) : showSkipConfirmation ? (
                /* Skip Confirmation */
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mx-auto">
                    <ArrowRight className="h-8 w-8 text-yellow-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Skip the Quiz?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      You'll complete the tutorial but won't earn the <strong>{config.badge.name}</strong> badge.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      You can always come back and take the quiz later!
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => setShowSkipConfirmation(false)}
                      className="flex-1"
                    >
                      Go Back
                    </Button>
                    <Button 
                      onClick={() => {
                        onSkip?.()
                        setShowSkipConfirmation(false)
                        setShowQuizConfirmation(true)
                      }}
                      className="flex-1"
                    >
                      Skip Quiz
                    </Button>
                  </div>
                </div>
              ) : !showResults ? (
                <>
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        Question {currentQuestionIndex + 1} of {totalQuestions}
                      </span>
                      <span className="text-gray-500">
                        {progress.toFixed(0)}% Complete
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Question */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentQuestion.question}
                    </h3>
                    
                    <div className="space-y-2">
                      {currentQuestion.options.map((option, index) => (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAnswerSelect(option)}
                          className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                            selectedAnswers[currentQuestionIndex] === option
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                              : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              selectedAnswers[currentQuestionIndex] === option
                                ? 'border-orange-500 bg-orange-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {selectedAnswers[currentQuestionIndex] === option && (
                                <div className="w-full h-full rounded-full bg-white scale-50" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {option}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {currentQuestionIndex > 0 && (
                      <Button 
                        variant="outline" 
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                      >
                        Back
                      </Button>
                    )}
                    
                    <Button 
                      onClick={handleNext}
                      disabled={!selectedAnswers[currentQuestionIndex]}
                      className="btn-primary flex-1"
                    >
                      {currentQuestionIndex === totalQuestions - 1 ? (
                        <>
                          <Trophy className="h-4 w-4 mr-2" />
                          Finish Quiz
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Next Question
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                /* Quiz Results */
                <div className="text-center space-y-6">
                  <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
                    score >= 70 
                      ? 'bg-green-100 dark:bg-green-900' 
                      : 'bg-red-100 dark:bg-red-900'
                  }`}>
                    {score >= 70 ? (
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    ) : (
                      <XCircle className="h-10 w-10 text-red-600" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {score >= 70 ? 'Congratulations! 🎉' : 'Almost there! 💪'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      You scored {score}% ({config.quiz.filter((q, i) => selectedAnswers[i] === q.answer).length} out of {totalQuestions} correct)
                    </p>
                    
                    {score >= 70 ? (
                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 justify-center">
                          <span className="text-2xl">{config.badge.icon}</span>
                          <div>
                            <div className="font-semibold text-green-800 dark:text-green-200">
                              {config.badge.name} Badge Earned!
                            </div>
                            <div className="text-sm text-green-600 dark:text-green-400">
                              {config.badge.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div className="text-sm text-yellow-800 dark:text-yellow-200">
                            <strong>Need 70% to pass.</strong> Review the tutorial and try again!
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Review incorrect answers */}
                  {score < 70 && (
                    <div className="text-left space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">Review:</h4>
                      {config.quiz.map((question, index) => {
                        const userAnswer = selectedAnswers[index]
                        const isCorrect = userAnswer === question.answer
                        
                        if (isCorrect) return null
                        
                        return (
                          <div key={index} className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="text-sm">
                              <div className="font-medium text-red-800 dark:text-red-200 mb-1">
                                {question.question}
                              </div>
                              <div className="text-red-600 dark:text-red-400">
                                Your answer: {userAnswer}
                              </div>
                              <div className="text-green-600 dark:text-green-400">
                                Correct: {question.answer}
                              </div>
                              {question.explanation && (
                                <div className="text-gray-600 dark:text-gray-400 mt-2">
                                  {question.explanation}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    {score < 70 ? (
                      <>
                        <Button variant="outline" onClick={handleRetry} className="flex-1">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Retry Quiz
                        </Button>
                        <Button onClick={onClose} className="flex-1">
                          Skip for Now
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleComplete} className="btn-primary w-full">
                        <Trophy className="h-4 w-4 mr-2" />
                        Claim Badge
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
