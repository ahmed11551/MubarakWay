-- Create campaign_updates table for campaign progress updates
create table if not exists public.campaign_updates (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  title text not null,
  content text not null,
  image_url text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.campaign_updates enable row level security;

-- Anyone can view updates for active campaigns
create policy "campaign_updates_select_all"
  on public.campaign_updates for select
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = campaign_updates.campaign_id
      and (campaigns.status = 'active' or campaigns.creator_id = auth.uid())
    )
  );

-- Campaign creators can insert updates
create policy "campaign_updates_insert_creator"
  on public.campaign_updates for insert
  with check (
    exists (
      select 1 from public.campaigns
      where campaigns.id = campaign_updates.campaign_id
      and campaigns.creator_id = auth.uid()
    )
  );

-- Campaign creators can update their updates
create policy "campaign_updates_update_creator"
  on public.campaign_updates for update
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = campaign_updates.campaign_id
      and campaigns.creator_id = auth.uid()
    )
  );

-- Campaign creators can delete their updates
create policy "campaign_updates_delete_creator"
  on public.campaign_updates for delete
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = campaign_updates.campaign_id
      and campaigns.creator_id = auth.uid()
    )
  );

create index if not exists campaign_updates_campaign_id_idx on public.campaign_updates(campaign_id);
