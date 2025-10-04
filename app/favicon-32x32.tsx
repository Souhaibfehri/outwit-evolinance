import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Favicon32() {
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
        {/* Fox head matching your logo */}
        <div
          style={{
            width: '28px',
            height: '24px',
            background: 'linear-gradient(135deg, #ff8c42 0%, #f97316 100%)',
            borderRadius: '50% 50% 50% 50% / 70% 70% 30% 30%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Fox ears - blue like your logo */}
          <div
            style={{
              position: 'absolute',
              top: '-6px',
              left: '6px',
              width: '6px',
              height: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '50% 10% 50% 10%',
              transform: 'rotate(-25deg)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '-6px',
              right: '6px',
              width: '6px',
              height: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '10% 50% 10% 50%',
              transform: 'rotate(25deg)',
            }}
          />
          
          {/* Fox snout - dark bottom like your logo */}
          <div
            style={{
              position: 'absolute',
              bottom: '-3px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '14px',
              height: '6px',
              background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
              borderRadius: '50% 50% 50% 50% / 30% 30% 70% 70%',
            }}
          />

          {/* Dollar sign with upward arrow */}
          <div
            style={{
              position: 'absolute',
              top: '2px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#22c55e',
              fontSize: '12px',
              fontWeight: 'bold',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            $↑
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
