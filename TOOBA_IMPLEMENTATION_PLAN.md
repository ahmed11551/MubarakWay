# 🚀 План реализации фишек Tooba

## ✅ Что уже сделано

1. **Улучшенное отображение прогресса**
   - Формат "нужно / собрали" как в Tooba
   - Визуальное выделение собранной суммы
   - Градиентный прогресс-бар

2. **Функциональная кнопка "Поделиться"**
   - Web Share API для нативных приложений
   - Fallback на копирование в буфер обмена
   - Визуальный feedback при успехе

3. **Кнопка закладок/избранного**
   - Сохранение кампаний в закладки
   - Визуальное состояние (заполненная/пустая иконка)
   - Интеграция с Supabase (когда таблица будет создана)

4. **Disclaimer о превышении суммы**
   - Информация о направлении избыточных средств
   - Визуальное выделение

5. **Раздел "Документы"**
   - Поддержка документов для прозрачности
   - Ссылки на PDF/файлы

---

## 🔴 Что нужно сделать дальше

### Приоритет 1: Рейтинговая система (2-3 дня)

#### Шаг 1: База данных
```sql
-- Таблица для рейтингов
CREATE TABLE user_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  total_donated numeric(12,2) DEFAULT 0,
  referral_count integer DEFAULT 0,
  period_type text CHECK (period_type IN ('all_time', 'ramadan')),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, period_type)
);

-- Таблица для закладок
CREATE TABLE user_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, campaign_id)
);

-- Индексы
CREATE INDEX user_ratings_user_id_idx ON user_ratings(user_id);
CREATE INDEX user_ratings_period_type_idx ON user_ratings(period_type);
CREATE INDEX user_ratings_total_donated_idx ON user_ratings(total_donated DESC);
CREATE INDEX user_bookmarks_user_id_idx ON user_bookmarks(user_id);
```

#### Шаг 2: Генерация аватаров животных
- Создать функцию `generateAnimalAvatar(userId: string)`
- Использовать детерминированный алгоритм
- Набор иконок: орлан, гагара, белка, трогон, черепаха, дрофа, кроншнеп

#### Шаг 3: UI компоненты
- Страница `/rating`
- Компоненты: `RatingTabs`, `RatingTypeTabs`, `RatingList`
- Выделение позиции пользователя

---

### Приоритет 2: Комментарии и лайки (2 дня)

#### Шаг 1: База данных
```sql
-- Таблица для лайков
CREATE TABLE campaign_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, campaign_id)
);

-- Таблица для комментариев
CREATE TABLE campaign_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Индексы
CREATE INDEX campaign_likes_campaign_id_idx ON campaign_likes(campaign_id);
CREATE INDEX campaign_comments_campaign_id_idx ON campaign_comments(campaign_id);
CREATE INDEX campaign_comments_created_at_idx ON campaign_comments(created_at DESC);
```

#### Шаг 2: UI компоненты
- `CampaignLikes` - счетчик и кнопка лайка
- `CampaignComments` - форма и список комментариев
- Интеграция на страницу кампании

---

### Приоритет 3: UX улучшения (3-4 дня)

#### Шаг 1: Визуальная иерархия
- Аудит всех страниц
- Улучшение цветовых акцентов
- Добавление визуальных разделителей

#### Шаг 2: Навигация
- Улучшение табов
- Улучшение кнопок CTA
- Breadcrumbs где нужно

#### Шаг 3: Микро-интеракции
- Анимации при наведении
- Skeleton loaders
- Плавные transitions

---

## 📋 Чеклист реализации

### Рейтинговая система
- [ ] Создать таблицы в БД
- [ ] Создать RLS политики
- [ ] Функция расчета рейтинга
- [ ] Генерация аватаров животных
- [ ] Страница `/rating`
- [ ] Компоненты UI
- [ ] Интеграция с пожертвованиями

### Комментарии и лайки
- [ ] Создать таблицы в БД
- [ ] Создать RLS политики
- [ ] Компонент `CampaignLikes`
- [ ] Компонент `CampaignComments`
- [ ] Интеграция на страницу кампании

### UX улучшения
- [ ] Аудит главной страницы
- [ ] Аудит страницы кампаний
- [ ] Аудит страницы профиля
- [ ] Аудит страницы фондов
- [ ] Улучшение всех страниц

---

## 🎯 Цель

**Сделать MubarakWay лучше Tooba по UX и функциональности!**

