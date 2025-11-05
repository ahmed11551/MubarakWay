"use client"

import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Calculator, Sparkles, HandHeart, Users, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const urgentCampaigns = [
    {
      id: 1,
      title: "Срочная операция для ребёнка",
      description: "Требуется срочная операция на сердце",
      raised: 450000,
      goal: 800000,
      donors: 156,
      daysLeft: 3,
      image: "/children-medical-care.jpg",
      urgent: true,
    },
    {
      id: 2,
      title: "Помощь семье после пожара",
      description: "Семья из 6 человек осталась без крова",
      raised: 280000,
      goal: 500000,
      donors: 98,
      daysLeft: 5,
      image: "/charity-campaign-.jpg",
      urgent: true,
    },
    {
      id: 3,
      title: "Экстренная гуманитарная помощь",
      description: "Продукты и медикаменты для пострадавших",
      raised: 620000,
      goal: 1000000,
      donors: 234,
      daysLeft: 7,
      image: "/charity-campaign-.jpg",
      urgent: true,
    },
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % urgentCampaigns.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + urgentCampaigns.length) % urgentCampaigns.length)
  }

  return (
    <div className="min-h-screen pb-20">
      <AppHeader />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Срочные сборы
            </h3>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" onClick={prevSlide}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" onClick={nextSlide}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {urgentCampaigns.map((campaign) => (
                <div key={campaign.id} className="min-w-full">
                  <Card className="border-2 border-red-500/30 bg-gradient-to-br from-red-500/5 to-orange-500/5 overflow-hidden">
                    <div className="aspect-[16/9] relative overflow-hidden">
                      <img
                        src={campaign.image || "/placeholder.svg"}
                        alt={campaign.title}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                        {campaign.daysLeft} дней
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h4 className="text-white font-bold text-lg mb-1 line-clamp-1">{campaign.title}</h4>
                        <p className="text-white/90 text-sm line-clamp-1">{campaign.description}</p>
                      </div>
                    </div>
                    <CardContent className="pt-4 space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Собрано</span>
                          <span className="font-bold text-primary">{campaign.raised.toLocaleString("ru-RU")} ₽</span>
                        </div>
                        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                            style={{ width: `${(campaign.raised / campaign.goal) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{campaign.donors} жертвователей</span>
                          <span>Цель: {campaign.goal.toLocaleString("ru-RU")} ₽</span>
                        </div>
                      </div>
                      <Button className="w-full bg-red-500 hover:bg-red-600" asChild>
                        <Link href={`/campaigns/${campaign.id}`}>Помочь сейчас</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Индикаторы слайдов */}
          <div className="flex justify-center gap-2">
            {urgentCampaigns.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? "w-8 bg-primary" : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 border-2 border-primary/20 shadow-lg shadow-primary/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <CardHeader className="relative">
              <div className="flex items-center gap-2">
                <HandHeart className="h-5 w-5 text-primary" />
                <CardTitle className="text-primary">Быстрое пожертвование</CardTitle>
              </div>
              <CardDescription>Выберите сумму для пожертвования</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              <div className="grid grid-cols-3 gap-2">
                {[100, 250, 500, 1000, 2500, 5000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    className="h-14 font-bold text-base bg-card/80 hover:bg-primary/10 hover:border-primary/40 hover:scale-105 transition-all duration-200 shadow-sm"
                    asChild
                  >
                    <Link href={`/donate?amount=${amount}`}>{amount} ₽</Link>
                  </Button>
                ))}
              </div>
              <Button
                className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                size="lg"
                asChild
              >
                <Link href="/donate">Пожертвовать сейчас</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            Быстрые действия
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/subscription">
              <Card className="hover:bg-primary/5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer h-full border-2 group">
                <CardHeader className="pb-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-200">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-base">Садака-подписка</CardTitle>
                  <CardDescription className="text-xs">Регулярная милостыня</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/campaigns/new">
              <Card className="hover:bg-accent/5 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 transition-all duration-200 cursor-pointer h-full border-2 group">
                <CardHeader className="pb-3">
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-200">
                    <Heart className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle className="text-base">Создать кампанию</CardTitle>
                  <CardDescription className="text-xs">Запустите свой сбор</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/zakat-calculator">
              <Card className="hover:bg-primary/5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer h-full border-2 group">
                <CardHeader className="pb-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-200">
                    <Calculator className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-base">Калькулятор закята</CardTitle>
                  <CardDescription className="text-xs">Рассчитайте закят</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/funds">
              <Card className="hover:bg-accent/5 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 transition-all duration-200 cursor-pointer h-full border-2 group">
                <CardHeader className="pb-3">
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-200">
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle className="text-base">Фонды-партнёры</CardTitle>
                  <CardDescription className="text-xs">Проверенные фонды</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              Активные кампании
            </h3>
            <Button variant="link" className="text-primary font-semibold" asChild>
              <Link href="/campaigns">Все →</Link>
            </Button>
          </div>

          <div className="space-y-3">
            {[
              {
                title: "Строительство колодцев в сельских районах",
                description: "Обеспечение доступа к чистой воде",
                raised: 745000,
                goal: 1200000,
                donors: 245,
                image: "/water-well-construction.jpg",
              },
              {
                title: "Образование для детей из малоимущих семей",
                description: "Качественное образование для нуждающихся",
                raised: 890000,
                goal: 1000000,
                donors: 312,
                image: "/children-education.jpg",
              },
            ].map((campaign, i) => (
              <Card
                key={i}
                className="overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 border-2 hover:border-primary/30 group cursor-pointer"
                asChild
              >
                <Link href="/campaigns">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 relative overflow-hidden">
                    <img
                      src={campaign.image || "/placeholder.svg"}
                      alt={campaign.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">
                      {campaign.title}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-1">{campaign.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Собрано</span>
                        <span className="font-bold text-primary">{campaign.raised.toLocaleString("ru-RU")} ₽</span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                          style={{ width: `${(campaign.raised / campaign.goal) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        <span className="text-foreground font-bold">{campaign.donors}</span> жертвователей
                      </span>
                      <span className="px-2 py-1 rounded-md bg-accent/10 text-accent font-semibold">
                        {Math.round((campaign.raised / campaign.goal) * 100)}%
                      </span>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
