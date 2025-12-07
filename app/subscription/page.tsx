// FSD widgets
import { AppHeader } from "@/widgets/header/ui/app-header"
import { BottomNav } from "@/widgets/navigation/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Crown, Star } from "lucide-react"
import Link from "next/link"

export default function SubscriptionPage() {
  const plans = [
    {
      name: "Муслим",
      subtitle: "Базовый",
      icon: Star,
      description: "Начните свой путь садака-джария",
      features: [
        "Доступ к базовым функциям",
        "История пожертвований",
        "Уведомления о кампаниях",
        "Поддержка сообщества",
      ],
      prices: [],
      charity: "Бесплатно",
      color: "muted",
      free: true,
    },
    {
      name: "Мутахсин",
      subtitle: "Pro",
      icon: Sparkles,
      description: "Для тех, кто стремится к большему",
      features: [
        "Все функции Базового",
        "Приоритетная поддержка",
        "Расширенная аналитика",
        "Эксклюзивный контент",
        "5% в благотворительность",
      ],
      prices: [
        { period: "1 месяц", price: 260, charity: 13 },
        { period: "3 месяца", price: 870, charity: 43.5 },
        {
          period: "6 месяцев",
          price: 1300,
          charity: 65,
          bonus: "+1 мес в подарок",
          discount: "Выгоднее на 16,7%",
        },
        {
          period: "12 месяцев",
          price: 2340,
          charity: 234,
          bonus: "+3 мес в подарок",
          discount: "Выгоднее на 25%",
        },
      ],
      charity: "5%",
      color: "accent",
      popular: true,
    },
    {
      name: "Сахиб аль-Вакф",
      subtitle: "Premium",
      icon: Crown,
      description: "Максимальный вклад в умму",
      features: [
        "Все функции Pro",
        "VIP поддержка 24/7",
        "Персональный менеджер",
        "Доступ к закрытым мероприятиям",
        "Именной сертификат",
        "10% в благотворительность",
      ],
      prices: [
        { period: "1 месяц", price: 550, charity: 55 },
        { period: "3 месяца", price: 1650, charity: 165 },
        {
          period: "6 месяцев",
          price: 2750,
          charity: 137.5,
          bonus: "+1 мес в подарок",
          discount: "Выгоднее на 16,7%",
        },
        {
          period: "12 месяцев",
          price: 4950,
          charity: 495,
          bonus: "+3 мес в подарок",
          discount: "Выгоднее на 25%",
        },
      ],
      charity: "10%",
      color: "primary",
      premium: true,
    },
  ]

  return (
    <div className="min-h-screen pb-20">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            <span>Садака-джария</span>
          </div>
          <h1 className="text-3xl font-bold text-balance">Садака-подписка</h1>
          <p className="text-muted-foreground text-balance leading-relaxed max-w-2xl mx-auto">
            Приобретая подписку, вы не совершаете покупку. Вы делаете садака-джария (непрерывную милостыню) на развитие
            глобального проекта, который несет пользу мусульманам по всему Миру.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <Card
                key={plan.name}
                className={`relative overflow-hidden border-2 ${
                  plan.popular
                    ? "border-accent shadow-xl shadow-accent/20 scale-105"
                    : plan.premium
                      ? "border-primary shadow-xl shadow-primary/20"
                      : "border-muted-foreground/20"
                } transition-all duration-200`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-accent via-accent to-accent" />
                )}
                {plan.premium && (
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                )}
                {plan.popular && (
                  <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">Популярный</Badge>
                )}
                {plan.premium && (
                  <Badge className="absolute top-4 right-4 bg-gradient-to-r from-primary to-accent text-primary-foreground border-0">
                    Premium
                  </Badge>
                )}
                <CardHeader>
                  <div
                    className={`h-12 w-12 rounded-xl ${plan.free ? "bg-muted" : `bg-${plan.color}/10`} flex items-center justify-center mb-3`}
                  >
                    <Icon className={`h-6 w-6 ${plan.free ? "text-muted-foreground" : `text-${plan.color}`}`} />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-sm font-semibold text-muted-foreground">{plan.subtitle}</p>
                  <CardDescription className="text-sm leading-relaxed pt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check
                          className={`h-5 w-5 ${plan.free ? "text-muted-foreground" : "text-primary"} shrink-0 mt-0.5`}
                        />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {plan.free ? (
                    <Button variant="outline" className="w-full bg-transparent" disabled>
                      Текущий тариф
                    </Button>
                  ) : (
                    <div className="space-y-2 pt-4 border-t">
                      <p className="text-sm font-semibold text-muted-foreground">Выберите период:</p>
                      {plan.prices.map((price, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          className={`w-full justify-between h-auto py-3 ${
                            price.discount ? "border-accent/40 bg-accent/5" : ""
                          }`}
                          asChild
                        >
                          <Link href={`/subscription/checkout?plan=${plan.name}&period=${price.period}`}>
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="font-semibold">{price.period}</span>
                              {price.bonus && <span className="text-xs text-accent font-medium">Подарок: {price.bonus}</span>}
                              {price.discount && (
                                <span className="text-xs text-green-600 font-medium">{price.discount}</span>
                              )}
                              <span className="text-xs text-muted-foreground">Садака-джария: {price.charity} ₽</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="font-bold text-lg">{price.price} ₽</span>
                            </div>
                          </Link>
                        </Button>
                      ))}
                    </div>
                  )}

                  {!plan.free && (
                    <div className="pt-2">
                      <Badge variant="secondary" className="w-full justify-center py-2">
                        {plan.charity} идёт в благотворительность
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="py-6">
            <div className="text-center space-y-3">
              <h3 className="font-semibold text-lg">Садака-подписка — ваша регулярная милостыня</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                В благодарность за вашу поддержку мы открываем для вас эксклюзивные возможности для духовного роста.
                Часть вашего взноса автоматически направляется в благотворительный фонд.
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground pt-2">
                <span>✓ Рекуррентное списание</span>
                <span>✓ Отмена в любое время</span>
                <span>✓ Прозрачная отчётность</span>
                <span>✓ Безопасные платежи</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  )
}
