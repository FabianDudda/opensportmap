import type { Metadata } from "next"
import { Suspense } from "react"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import QueryProvider from "@/components/providers/query-provider"
import AuthProvider from "@/components/providers/auth-provider"
import BottomNav from "@/components/layout/bottom-nav"
import { Toaster } from "@/components/ui/toaster"
import InstallButton from "@/components/install-button"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Court Sports - Find Courts, Play Matches, Track Rankings",
  description: "Discover sports courts, log matches, and track your Elo rankings across multiple sports",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <main className="flex-1 pb-16">{children}</main>
              <div className="fixed bottom-16 left-0 right-0 z-40 flex justify-center pb-2 pointer-events-none">
                <div className="pointer-events-auto">
                  <Suspense><InstallButton /></Suspense>
                </div>
              </div>
              <Suspense><BottomNav /></Suspense>
            </div>
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
