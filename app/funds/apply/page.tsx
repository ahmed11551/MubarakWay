"use client"

import type React from "react"

// FSD widgets
import { AppHeader } from "@/widgets/header/ui/app-header"
import { BottomNav } from "@/widgets/navigation/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function FundApplicationPage() {
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const formValues = {
      org_name: formData.get("name") as string,
      country_code: formData.get("country") as string,
      categories: formData.get("categories") ? [formData.get("categories") as string] : [],
      website: formData.get("website") as string,
      contact_name: formData.get("contact_name") as string || formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string || undefined,
      telegram_username: formData.get("telegram") as string || undefined,
      about: formData.get("description") as string || undefined,
    }

    try {
      const response = await fetch("/api/partners/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Ошибка при отправке заявки")
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить заявку. Попробуйте позже.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen pb-20">
        <AppHeader />
        <main className="max-w-2xl mx-auto px-4 py-12">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="pt-12 pb-12 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Заявка отправлена!</h2>
              <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                Спасибо за ваш интерес к партнёрству. Мы рассмотрим вашу заявку в течение 3-5 рабочих дней и свяжемся с
                вами по указанному email.
              </p>
              <Button asChild className="mt-6">
                <Link href="/funds">Вернуться к фондам</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <AppHeader />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/funds">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Заявка на партнёрство</h1>
            <p className="text-sm text-muted-foreground">Станьте партнёром MubarakWay</p>
          </div>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Информация об организации
            </CardTitle>
            <CardDescription>Заполните все обязательные поля, отмеченные звёздочкой (*)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Название организации <span className="text-red-500">*</span>
                </Label>
                <Input id="name" name="name" placeholder="Исламский благотворительный фонд" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">
                  Страна <span className="text-red-500">*</span>
                </Label>
                <Select name="country" required>
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Выберите страну" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RU">Россия</SelectItem>
                    <SelectItem value="KZ">Казахстан</SelectItem>
                    <SelectItem value="UZ">Узбекистан</SelectItem>
                    <SelectItem value="TR">Турция</SelectItem>
                    <SelectItem value="AE">ОАЭ</SelectItem>
                    <SelectItem value="SA">Саудовская Аравия</SelectItem>
                    <SelectItem value="OTHER">Другая</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">
                  Веб-сайт <span className="text-red-500">*</span>
                </Label>
                <Input id="website" name="website" type="url" placeholder="https://example.org" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_name">
                  Контактное лицо <span className="text-red-500">*</span>
                </Label>
                <Input id="contact_name" name="contact_name" placeholder="Иван Иванов" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email для связи <span className="text-red-500">*</span>
                </Label>
                <Input id="email" name="email" type="email" placeholder="info@example.org" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Телефон (опционально)</Label>
                <Input id="phone" name="phone" type="tel" placeholder="+7 999 123-45-67" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание деятельности</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Расскажите о вашей организации, её миссии и основных направлениях работы..."
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categories">Категории деятельности</Label>
                <Select name="categories">
                  <SelectTrigger id="categories">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="education">Образование</SelectItem>
                    <SelectItem value="healthcare">Здравоохранение</SelectItem>
                    <SelectItem value="water">Водоснабжение</SelectItem>
                    <SelectItem value="orphans">Помощь сиротам</SelectItem>
                    <SelectItem value="emergency">Экстренная помощь</SelectItem>
                    <SelectItem value="food">Продовольствие</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegram">Ник в Telegram (опционально)</Label>
                <Input id="telegram" name="telegram" placeholder="@username" />
              </div>

              <div className="pt-4 space-y-3">
                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? "Отправка..." : "Отправить заявку"}
                </Button>
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  Отправляя заявку, вы соглашаетесь с нашими условиями партнёрства и политикой конфиденциальности
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  )
}
