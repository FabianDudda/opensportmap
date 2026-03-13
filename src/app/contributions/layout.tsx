import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meine Beiträge | OpenSportMap',
  description: 'Deine hinzugefügten Sportplätze und eingereichten Bearbeitungen auf einen Blick.',
}

export default function ContributionsLayout({ children }: { children: React.ReactNode }) {
  return children
}
