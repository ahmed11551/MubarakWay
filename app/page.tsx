"use client"

import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Calculator, Sparkles, HandHeart, Users, ChevronLeft, ChevronRight, Target } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { QuickDonation } from "@/components/quick-donation"
import { QuickDonationBlock } from "@/components/quick-donation-block"
import { PlatformStats } from "@/components/platform-stats"
import { UltraQuickDonation } from "@/components/ultra-quick-donation"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { toast } from "sonner"
import { SkeletonCampaignCard } from "@/components/skeleton-campaign-card"
import { PrayerTimesPopup } from "@/components/prayer-times-popup"

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const autoplayRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartX = useRef<number | null>(null)
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([])
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true)

  // Fetch active campaigns from database
  useEffect(() => {
    async function fetchActiveCampaigns() {
      setIsLoadingCampaigns(true)
      try {
        const response = await fetch("/api/campaigns?status=active&limit=3")
        if (response.ok) {
          const data = await response.json()
          setActiveCampaigns(data.campaigns || [])
        } else {
          console.error("Failed to fetch campaigns:", response.status, response.statusText)
          // Не показываем toast при первой загрузке, чтобы не раздражать пользователя
          // Ошибка будет видна по отсутствию кампаний
        }
      } catch (error) {
        console.error("Failed to fetch active campaigns:", error)
        // Don't show toast on initial load errors to prevent client-side exceptions
        if (typeof window !== "undefined") {
          toast.error("Не удалось загрузить активные кампании")
        }
      } finally {
        setIsLoadingCampaigns(false)
      }
    }
    
    // Only fetch on client side
    if (typeof window !== "undefined") {
      fetchActiveCampaigns()
    }
  }, [])

  const urgentCampaigns = [
    {
      id: 1,
      title: "Срочная операция для ребёнка",
      description: "Требуется срочная операция на сердце",
      category: "healthcare",
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
      category: "emergency",
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
      category: "general",
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

  // Autoplay every 4 seconds
  useEffect(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current)
    autoplayRef.current = setInterval(() => nextSlide(), 4000)
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current)
    }
  }, [currentSlide])

  const handleRefresh = async () => {
    setIsLoadingCampaigns(true)
    try {
      const response = await fetch("/api/campaigns?status=active&limit=3")
      if (response.ok) {
        const data = await response.json()
        setActiveCampaigns(data.campaigns || [])
        toast.success("Обновлено")
      } else {
        toast.error("Не удалось загрузить кампании. Попробуйте позже.")
      }
    } catch (error) {
      console.error("Failed to refresh campaigns:", error)
      toast.error("Ошибка соединения. Проверьте интернет и попробуйте снова.")
    } finally {
      setIsLoadingCampaigns(false)
    }
  }

  return (
    <div className="min-h-screen pb-32">
      <AppHeader />

      <PullToRefresh onRefresh={handleRefresh}>
        <main className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-6">
        {/* Top hero text block reserved for message & UI */}
        <section className="space-y-3">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <HandHeart className="h-5 w-5 text-primary" />
                <CardTitle>Садака-пасс — Ваша регулярная милостыня</CardTitle>
              </div>
              <CardDescription>
                Сделайте садака-джария на развитие цифровой уммы и получите доступ к знаниям в благодарность
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Приобретая подписку, вы не только совершаете покупку. Вы делаете садака-джария (непрерывную милостыню) на
                развитие глобального проекта, который несет пользу мусульманам по всему Миру. В благодарность за вашу
                поддержку мы открываем для вас эксклюзивные возможности для духовного роста. Часть вашего взноса автоматически
                направляется в благотворительный фонд.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Quick Actions Section - moved to top */}
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

            <Link href="/campaigns">
              <Card className="hover:bg-primary/5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer h-full border-2 group col-span-2">
                <CardHeader className="pb-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-200">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-base">Целевая поддержка</CardTitle>
                  <CardDescription className="text-xs">Выберите конкретную кампанию для помощи</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </section>

        {/* Platform Statistics */}
        <section className="space-y-4">
          <PlatformStats />
        </section>

        {/* Ultra Quick Donation (3 clicks like Tooba) */}
        <section className="space-y-4">
          <UltraQuickDonation />
        </section>

        {/* Quick Donation Block */}
        <section className="space-y-4">
          <QuickDonationBlock />
        </section>

        {/* Urgent Campaigns Carousel */}
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

          {/* Urgent campaigns carousel (reduced height) */}
          <div
            className="relative overflow-hidden rounded-xl"
            onMouseEnter={() => {
              if (autoplayRef.current) clearInterval(autoplayRef.current)
            }}
            onMouseLeave={() => {
              autoplayRef.current = setInterval(() => nextSlide(), 4000)
            }}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX
            }}
            onTouchEnd={(e) => {
              if (touchStartX.current == null) return
              const dx = e.changedTouches[0].clientX - touchStartX.current
              if (Math.abs(dx) > 40) {
                dx < 0 ? nextSlide() : prevSlide()
              }
              touchStartX.current = null
            }}
          >
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {urgentCampaigns.map((campaign) => (
                <div key={campaign.id} className="min-w-full">
                  <Link href={`/campaigns/${campaign.id}`} className="block">
                    <Card className="border bg-gradient-to-br from-red-500/5 to-orange-500/5 overflow-hidden hover:shadow-lg hover:shadow-red-500/10 transition-all duration-200 cursor-pointer group">
                      {/* Reduce banner height from 16/9 to slimmer 16/7 */}
                      <div className="aspect-[16/7] relative overflow-hidden">
                        <Image
                          src={campaign.image || "/placeholder.svg"}
                          alt={campaign.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                          {campaign.daysLeft} дней
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3">
                          <h4 className="text-white font-bold text-base mb-0.5 line-clamp-1 group-hover:text-primary-foreground transition-colors">{campaign.title}</h4>
                          <p className="text-white/90 text-xs line-clamp-1">{campaign.description}</p>
                        </div>
                      </div>
                      <CardContent className="pt-3 space-y-2">
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
                        <div onClick={(e) => e.stopPropagation()}>
                          <QuickDonation
                            amount={500}
                            campaignId={campaign.id.toString()}
                            category={campaign.category}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
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


        {/* Active Campaigns Section */}
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
            {isLoadingCampaigns ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <p className="mt-2 text-sm">Загрузка кампаний...</p>
              </div>
            ) : activeCampaigns.length > 0 ? (
              activeCampaigns.map((campaign) => {
                const progress = campaign.goal_amount > 0 ? (campaign.current_amount / campaign.goal_amount) * 100 : 0
                return (
                  <Card
                    key={campaign.id}
                    className="overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 border-2 hover:border-primary/30 group cursor-pointer"
                    asChild
                  >
                    <Link href={`/campaigns/${campaign.id}`}>
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 relative overflow-hidden">
                        <Image
                          src={campaign.image_url || "/placeholder.svg"}
                          alt={campaign.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                            <span className="font-bold text-primary">
                              {Number(campaign.current_amount || 0).toLocaleString("ru-RU")} ₽
                            </span>
                          </div>
                          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            <span className="text-foreground font-bold">{campaign.donor_count || 0}</span> жертвователей
                          </span>
                          <span className="px-2 py-1 rounded-md bg-accent/10 text-accent font-semibold">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                )
              })
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>Активные кампании появятся здесь</p>
                  <p className="text-xs mt-2">Новые кампании будут отображаться автоматически</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
        </main>
      </PullToRefresh>

      <BottomNav />
    </div>
  )
}
