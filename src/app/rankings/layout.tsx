import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rankings – Elo-Bestenliste | OpenSportMap',
  description:
    'Sportart-spezifische Elo-Rankings für Tennis, Basketball, Volleyball & Co. Finde heraus, wer die beste Spielerin in deiner Stadt ist.',
  openGraph: {
    title: 'Rankings – Elo-Bestenliste | OpenSportMap',
    description:
      'Sportart-spezifische Elo-Rankings für Tennis, Basketball, Volleyball & Co.',
  },
}

export default function RankingsLayout({ children }: { children: React.ReactNode }) {
  return children
}
