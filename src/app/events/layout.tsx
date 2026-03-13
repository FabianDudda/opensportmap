import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Events | OpenSportMap',
  description: 'Sportevents in deiner Nähe entdecken und selbst organisieren – auf OpenSportMap.',
  openGraph: {
    title: 'Events | OpenSportMap',
    description: 'Sportevents in deiner Nähe entdecken und selbst organisieren.',
  },
}

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children
}
