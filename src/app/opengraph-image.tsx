import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'OpenSportMap – Kostenlose Sportplätze in deiner Nähe'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#f8fafc',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* subtle grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            opacity: 0.5,
          }}
        />

        {/* card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            background: 'white',
            borderRadius: '24px',
            padding: '60px 80px',
            boxShadow: '0 4px 40px rgba(0,0,0,0.10)',
            position: 'relative',
          }}
        >
          {/* logo row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '52px' }}>📍</span>
            <span
              style={{
                fontSize: '52px',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-1px',
              }}
            >
              OpenSportMap
            </span>
          </div>

          {/* tagline */}
          <p
            style={{
              fontSize: '28px',
              color: '#475569',
              margin: 0,
              fontWeight: 400,
            }}
          >
            Kostenlose Sportplätze in deiner Nähe finden
          </p>

          {/* sports row */}
          <div style={{ display: 'flex', gap: '16px', fontSize: '40px' }}>
            <span>⚽</span>
            <span>🏀</span>
            <span>🎾</span>
            <span>🏐</span>
            <span>🛹</span>
            <span>🏓</span>
          </div>

          {/* badge */}
          <div
            style={{
              background: '#dcfce7',
              border: '1.5px solid #86efac',
              borderRadius: '999px',
              padding: '10px 28px',
              fontSize: '22px',
              fontWeight: 600,
              color: '#15803d',
            }}
          >
            13.000+ Plätze in Deutschland
          </div>
        </div>
      </div>
    ),
    size,
  )
}
