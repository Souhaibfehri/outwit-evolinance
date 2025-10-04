import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #ff8c42 0%, #f97316 50%, #ea580c 100%)',
          borderRadius: '22%',
        }}
      >
        {/* Fox head shape - larger for Apple icon */}
        <div
          style={{
            width: '140px',
            height: '140px',
            background: 'linear-gradient(135deg, #ff8c42 0%, #f97316 100%)',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.3), inset 0 -8px 16px rgba(0,0,0,0.2)',
          }}
        >
          {/* Fox ears */}
          <div
            style={{
              position: 'absolute',
              top: '-15px',
              left: '20px',
              width: '30px',
              height: '45px',
              background: 'linear-gradient(135deg, #ff8c42 0%, #f97316 100%)',
              borderRadius: '50% 10% 50% 10%',
              transform: 'rotate(-20deg)',
              boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.3)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '-15px',
              right: '20px',
              width: '30px',
              height: '45px',
              background: 'linear-gradient(135deg, #ff8c42 0%, #f97316 100%)',
              borderRadius: '10% 50% 10% 50%',
              transform: 'rotate(20deg)',
              boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.3)',
            }}
          />
          
          {/* Inner ear details */}
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              left: '28px',
              width: '12px',
              height: '20px',
              background: 'linear-gradient(135deg, #ffa726 0%, #ff8c42 100%)',
              borderRadius: '50% 10% 50% 10%',
              transform: 'rotate(-20deg)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              right: '28px',
              width: '12px',
              height: '20px',
              background: 'linear-gradient(135deg, #ffa726 0%, #ff8c42 100%)',
              borderRadius: '10% 50% 10% 50%',
              transform: 'rotate(20deg)',
            }}
          />

          {/* Fox eyes */}
          <div
            style={{
              position: 'absolute',
              top: '45px',
              left: '45px',
              width: '8px',
              height: '12px',
              background: '#1f2937',
              borderRadius: '50%',
              transform: 'rotate(-10deg)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '45px',
              right: '45px',
              width: '8px',
              height: '12px',
              background: '#1f2937',
              borderRadius: '50%',
              transform: 'rotate(10deg)',
            }}
          />

          {/* Fox nose */}
          <div
            style={{
              position: 'absolute',
              top: '65px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '6px',
              height: '6px',
              background: '#1f2937',
              borderRadius: '50%',
            }}
          />

          {/* Dollar sign overlay */}
          <div
            style={{
              position: 'absolute',
              top: '75px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              fontSize: '32px',
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0,0,0,0.4)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            $
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
