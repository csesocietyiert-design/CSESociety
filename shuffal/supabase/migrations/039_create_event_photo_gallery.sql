create table if not exists public.event_photo_albums (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  event_date date not null,
  description text,
  cover_url text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.event_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.event_photo_albums(id) on delete cascade,
  photo_url text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists event_photo_albums_event_date_idx
  on public.event_photo_albums(event_date desc);

create index if not exists event_photos_album_id_idx
  on public.event_photos(album_id, sort_order);
