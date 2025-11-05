import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { CampaignCreationForm } from "@/components/campaign-creation-form"

export default function NewCampaignPage() {
  return (
    <div className="min-h-screen pb-20">
      <AppHeader />

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-balance">Создать кампанию</h1>
            <p className="text-muted-foreground text-balance">
              Начните свою собственную кампанию по сбору средств для поддержки важного дела
            </p>
          </div>

          <CampaignCreationForm />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
