# GitHub Secrets - Готово к добавлению

## ✅ Переменные уже добавлены в Vercel:
- TELEGRAM_BOT_TOKEN
- TELEGRAM_SECRET_TOKEN  
- API_AUTH_TOKEN

## 📋 Добавьте эти секреты в GitHub:

Перейдите: **https://github.com/ahmed11551/SadakaPass/settings/secrets/actions**

Нажмите **"New repository secret"** и добавьте:

| Secret Name | Значение |
|------------|----------|
| `VERCEL_ORG_ID` | `team_y1QCs5r5OPnKKuHRQJYVUvEX` |
| `VERCEL_PROJECT_ID` | `prj_VsqHkoeM952J8v5lmYfzFl4CaBPu` |
| `VERCEL_TOKEN` | `90yDvxTtS7pSJxB6QhfYqp5X` |
| `TELEGRAM_BOT_TOKEN` | `8417046320:AAF6TExdeJiSq3xK0Cy2GhL8KVRrvZf7UWQ` |
| `TELEGRAM_SECRET_TOKEN` | `1f2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7081a9b0c1d2e3f40516` |
| `API_AUTH_TOKEN` | `test_token_123` |
| `NEXT_PUBLIC_SUPABASE_URL` | *Ваш Supabase URL* |
| `SUPABASE_SERVICE_ROLE_KEY` | *Ваш Supabase Service Role Key* |

## 🚀 После добавления:

1. GitHub Actions автоматически запустится
2. Проект задеплоится на Vercel
3. Ссылка: **https://sadaka-pass.vercel.app**

## ✅ Проверка:

После деплоя проверьте API:
```powershell
$headers = @{ Authorization = "Bearer test_token_123" }
Invoke-RestMethod -Uri "https://sadaka-pass.vercel.app/api/stats" -Headers $headers
```

