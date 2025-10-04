'use client'

import { ReactNode } from 'react'
import { Info, ExternalLink } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

interface InfoPopoverProps {
  title: string
  children: ReactNode
  learnMoreLink?: string
  learnMoreText?: string
  className?: string
}

export function InfoPopover({ 
  title, 
  children, 
  learnMoreLink, 
  learnMoreText = "Learn more",
  className = "" 
}: InfoPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-5 w-5 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 ${className}`}
        >
          <Info className="h-3 w-3" />
          <span className="sr-only">More information about {title}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="top" align="start">
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {children}
          </div>
          {learnMoreLink && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-blue-600 dark:text-blue-400"
              asChild
            >
              <a 
                href={learnMoreLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1"
              >
                <span>{learnMoreText}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
