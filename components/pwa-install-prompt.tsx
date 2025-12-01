"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    // Check if running on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = ("standalone" in window.navigator && (window.navigator as any).standalone) || false

    if (isIOS && !isInStandaloneMode) {
      // Show iOS install instructions
      setShowPrompt(true)
    }

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Check if app was just installed
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // iOS - show instructions
      return
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt()

      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        console.log("User accepted the install prompt")
      } else {
        console.log("User dismissed the install prompt")
      }

      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error("Error showing install prompt:", error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for this session
    sessionStorage.setItem("pwa-prompt-dismissed", "true")
  }

  // Don't show if already installed or dismissed
  if (isInstalled || !showPrompt || sessionStorage.getItem("pwa-prompt-dismissed")) {
    return null
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Установить MubarakWay</DialogTitle>
          <DialogDescription>
            {isIOS
              ? "Добавьте MubarakWay на главный экран для быстрого доступа"
              : "Установите MubarakWay как приложение для лучшего опыта"}
          </DialogDescription>
        </DialogHeader>

        {isIOS ? (
          <div className="space-y-4 py-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Нажмите кнопку "Поделиться" внизу экрана</li>
              <li>Выберите "На экран «Домой»"</li>
              <li>Нажмите "Добавить"</li>
            </ol>
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-1">Преимущества установки:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Быстрый доступ к приложению</li>
                <li>Работа в полноэкранном режиме</li>
                <li>Офлайн доступ к основным функциям</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">Преимущества установки:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Быстрый доступ к приложению</li>
                <li>Работа в полноэкранном режиме</li>
                <li>Офлайн доступ к основным функциям</li>
                <li>Уведомления о новых кампаниях</li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDismiss} className="w-full sm:w-auto">
            <X className="h-4 w-4 mr-2" />
            Позже
          </Button>
          {!isIOS && deferredPrompt && (
            <Button onClick={handleInstallClick} className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Установить
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

