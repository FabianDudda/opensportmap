'use client'

import { ArrowLeft } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

type FaqItem = {
  question: string
  answer: string
  bullets?: string[]
  link?: { href: string; label: string }
}

const FAQ: FaqItem[] = [
  {
    question: 'Wie füge ich einen Sportplatz hinzu?',
    answer: 'Tippe auf der Karte auf das „+"-Symbol, fülle das Formular aus und bestätige die Position auf der Karte. Bist du eingeloggt, wird dein Beitrag direkt deinem Profil zugeordnet. Als Gast wird er zunächst zur Prüfung eingereicht.',
  },
  {
    question: 'Wie bearbeite ich einen Sportplatz?',
    answer: 'Öffne einen Sportplatz und tippe auf „Bearbeiten". Deine Änderungen werden als Vorschlag eingereicht und nach Prüfung übernommen.',
  },
  {
    question: 'Wie melde ich einen Sportplatz?',
    answer: 'Öffne einen Sportplatz und tippe auf „Platz melden". Du kannst dann angeben, was nicht stimmt – z. B. falsche Informationen, geschlossener Platz oder unangemessene Inhalte. Die Meldung wird von einem Admin geprüft.',
  },
  {
    question: 'Brauche ich ein Konto?',
    answer: 'Nein. Du kannst die Karte ohne Konto nutzen, Sportplätze anschauen, Sportplätze hinzufügen und Bearbeitungen vorschlagen. Beiträge von Gästen werden jedoch erst nach Prüfung durch ein Admin freigeschaltet. Mit einem Konto werden deine Beiträge direkt deinem Profil zugeordnet und sind unter „Meine Beiträge" einsehbar.',
  },
  {
    question: 'Was bedeuten die Platztypen?',
    answer: 'Jeder Sportplatz ist einem von drei Typen zugeordnet:',
    bullets: [
      'Öffentlich – frei zugänglich, kann von jedem genutzt werden.',
      'Verein – gehört einem Verein, Nutzung ggf. nur für Mitglieder.',
      'Schule – auf einem Schulgelände, meist nur außerhalb der Schulzeiten zugänglich.',
    ],
  },
  {
    question: 'Welche Sportarten sind verfügbar?',
    answer: 'Aktuell unterstützt OpenSportMap folgende Sportarten:',
    bullets: [
      'Basketball', 'Badminton', 'Beachvolleyball', 'Boule', 'Calisthenics',
      'Fußball', 'Hockey', 'Laufen', 'Pickleball', 'Schwimmen',
      'Skatepark', 'Spikeball', 'Squash', 'Tennis', 'Tischtennis', 'Volleyball',
    ],
  },
  {
    question: 'Woher stammen die Daten?',
    answer: 'Die Daten stammen aus offiziellen Open-Data-Quellen verschiedener Städte (u. a. Bonn, Köln, Dormagen, Dortmund) sowie aus Beiträgen der Community. Alle Quellen und Lizenzen findest du auf der Seite „Daten".',
    link: { href: '/daten', label: 'Zur Daten-Übersicht' },
  },
]

export default function FaqPage() {
  return (
    <div className="container px-4 py-4 overflow-x-hidden">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Häufige Fragen</h1>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {FAQ.map((item, i) => (
            <AccordionItem key={item.question} value={`item-${i}`} className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium text-left hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                {item.bullets && (
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {item.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
                {item.link && (
                  <Link href={item.link.href} className="inline-block text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors">
                    {item.link.label}
                  </Link>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
