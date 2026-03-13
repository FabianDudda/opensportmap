import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Changelog | OpenSportMap',
  description: 'Neue Funktionen, Verbesserungen und Fehlerbehebungen – alle Updates zu OpenSportMap im Überblick.',
}

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return children
}
