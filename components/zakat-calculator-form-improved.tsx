"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Calculator, Info, Heart, TrendingUp, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// Текущие цены на золото/серебро (в продакшене должны загружаться из API)
const GOLD_PRICE_PER_GRAM = 7500 // RUB (обновлено согласно ТЗ)
const SILVER_PRICE_PER_GRAM = 80 // RUB
const NISAB_GOLD_GRAMS = 85
const NISAB_SILVER_GRAMS = 595
const ZAKAT_RATE = 0.025 // 2.5%

type Madhab = "hanafi" | "shafi" | "maliki" | "hanbali"

const MADHAB_NAMES: Record<Madhab, string> = {
  hanafi: "Ханафи",
  shafi: "Шафии",
  maliki: "Малики",
  hanbali: "Ханбали",
}

interface CalculationResult {
  zakat_due: number
  above_nisab: boolean
  net_wealth: number
  total_assets: number
  nisab_value: number
  madhab?: string
  deductible_debts?: number
  calculation_id?: string
}

export function ZakatCalculatorForm() {
  const router = useRouter()
  const [currency, setCurrency] = useState("RUB")
  const [madhab, setMadhab] = useState<Madhab>("hanafi")
  const [isCalculating, setIsCalculating] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null)

  // Активы
  const [cash, setCash] = useState("")
  const [bankAccounts, setBankAccounts] = useState("")
  const [eWallets, setEWallets] = useState("")
  const [goldGrams, setGoldGrams] = useState("")
  const [silverGrams, setSilverGrams] = useState("")
  const [businessGoods, setBusinessGoods] = useState("")
  const [investments, setInvestments] = useState("")
  const [receivables, setReceivables] = useState("")
  const [propertyValue, setPropertyValue] = useState("")
  const [otherAssets, setOtherAssets] = useState("")

  // Обязательства
  const [debts, setDebts] = useState("")
  const [debtsDueThisYear, setDebtsDueThisYear] = useState("") // Для Шафии
  const [investmentsForTrade, setInvestmentsForTrade] = useState(false) // Для Ханафи

  // Рассчитанные значения (для предпросмотра)
  const [totalAssets, setTotalAssets] = useState(0)
  const [totalLiabilities, setTotalLiabilities] = useState(0)
  const [netWealth, setNetWealth] = useState(0)
  const [nisabThreshold, setNisabThreshold] = useState(0)
  const [zakatDue, setZakatDue] = useState(0)
  const [isAboveNisab, setIsAboveNisab] = useState(false)

  // Функция расчета нисаба по мазхабу
  const calculateNisabByMadhab = (m: Madhab): number => {
    const goldNisab = NISAB_GOLD_GRAMS * GOLD_PRICE_PER_GRAM // ≈ 637 500 ₽
    const silverNisab = NISAB_SILVER_GRAMS * SILVER_PRICE_PER_GRAM // ≈ 47 600 ₽

    switch (m) {
      case "hanafi":
      case "hanbali":
        return goldNisab
      case "shafi":
        return Math.min(goldNisab, silverNisab)
      case "maliki":
        return silverNisab
      default:
        return goldNisab
    }
  }

  // Пересчёт при изменении полей (предпросмотр)
  useEffect(() => {
    const cashTotal = Number.parseFloat(cash || "0") + Number.parseFloat(bankAccounts || "0") + Number.parseFloat(eWallets || "0")
    const goldValue = Number.parseFloat(goldGrams || "0") * GOLD_PRICE_PER_GRAM
    const silverValue = Number.parseFloat(silverGrams || "0") * SILVER_PRICE_PER_GRAM
    
    // Для Ханафи: инвестиции только если для торговли
    let investmentsValue = Number.parseFloat(investments || "0")
    if (madhab === "hanafi" && !investmentsForTrade) {
      investmentsValue = 0
    }
    
    const assets =
      cashTotal +
      goldValue +
      silverValue +
      Number.parseFloat(businessGoods || "0") +
      investmentsValue +
      Number.parseFloat(receivables || "0") +
      Number.parseFloat(propertyValue || "0") +
      Number.parseFloat(otherAssets || "0")

    // Для Шафии: только долги, которые вернут в этом году
    // Для остальных: все краткосрочные долги
    const deductibleDebts = madhab === "shafi" 
      ? Number.parseFloat(debtsDueThisYear || "0")
      : Number.parseFloat(debts || "0")
    
    const net = assets - deductibleDebts
    
    // Нисаб по мазхабу
    const nisab = calculateNisabByMadhab(madhab)
    
    // Закят = 2.5% от превышения нисаба (не от всего!)
    const excess = net > nisab ? net - nisab : 0
    const zakat = excess > 0 ? excess * ZAKAT_RATE : 0

    setTotalAssets(assets)
    setTotalLiabilities(deductibleDebts)
    setNetWealth(net)
    setNisabThreshold(nisab)
    setZakatDue(zakat)
    setIsAboveNisab(net >= nisab)
  }, [cash, bankAccounts, eWallets, goldGrams, silverGrams, businessGoods, investments, investmentsForTrade, receivables, propertyValue, otherAssets, debts, debtsDueThisYear, madhab])

  const handleCalculate = async () => {
    setIsCalculating(true)
    try {
      const cashTotal = Number.parseFloat(cash || "0") + Number.parseFloat(bankAccounts || "0") + Number.parseFloat(eWallets || "0")
      const goldG = Number.parseFloat(goldGrams || "0")
      const silverG = Number.parseFloat(silverGrams || "0")
      
      const payload = {
        assets: {
          cash_total: cashTotal,
          gold_g: goldG,
          silver_g: silverG,
          business_goods_value: Number.parseFloat(businessGoods || "0"),
          investments: Number.parseFloat(investments || "0"),
          investments_for_trade: investmentsForTrade, // Для Ханафи
          receivables_collectible: Number.parseFloat(receivables || "0"),
          property_value: Number.parseFloat(propertyValue || "0"),
          other_assets: Number.parseFloat(otherAssets || "0"),
        },
        debts_short_term: Number.parseFloat(debts || "0"),
        debts_due_this_year: Number.parseFloat(debtsDueThisYear || "0"), // Для Шафии
        madhab: madhab,
        nisab_currency: currency,
        rate_percent: 2.5,
      }

      const response = await fetch("/api/zakat/calc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Ошибка расчета")
      }

      const result = await response.json()
      setCalculationResult(result)
      setShowResult(true)
      toast.success("Расчет выполнен успешно")
    } catch (error) {
      console.error("Zakat calculation error:", error)
      toast.error(error instanceof Error ? error.message : "Ошибка при расчете закята")
    } finally {
      setIsCalculating(false)
    }
  }

  const handleReset = () => {
    setCash("")
    setBankAccounts("")
    setEWallets("")
    setGoldGrams("")
    setSilverGrams("")
    setBusinessGoods("")
    setInvestments("")
    setReceivables("")
    setPropertyValue("")
    setOtherAssets("")
    setDebts("")
    setDebtsDueThisYear("")
    setInvestmentsForTrade(false)
    setShowResult(false)
    setCalculationResult(null)
  }

  const handlePayZakat = () => {
    if (!calculationResult) return
    router.push(`/donate?amount=${calculationResult.zakat_due.toFixed(2)}&category=zakat&type=zakat`)
  }

  return (
    <div className="space-y-6">
      {/* Дисклеймер */}
      <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-900 dark:text-amber-100">Важно</AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
          Расчёт носит справочный характер. Следуйте мазхабу вашего учёного для точных вычислений.
        </AlertDescription>
      </Alert>

      {/* Выбор мазхаба и валюты */}
      <Card>
        <CardHeader>
          <CardTitle>Настройки расчета</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="madhab">Мазхаб</Label>
            <Select value={madhab} onValueChange={(v) => setMadhab(v as Madhab)}>
              <SelectTrigger id="madhab">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hanafi">Ханафи</SelectItem>
                <SelectItem value="shafi">Шафии</SelectItem>
                <SelectItem value="maliki">Малики</SelectItem>
                <SelectItem value="hanbali">Ханбали</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Выбор мазхаба влияет на расчет нисаба и правила облагаемого имущества
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Валюта</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RUB">RUB - Российский рубль</SelectItem>
                <SelectItem value="USD">USD - Доллар США</SelectItem>
                <SelectItem value="EUR">EUR - Евро</SelectItem>
                <SelectItem value="SAR">SAR - Саудовский риял</SelectItem>
                <SelectItem value="AED">AED - Дирхам ОАЭ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Информация о нисабе */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <CardTitle className="text-base">Нисаб</CardTitle>
              <CardDescription className="text-xs">
                Минимальный порог облагаемого имущества:{" "}
                <span className="font-semibold text-primary">
                  {currency} {nisabThreshold.toLocaleString("ru-RU")}
                </span>{" "}
                (на основе {NISAB_GOLD_GRAMS}г золота по цене {GOLD_PRICE_PER_GRAM.toLocaleString("ru-RU")} ₽/г)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Вкладки активов и обязательств */}
      <Tabs defaultValue="assets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assets">Активы</TabsTrigger>
          <TabsTrigger value="liabilities">Долги</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4 mt-4">
          {/* Денежные средства */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Денежные средства</CardTitle>
              <CardDescription className="text-xs">
                Включая все валюты по курсу на дату расчета
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="cash">Наличные</Label>
                <Input
                  id="cash"
                  type="number"
                  placeholder="0.00"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank">Банковские счета</Label>
                <Input
                  id="bank"
                  type="number"
                  placeholder="0.00"
                  value={bankAccounts}
                  onChange={(e) => setBankAccounts(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ewallets">Электронные кошельки (QIWI, Yandex.Pay и т.д.)</Label>
                <Input
                  id="ewallets"
                  type="number"
                  placeholder="0.00"
                  value={eWallets}
                  onChange={(e) => setEWallets(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </CardContent>
          </Card>

          {/* Золото и серебро */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Драгоценные металлы</CardTitle>
              <CardDescription className="text-xs">
                В граммах чистого металла
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="gold">Золото (граммы)</Label>
                <Input
                  id="gold"
                  type="number"
                  placeholder="0.00"
                  value={goldGrams}
                  onChange={(e) => setGoldGrams(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground">
                  Текущая цена: {GOLD_PRICE_PER_GRAM.toLocaleString("ru-RU")} ₽/г
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="silver">Серебро (граммы)</Label>
                <Input
                  id="silver"
                  type="number"
                  placeholder="0.00"
                  value={silverGrams}
                  onChange={(e) => setSilverGrams(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground">
                  Текущая цена: {SILVER_PRICE_PER_GRAM.toLocaleString("ru-RU")} ₽/г
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Бизнес и инвестиции */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Бизнес-товары и инвестиции</CardTitle>
              <CardDescription className="text-xs">
                Рыночная стоимость на конец лунного года
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="business">Стоимость товарных остатков / торговые активы</Label>
                <Input
                  id="business"
                  type="number"
                  placeholder="0.00"
                  value={businessGoods}
                  onChange={(e) => setBusinessGoods(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="investments">Инвестиции (акции, облигации)</Label>
                <Input
                  id="investments"
                  type="number"
                  placeholder="0.00"
                  value={investments}
                  onChange={(e) => setInvestments(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receivables">Взыскаемые дебиторки</Label>
                <Input
                  id="receivables"
                  type="number"
                  placeholder="0.00"
                  value={receivables}
                  onChange={(e) => setReceivables(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </CardContent>
          </Card>

          {/* Прочее */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Прочее</CardTitle>
              <CardDescription className="text-xs">
                Недвижимость на продажу (если товар) и иное
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="property">Недвижимость на продажу (если товар)</Label>
                <Input
                  id="property"
                  type="number"
                  placeholder="0.00"
                  value={propertyValue}
                  onChange={(e) => setPropertyValue(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other">Иное</Label>
                <Input
                  id="other"
                  type="number"
                  placeholder="0.00"
                  value={otherAssets}
                  onChange={(e) => setOtherAssets(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liabilities" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Долги к вычету</CardTitle>
              <CardDescription className="text-xs">
                Только подтверждённые долги, погашаемые в текущем году
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="debts">Краткосрочные обязательства</Label>
                <Input
                  id="debts"
                  type="number"
                  placeholder="0.00"
                  value={debts}
                  onChange={(e) => setDebts(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Итоговый расчёт */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle>Предварительный расчет</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Всего активов</span>
              <span className="font-semibold">
                {currency} {totalAssets.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Минус долги</span>
              <span className="font-semibold text-red-600">
                - {currency} {totalLiabilities.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm font-medium">Чистые активы</span>
              <span className="font-bold text-lg">
                {currency} {netWealth.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Нисаб</span>
              <span className="font-semibold">
                {currency} {nisabThreshold.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {isAboveNisab && (
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Превышение нисаба</span>
                <span className="font-semibold text-primary">
                  {currency} {(netWealth - nisabThreshold).toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          {isAboveNisab ? (
            <Alert className="bg-primary/10 border-primary/30">
              <TrendingUp className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">Закят обязателен</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  <p className="text-sm">
                    Ваше имущество превышает порог нисаба. Предварительный расчет закята:
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {currency} {zakatDue.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Это 2,5% от превышения нисаба ({(netWealth - nisabThreshold).toLocaleString("ru-RU")} ₽)
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Закят не требуется</AlertTitle>
              <AlertDescription className="text-sm">
                Ваше имущество ниже порога нисаба. Закят в данный момент не обязателен, но добровольная милостыня
                (садака) всегда приветствуется.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              size="lg"
              onClick={handleCalculate}
              disabled={isCalculating || netWealth <= 0}
            >
              {isCalculating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Расчет...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Рассчитать
                </>
              )}
            </Button>
            <Button variant="outline" size="lg" onClick={handleReset}>
              Сбросить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Диалог с результатами */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Результат расчета закята</DialogTitle>
            <DialogDescription>
              Детальный расчет на основе введенных данных
            </DialogDescription>
          </DialogHeader>
          {calculationResult && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Общие активы</span>
                  <span className="font-semibold">
                    {currency} {calculationResult.total_assets.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Чистые активы</span>
                  <span className="font-semibold">
                    {currency} {calculationResult.net_wealth.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Нисаб</span>
                  <span className="font-semibold">
                    {currency} {calculationResult.nisab_value.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-medium">Закят (2.5%)</span>
                    <span className="text-2xl font-bold text-primary">
                      {currency} {calculationResult.zakat_due.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
              {calculationResult.above_nisab && (
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" size="lg" onClick={handlePayZakat}>
                    <Heart className="h-4 w-4 mr-2" />
                    Выплатить закят
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Образовательная информация */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">О закяте</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Закят — один из пяти столпов Ислама и обязательный акт благотворительности для мусульман, владеющих
            имуществом выше порога нисаба в течение одного лунного года (хауль).
          </p>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Ключевые моменты:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Ставка закята составляет 2,5% от превышения нисаба</li>
              <li>Имущество должно находиться в собственности один лунный год (хауль)</li>
              <li>Нисаб основан на стоимости {NISAB_GOLD_GRAMS}г золота или {NISAB_SILVER_GRAMS}г серебра</li>
              <li>Личное жильё и предметы первой необходимости не облагаются закятом</li>
              <li>Долги могут быть вычтены из общего имущества</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

