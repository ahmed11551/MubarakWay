import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { CampaignCreationForm } from "@/components/campaign-creation-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

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

          {/* Important Information Block */}
          <Alert className="bg-primary/10 border-primary/30 border-2">
            <Info className="h-5 w-5 text-primary" />
            <AlertDescription className="text-sm leading-relaxed space-y-3">
              <div>
                <p className="font-semibold text-primary mb-2">Важная информация</p>
                <p className="text-foreground">
                  Платформа MubarakWay предоставляет пользователям техническую возможность создавать кампании по сбору средств в пользу зарегистрированных благотворительных фондов партнеров, имеющих заключённый договор с Платформой. Все переводы совершаются напрямую на реквизиты фонда.
                </p>
              </div>
              <div className="w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full !whitespace-normal border-primary/30 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors py-2.5 min-h-[2.75rem] h-auto"
                  asChild
                >
                  <Link href="/funds" className="flex flex-wrap items-center justify-center gap-2 text-center px-3">
                    <span className="break-words leading-tight">Посмотреть фонды-партнёры в вашей стране</span>
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          <CampaignCreationForm />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
