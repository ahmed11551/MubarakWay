"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Repeat } from "lucide-react"
import { cn } from "@/lib/utils"
import { CloudPaymentsButton } from "@/components/cloudpayments-button"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

const PRESET_AMOUNTS = [100, 500, 1000, 2500, 5000, 10000]
const CURRENCIES = ["RUB", "USD", "EUR"]

export function DonationForm() {
  const router = useRouter()
  const search = useSearchParams()
  const [donationType, setDonationType] = useState<"one_time" | "recurring">("one_time")
  const [amount, setAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState("")
  const [currency, setCurrency] = useState("RUB")
  const [frequency, setFrequency] = useState("monthly")
  const [category, setCategory] = useState("sadaqah")
  const [fundId, setFundId] = useState<string>("")
  const [campaignId, setCampaignId] = useState<string>("")
  const [message, setMessage] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)

  const selectedAmount = customAmount ? Number.parseFloat(customAmount) : amount

  // Prefill from query params
  useEffect(() => {
    const typeParam = search.get("type") // project | target
    const amountParam = search.get("amount")
    const categoryParam = search.get("category")
    const fundParam = search.get("fundId")
    const campaignParam = search.get("campaignId")

    if (amountParam) {
      const val = Number(amountParam)
      if (!Number.isNaN(val) && val > 0) setAmount(val)
    }
    if (categoryParam) setCategory(categoryParam)
    if (fundParam) setFundId(fundParam)
    if (campaignParam) setCampaignId(campaignParam)

    // Map project/target to sensible defaults
    if (typeParam === "project") {
      setCategory("general")
    } else if (typeParam === "target") {
      // keep provided category if any, else default to sadaqah
      setCategory((prev) => prev || "sadaqah")
    }
    // Keep donationType UI default (one_time)
  }, [search])

  const handlePaymentSuccess = async () => {
    // Donation уже создан в initiatePayment, просто перенаправляем
    toast.success("Спасибо за ваше пожертвование! Да воздаст вам Аллах благом.")
    router.push("/profile")
  }

  const handlePaymentFail = (reason: string) => {
    toast.error(`Платёж не прошёл: ${reason}`)
  }

  return (
    <div className="space-y-6">
      {/* Donation Type Tabs */}
      <Tabs value={donationType} onValueChange={(v) => setDonationType(v as "one_time" | "recurring")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="one_time" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Единоразово
          </TabsTrigger>
          <TabsTrigger value="recurring" className="flex items-center gap-2">
            <Repeat className="h-4 w-4" />
            Регулярно
          </TabsTrigger>
        </TabsList>

        <TabsContent value="one_time" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Единоразовое пожертвование</CardTitle>
              <CardDescription>Сделайте разовое пожертвование на благое дело</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="recurring" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Регулярное пожертвование</CardTitle>
              <CardDescription>Настройте автоматические пожертвования для постоянной поддержки</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Периодичность</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Ежедневно</SelectItem>
                    <SelectItem value="weekly">Еженедельно</SelectItem>
                    <SelectItem value="monthly">Ежемесячно</SelectItem>
                    <SelectItem value="yearly">Ежегодно</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Amount Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Выберите сумму</CardTitle>
          <CardDescription>Выберите готовую сумму или введите свою</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-24">
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
            <span className="text-sm text-muted-foreground">Валюта</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {PRESET_AMOUNTS.map((presetAmount) => (
              <Button
                key={presetAmount}
                type="button"
                variant={amount === presetAmount && !customAmount ? "default" : "outline"}
                className={cn("h-14 font-semibold", amount === presetAmount && !customAmount && "ring-2 ring-primary")}
                onClick={() => {
                  setAmount(presetAmount)
                  setCustomAmount("")
                }}
              >
                {presetAmount} ₽
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-amount">Своя сумма</Label>
            <Input
              id="custom-amount"
              type="number"
              placeholder="Введите сумму"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value)
                setAmount(null)
              }}
              min="1"
              step="0.01"
            />
          </div>

          {selectedAmount && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-primary">
                Итого: {selectedAmount.toFixed(2)} {currency}
                {donationType === "recurring" &&
                  ` / ${frequency === "daily" ? "день" : frequency === "weekly" ? "неделя" : frequency === "monthly" ? "месяц" : "год"}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Donation Category */}
      <Card>
        <CardHeader>
          <CardTitle>Тип пожертвования</CardTitle>
          <CardDescription>Выберите категорию пожертвования</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={category} onValueChange={setCategory}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sadaqah" id="sadaqah" />
              <Label htmlFor="sadaqah" className="flex-1 cursor-pointer">
                <div>
                  <p className="font-medium">Садака (добровольная милостыня)</p>
                  <p className="text-xs text-muted-foreground">Общая благотворительность</p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="zakat" id="zakat" />
              <Label htmlFor="zakat" className="flex-1 cursor-pointer">
                <div>
                  <p className="font-medium">Закят (обязательная милостыня)</p>
                  <p className="text-xs text-muted-foreground">Выполните свою обязанность по закяту</p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="general" id="general" />
              <Label htmlFor="general" className="flex-1 cursor-pointer">
                <div>
                  <p className="font-medium">Общее пожертвование</p>
                  <p className="text-xs text-muted-foreground">Поддержка там, где нужнее всего</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Fund Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Выберите фонд (необязательно)</CardTitle>
          <CardDescription>Направьте пожертвование на конкретную цель</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={fundId} onValueChange={setFundId}>
            <SelectTrigger>
              <SelectValue placeholder="Общий фонд (все цели)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Общий фонд (все цели)</SelectItem>
              <SelectItem value="education">Образование</SelectItem>
              <SelectItem value="healthcare">Медицинская помощь</SelectItem>
              <SelectItem value="water">Вода для жизни</SelectItem>
              <SelectItem value="orphans">Помощь сиротам</SelectItem>
              <SelectItem value="emergency">Экстренная помощь</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Message */}
      <Card>
        <CardHeader>
          <CardTitle>Добавить сообщение (необязательно)</CardTitle>
          <CardDescription>Поделитесь своими мыслями или посвятите это пожертвование</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Например: В память о моей любимой матери..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-2">{message.length}/500 символов</p>
        </CardContent>
      </Card>

      {/* Anonymous Option */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="anonymous">Анонимное пожертвование</Label>
              <p className="text-xs text-muted-foreground">Ваше имя не будет отображаться публично</p>
            </div>
            <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>
        </CardContent>
      </Card>

      <CloudPaymentsButton
        amount={selectedAmount || 0}
        currency={currency}
        description={`Пожертвование - ${category === "sadaqah" ? "Садака" : category === "zakat" ? "Закят" : "Общее"}`}
        donationData={{
          donationType,
          frequency: donationType === "recurring" ? frequency : null,
          category,
          fundId,
          message,
          isAnonymous,
        }}
        onSuccess={handlePaymentSuccess}
        onFail={handlePaymentFail}
        disabled={!selectedAmount || selectedAmount <= 0}
        className="w-full"
      />

      <p className="text-xs text-center text-muted-foreground">
        Совершая пожертвование, вы соглашаетесь с нашими условиями. Ваш платёж защищён и зашифрован.
      </p>
    </div>
  )
}
