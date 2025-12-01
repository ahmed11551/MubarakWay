"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calculator, Info, Heart, TrendingUp } from "lucide-react"
import Link from "next/link"

// Текущие цены на золото/серебро (в продакшене должны загружаться из API)
const GOLD_PRICE_PER_GRAM = 5200 // RUB
const SILVER_PRICE_PER_GRAM = 65 // RUB
const NISAB_GOLD_GRAMS = 85
const NISAB_SILVER_GRAMS = 595
const ZAKAT_RATE = 0.025 // 2.5%

export function ZakatCalculatorForm() {
  const [currency, setCurrency] = useState("RUB")

  // Активы
  const [cash, setCash] = useState("")
  const [bankAccounts, setBankAccounts] = useState("")
  const [gold, setGold] = useState("")
  const [silver, setSilver] = useState("")
  const [investments, setInvestments] = useState("")
  const [businessAssets, setBusinessAssets] = useState("")
  const [propertyValue, setPropertyValue] = useState("")
  const [otherAssets, setOtherAssets] = useState("")

  // Обязательства
  const [debts, setDebts] = useState("")
  const [loans, setLoans] = useState("")

  // Рассчитанные значения
  const [totalAssets, setTotalAssets] = useState(0)
  const [totalLiabilities, setTotalLiabilities] = useState(0)
  const [netWealth, setNetWealth] = useState(0)
  const [nisabThreshold, setNisabThreshold] = useState(0)
  const [zakatDue, setZakatDue] = useState(0)
  const [isAboveNisab, setIsAboveNisab] = useState(false)

  // Пересчёт при изменении полей
  useEffect(() => {
    const assets =
      Number.parseFloat(cash || "0") +
      Number.parseFloat(bankAccounts || "0") +
      Number.parseFloat(gold || "0") +
      Number.parseFloat(silver || "0") +
      Number.parseFloat(investments || "0") +
      Number.parseFloat(businessAssets || "0") +
      Number.parseFloat(propertyValue || "0") +
      Number.parseFloat(otherAssets || "0")

    const liabilities = Number.parseFloat(debts || "0") + Number.parseFloat(loans || "0")

    const net = assets - liabilities
    const nisab = NISAB_GOLD_GRAMS * GOLD_PRICE_PER_GRAM
    const zakat = net >= nisab ? net * ZAKAT_RATE : 0

    setTotalAssets(assets)
    setTotalLiabilities(liabilities)
    setNetWealth(net)
    setNisabThreshold(nisab)
    setZakatDue(zakat)
    setIsAboveNisab(net >= nisab)
  }, [cash, bankAccounts, gold, silver, investments, businessAssets, propertyValue, otherAssets, debts, loans])

  const handleReset = () => {
    setCash("")
    setBankAccounts("")
    setGold("")
    setSilver("")
    setInvestments("")
    setBusinessAssets("")
    setPropertyValue("")
    setOtherAssets("")
    setDebts("")
    setLoans("")
  }

  return (
    <div className="space-y-6">
      {/* Информация о нисабе */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <CardTitle className="text-base">Что такое нисаб?</CardTitle>
              <CardDescription className="text-xs">
                Нисаб — это минимальная сумма имущества, при достижении которой закят становится обязательным для
                мусульманина. Текущий порог нисаба составляет примерно{" "}
                <span className="font-semibold text-primary">
                  {currency} {nisabThreshold.toLocaleString("ru-RU")}
                </span>{" "}
                на основе стоимости {NISAB_GOLD_GRAMS}г золота.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Выбор валюты */}
      <Card>
        <CardHeader>
          <CardTitle>Выберите валюту</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
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
        </CardContent>
      </Card>

      {/* Вкладки активов и обязательств */}
      <Tabs defaultValue="assets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assets">Активы</TabsTrigger>
          <TabsTrigger value="liabilities">Обязательства</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4 mt-4">
          {/* Наличные и банковские счета */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Наличные и банковские счета</CardTitle>
              <CardDescription className="text-xs">
                Включите все наличные деньги и средства на банковских счетах
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
            </CardContent>
          </Card>

          {/* Золото и серебро */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Золото и серебро</CardTitle>
              <CardDescription className="text-xs">
                Введите стоимость золота и серебра, которым вы владеете
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="gold">Стоимость золота</Label>
                <Input
                  id="gold"
                  type="number"
                  placeholder="0.00"
                  value={gold}
                  onChange={(e) => setGold(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground">
                  Текущая цена золота: ~{currency} {GOLD_PRICE_PER_GRAM.toLocaleString("ru-RU")}/грамм
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="silver">Стоимость серебра</Label>
                <Input
                  id="silver"
                  type="number"
                  placeholder="0.00"
                  value={silver}
                  onChange={(e) => setSilver(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground">
                  Текущая цена серебра: ~{currency} {SILVER_PRICE_PER_GRAM.toLocaleString("ru-RU")}/грамм
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Инвестиции и бизнес */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Инвестиции и бизнес</CardTitle>
              <CardDescription className="text-xs">
                Акции, облигации, товарные запасы бизнеса и другие инвестиции
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="investments">Инвестиции (акции, облигации и т.д.)</Label>
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
                <Label htmlFor="business">Активы бизнеса/товарные запасы</Label>
                <Input
                  id="business"
                  type="number"
                  placeholder="0.00"
                  value={businessAssets}
                  onChange={(e) => setBusinessAssets(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </CardContent>
          </Card>

          {/* Недвижимость и другие активы */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Недвижимость и другие активы</CardTitle>
              <CardDescription className="text-xs">
                Инвестиционная недвижимость и другие активы, облагаемые закятом
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="property">Стоимость инвестиционной недвижимости</Label>
                <Input
                  id="property"
                  type="number"
                  placeholder="0.00"
                  value={propertyValue}
                  onChange={(e) => setPropertyValue(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground">
                  Включайте только недвижимость для инвестиций, не основное жильё
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="other">Другие активы</Label>
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
              <CardTitle className="text-base">Долги и займы</CardTitle>
              <CardDescription className="text-xs">Вычтите срочные долги и краткосрочные обязательства</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="debts">Непогашенные долги</Label>
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
              <div className="space-y-2">
                <Label htmlFor="loans">Займы к погашению</Label>
                <Input
                  id="loans"
                  type="number"
                  placeholder="0.00"
                  value={loans}
                  onChange={(e) => setLoans(e.target.value)}
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
            <CardTitle>Расчёт закята</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Всего активов</span>
              <span className="font-semibold">
                {currency} {totalAssets.toLocaleString("ru-RU")}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Всего обязательств</span>
              <span className="font-semibold">
                - {currency} {totalLiabilities.toLocaleString("ru-RU")}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm font-medium">Чистое имущество для закята</span>
              <span className="font-bold text-lg">
                {currency} {netWealth.toLocaleString("ru-RU")}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Порог нисаба</span>
              <span className="font-semibold">
                {currency} {nisabThreshold.toLocaleString("ru-RU")}
              </span>
            </div>
          </div>

          {isAboveNisab ? (
            <Alert className="bg-primary/10 border-primary/30">
              <TrendingUp className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">Закят обязателен</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  <p className="text-sm">
                    Ваше имущество превышает порог нисаба. Ваша обязанность по закяту составляет:
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {currency} {zakatDue.toLocaleString("ru-RU")}
                  </p>
                  <p className="text-xs text-muted-foreground">Это 2,5% от вашего чистого имущества</p>
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
            {isAboveNisab && (
              <Button className="flex-1" size="lg" asChild>
                <Link href={`/donate?amount=${zakatDue.toFixed(2)}&type=zakat`}>
                  <Heart className="h-4 w-4 mr-2" />
                  Выплатить закят
                </Link>
              </Button>
            )}
            <Button variant="outline" size="lg" onClick={handleReset} className={isAboveNisab ? "" : "flex-1"}>
              Сбросить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Образовательная информация */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">О закяте</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Закят — один из пяти столпов Ислама и обязательный акт благотворительности для мусульман, владеющих
            имуществом выше порога нисаба в течение одного лунного года.
          </p>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Ключевые моменты:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Ставка закята составляет 2,5% от облагаемого имущества</li>
              <li>Имущество должно находиться в собственности один лунный год (хауль)</li>
              <li>Нисаб основан на стоимости 85г золота или 595г серебра</li>
              <li>Личное жильё и предметы первой необходимости не облагаются закятом</li>
              <li>Долги могут быть вычтены из общего имущества</li>
            </ul>
          </div>
          <p className="text-xs">
            Примечание: Этот калькулятор предоставляет приблизительный расчёт. Для точных вычислений проконсультируйтесь
            с квалифицированным исламским учёным.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
