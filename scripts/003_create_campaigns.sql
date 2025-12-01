-- Create campaigns table for user-created targeted campaigns
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  title_ar text,
  description text not null,
  description_ar text,
  story text,
  story_ar text,
  goal_amount numeric(10, 2) not null,
  current_amount numeric(10, 2) default 0,
  currency text default 'USD' check (currency in ('USD', 'EUR', 'SAR', 'AED')),
  category text not null check (category in ('medical', 'education', 'emergency', 'family', 'community', 'other')),
  image_url text,
  video_url text,
  status text default 'draft' check (status in ('draft', 'pending', 'active', 'completed', 'cancelled')),
  is_verified boolean default false,
  donor_count integer default 0,
  deadline timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.campaigns enable row level security;

-- Anyone can view active campaigns
create policy "campaigns_select_active"
  on public.campaigns for select
  using (status = 'active' or creator_id = auth.uid());

-- Users can create their own campaigns
create policy "campaigns_insert_own"
  on public.campaigns for insert
  with check (auth.uid() = creator_id);

-- Users can update their own campaigns
create policy "campaigns_update_own"
  on public.campaigns for update
  using (auth.uid() = creator_id);

-- Users can delete their own campaigns
create policy "campaigns_delete_own"
  on public.campaigns for delete
  using (auth.uid() = creator_id);

create trigger campaigns_updated_at
  before update on public.campaigns
  for each row
  execute function public.handle_updated_at();
