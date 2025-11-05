-- Create subscriptions table for recurring subscription payments
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier text not null check (tier in ('mutahsin_pro', 'sahib_al_waqf_premium')),
  status text default 'active' check (status in ('active', 'cancelled', 'expired', 'paused')),
  amount numeric(10, 2) not null,
  currency text default 'USD',
  billing_frequency text not null check (billing_frequency in ('monthly', 'yearly')),
  next_billing_date timestamptz,
  started_at timestamptz default now(),
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.subscriptions enable row level security;

-- Users can view their own subscriptions
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Users can insert their own subscriptions
create policy "subscriptions_insert_own"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

-- Users can update their own subscriptions
create policy "subscriptions_update_own"
  on public.subscriptions for update
  using (auth.uid() = user_id);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function public.handle_updated_at();
