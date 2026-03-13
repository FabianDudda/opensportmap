import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Datenquellen | OpenSportMap',
  description: 'Alle Datenquellen und Lizenzen, auf denen OpenSportMap basiert – Open Data aus deutschen Städten und Community-Beiträge.',
}

export default function DatenLayout({ children }: { children: React.ReactNode }) {
  return children
}
