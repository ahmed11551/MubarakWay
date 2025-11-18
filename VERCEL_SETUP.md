# Настройка переменных окружения в Vercel

## Автоматическая настройка через скрипт

### Вариант 1: Node.js скрипт (рекомендуется)

```bash
# 1. Убедитесь, что авторизованы в Vercel
vercel login

# 2. Запустите скрипт
node scripts/setup-vercel-env.js
```

Скрипт попросит ввести значения переменных и автоматически добавит их в Vercel.

### Вариант 2: Через Vercel CLI вручную

```bash
# Авторизация
vercel login

# Добавление переменных (для каждого окружения: production, preview, development)
echo "your_supabase_url" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "your_anon_key" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "your_service_role_key" | vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Для preview и development повторите команды с соответствующими окружениями
```

## Ручная настройка через веб-интерфейс

1. Откройте https://vercel.com/dashboard
2. Выберите проект `mubarak-way`
3. Перейдите в **Settings** → **Environment Variables**
4. Добавьте следующие переменные:

### Обязательные переменные:

| Переменная | Описание | Где взять |
|-----------|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Публичный ключ Supabase | Supabase Dashboard → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role ключ Supabase | Supabase Dashboard → Settings → API → service_role |

### Рекомендуемые переменные:

| Переменная | Значение |
|-----------|----------|
| `NEXT_PUBLIC_SITE_URL` | `https://mubarak-way.vercel.app` |
| `NEXT_PUBLIC_BASE_URL` | `https://mubarak-way.vercel.app` |

### Опциональные переменные (если используете):

| Переменная | Описание |
|-----------|----------|
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота |
| `TELEGRAM_SECRET_TOKEN` | Секретный токен для Telegram webhook |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Username Telegram бота |
| `API_AUTH_TOKEN` | Токен для API аутентификации |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN для Sentry (если используете) |

5. Выберите окружения: **Production**, **Preview**, **Development**
6. Нажмите **Save**
7. Перейдите в **Deployments** и нажмите **Redeploy** для последнего деплоя

## Проверка настроенных переменных

```bash
# Просмотр всех переменных
vercel env ls

# Просмотр переменных для конкретного окружения
vercel env ls production
```

## После настройки

Vercel автоматически пересоберет проект. Если этого не произошло:
- Перейдите в **Deployments**
- Нажмите на три точки рядом с последним деплоем
- Выберите **Redeploy**

## Где найти значения Supabase

1. Откройте https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **Settings** → **API**
4. Скопируйте:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ секретный ключ!)

