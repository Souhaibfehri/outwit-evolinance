'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Crown, X, Clock } from 'lucide-react'

export function LifetimeOfferModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasShown, setHasShown] = useState(false)

  useEffect(() => {
    // Check if modal has been shown before
    const shown = localStorage.getItem('lifetime-offer-shown')
    if (shown) {
      setHasShown(true)
      return
    }

    // Show modal after 10 seconds
    const timer = setTimeout(() => {
      setIsOpen(true)
      setHasShown(true)
      localStorage.setItem('lifetime-offer-shown', 'true')
    }, 10000)

    // Show on exit intent
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown) {
        setIsOpen(true)
        setHasShown(true)
        localStorage.setItem('lifetime-offer-shown', 'true')
        clearTimeout(timer)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [hasShown])

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border border-gray-200/50 dark:bg-gray-900/95 dark:border-gray-800/50">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge className="bg-purple-600 text-white">
              <Sparkles className="mr-1 h-3 w-3" />
              Limited Time
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-center space-y-2">
            <Crown className="h-12 w-12 text-purple-600 mx-auto" />
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Lifetime Access for $49
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              Get permanent access to Outwit Budget with all future updates included. Limited time offer!
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Value Proposition */}
          <div className="bg-purple-50/50 dark:bg-purple-900/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Regular Yearly Price:</span>
              <span className="text-sm line-through text-gray-500">$39/year</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Over 5 years:</span>
              <span className="text-sm line-through text-gray-500">$195</span>
            </div>
            <div className="flex items-center justify-between border-t border-purple-200/50 dark:border-purple-800/50 pt-2">
              <span className="font-semibold text-gray-900 dark:text-white">Lifetime Price:</span>
              <span className="text-xl font-bold text-purple-600 dark:text-purple-400">$49</span>
            </div>
            <div className="text-center">
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                Save $146+ over 5 years
              </Badge>
            </div>
          </div>

          {/* Features */}
          <ul className="space-y-2">
            {[
              'Lifetime access to all features',
              'All future updates included',
              'No recurring payments ever',
              'Premium support for life',
              'Exclusive lifetime member benefits'
            ].map((feature, index) => (
              <li key={index} className="flex items-center space-x-2">
                <Crown className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="flex flex-col space-y-3">
            <Link href="/checkout?plan=lifetime" onClick={handleClose}>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                <Sparkles className="mr-2 h-4 w-4" />
                Get Lifetime Access - $49
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              onClick={handleClose}
              className="w-full text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Maybe Later
            </Button>
          </div>

          {/* Urgency */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Limited time offer • Regular price returns to $99</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
