import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Feedback | OpenSportMap',
  description: 'Fehler melden, Ideen einreichen oder Feedback zur App geben – hilf uns, OpenSportMap zu verbessern.',
}

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return children
}
