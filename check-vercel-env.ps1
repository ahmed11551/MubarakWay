# Скрипт для проверки и установки переменных окружения в Vercel

$token = "90yDvxTtS7pSJxB6QhfYqp5X"
$projectId = "prj_VsqHkoeM952J8v5lmYfzFl4CaBPu"
$baseUrl = "https://api.vercel.com/v10/projects/$projectId/env"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "Проверка переменных окружения в Vercel..." -ForegroundColor Cyan
Write-Host ""

# Supabase значения (из MCP)
$supabaseUrl = "https://fvxkywczuqincnjilgzd.supabase.co"
$supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGt5d2N6dXFpbmNuamlsZ3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDgwNTYsImV4cCI6MjA3NzkyNDA1Nn0.jBvLDl0T2u-slvf4Uu4oZj7yRWMQCKmiln0mXRU0q54"
$supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGt5d2N6dXFpbmNuamlsZ3pkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjM0ODA1NiwiZXhwIjoyMDc3OTI0MDU2fQ.S7NaVDbxey9V-3lxiTKYh2nsMOkQYK3Rc3TqsbYahOA"

# Список переменных для проверки
$requiredVars = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY"
)

# Получаем текущие переменные
Write-Host "Получение текущих переменных окружения..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method Get -Headers $headers
    $existingVars = $response.envs | Where-Object { $_.key -in $requiredVars }
    
    Write-Host "`nНайденные переменные:" -ForegroundColor Green
    foreach ($var in $existingVars) {
        $value = if ($var.value.Length -gt 50) { $var.value.Substring(0, 50) + "..." } else { $var.value }
        Write-Host "  ✓ $($var.key) = $value (environments: $($var.target -join ', '))" -ForegroundColor Green
    }
    
    $missingVars = $requiredVars | Where-Object { $_ -notin $existingVars.key }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "`nОтсутствующие переменные:" -ForegroundColor Red
        foreach ($var in $missingVars) {
            Write-Host "  ✗ $var" -ForegroundColor Red
        }
        
        Write-Host "`nУстановка отсутствующих переменных..." -ForegroundColor Yellow
        
        # Устанавливаем отсутствующие переменные
        $envVars = @{
            "NEXT_PUBLIC_SUPABASE_URL" = $supabaseUrl
            "NEXT_PUBLIC_SUPABASE_ANON_KEY" = $supabaseAnonKey
            "SUPABASE_SERVICE_ROLE_KEY" = $supabaseServiceKey
        }
        
        foreach ($var in $missingVars) {
            $value = $envVars[$var]
            if ($value) {
                Write-Host "Добавление $var..." -ForegroundColor Yellow
                
                $body = @{
                    key = $var
                    value = $value
                    type = "encrypted"
                    target = @("production", "preview", "development")
                } | ConvertTo-Json
                
                try {
                    $addResponse = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body
                    Write-Host "  ✓ $var добавлена успешно" -ForegroundColor Green
                } catch {
                    Write-Host "  ✗ Ошибка при добавлении $var : $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
    } else {
        Write-Host "`n✓ Все необходимые переменные установлены!" -ForegroundColor Green
    }
    
    # Проверяем, что переменные установлены для production
    Write-Host "`nПроверка production окружения..." -ForegroundColor Yellow
    $productionVars = $existingVars | Where-Object { "production" -in $_.target }
    if ($productionVars.Count -lt $requiredVars.Count) {
        Write-Host "⚠ Некоторые переменные не установлены для production!" -ForegroundColor Yellow
        Write-Host "  Необходимо обновить переменные, чтобы они были доступны в production" -ForegroundColor Yellow
    } else {
        Write-Host "✓ Все переменные доступны в production" -ForegroundColor Green
    }
    
} catch {
    Write-Host "Ошибка при получении переменных: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Попробуйте проверить токен и project ID" -ForegroundColor Yellow
}

Write-Host "`nГотово!" -ForegroundColor Cyan

