-- Capital liquidation requests — principal return requires admin approval.
-- Does not alter investment accrual math; only adds review workflow.

create table if not exists public.capital_liquidation_requests (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  principal_amount numeric(18, 2) not null check (principal_amount > 0),
  reason text not null,
  comments text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'more_info')),
  admin_note text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists capital_liquidation_requests_status_idx
  on public.capital_liquidation_requests (status, created_at desc);

create index if not exists capital_liquidation_requests_user_idx
  on public.capital_liquidation_requests (user_id, created_at desc);

create unique index if not exists capital_liquidation_requests_one_pending_per_investment
  on public.capital_liquidation_requests (investment_id)
  where status = 'pending';

alter table public.capital_liquidation_requests enable row level security;

create policy capital_liquidation_select_own
  on public.capital_liquidation_requests
  for select
  to authenticated
  using (user_id = auth.uid() or public.has_admin_role());

create policy capital_liquidation_insert_own
  on public.capital_liquidation_requests
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy capital_liquidation_admin_update
  on public.capital_liquidation_requests
  for update
  to authenticated
  using (public.has_admin_role());

grant select, insert, update on public.capital_liquidation_requests to authenticated;
grant all on public.capital_liquidation_requests to service_role;
