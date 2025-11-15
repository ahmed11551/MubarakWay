# SadakaPass - Платформа благотворительности

Next.js приложение для управления благотворительными кампаниями с интеграцией Telegram бота.

## 🚀 Быстрый старт

### Установка

```bash
pnpm install
pnpm dev
```

### Переменные окружения

Создайте `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API
API_AUTH_TOKEN=your_api_token

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_SECRET_TOKEN=your_telegram_secret_token
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=YourBotUsername

# App
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## 📝 Лицензия

MIT
