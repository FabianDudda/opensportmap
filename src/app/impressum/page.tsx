'use client'

import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default function ImpressumPage() {
  return (
    <div className="container px-4 py-4 overflow-x-hidden">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Impressum</h1>
        </div>

        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            <p>Placeholder text. Legal information will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
