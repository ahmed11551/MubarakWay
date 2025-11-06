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
            <AlertDescription className="text-sm leading-relaxed">
              <p className="font-semibold text-primary mb-2">Важная информация</p>
              <p className="text-foreground mb-3">
                Платформа MubarakWay предоставляет пользователям техническую возможность создавать кампании по сбору средств в пользу зарегистрированных благотворительных фондов партнеров, имеющих заключённый договор с Платформой. Все переводы совершаются напрямую на реквизиты фонда.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                asChild
              >
                <Link href="/funds" className="flex items-center gap-2">
                  Посмотреть фонды-партнёры в вашей стране
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </AlertDescription>
          </Alert>

          <CampaignCreationForm />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
