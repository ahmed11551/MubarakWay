# Запуск MubarakWay в Docker

## Быстрый старт

### 1. Создайте файл `.env.local`

Скопируйте `env.example` в `.env.local` и заполните необходимые переменные:

```bash
cp env.example .env.local
```

**Минимально необходимые переменные:**
- `NEXT_PUBLIC_SUPABASE_URL` - URL вашего Supabase проекта
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key из Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key из Supabase

### 2. Запустите Docker Compose

```bash
# Сборка и запуск
docker-compose up -d --build

# Просмотр логов
docker-compose logs -f app

# Остановка
docker-compose down
```

### 3. Откройте приложение

Приложение будет доступно по адресу: http://localhost:3000

## Полезные команды

```bash
# Пересобрать образ
docker-compose build --no-cache

# Перезапустить контейнер
docker-compose restart app

# Войти в контейнер
docker-compose exec app sh

# Просмотр логов
docker-compose logs -f --tail=100 app

# Остановить и удалить контейнеры
docker-compose down

# Остановить и удалить контейнеры + volumes
docker-compose down -v
```

## Переменные окружения

Все переменные окружения настраиваются в файле `.env.local` или через `docker-compose.yml`.

См. `env.example` для полного списка переменных.

## Troubleshooting

### Проблема: Контейнер не запускается

```bash
# Проверьте логи
docker-compose logs app

# Проверьте, что порт 3000 свободен
lsof -i :3000
```

### Проблема: Ошибки при сборке

```bash
# Очистите кеш Docker
docker system prune -a

# Пересоберите без кеша
docker-compose build --no-cache
```

### Проблема: Приложение не подключается к Supabase

Проверьте, что переменные `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` правильно установлены в `.env.local`.

## Production

Для production рекомендуется:

1. Использовать `.env.production` вместо `.env.local`
2. Настроить reverse proxy (nginx/traefik)
3. Использовать Docker secrets для чувствительных данных
4. Настроить мониторинг и логирование

