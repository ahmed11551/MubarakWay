-- Создание таблиц для социальных функций кампаний (лайки и комментарии)
-- Приоритет 2: Комментарии и лайки

-- Таблица для лайков кампаний
CREATE TABLE IF NOT EXISTS public.campaign_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, campaign_id)
);

-- Таблица для комментариев кампаний
CREATE TABLE IF NOT EXISTS public.campaign_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_deleted boolean DEFAULT false
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS campaign_likes_campaign_id_idx ON public.campaign_likes(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_likes_user_id_idx ON public.campaign_likes(user_id);
CREATE INDEX IF NOT EXISTS campaign_comments_campaign_id_idx ON public.campaign_comments(campaign_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS campaign_comments_user_id_idx ON public.campaign_comments(user_id);
CREATE INDEX IF NOT EXISTS campaign_comments_created_at_idx ON public.campaign_comments(created_at DESC) WHERE is_deleted = false;

-- RLS политики для лайков
ALTER TABLE public.campaign_likes ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать лайки
CREATE POLICY "campaign_likes_select_all"
  ON public.campaign_likes FOR SELECT
  USING (true);

-- Политика: авторизованные пользователи могут добавлять лайки
CREATE POLICY "campaign_likes_insert_authenticated"
  ON public.campaign_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Политика: пользователи могут удалять свои лайки
CREATE POLICY "campaign_likes_delete_own"
  ON public.campaign_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS политики для комментариев
ALTER TABLE public.campaign_comments ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать комментарии (кроме удаленных)
CREATE POLICY "campaign_comments_select_all"
  ON public.campaign_comments FOR SELECT
  USING (is_deleted = false);

-- Политика: авторизованные пользователи могут добавлять комментарии
CREATE POLICY "campaign_comments_insert_authenticated"
  ON public.campaign_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Политика: пользователи могут обновлять свои комментарии
CREATE POLICY "campaign_comments_update_own"
  ON public.campaign_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Политика: пользователи могут удалять свои комментарии (soft delete)
CREATE POLICY "campaign_comments_delete_own"
  ON public.campaign_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND is_deleted = true);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_campaign_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS campaign_comments_updated_at_trigger ON public.campaign_comments;
CREATE TRIGGER campaign_comments_updated_at_trigger
  BEFORE UPDATE ON public.campaign_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_comments_updated_at();

-- Функция для подсчета лайков кампании
CREATE OR REPLACE FUNCTION get_campaign_likes_count(campaign_uuid uuid)
RETURNS integer AS $$
BEGIN
  RETURN (SELECT COUNT(*)::integer FROM public.campaign_likes WHERE campaign_id = campaign_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для проверки, лайкнул ли пользователь кампанию
CREATE OR REPLACE FUNCTION has_user_liked_campaign(campaign_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.campaign_likes 
    WHERE campaign_id = campaign_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

