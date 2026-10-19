-- TAMBURINS: orders + newsletter.
-- Orders are inserted only by the create-order Edge Function (service role),
-- which re-prices every line from its own catalog. Members can read their
-- own orders; nobody can write orders directly from the browser.

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_no      text not null unique,
  user_id       uuid references auth.users (id) on delete set null,
  channel       text not null default 'online' check (channel in ('online', 'offline')),
  status        text not null default '온라인 구매 완료',
  items         jsonb not null,
  subtotal      integer not null check (subtotal >= 0),
  shipping_fee  integer not null check (shipping_fee >= 0),
  total         integer not null check (total >= 0),
  points        integer not null default 0,
  recipient_name text not null,
  phone         text not null,
  address       text not null,
  address_detail text not null,
  request       text,
  created_at    timestamptz not null default now()
);

create index if not exists orders_user_id_created_at_idx on public.orders (user_id, created_at desc);

alter table public.orders enable row level security;

drop policy if exists "members read own orders" on public.orders;
create policy "members read own orders"
  on public.orders for select
  to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.newsletter_subscribers (
  id         bigint generated always as identity primary key,
  email      text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "anyone can subscribe" on public.newsletter_subscribers;
create policy "anyone can subscribe"
  on public.newsletter_subscribers for insert
  to anon, authenticated
  with check (true);
