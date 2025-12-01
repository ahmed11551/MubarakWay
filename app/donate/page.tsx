// FSD widgets
import { AppHeader } from "@/widgets/header/ui/app-header"
import { BottomNav } from "@/widgets/navigation/ui/bottom-nav"
// FSD features
import { DonationForm } from "@/features/make-donation/ui/donation-form"
import { Suspense } from "react"

export default function DonatePage() {
  return (
    <div className="min-h-screen pb-20">
      <AppHeader />

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-balance">Сделать пожертвование</h1>
            <p className="text-muted-foreground text-balance">Ваша щедрость действительно меняет жизни людей</p>
          </div>

          <Suspense fallback={<div>Загрузка...</div>}>
            <DonationForm />
          </Suspense>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
