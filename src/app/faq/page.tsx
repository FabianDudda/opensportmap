'use client'

import { ArrowLeft, Map, Heart, Plus, Trophy, Github } from 'lucide-react'
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

        <Card>
          <CardContent className="p-4 text-sm space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              OpenSportMap ist eine Community-App, mit der du Sportplätze in deiner Nähe entdecken, speichern und selbst hinzufügen kannst.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Die Karte zeigt dir Basketballplätze, Fußballfelder, Tischtennisplatten, Skateparks und viele weitere Sportanlagen – alles an einem Ort.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold">Was du tun kannst</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Map className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Sportplätze entdecken</p>
                  <p className="text-muted-foreground">Durchsuche die Karte und finde Sportplätze in deiner Umgebung.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Heart className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Favoriten speichern</p>
                  <p className="text-muted-foreground">Markiere deine Lieblingsplätze und greife schnell darauf zu.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Plus className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Sportplätze hinzufügen</p>
                  <p className="text-muted-foreground">Trage fehlende Sportplätze ein und hilf anderen, sie zu finden.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Trophy className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Community aufbauen</p>
                  <p className="text-muted-foreground">Die App lebt von Beiträgen der Community – jeder kann mitmachen.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-sm space-y-2">
            <h2 className="font-semibold">Open Source & kostenlos</h2>
            <p className="text-muted-foreground leading-relaxed">
              OpenSportMap ist kostenlos und wird ohne kommerzielle Absichten betrieben. Daten werden nicht verkauft.
            </p>
            <a
              href="https://github.com/FabianDudda/opensportmap"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
              GitHub Repository
            </a>
          </CardContent>
        </Card>

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
