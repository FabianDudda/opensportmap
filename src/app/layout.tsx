import type { Metadata } from "next"
import { Suspense } from "react"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"
import QueryProvider from "@/components/providers/query-provider"
import AuthProvider from "@/components/providers/auth-provider"
import BottomNav from "@/components/layout/bottom-nav"
import { Toaster } from "@/components/ui/toaster"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "OpenSportMap - Kostenlose Sportplätze in deiner Nähe finden",
  description: "Finde kostenlose Sportplätze in deiner Nähe. Basketball, Fußball, Tennis, Calisthenics, Skateparks & mehr – über 1.600 Plätze in Deutschland.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://abminvrgugkbzgxvqxap.supabase.co" />
        <link rel="dns-prefetch" href="https://abminvrgugkbzgxvqxap.supabase.co" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <main className="flex-1 pb-16">{children}</main>
<Suspense><BottomNav /></Suspense>
            </div>
            <Toaster />
            <Analytics />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
