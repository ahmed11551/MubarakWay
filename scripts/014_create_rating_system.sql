-- Создание рейтинговой системы (Приоритет 1)
-- Общий рейтинг и Рейтинг Рамадана
-- Топ доноров и Топ по ссылкам

-- Таблица для рейтингов пользователей
CREATE TABLE IF NOT EXISTS public.user_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_donated numeric(12,2) DEFAULT 0,
  referral_count integer DEFAULT 0,
  period_type text NOT NULL CHECK (period_type IN ('all_time', 'ramadan')),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, period_type)
);

-- Таблица для закладок пользователей
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, campaign_id)
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS user_ratings_user_id_idx ON public.user_ratings(user_id);
CREATE INDEX IF NOT EXISTS user_ratings_period_type_idx ON public.user_ratings(period_type);
CREATE INDEX IF NOT EXISTS user_ratings_total_donated_idx ON public.user_ratings(total_donated DESC);
CREATE INDEX IF NOT EXISTS user_ratings_referral_count_idx ON public.user_ratings(referral_count DESC);
CREATE INDEX IF NOT EXISTS user_bookmarks_user_id_idx ON public.user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS user_bookmarks_campaign_id_idx ON public.user_bookmarks(campaign_id);

-- RLS политики для рейтингов
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать рейтинги
CREATE POLICY "user_ratings_select_all"
  ON public.user_ratings FOR SELECT
  USING (true);

-- Политика: только система может обновлять рейтинги (через service role)
-- Пользователи не могут напрямую изменять свои рейтинги

-- RLS политики для закладок
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи могут читать только свои закладки
CREATE POLICY "user_bookmarks_select_own"
  ON public.user_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- Политика: авторизованные пользователи могут добавлять закладки
CREATE POLICY "user_bookmarks_insert_authenticated"
  ON public.user_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Политика: пользователи могут удалять свои закладки
CREATE POLICY "user_bookmarks_delete_own"
  ON public.user_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Функция для автоматического обновления рейтинга при пожертвовании
CREATE OR REPLACE FUNCTION update_user_rating_on_donation()
RETURNS TRIGGER AS $$
BEGIN
  -- Обновляем рейтинг только для завершенных пожертвований
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Обновляем общий рейтинг
    INSERT INTO public.user_ratings (user_id, total_donated, period_type, updated_at)
    VALUES (NEW.donor_id, NEW.amount, 'all_time', now())
    ON CONFLICT (user_id, period_type) 
    DO UPDATE SET 
      total_donated = user_ratings.total_donated + NEW.amount,
      updated_at = now();
    
    -- Обновляем рейтинг Рамадана (если пожертвование в период Рамадана)
    -- TODO: Добавить проверку даты Рамадана
    -- Пока обновляем для всех пожертвований
    INSERT INTO public.user_ratings (user_id, total_donated, period_type, updated_at)
    VALUES (NEW.donor_id, NEW.amount, 'ramadan', now())
    ON CONFLICT (user_id, period_type) 
    DO UPDATE SET 
      total_donated = user_ratings.total_donated + NEW.amount,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматического обновления рейтинга
DROP TRIGGER IF EXISTS donations_update_rating_trigger ON public.donations;
CREATE TRIGGER donations_update_rating_trigger
  AFTER INSERT OR UPDATE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating_on_donation();

-- Функция для получения топа доноров
CREATE OR REPLACE FUNCTION get_top_donors(
  period text DEFAULT 'all_time',
  limit_count integer DEFAULT 100
)
RETURNS TABLE (
  user_id uuid,
  total_donated numeric,
  rank bigint,
  display_name text,
  avatar_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ur.user_id,
    ur.total_donated,
    ROW_NUMBER() OVER (ORDER BY ur.total_donated DESC) as rank,
    p.display_name,
    p.avatar_url
  FROM public.user_ratings ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.period_type = period
  ORDER BY ur.total_donated DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для получения топа по реферальным ссылкам
CREATE OR REPLACE FUNCTION get_top_referrals(
  period text DEFAULT 'all_time',
  limit_count integer DEFAULT 100
)
RETURNS TABLE (
  user_id uuid,
  referral_count integer,
  rank bigint,
  display_name text,
  avatar_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ur.user_id,
    ur.referral_count,
    ROW_NUMBER() OVER (ORDER BY ur.referral_count DESC) as rank,
    p.display_name,
    p.avatar_url
  FROM public.user_ratings ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.period_type = period
  ORDER BY ur.referral_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

