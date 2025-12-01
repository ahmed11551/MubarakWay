import Link from "next/link"
import { Button } from "@/components/ui/button"
// FSD widgets
import { AppHeader } from "@/widgets/header/ui/app-header"
import { BottomNav } from "@/widgets/navigation/ui/bottom-nav"

export default function NotFound() {
  return (
    <div className="min-h-screen pb-20">
      <AppHeader />
      <main className="max-w-lg mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
          <div className="h-px w-16 bg-muted-foreground mx-auto"></div>
          <p className="text-lg text-muted-foreground">Фонд не найден</p>
        </div>
        <p className="text-sm text-muted-foreground max-w-md">
          Запрашиваемый фонд не существует или был удалён.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/funds">Вернуться к фондам</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">На главную</Link>
          </Button>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}

