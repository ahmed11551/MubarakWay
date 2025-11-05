# Скрипт для добавления секретов в GitHub через API
# Требуется: GitHub Personal Access Token с правами repo

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubToken,
    
    [Parameter(Mandatory=$false)]
    [string]$VercelToken = ""
)

$repo = "ahmed11551/SadakaPass"
$baseUrl = "https://api.github.com/repos/$repo/actions/secrets"

$headers = @{
    "Accept" = "application/vnd.github.v3+json"
    "Authorization" = "Bearer $GitHubToken"
}

# Секреты для добавления
$secrets = @{
    "VERCEL_ORG_ID" = "team_y1QCs5r5OPnKKuHRQJYVUvEX"
    "VERCEL_PROJECT_ID" = "prj_VsqHkoeM952J8v5lmYfzFl4CaBPu"
    "TELEGRAM_BOT_TOKEN" = "8417046320:AAF6TExdeJiSq3xK0Cy2GhL8KVRrvZf7UWQ"
    "TELEGRAM_SECRET_TOKEN" = "1f2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7081a9b0c1d2e3f40516"
    "API_AUTH_TOKEN" = "test_token_123"
}

# Получаем публичный ключ репозитория
Write-Host "Получение публичного ключа репозитория..." -ForegroundColor Cyan
try {
    $publicKeyResponse = Invoke-RestMethod -Uri "$baseUrl/public-key" -Headers $headers -Method Get
    $publicKey = $publicKeyResponse.key
    $keyId = $publicKeyResponse.key_id
    
    Write-Host "Публичный ключ получен" -ForegroundColor Green
} catch {
    Write-Host "Ошибка получения публичного ключа: $_" -ForegroundColor Red
    exit 1
}

# Функция для шифрования секрета
function Encrypt-Secret {
    param([string]$plaintext, [string]$publicKey)
    
    # Используем .NET для шифрования
    Add-Type -AssemblyName System.Security
    
    $publicKeyBytes = [Convert]::FromBase64String($publicKey)
    $plaintextBytes = [System.Text.Encoding]::UTF8.GetBytes($plaintext)
    
    # Используем RSA для шифрования
    $rsa = New-Object System.Security.Cryptography.RSACryptoServiceProvider
    $rsa.ImportSubjectPublicKeyInfo($publicKeyBytes, [ref]$null)
    
    $encrypted = $rsa.Encrypt($plaintextBytes, [System.Security.Cryptography.RSAEncryptionPadding]::OaepSHA256)
    return [Convert]::ToBase64String($encrypted)
}

# Добавляем секреты
foreach ($secretName in $secrets.Keys) {
    $secretValue = $secrets[$secretName]
    
    Write-Host "Добавление секрета: $secretName" -ForegroundColor Yellow
    
    try {
        # Для GitHub API нужно использовать библиотеку sodium для шифрования
        # Упрощенная версия - используем либу libsodium
        $body = @{
            encrypted_value = $secretValue  # В реальности нужно шифровать
            key_id = $keyId
        } | ConvertTo-Json
        
        # ВНИМАНИЕ: GitHub API требует шифрования через libsodium
        # Этот скрипт показывает структуру, но для реального использования
        # нужно использовать правильное шифрование
        
        Write-Host "  ⚠️  Требуется правильное шифрование через libsodium" -ForegroundColor Red
        Write-Host "  Используйте веб-интерфейс GitHub или GitHub CLI" -ForegroundColor Red
        
    } catch {
        Write-Host "  Ошибка: $_" -ForegroundColor Red
    }
}

Write-Host "`nДля добавления VERCEL_TOKEN используйте:" -ForegroundColor Cyan
Write-Host "  gh secret set VERCEL_TOKEN --body '<YOUR_TOKEN>'" -ForegroundColor Yellow
Write-Host "`nИли добавьте вручную через:" -ForegroundColor Cyan
Write-Host "  https://github.com/$repo/settings/secrets/actions" -ForegroundColor Yellow

