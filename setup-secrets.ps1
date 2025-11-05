# Скрипт для добавления секретов в GitHub
# Запустите: .\setup-secrets.ps1

# ВАЖНО: Замените YOUR_VERCEL_TOKEN на реальный токен из https://vercel.com/account/tokens
$VERCEL_TOKEN = "YOUR_VERCEL_TOKEN"

# Известные значения
$VERCEL_ORG_ID = "team_y1QCs5r5OPnKKuHRQJYVUvEX"
$VERCEL_PROJECT_ID = "prj_VsqHkoeM952J8v5lmYfzFl4CaBPu"
$TELEGRAM_BOT_TOKEN = "8417046320:AAF6TExdeJiSq3xK0Cy2GhL8KVRrvZf7UWQ"
$TELEGRAM_SECRET_TOKEN = "1f2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7081a9b0c1d2e3f40516"
$API_AUTH_TOKEN = "test_token_123"

Write-Host "Добавление секретов в GitHub..." -ForegroundColor Green

# Проверка наличия GitHub CLI
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "GitHub CLI не установлен. Установите: https://cli.github.com/" -ForegroundColor Red
    exit 1
}

# Добавление секретов
gh secret set VERCEL_ORG_ID --body $VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID --body $VERCEL_PROJECT_ID
if ($VERCEL_TOKEN -ne "YOUR_VERCEL_TOKEN") {
    gh secret set VERCEL_TOKEN --body $VERCEL_TOKEN
}
gh secret set TELEGRAM_BOT_TOKEN --body $TELEGRAM_BOT_TOKEN
gh secret set TELEGRAM_SECRET_TOKEN --body $TELEGRAM_SECRET_TOKEN
gh secret set API_AUTH_TOKEN --body $API_AUTH_TOKEN

Write-Host "`nГотово! Не забудьте добавить:" -ForegroundColor Yellow
Write-Host "- NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Yellow
Write-Host "- SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
Write-Host "- VERCEL_TOKEN (если еще не добавлен)" -ForegroundColor Yellow

