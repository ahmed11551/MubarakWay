import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { ZakatCalculatorForm } from "@/components/zakat-calculator-form"

export default function ZakatCalculatorPage() {
  return (
    <div className="min-h-screen pb-20">
      <AppHeader />

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-balance">Калькулятор закята</h1>
            <p className="text-muted-foreground text-balance">
              Рассчитайте свою обязанность по закяту на основе исламских принципов
            </p>
          </div>

          <ZakatCalculatorForm />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
