import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ – Häufige Fragen | OpenSportMap',
  description:
    'Alles über OpenSportMap: Wie füge ich einen Platz hinzu? Wie funktioniert das Elo-System? Antworten auf die häufigsten Fragen.',
  openGraph: {
    title: 'FAQ – Häufige Fragen | OpenSportMap',
    description:
      'Antworten auf die häufigsten Fragen zu OpenSportMap – Sportplätze finden, hinzufügen und bearbeiten.',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Wie füge ich einen Sportplatz hinzu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tippe auf der Karte auf das „+"-Symbol, fülle das Formular aus und bestätige die Position auf der Karte. Bist du eingeloggt, wird dein Beitrag direkt deinem Profil zugeordnet. Als Gast wird er zunächst zur Prüfung eingereicht.',
      },
    },
    {
      '@type': 'Question',
      name: 'Wie bearbeite ich einen Sportplatz?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Öffne einen Sportplatz und tippe auf „Bearbeiten". Deine Änderungen werden als Vorschlag eingereicht und nach Prüfung übernommen.',
      },
    },
    {
      '@type': 'Question',
      name: 'Wie melde ich einen Sportplatz?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Öffne einen Sportplatz und tippe auf „Platz melden". Du kannst dann angeben, was nicht stimmt – z. B. falsche Informationen, geschlossener Platz oder unangemessene Inhalte. Die Meldung wird von einem Admin geprüft.',
      },
    },
    {
      '@type': 'Question',
      name: 'Brauche ich ein Konto?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nein. Du kannst die Karte ohne Konto nutzen, Sportplätze anschauen, Sportplätze hinzufügen und Bearbeitungen vorschlagen. Beiträge von Gästen werden jedoch erst nach Prüfung durch ein Admin freigeschaltet. Mit einem Konto werden deine Beiträge direkt deinem Profil zugeordnet und sind unter „Meine Beiträge" einsehbar.',
      },
    },
    {
      '@type': 'Question',
      name: 'Was bedeuten die Platztypen?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Jeder Sportplatz ist einem von drei Typen zugeordnet: Öffentlich – frei zugänglich, kann von jedem genutzt werden. Verein – gehört einem Verein, Nutzung ggf. nur für Mitglieder. Schule – auf einem Schulgelände, meist nur außerhalb der Schulzeiten zugänglich.',
      },
    },
    {
      '@type': 'Question',
      name: 'Welche Sportarten sind verfügbar?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Aktuell unterstützt OpenSportMap folgende Sportarten: Basketball, Badminton, Beachvolleyball, Boule, Calisthenics, Fußball, Hockey, Laufen, Pickleball, Schwimmen, Skatepark, Spikeball, Squash, Tennis, Tischtennis, Volleyball.',
      },
    },
    {
      '@type': 'Question',
      name: 'Woher stammen die Daten?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Die Daten stammen aus offiziellen Open-Data-Quellen verschiedener Städte (u. a. Bonn, Köln, Dormagen, Dortmund) sowie aus Beiträgen der Community.',
      },
    },
  ],
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  )
}
