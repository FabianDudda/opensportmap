import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profil | OpenSportMap',
  description: 'Dein OpenSportMap-Profil: Beiträge, Elo-Rankings, Match-Historie und Einstellungen.',
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
