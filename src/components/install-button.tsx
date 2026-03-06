"use client"

import { useEffect, useState } from "react"
import { Download, Share } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isIos() {
  if (typeof navigator === "undefined") return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(display-mode: standalone)").matches
}

export default function InstallButton() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosSheet, setShowIosSheet] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }

    // Already installed as standalone
    if (isInStandaloneMode()) {
      setInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", handler)

    window.addEventListener("appinstalled", () => {
      setInstalled(true)
      setInstallEvent(null)
    })

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome === "accepted") {
      setInstallEvent(null)
    }
  }

  // Don't show anything if already installed
  if (installed) return null

  // iOS: show a button that opens instructions
  if (isIos()) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setShowIosSheet(true)}>
          <Download className="mr-2 h-4 w-4" />
          Install App
        </Button>

        <Sheet open={showIosSheet} onOpenChange={setShowIosSheet}>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Install Court Sports</SheetTitle>
              <SheetDescription>
                Add this app to your home screen for the best experience.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-medium">1</span>
                <span>
                  Tap the{" "}
                  <Share className="inline h-4 w-4" />{" "}
                  <strong>Share</strong> button in Safari&apos;s toolbar
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-medium">2</span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-medium">3</span>
                <span>Tap <strong>Add</strong> to confirm</span>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Android / Desktop Chrome: native prompt available
  if (!installEvent) return null

  return (
    <Button variant="outline" size="sm" onClick={handleInstall}>
      <Download className="mr-2 h-4 w-4" />
      Install App
    </Button>
  )
}
