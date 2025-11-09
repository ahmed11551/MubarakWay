-- Создание таблицы для связи кампаний с проектами (другими кампаниями)
-- Many-to-many relationship между campaigns

CREATE TABLE IF NOT EXISTS public.campaign_project_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  linked_campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, linked_campaign_id),
  CHECK (campaign_id != linked_campaign_id) -- Предотвращаем связь кампании с самой собой
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS campaign_project_links_campaign_id_idx ON public.campaign_project_links(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_project_links_linked_campaign_id_idx ON public.campaign_project_links(linked_campaign_id);

-- RLS политики
ALTER TABLE public.campaign_project_links ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать связи активных кампаний
CREATE POLICY "campaign_project_links_select_all"
  ON public.campaign_project_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_project_links.campaign_id
      AND (campaigns.status = 'active' OR campaigns.creator_id = auth.uid())
    )
  );

-- Политика: создатели кампаний могут добавлять связи
CREATE POLICY "campaign_project_links_insert_creator"
  ON public.campaign_project_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_project_links.campaign_id
      AND campaigns.creator_id = auth.uid()
    )
  );

-- Политика: создатели кампаний могут удалять связи
CREATE POLICY "campaign_project_links_delete_creator"
  ON public.campaign_project_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_project_links.campaign_id
      AND campaigns.creator_id = auth.uid()
    )
  );

