import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Bot, Copy } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export default function BotSettingsPage() {
  return (
    <div className="min-h-screen pb-20">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Настройки Telegram Mini App</h1>
              <p className="text-muted-foreground">Конфигурация бота и интеграции</p>
            </div>
          </div>

          {/* Bot Token */}
          <Card>
            <CardHeader>
              <CardTitle>Токен бота</CardTitle>
              <CardDescription>Получите токен у @BotFather в Telegram</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bot-token">Bot Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="bot-token"
                    type="password"
                    placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                    defaultValue=""
                  />
                  <Button variant="outline" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button>Сохранить токен</Button>
            </CardContent>
          </Card>

          {/* API Authorization Token */}
          <Card>
            <CardHeader>
              <CardTitle>Токен авторизации API</CardTitle>
              <CardDescription>Токен для авторизации запросов к Bot.e-replika.ru/docs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-token">API Authorization Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-token"
                    type="password"
                    placeholder="Введите токен авторизации"
                    defaultValue="test_token_123"
                  />
                  <Button variant="outline" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-endpoint">API Endpoint</Label>
                <Input id="api-endpoint" readOnly value="https://bot.e-replika.ru/docs" className="font-mono text-sm" />
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Использование токена:</p>
                <code className="text-xs bg-background p-2 rounded block">Authorization: Bearer test_token_123</code>
              </div>
              <Button>Сохранить токен API</Button>
            </CardContent>
          </Card>

          {/* Mini App URL */}
          <Card>
            <CardHeader>
              <CardTitle>URL Mini App</CardTitle>
              <CardDescription>Укажите этот URL в настройках бота у @BotFather</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app-url">Mini App URL</Label>
                <div className="flex gap-2">
                  <Input id="app-url" readOnly value="https://your-app.vercel.app" className="font-mono text-sm" />
                  <Button variant="outline" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Инструкция по настройке:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Откройте @BotFather в Telegram</li>
                  <li>Отправьте команду /newapp</li>
                  <li>Выберите вашего бота</li>
                  <li>Введите название приложения</li>
                  <li>Загрузите иконку (512x512 px)</li>
                  <li>Вставьте URL выше</li>
                  <li>Добавьте короткое описание</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Webhook Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Webhook настройки</CardTitle>
              <CardDescription>Настройте webhook для получения обновлений от Telegram</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://your-app.vercel.app/api/telegram/webhook"
                  defaultValue=""
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Включить webhook</Label>
                  <p className="text-xs text-muted-foreground">Автоматически обрабатывать команды бота</p>
                </div>
                <Switch />
              </div>
              <Button>Установить webhook</Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Bot Commands */}
          <Card>
            <CardHeader>
              <CardTitle>Команды бота</CardTitle>
              <CardDescription>Настройте команды для быстрого доступа к функциям</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Список команд</Label>
                <Textarea
                  placeholder="start - Запустить приложение&#10;donate - Сделать пожертвование&#10;campaigns - Просмотреть кампании&#10;zakat - Калькулятор закята&#10;profile - Мой профиль"
                  rows={6}
                  className="font-mono text-sm"
                  defaultValue="start - Запустить приложение&#10;donate - Сделать пожертвование&#10;campaigns - Просмотреть кампании&#10;zakat - Калькулятор закята&#10;profile - Мой профиль"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Отправьте команду /setcommands в @BotFather и вставьте список выше
              </p>
              <Button variant="outline">
                <Copy className="mr-2 h-4 w-4" />
                Скопировать команды
              </Button>
            </CardContent>
          </Card>

          {/* CloudPayments Integration */}
          <Card>
            <CardHeader>
              <CardTitle>CloudPayments интеграция</CardTitle>
              <CardDescription>Настройте платёжную систему для приёма пожертвований</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cp-public-id">Public ID</Label>
                <Input id="cp-public-id" placeholder="pk_xxxxxxxxxxxxxxxxxxxxxxxx" defaultValue="" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp-api-secret">API Secret</Label>
                <Input id="cp-api-secret" type="password" placeholder="••••••••••••••••••••••••" defaultValue="" />
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-900 dark:text-amber-200">
                  <strong>Важно:</strong> Добавьте переменные окружения NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID и
                  CLOUDPAYMENTS_API_SECRET в настройках проекта Vercel
                </p>
              </div>
              <Button>Сохранить настройки</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
