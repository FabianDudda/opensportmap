import { ImageResponse } from 'next/og'
import { database } from '@/lib/supabase/database'
import { sportNames, sportIcons } from '@/lib/utils/sport-utils'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface Props {
  params: Promise<{ id: string }>
}

export default async function Image({ params }: Props) {
  const { id } = await params

  let place = null
  try {
    place = await database.courts.getCourt(id)
  } catch {
    // fall through to placeholder
  }

  const placeName = place?.name ?? 'Sports Court'
  const imageUrl = place?.image_url ?? null

  const availableSports = place?.courts && place.courts.length > 0
    ? [...new Set(place.courts.map((c) => c.sport))]
    : (place?.sports ?? [])

  const sportsDisplay = availableSports.slice(0, 4).map((s) => `${sportIcons[s] ?? '📍'} ${sportNames[s] ?? s}`)

  const addressParts = [
    place?.street && place?.house_number
      ? `${place.street} ${place.house_number}`
      : place?.street,
    place?.city,
  ].filter(Boolean)
  const address = addressParts.join(', ')

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          position: 'relative',
          fontFamily: 'sans-serif',
          backgroundColor: '#000000',
          overflow: 'hidden',
        }}
      >
        {/* Background image if available */}
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.35,
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: imageUrl
              ? 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.8) 100%)'
              : 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
          }}
        />

        {/* Decorative circle accent */}
        {!imageUrl && (
          <div
            style={{
              position: 'absolute',
              right: -80,
              top: -80,
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
        )}

        {/* Content */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '56px 72px',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Top: Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              📍
            </div>
            <span style={{ color: '#94a3b8', fontSize: 18, fontWeight: 500 }}>
              OpenSportMap
            </span>
          </div>

          {/* Middle: Place name + address */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                fontSize: placeName.length > 30 ? 48 : 60,
                fontWeight: 800,
                color: '#f8fafc',
                lineHeight: 1.1,
                letterSpacing: '-1px',
              }}
            >
              {placeName}
            </div>
            {address && (
              <div style={{ fontSize: 22, color: '#94a3b8', display: 'flex', gap: 8 }}>
                <span>📍</span>
                <span>{address}</span>
              </div>
            )}
          </div>

          {/* Bottom: Sports tags */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {sportsDisplay.length > 0 ? (
              sportsDisplay.map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 999,
                    background: 'rgba(59,130,246,0.2)',
                    border: '1px solid rgba(59,130,246,0.4)',
                    color: '#93c5fd',
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  {s}
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: '8px 16px',
                  borderRadius: 999,
                  background: 'rgba(59,130,246,0.2)',
                  border: '1px solid rgba(59,130,246,0.4)',
                  color: '#93c5fd',
                  fontSize: 18,
                }}
              >
                🏟️ Sports Venue
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
