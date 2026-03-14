import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Was ist OpenSportMap?',
  description:
    'OpenSportMap ist eine kostenlose Community-App zum Entdecken, Hinzufügen und Speichern von Sportplätzen in deiner Nähe.',
  openGraph: {
    title: 'Was ist OpenSportMap?',
    description:
      'Entdecke Basketballplätze, Fußballfelder, Tischtennisplatten und viele weitere Sportanlagen – kostenlos und community-betrieben.',
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
