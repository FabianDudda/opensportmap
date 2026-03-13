import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Karte – Sportplätze finden | OpenSportMap',
  description:
    'Interaktive Karte mit über 13.000 kostenlosen Sportplätzen in Deutschland. Filtere nach Basketball, Fußball, Tennis, Skateparks & mehr.',
  openGraph: {
    title: 'Karte – Sportplätze finden | OpenSportMap',
    description:
      'Interaktive Karte mit über 13.000 kostenlosen Sportplätzen in Deutschland.',
  },
}

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children
}
