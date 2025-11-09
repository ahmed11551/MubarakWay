# SadakaPass - Платформа благотворительности

Next.js приложение для управления благотворительными кампаниями с интеграцией Telegram бота.

## 🚀 Быстрый старт

### API Endpoints

- **GET `/api/stats`** - Статистика платформы (требует Bearer токен)
  ```bash
  curl -H "Authorization: Bearer test_token_123" https://your-domain.com/api/stats
  ```

- **POST `/api/telegram/webhook`** - Webhook для Telegram бота
  - Проверяет секретный токен из заголовка `X-Telegram-Bot-Api-Secret-Token`
  - Команды: `/start`, `/stats`

### Переменные окружения

Создайте `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
API_AUTH_TOKEN=test_token_123
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_SECRET_TOKEN=your_telegram_secret_token
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=YourBotUsername
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### Деплой на Vercel

1. Добавьте секреты в GitHub: https://github.com/ahmed11551/SadakaPass/settings/secrets/actions
2. См. `DEPLOY_SETUP.md` для детальных инструкций

**Ссылка на деплой**: https://sadaka-pass.vercel.app

## 📚 Документация

- [Инструкция по деплою](./DEPLOY_SETUP.md)

## 🤖 Telegram Bot

После деплоя установите webhook:

```powershell
$body = @{
  url = "https://sadaka-pass.vercel.app/api/telegram/webhook"
  secret_token = "your_secret_token"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" `
  -ContentType "application/json" `
  -Body $body
```

## 🛠️ Разработка

```bash
pnpm install
pnpm dev
```

## 📝 Лицензия

MIT
