-- Добавление поддержки документов для кампаний

-- Добавляем поле documents в таблицу campaigns (JSON для хранения массива документов)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'campaigns'
    AND column_name = 'documents'
  ) THEN
    ALTER TABLE public.campaigns
    ADD COLUMN documents jsonb DEFAULT '[]'::jsonb;
    
    COMMENT ON COLUMN public.campaigns.documents IS 'Массив документов в формате [{"name": "Название", "url": "https://..."}]';
  END IF;
END $$;

-- Создаем индекс для поиска по документам (если нужно)
CREATE INDEX IF NOT EXISTS campaigns_documents_idx ON public.campaigns USING gin (documents);

