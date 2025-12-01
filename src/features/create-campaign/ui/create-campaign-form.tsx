/**
 * Create campaign feature (FSD features layer)
 */

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
import { CalendarIcon, Upload, X, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/shared/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { createCampaign } from "@/entities/campaign/api"
import { uploadImageFromBase64 } from "@/lib/actions/storage"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CampaignProjectLinker } from "@/components/campaign-project-linker"

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
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [story, setStory] = useState("")
  const [goalAmount, setGoalAmount] = useState("")
  const [currency, setCurrency] = useState("RUB")
  const [category, setCategory] = useState("")
  const [deadline, setDeadline] = useState<Date>()
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [selectedFundId, setSelectedFundId] = useState<string>("")
  const [funds, setFunds] = useState<any[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoadingFunds, setIsLoadingFunds] = useState(true)
  const [linkedProjectIds, setLinkedProjectIds] = useState<string[]>([])

  // Fetch funds on component mount (с кэшированием)
  useEffect(() => {
    async function loadFunds() {
      // Проверяем кэш
      const { cache } = await import("@/lib/cache")
      const cached = cache.get<any[]>("funds_cache")
      
      if (cached) {
        setFunds(cached)
        setIsLoadingFunds(false)
        return
      }

      setIsLoadingFunds(true)
      try {
        const response = await fetch("/api/funds")
        if (response.ok) {
          const data = await response.json()
          if (data.funds) {
            // Сохраняем в кэш на 5 минут
            const { cache } = await import("@/lib/cache")
            cache.set("funds_cache", data.funds, 5 * 60 * 1000)
            
            setFunds(data.funds)
          }
        }
      } catch (error) {
        console.error("Failed to load funds:", error)
        toast.error("Не удалось загрузить список фондов")
      } finally {
        setIsLoadingFunds(false)
      }
    }
    loadFunds()
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Пожалуйста, выберите изображение")
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error("Размер изображения не должен превышать 5 МБ")
      return
    }

    // Compress and preview image
    const reader = new FileReader()
    reader.onloadend = () => {
      const img = document.createElement("img")
      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement("canvas")
        const MAX_WIDTH = 1920
        const MAX_HEIGHT = 1080
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          // Convert to base64 with quality 0.8
          const compressed = canvas.toDataURL("image/jpeg", 0.8)
          setImagePreview(compressed)
          setImageFile(file)
        } else {
          // Fallback if canvas not available
          setImagePreview(reader.result as string)
          setImageFile(file)
        }
      }
      img.onerror = () => {
        toast.error("Ошибка при загрузке изображения")
      }
      img.src = reader.result as string
    }
    reader.onerror = () => {
      toast.error("Ошибка при чтении файла")
    }
    reader.readAsDataURL(file)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate title
    if (!title.trim()) {
      newErrors.title = "Название кампании обязательно"
    } else if (title.trim().length > 100) {
      newErrors.title = "Название не должно превышать 100 символов"
    }

    // Validate description
    if (!description.trim()) {
      newErrors.description = "Описание обязательно"
    } else if (description.trim().length > 200) {
      newErrors.description = "Описание не должно превышать 200 символов"
    }

    // Validate story
    if (!story.trim()) {
      newErrors.story = "История кампании обязательна"
    } else if (story.trim().length > 2000) {
      newErrors.story = "История не должна превышать 2000 символов"
    }

    // Validate goal amount
    const parsedAmount = Number.parseFloat(goalAmount)
    if (!goalAmount || isNaN(parsedAmount)) {
      newErrors.goalAmount = "Укажите корректную сумму цели"
    } else if (parsedAmount <= 0) {
      newErrors.goalAmount = "Сумма должна быть положительным числом"
    } else if (parsedAmount > 1000000000) {
      newErrors.goalAmount = "Максимальная сумма цели: 1 000 000 000"
    } else if (goalAmount.includes('.') && goalAmount.split('.')[1]?.length > 2) {
      newErrors.goalAmount = "Сумма не должна содержать более 2 знаков после запятой"
    }

    // Validate category
    if (!category) {
      newErrors.category = "Выберите категорию"
    }

    // Validate fund
    if (!selectedFundId) {
      newErrors.fundId = "Выберите фонд-партнёр"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Пожалуйста, заполните все обязательные поля")
      return
    }

    setIsLoading(true)

    try {
      // Upload image if provided
      let imageUrl: string | undefined = undefined
      if (imagePreview && imageFile) {
        setIsUploadingImage(true)
        const uploadResult = await uploadImageFromBase64(imagePreview, imageFile.name)
        setIsUploadingImage(false)
        
        if ("error" in uploadResult) {
          toast.error(uploadResult.error)
          setIsLoading(false)
          return
        }
        imageUrl = uploadResult.url
      }

      const result = await createCampaign({
        title: title.trim(),
        description: description.trim(),
        story: story.trim(),
        goalAmount: Number.parseFloat(goalAmount),
        currency,
        category: category as any,
        deadline: deadline || undefined,
        imageUrl,
        fundId: selectedFundId || undefined,
        linkedProjectIds: linkedProjectIds.length > 0 ? linkedProjectIds : undefined,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Кампания успешно создана! Она будет проверена перед публикацией.")
      
      // Reset form
      setTitle("")
      setDescription("")
      setStory("")
      setGoalAmount("")
      setCategory("")
      setDeadline(undefined)
      setImagePreview(null)
      setImageFile(null)
      setSelectedFundId("")
      setLinkedProjectIds([])
      setErrors({})

      // Redirect to campaigns page after a short delay
      setTimeout(() => {
        router.push("/campaigns")
      }, 1500)
    } catch (error) {
      console.error("Campaign creation error:", error)
      toast.error("Не удалось создать кампанию. Пожалуйста, попробуйте снова.")
    } finally {
      setIsLoading(false)
      setIsUploadingImage(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cancel Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading || isUploadingImage}
        >
          Отмена
        </Button>
      </div>
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
              onChange={(e) => {
                setTitle(e.target.value)
                if (errors.title) setErrors({ ...errors, title: "" })
              }}
              maxLength={100}
              required
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            <p className="text-xs text-muted-foreground">{title.length}/100</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Краткое описание *</Label>
            <Textarea
              id="description"
              placeholder="Краткое резюме вашей кампании (1-2 предложения)"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (errors.description) setErrors({ ...errors, description: "" })
              }}
              rows={2}
              maxLength={200}
              required
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            <p className="text-xs text-muted-foreground">{description.length}/200</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Категория *</Label>
            <Select 
              value={category} 
              onValueChange={(value) => {
                setCategory(value)
                if (errors.category) setErrors({ ...errors, category: "" })
              }} 
              required
            >
              <SelectTrigger className={errors.category ? "border-destructive" : ""}>
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
            {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
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
            <Select 
              value={selectedFundId} 
              onValueChange={(value) => {
                setSelectedFundId(value)
                if (errors.fundId) setErrors({ ...errors, fundId: "" })
              }} 
              required
              disabled={isLoadingFunds}
            >
              <SelectTrigger className={errors.fundId ? "border-destructive" : ""}>
                <SelectValue placeholder={isLoadingFunds ? "Загрузка фондов..." : "Выберите фонд из списка партнёров"} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingFunds ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Загрузка...
                    </div>
                  </SelectItem>
                ) : funds.length > 0 ? (
                  funds.map((fund) => (
                    <SelectItem key={fund.id} value={fund.id.toString()}>
                      {fund.name || fund.name_ru || `Фонд ${fund.id}`}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="not-found" disabled>
                    Фонды не найдены
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.fundId && <p className="text-xs text-destructive">{errors.fundId}</p>}
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

      {/* Link To Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Link To Projects</CardTitle>
          <CardDescription>
            Свяжите вашу кампанию с другими активными проектами
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignProjectLinker
            selectedProjectIds={linkedProjectIds}
            onProjectsChange={setLinkedProjectIds}
          />
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
            onChange={(e) => {
              setStory(e.target.value)
              if (errors.story) setErrors({ ...errors, story: "" })
            }}
            rows={8}
            maxLength={2000}
            required
            className={errors.story ? "border-destructive" : ""}
          />
          {errors.story && <p className="text-xs text-destructive mt-1">{errors.story}</p>}
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
                onChange={(e) => {
                  setGoalAmount(e.target.value)
                  if (errors.goalAmount) setErrors({ ...errors, goalAmount: "" })
                }}
                min="100"
                step="0.01"
                required
                className={errors.goalAmount ? "border-destructive" : ""}
              />
              {errors.goalAmount && <p className="text-xs text-destructive">{errors.goalAmount}</p>}
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
              <Image
                src={imagePreview || "/placeholder.svg"}
                alt="Превью кампании"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 z-10"
                onClick={() => {
                  setImagePreview(null)
                  setImageFile(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              {imageFile && (
                <div className="absolute bottom-2 left-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                  {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} МБ)
                </div>
              )}
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
            <Button type="submit" size="lg" className="w-full" disabled={isLoading || isUploadingImage}>
              {isUploadingImage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка изображения...
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание кампании...
                </>
              ) : (
                "Отправить на проверку"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

