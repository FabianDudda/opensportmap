'use client'

import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

const CHANGELOG = [
  {
    version: '0.2.0-alpha',
    date: '13.03.2026',
    current: true,
    items: [
      'Added place type (Public / Club / School) with filter support on the map',
      'Guests can now add places and suggest edits – without an account, subject to admin approval',
      'fix Leaflet map control memory leak (stable DOM refs + mutation updates)',
    ],
  },
  {
    version: '0.1.4-alpha',
    date: '12.03.2026',
    current: false,
    items: [
      'Increased cluster radius from 50px to 100px for fewer, larger clusters  ',
      'Clusters now persist one zoom level deeper before expanding to individual pins  ',
      'Added place reporting: users (guests & logged in) can flag a place via a "Platz melden" sheet, with reports visible to admins ',
      'Added a "Daten" page listing all imported open data sources with links and licenses',
    ],
  },
  {
    version: '0.1.3-alpha',
    date: '11.03.2026',
    current: false,
    items: [
      'Split marker data from full place details — map now loads ~10× less data',
      'Place details (courts, images, address) fetched on demand when opening a place',
      'Skeleton loader shown while place details load',
      'Sport filter no longer triggers full marker rebuild — only updates icons in place',
      'Map marker data cached in localStorage for 30 min — instant load on revisit',
      'Added DB indexes for approved places query',
    ],
  },
  {
    version: '0.1.2-alpha',
    date: '10.03.2026',
    current: false,
    items: [
      'When user opens the add-place page, use current map section for better user experience',
      'Fix position for place-count, osm-contribution and location-button on map component',
      'Add satellite map layer',
      'Add icon for sport "Calisthenics"',
      'Open place images fullscreen',
      'Add sport types: Running & Swimming',
    ],
  },
  {
    version: '0.1.1-alpha',
    date: '09.03.2026',
    current: false,
    items: [
      'Improved metadata for better SEO',
      'Add robots.txt for better SEO',
      'Add sitemap for better SEO',
      'JSON-LD on place pages for better SEO',
      'Preconnect Supabase for better performance',
    ],
  },
  {
    version: '0.1.0-alpha',
    date: '08.03.2026',
    current: false,
    items: [
      'Initial release',
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div className="container px-4 py-4 overflow-x-hidden">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Changelog</h1>
        </div>

        {CHANGELOG.map((release) => (
          <Card key={release.version}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-base">{release.version}</h2>
                {release.current && (
                  <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                    Current
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-auto">{release.date}</span>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {release.items.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
