"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Server Component error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Произошла ошибка</CardTitle>
          </div>
          <CardDescription>
            {process.env.NODE_ENV === "development"
              ? error.message || "Неизвестная ошибка"
              : "Произошла ошибка при загрузке страницы. Пожалуйста, попробуйте обновить страницу."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Пожалуйста, обновите страницу или попробуйте позже.
          </p>
          {process.env.NODE_ENV === "development" && error.digest && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs font-semibold mb-1">Error Digest:</p>
              <p className="text-xs text-muted-foreground font-mono break-all">{error.digest}</p>
            </div>
          )}
          {process.env.NODE_ENV === "development" && error.stack && (
            <details className="p-3 bg-muted rounded-md">
              <summary className="text-xs font-semibold cursor-pointer mb-2">Stack Trace</summary>
              <pre className="text-xs text-muted-foreground font-mono overflow-auto max-h-40">
                {error.stack}
              </pre>
            </details>
          )}
          <div className="flex gap-2">
            <Button
              onClick={() => {
                window.location.reload()
              }}
              className="flex-1"
            >
              Обновить страницу
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                reset()
              }}
              className="flex-1"
            >
              Попробовать снова
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

