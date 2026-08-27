-- Admin-controlled opening amount for the shared society fund.
create table if not exists public.finance_settings (
  id integer primary key default 1 check (id = 1),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  updated_by uuid references public.users(id) on delete restrict,
  updated_at timestamptz default now() not null
);

alter table public.finance_settings enable row level security;

insert into public.finance_settings (id, total_amount)
values (1, 0)
on conflict (id) do nothing;
