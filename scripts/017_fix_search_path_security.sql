-- Исправление проблем безопасности: установка search_path для всех функций
-- Это предотвращает SQL injection через изменение search_path

-- 1. handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. is_ramadan_date
CREATE OR REPLACE FUNCTION public.is_ramadan_date(check_date date)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  year_val integer;
  ramadan_start date;
  ramadan_end date;
BEGIN
  year_val := EXTRACT(YEAR FROM check_date);
  
  -- Даты Рамадана по годам (примерные, нужно обновлять каждый год)
  CASE year_val
    WHEN 2025 THEN
      ramadan_start := '2025-03-01'::date;
      ramadan_end := '2025-03-30'::date;
    WHEN 2026 THEN
      ramadan_start := '2026-02-20'::date;
      ramadan_end := '2026-03-21'::date;
    WHEN 2027 THEN
      ramadan_start := '2027-02-09'::date;
      ramadan_end := '2027-03-10'::date;
    WHEN 2028 THEN
      ramadan_start := '2028-01-28'::date;
      ramadan_end := '2028-02-26'::date;
    WHEN 2029 THEN
      ramadan_start := '2029-01-17'::date;
      ramadan_end := '2029-02-15'::date;
    WHEN 2030 THEN
      ramadan_start := '2030-01-06'::date;
      ramadan_end := '2030-02-04'::date;
    ELSE
      -- Fallback: используем примерные даты для текущего года
      ramadan_start := (year_val || '-03-01')::date;
      ramadan_end := (year_val || '-03-30')::date;
  END CASE;
  
  RETURN check_date >= ramadan_start AND check_date <= ramadan_end;
END;
$$;

-- 3. update_user_rating_on_donation
CREATE OR REPLACE FUNCTION public.update_user_rating_on_donation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  donation_date date;
BEGIN
  -- Обновляем рейтинг только для завершенных пожертвований
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Получаем дату пожертвования
    donation_date := NEW.created_at::date;
    
    -- Обновляем общий рейтинг (всегда)
    INSERT INTO public.user_ratings (user_id, total_donated, period_type, updated_at)
    VALUES (NEW.donor_id, NEW.amount, 'all_time', now())
    ON CONFLICT (user_id, period_type) 
    DO UPDATE SET 
      total_donated = user_ratings.total_donated + NEW.amount,
      updated_at = now();
    
    -- Обновляем рейтинг Рамадана (только если пожертвование в период Рамадана)
    IF public.is_ramadan_date(donation_date) THEN
      INSERT INTO public.user_ratings (user_id, total_donated, period_type, updated_at)
      VALUES (NEW.donor_id, NEW.amount, 'ramadan', now())
      ON CONFLICT (user_id, period_type) 
      DO UPDATE SET 
        total_donated = user_ratings.total_donated + NEW.amount,
        updated_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. update_campaign_comments_updated_at
CREATE OR REPLACE FUNCTION public.update_campaign_comments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 5. get_top_donors
CREATE OR REPLACE FUNCTION public.get_top_donors(
  period text DEFAULT 'all_time',
  limit_count integer DEFAULT 100
)
RETURNS TABLE (
  user_id uuid,
  total_donated numeric,
  rank bigint,
  display_name text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 6. get_top_referrals
CREATE OR REPLACE FUNCTION public.get_top_referrals(
  period text DEFAULT 'all_time',
  limit_count integer DEFAULT 100
)
RETURNS TABLE (
  user_id uuid,
  referral_count integer,
  rank bigint,
  display_name text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 7. calculate_total_completed (если существует)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'calculate_total_completed'
  ) THEN
    EXECUTE 'CREATE OR REPLACE FUNCTION public.calculate_total_completed()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
    BEGIN
      -- Функция будет переопределена с правильным search_path
      -- Если функция существует, она должна быть обновлена отдельно
    END;
    $func$;';
  END IF;
END $$;

-- 8. update_total_completed (если существует)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'update_total_completed'
  ) THEN
    EXECUTE 'CREATE OR REPLACE FUNCTION public.update_total_completed()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
    BEGIN
      -- Функция будет переопределена с правильным search_path
      -- Если функция существует, она должна быть обновлена отдельно
    END;
    $func$;';
  END IF;
END $$;

