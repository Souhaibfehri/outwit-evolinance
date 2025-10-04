import React from 'react'

interface OutwitLogoProps {
  size?: number
  className?: string
  showText?: boolean
}

export function OutwitLogo({ size = 40, className = '', showText = true }: OutwitLogoProps) {
  const uniqueId = React.useId()
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Fox Logo SVG */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg 
          viewBox="0 0 120 120" 
          className="w-full h-full"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
        >
          <defs>
            {/* Orange gradient for fox body */}
            <linearGradient id={`foxBody-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff8c42" />
              <stop offset="50%" stopColor="#ff7b2a" />
              <stop offset="100%" stopColor="#ff6b1a" />
            </linearGradient>
            
            {/* Blue gradient for ears and features */}
            <linearGradient id={`foxBlue-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            
            {/* Green gradient for dollar sign */}
            <linearGradient id={`dollarGreen-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
          </defs>
          
          {/* Fox ears - pointed and alert */}
          <path 
            d="M35 45 L25 20 L45 35 Q40 40 35 45 Z" 
            fill={`url(#foxBlue-${uniqueId})`}
          />
          <path 
            d="M85 45 L95 20 L75 35 Q80 40 85 45 Z" 
            fill={`url(#foxBlue-${uniqueId})`}
          />
          
          {/* Inner ear details */}
          <path 
            d="M32 35 L28 25 L38 32 Q35 35 32 35 Z" 
            fill="#1e40af"
          />
          <path 
            d="M88 35 L92 25 L82 32 Q85 35 88 35 Z" 
            fill="#1e40af"
          />
          
          {/* Fox head - main circle */}
          <circle 
            cx="60" 
            cy="65" 
            r="28" 
            fill={`url(#foxBody-${uniqueId})`}
          />
          
          {/* Fox snout */}
          <ellipse 
            cx="60" 
            cy="75" 
            rx="12" 
            ry="8" 
            fill="#ff6b1a"
          />
          
          {/* Fox eyes - clever and alert */}
          <path 
            d="M48 58 Q52 52 56 58 Q52 62 48 58 Z" 
            fill="#1e40af"
          />
          <path 
            d="M64 58 Q68 52 72 58 Q68 62 64 58 Z" 
            fill="#1e40af"
          />
          
          {/* Eye highlights */}
          <circle cx="50" cy="57" r="2" fill="white" />
          <circle cx="70" cy="57" r="2" fill="white" />
          
          {/* Fox nose */}
          <ellipse cx="60" cy="72" rx="2" ry="1.5" fill="#1e40af" />
          
          {/* Fox mouth - subtle smile */}
          <path 
            d="M60 75 Q56 78 52 76 M60 75 Q64 78 68 76" 
            stroke="#1e40af" 
            strokeWidth="1.5" 
            fill="none" 
            strokeLinecap="round"
          />
          
          {/* Dollar sign on top - representing financial cleverness */}
          <g transform="translate(60, 15)">
            <path 
              d="M0 0 L0 20 M-6 5 Q0 2 6 5 Q0 8 -6 11 Q0 14 6 17" 
              stroke={`url(#dollarGreen-${uniqueId})`} 
              strokeWidth="3" 
              fill="none" 
              strokeLinecap="round"
            />
            {/* Dollar sign glow effect */}
            <path 
              d="M0 0 L0 20 M-6 5 Q0 2 6 5 Q0 8 -6 11 Q0 14 6 17" 
              stroke="#22c55e" 
              strokeWidth="1" 
              fill="none" 
              strokeLinecap="round"
              opacity="0.6"
            />
          </g>
          
          {/* Subtle shadow */}
          <ellipse 
            cx="60" 
            cy="95" 
            rx="25" 
            ry="3" 
            fill="rgba(0,0,0,0.1)"
          />
        </svg>
      </div>
      
      {/* Brand Text */}
      {showText && (
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Outwit <span className="text-orange-500">Budget</span>
          </h1>
        </div>
      )}
    </div>
  )
}
