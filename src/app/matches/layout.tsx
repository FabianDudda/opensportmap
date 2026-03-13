import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Matches | OpenSportMap',
  description:
    'Trag dein Spielergebnis ein und lass das Elo-System deine Stärke berechnen. Match-Historie und Statistiken auf einen Blick.',
  openGraph: {
    title: 'Matches | OpenSportMap',
    description:
      'Spielergebnisse eintragen und Elo-Ranking verfolgen – auf OpenSportMap.',
  },
}

export default function MatchesLayout({ children }: { children: React.ReactNode }) {
  return children
}
