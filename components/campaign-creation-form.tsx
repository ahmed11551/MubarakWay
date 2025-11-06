"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Upload, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"

const CATEGORIES = [
  { value: "medical", label: "Медицина" },
  { value: "education", label: "Образование" },
  { value: "emergency", label: "Экстренная помощь" },
  { value: "family", label: "Поддержка семей" },
  { value: "community", label: "Сообщество" },
  { value: "other", label: "Другое" },
]

const CURRENCIES = ["RUB", "USD", "EUR"]

export function CampaignCreationForm() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [story, setStory] = useState("")
  const [goalAmount, setGoalAmount] = useState("")
  const [currency, setCurrency] = useState("RUB")
  const [category, setCategory] = useState("")
  const [deadline, setDeadline] = useState<Date>()
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFundId, setSelectedFundId] = useState<string>("")
  const [funds, setFunds] = useState<any[]>([])

  // Fetch funds on component mount
  useEffect(() => {
    async function loadFunds() {
      try {
        const response = await fetch("/api/funds")
        if (response.ok) {
          const data = await response.json()
          if (data.funds) {
            setFunds(data.funds)
          }
        }
      } catch (error) {
        console.error("Failed to load funds:", error)
      }
    }
    loadFunds()
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !description || !story || !goalAmount || !category || !selectedFundId) {
      alert("Пожалуйста, заполните все обязательные поля, включая выбор фонда-партнёра")
      return
    }

    setIsLoading(true)

    try {
      // TODO: Implement campaign creation with server action
      console.log("[v0] Campaign data:", {
        title,
        description,
        story,
        goalAmount: Number.parseFloat(goalAmount),
        currency,
        category,
        deadline,
        imagePreview,
        fundId: selectedFundId || undefined,
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      alert("Кампания успешно создана! Она будет проверена перед публикацией.")

      // Reset form
      setTitle("")
      setDescription("")
      setStory("")
      setGoalAmount("")
      setCategory("")
      setDeadline(undefined)
      setImagePreview(null)
      setSelectedFundId("")
    } catch (error) {
      console.error("[v0] Campaign creation error:", error)
      alert("Не удалось создать кампанию. Пожалуйста, попробуйте снова.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
          <CardDescription>Расскажите людям о вашей кампании</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название кампании *</Label>
            <Input
              id="title"
              placeholder="Например: Помощь в строительстве школы в сельской местности"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
            />
            <p className="text-xs text-muted-foreground">{title.length}/100</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Краткое описание *</Label>
            <Textarea
              id="description"
              placeholder="Краткое резюме вашей кампании (1-2 предложения)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={200}
              required
            />
            <p className="text-xs text-muted-foreground">{description.length}/200</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Категория *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Fund Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Выбор фонда-партнёра *</CardTitle>
          <CardDescription>
            Выберите фонд, в пользу которого будет проводиться сбор средств. Все переводы совершаются напрямую на реквизиты выбранного фонда.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fund">Фонд-партнёр *</Label>
            <Select value={selectedFundId} onValueChange={setSelectedFundId} required>
              <SelectTrigger>
                <SelectValue placeholder="Выберите фонд из списка партнёров" />
              </SelectTrigger>
              <SelectContent>
                {funds.length > 0 ? (
                  funds.map((fund) => (
                    <SelectItem key={fund.id} value={fund.id.toString()}>
                      {fund.name || fund.name_ru || `Фонд ${fund.id}`}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    Загрузка фондов...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Не нашли нужный фонд?{" "}
              <Link href="/funds" className="text-primary hover:underline">
                Посмотрите все фонды-партнёры
              </Link>
            </p>
          </div>
          {selectedFundId && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Важно:</strong> После создания кампании выбранный фонд подтвердит реквизиты для перевода средств. 
                На странице кампании появится кнопка «Пожертвовать», которая ведёт на форму с прямыми реквизитами фонда.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Story */}
      <Card>
        <CardHeader>
          <CardTitle>История кампании *</CardTitle>
          <CardDescription>Поделитесь полной историей вашей кампании</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Расскажите свою историю подробно. Почему эта кампания важна? Кому она поможет? Как будут использованы средства?"
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={8}
            maxLength={2000}
            required
          />
          <p className="text-xs text-muted-foreground mt-2">{story.length}/2000</p>
        </CardContent>
      </Card>

      {/* Funding Goal */}
      <Card>
        <CardHeader>
          <CardTitle>Цель сбора *</CardTitle>
          <CardDescription>Установите целевую сумму для сбора средств</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="goal-amount">Целевая сумма *</Label>
              <Input
                id="goal-amount"
                type="number"
                placeholder="10000"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                min="100"
                step="0.01"
                required
              />
            </div>
            <div className="w-24 space-y-2">
              <Label>Валюта</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr} value={curr}>
                      {curr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Срок кампании (необязательно)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !deadline && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "PPP") : "Без срока"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Image */}
      <Card>
        <CardHeader>
          <CardTitle>Изображение кампании</CardTitle>
          <CardDescription>Добавьте привлекательное изображение для вашей кампании</CardDescription>
        </CardHeader>
        <CardContent>
          {imagePreview ? (
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              <img
                src={imagePreview || "/placeholder.svg"}
                alt="Превью кампании"
                className="object-cover w-full h-full"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setImagePreview(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Нажмите для загрузки изображения</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Перед отправкой:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Ваша кампания будет проверена перед публикацией</li>
                <li>Убедитесь, что вся информация точна и правдива</li>
                <li>Вы сможете публиковать обновления после одобрения</li>
                <li>Средства будут переведены согласно нашим условиям</li>
              </ul>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? "Создание кампании..." : "Отправить на проверку"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
