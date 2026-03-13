import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Impressum | OpenSportMap',
  description: 'Impressum und rechtliche Angaben zu OpenSportMap.',
}

export default function ImpressumLayout({ children }: { children: React.ReactNode }) {
  return children
}
