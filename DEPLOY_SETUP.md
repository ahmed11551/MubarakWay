# Инструкция по настройке деплоя

## Найденные данные

- **VERCEL_ORG_ID**: `team_y1QCs5r5OPnKKuHRQJYVUvEX`
- **VERCEL_PROJECT_ID**: `prj_VsqHkoeM952J8v5lmYfzFl4CaBPu`
- **TELEGRAM_BOT_TOKEN**: `8417046320:AAF6TExdeJiSq3xK0Cy2GhL8KVRrvZf7UWQ`
- **TELEGRAM_SECRET_TOKEN**: `1f2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7081a9b0c1d2e3f40516`
- **API_AUTH_TOKEN**: `test_token_123`

## Шаги для настройки

### 1. Создайте VERCEL_TOKEN

1. Перейдите на https://vercel.com/account/tokens
2. Нажмите "Create Token"
3. Назовите токен (например, "GitHub Actions")
4. Скопируйте токен (он показывается только один раз!)

### 2. Добавьте секреты в GitHub

Перейдите в настройки репозитория: https://github.com/ahmed11551/SadakaPass/settings/secrets/actions

Добавьте следующие секреты:

| Secret Name | Значение |
|------------|----------|
| `VERCEL_ORG_ID` | `team_y1QCs5r5OPnKKuHRQJYVUvEX` |
| `VERCEL_PROJECT_ID` | `prj_VsqHkoeM952J8v5lmYfzFl4CaBPu` |
| `VERCEL_TOKEN` | *Ваш токен из шага 1* |
| `TELEGRAM_BOT_TOKEN` | `8417046320:AAF6TExdeJiSq3xK0Cy2GhL8KVRrvZf7UWQ` |
| `TELEGRAM_SECRET_TOKEN` | `1f2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7081a9b0c1d2e3f40516` |
| `API_AUTH_TOKEN` | `test_token_123` |
| `NEXT_PUBLIC_SUPABASE_URL` | *Ваш Supabase URL* |
| `SUPABASE_SERVICE_ROLE_KEY` | *Ваш Supabase Service Role Key* |

### 3. Настройте переменные в Vercel

После первого деплоя добавьте те же переменные окружения в Vercel Dashboard:
https://vercel.com/ahmed11551s-projects/sadaka-pass/settings/environment-variables

### 4. Установите Telegram Webhook

После деплоя выполните:

```powershell
$body = @{
  url = "https://sadaka-pass.vercel.app/api/telegram/webhook"
  secret_token = "1f2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7081a9b0c1d2e3f40516"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "https://api.telegram.org/bot8417046320:AAF6TExdeJiSq3xK0Cy2GhL8KVRrvZf7UWQ/setWebhook" `
  -ContentType "application/json" `
  -Body $body
```

## Ссылка на деплой

После настройки секретов и первого успешного деплоя:
- **Production**: https://sadaka-pass.vercel.app
- **API Stats**: https://sadaka-pass.vercel.app/api/stats
- **Telegram Webhook**: https://sadaka-pass.vercel.app/api/telegram/webhook

## Проверка

1. После добавления секретов сделайте push в main ветку
2. Проверьте статус деплоя: https://github.com/ahmed11551/SadakaPass/actions
3. После успешного деплоя проверьте API:
   ```powershell
   $headers = @{ Authorization = "Bearer test_token_123" }
   Invoke-RestMethod -Uri "https://sadaka-pass.vercel.app/api/stats" -Headers $headers
   ```

