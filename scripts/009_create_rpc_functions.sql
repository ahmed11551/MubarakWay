-- RPC функции для обновления сумм пожертвований

-- Функция для увеличения общей суммы пожертвований пользователя
create or replace function public.increment_total_donated(
  user_id uuid,
  amount numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set total_donated = total_donated + amount
  where id = user_id;
end;
$$;

-- Функция для увеличения суммы кампании и количества доноров
create or replace function public.increment_campaign_amount(
  campaign_id uuid,
  amount numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.campaigns
  set 
    current_amount = current_amount + amount,
    donor_count = donor_count + 1
  where id = campaign_id;
end;
$$;

-- Функция для увеличения суммы фонда и количества доноров
create or replace function public.increment_fund_amount(
  fund_id uuid,
  amount numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.funds
  set 
    total_raised = total_raised + amount,
    donor_count = donor_count + 1
  where id = fund_id;
end;
$$;

