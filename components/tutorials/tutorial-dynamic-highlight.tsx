'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface DynamicHighlightProps {
  isActive: boolean
  targetSelector: string
  onElementFound?: (element: HTMLElement) => void
}

export function DynamicTutorialHighlight({ isActive, targetSelector, onElementFound }: DynamicHighlightProps) {
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive) {
      setHighlightedElement(null)
      return
    }

    const findAndHighlightElement = () => {
      // Try multiple selectors if comma-separated
      const selectors = targetSelector.split(',').map(s => s.trim())
      let element: HTMLElement | null = null
      
      for (const sel of selectors) {
        element = document.querySelector(sel) as HTMLElement
        if (element) break
      }

      if (element) {
        setHighlightedElement(element)
        onElementFound?.(element)

        // Scroll into view
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        })
      }
    }

    // Initial search
    findAndHighlightElement()

    // Set up mutation observer to track DOM changes (for modals, dynamic content)
    const observer = new MutationObserver(() => {
      findAndHighlightElement()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-testid']
    })

    // Also listen for modal open events
    const handleModalOpen = () => {
      setTimeout(findAndHighlightElement, 100)
    }

    document.addEventListener('modal-opened', handleModalOpen)
    document.addEventListener('dialog-opened', handleModalOpen)

    return () => {
      observer.disconnect()
      document.removeEventListener('modal-opened', handleModalOpen)
      document.removeEventListener('dialog-opened', handleModalOpen)
    }
  }, [isActive, targetSelector, onElementFound])

  if (!highlightedElement || !isActive) return null

  return (
    <>
      {/* Enhanced glow effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: [0.2, 0.8, 0.2], 
          scale: [0.9, 1.15, 0.9] 
        }}
        transition={{ 
          duration: 2.5, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="fixed z-[200] rounded-xl pointer-events-none"
        style={{
          top: highlightedElement.getBoundingClientRect().top + window.pageYOffset - 25,
          left: highlightedElement.getBoundingClientRect().left + window.pageXOffset - 25,
          width: highlightedElement.getBoundingClientRect().width + 50,
          height: highlightedElement.getBoundingClientRect().height + 50,
          background: 'radial-gradient(circle, rgba(255, 140, 66, 0.4) 0%, rgba(255, 140, 66, 0.2) 40%, rgba(255, 140, 66, 0.05) 70%, transparent 100%)',
          border: '3px solid rgba(255, 140, 66, 0.6)',
          filter: 'blur(2px)'
        }}
      />
      
      {/* Main highlight border */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          boxShadow: [
            '0 0 0 4px rgba(255, 140, 66, 0.5), 0 0 30px rgba(255, 140, 66, 0.6), inset 0 0 20px rgba(255, 140, 66, 0.1)',
            '0 0 0 4px rgba(255, 140, 66, 0.7), 0 0 40px rgba(255, 140, 66, 0.8), inset 0 0 30px rgba(255, 140, 66, 0.15)',
            '0 0 0 4px rgba(255, 140, 66, 0.5), 0 0 30px rgba(255, 140, 66, 0.6), inset 0 0 20px rgba(255, 140, 66, 0.1)'
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="fixed z-[201] rounded-lg pointer-events-none"
        style={{
          top: highlightedElement.getBoundingClientRect().top + window.pageYOffset - 6,
          left: highlightedElement.getBoundingClientRect().left + window.pageXOffset - 6,
          width: highlightedElement.getBoundingClientRect().width + 12,
          height: highlightedElement.getBoundingClientRect().height + 12,
          border: '4px solid #ff8c42',
          background: 'rgba(255, 140, 66, 0.1)',
          backdropFilter: 'blur(1px)'
        }}
      />

      {/* Animated directional arrow */}
      <motion.div
        animate={{
          y: [0, -10, 0],
          opacity: [0.6, 1, 0.6],
          scale: [0.8, 1.2, 0.8]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="fixed z-[202] pointer-events-none"
        style={{
          top: highlightedElement.getBoundingClientRect().top + window.pageYOffset - 35,
          left: highlightedElement.getBoundingClientRect().left + window.pageXOffset + highlightedElement.getBoundingClientRect().width / 2 - 15,
        }}
      >
        <div className="w-6 h-6 bg-orange-500 rotate-45 transform border-2 border-white shadow-xl relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-1 bg-orange-300 rounded-sm"
          />
        </div>
      </motion.div>

      {/* Pulsing corner dots */}
      {[
        { top: -10, left: -10 },
        { top: -10, right: -10 },
        { bottom: -10, left: -10 },
        { bottom: -10, right: -10 }
      ].map((position, index) => (
        <motion.div
          key={index}
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0.5, 1.5, 0.5]
          }}
          transition={{ 
            duration: 1.8, 
            repeat: Infinity,
            delay: index * 0.2,
            ease: "easeInOut"
          }}
          className="fixed z-[202] w-3 h-3 pointer-events-none rounded-full"
          style={{
            top: position.top !== undefined 
              ? highlightedElement.getBoundingClientRect().top + window.pageYOffset + position.top
              : highlightedElement.getBoundingClientRect().bottom + window.pageYOffset + position.bottom!,
            left: position.left !== undefined
              ? highlightedElement.getBoundingClientRect().left + window.pageXOffset + position.left
              : highlightedElement.getBoundingClientRect().right + window.pageXOffset + position.right!,
            background: 'linear-gradient(45deg, #ff8c42, #ffa726, #ffb74d)',
            boxShadow: '0 0 12px rgba(255, 140, 66, 0.9), inset 0 0 6px rgba(255, 255, 255, 0.4)'
          }}
        />
      ))}
    </>
  )
}
