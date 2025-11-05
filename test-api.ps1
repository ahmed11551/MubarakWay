# Скрипт для проверки работы API

$baseUrl = "http://localhost:3000"

Write-Host "`n=== Проверка API данных ===" -ForegroundColor Cyan
Write-Host ""

# Проверка 1: API Кампаний
Write-Host "1. Проверка /api/campaigns..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/campaigns?status=active&limit=3" -ErrorAction Stop
    Write-Host "   ✅ API работает" -ForegroundColor Green
    Write-Host "   Найдено кампаний: $($response.campaigns.Count)" -ForegroundColor Gray
    if ($response.campaigns.Count -gt 0) {
        Write-Host "   Первая кампания: $($response.campaigns[0].title)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  Нет кампаний в базе (это нормально)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   ⚠️  Убедитесь, что приложение запущено (pnpm dev)" -ForegroundColor Yellow
}

Write-Host ""

# Проверка 2: API Статистики
Write-Host "2. Проверка /api/stats..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer test_token_123" }
    $stats = Invoke-RestMethod -Uri "$baseUrl/api/stats" -Headers $headers -ErrorAction Stop
    Write-Host "   ✅ API работает" -ForegroundColor Green
    Write-Host "   Всего собрано: $($stats.total_collected)" -ForegroundColor Gray
    Write-Host "   Активных доноров: $($stats.active_donors)" -ForegroundColor Gray
    Write-Host "   Активных кампаний: $($stats.active_campaigns)" -ForegroundColor Gray
    Write-Host "   Средний чек: $($stats.average_check)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Проверка 3: Подключение к Supabase
Write-Host "3. Проверка переменных окружения..." -ForegroundColor Yellow
if (Test-Path .env.local) {
    $envContent = Get-Content .env.local -Raw
    if ($envContent -match "NEXT_PUBLIC_SUPABASE_URL") {
        Write-Host "   ✅ .env.local найден" -ForegroundColor Green
        if ($envContent -match "https://.*\.supabase\.co") {
            Write-Host "   ✅ Supabase URL настроен" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Supabase URL не найден в .env.local" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠️  .env.local не содержит Supabase переменных" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ .env.local не найден" -ForegroundColor Red
    Write-Host "   Запустите: .\setup-supabase.ps1" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Готово ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Если приложение не запущено, выполните:" -ForegroundColor Yellow
Write-Host "  pnpm dev" -ForegroundColor White
Write-Host ""

