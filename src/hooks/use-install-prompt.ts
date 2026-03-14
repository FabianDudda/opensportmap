'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    __installPrompt?: BeforeInstallPromptEvent
  }
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window === 'undefined') return null
    return window.__installPrompt ?? null
  })

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      window.__installPrompt = e as BeforeInstallPromptEvent
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const installedHandler = () => {
      window.__installPrompt = undefined
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    window.__installPrompt = undefined
    setDeferredPrompt(null)
  }

  return { canInstall: !!deferredPrompt, promptInstall }
}
