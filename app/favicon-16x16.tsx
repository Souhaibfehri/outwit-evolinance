import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 16, height: 16 }
export const contentType = 'image/png'

export default function Favicon16() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        {/* Simplified fox for 16x16 */}
        <div
          style={{
            width: '14px',
            height: '12px',
            background: 'linear-gradient(135deg, #ff8c42 0%, #f97316 100%)',
            borderRadius: '50% 50% 50% 50% / 70% 70% 30% 30%',
            position: 'relative',
          }}
        >
          {/* Simple ears */}
          <div
            style={{
              position: 'absolute',
              top: '-3px',
              left: '2px',
              width: '3px',
              height: '6px',
              background: '#3b82f6',
              borderRadius: '50%',
              transform: 'rotate(-25deg)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '-3px',
              right: '2px',
              width: '3px',
              height: '6px',
              background: '#3b82f6',
              borderRadius: '50%',
              transform: 'rotate(25deg)',
            }}
          />
          
          {/* Simple dollar sign */}
          <div
            style={{
              position: 'absolute',
              top: '1px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#22c55e',
              fontSize: '8px',
              fontWeight: 'bold',
              fontFamily: 'system-ui',
            }}
          >
            $
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
