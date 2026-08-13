-- CSE Society Portal — Supabase Database Schema
-- run this in the Supabase SQL Editor to create all tables

-- enable uuid generation
create extension if not exists "pgcrypto";


-- users (linked to supabase auth.users)

create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  created_at timestamptz default now() not null
);

alter table public.users enable row level security;

create policy "user can read own profile"
  on public.users for select
  using (auth.uid() = id);


-- roles

create table public.roles (
  id uuid default gen_random_uuid() primary key,
  name text not null unique
);

insert into public.roles (name) values
  ('faculty'),
  ('admin'),
  ('vice_president'),
  ('general_secretary'),
  ('treasurer'),
  ('technical_secretary'),
  ('cultural_secretary'),
  ('year_rep_1'),
  ('year_rep_2'),
  ('year_rep_3'),
  ('year_rep_4'),
  ('member');


-- members

create table public.members (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null unique,
  full_name text not null,
  roll_number text not null unique,
  year smallint not null check (year between 1 and 4),
  department text not null,
  phone text,
  profile_photo_url text,
  is_active boolean default true not null,
  created_at timestamptz default now() not null
);

alter table public.members enable row level security;

create policy "member can read own profile"
  on public.members for select
  using (auth.uid() = user_id);

create policy "admin and faculty can read all members"
  on public.members for select
  using (
    exists (
      select 1 from public.member_roles mr
      join public.roles r on r.id = mr.role_id
      where mr.member_id = (
        select id from public.members where user_id = auth.uid()
      )
      and r.name in ('admin', 'faculty', 'vice_president', 'general_secretary')
    )
  );


-- member roles

create table public.member_roles (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.members(id) on delete cascade not null,
  role_id uuid references public.roles(id) not null,
  assigned_at timestamptz default now() not null,
  assigned_by uuid references public.members(id),
  unique (member_id, role_id)
);

alter table public.member_roles enable row level security;

create policy "member can read own role"
  on public.member_roles for select
  using (
    member_id = (select id from public.members where user_id = auth.uid())
  );


-- society ids

create table public.society_ids (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.members(id) on delete cascade not null unique,
  society_id_code text not null unique,
  issued_at timestamptz default now() not null,
  is_active boolean default true not null
);

alter table public.society_ids enable row level security;

create policy "member can read own society id"
  on public.society_ids for select
  using (
    member_id = (select id from public.members where user_id = auth.uid())
  );


-- events

create table public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  event_date timestamptz not null,
  venue text,
  capacity integer,
  created_by uuid references public.members(id) not null,
  status text default 'draft' not null check (status in ('draft', 'published', 'completed', 'cancelled')),
  cover_image_url text,
  created_at timestamptz default now() not null
);

alter table public.events enable row level security;

create policy "authenticated users can read published events"
  on public.events for select
  using (auth.uid() is not null and status = 'published');

create policy "admin and executives can read all events"
  on public.events for select
  using (
    exists (
      select 1 from public.member_roles mr
      join public.roles r on r.id = mr.role_id
      where mr.member_id = (select id from public.members where user_id = auth.uid())
      and r.name in ('admin', 'faculty', 'vice_president', 'general_secretary', 'technical_secretary', 'cultural_secretary')
    )
  );


-- event registrations

create table public.event_registrations (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  member_id uuid references public.members(id) on delete cascade not null,
  registered_at timestamptz default now() not null,
  status text default 'registered' not null check (status in ('registered', 'cancelled', 'attended')),
  unique (event_id, member_id)
);

alter table public.event_registrations enable row level security;

create policy "member can read own registrations"
  on public.event_registrations for select
  using (
    member_id = (select id from public.members where user_id = auth.uid())
  );

create policy "member can register for events"
  on public.event_registrations for insert
  with check (
    member_id = (select id from public.members where user_id = auth.uid())
  );


-- attendance

create table public.attendance (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  member_id uuid references public.members(id) on delete cascade not null,
  marked_by uuid references public.members(id) not null,
  marked_at timestamptz default now() not null,
  status text default 'present' not null check (status in ('present', 'absent')),
  unique (event_id, member_id)
);

alter table public.attendance enable row level security;

create policy "member can read own attendance"
  on public.attendance for select
  using (
    member_id = (select id from public.members where user_id = auth.uid())
  );


-- notifications

create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  message text not null,
  sender_id uuid references public.members(id) not null,
  sender_role text not null,
  recipient_type text not null check (recipient_type in ('all', 'role', 'year_rep', 'specific')),
  recipient_role text,
  created_at timestamptz default now() not null
);

alter table public.notifications enable row level security;

-- notification recipients — one row per recipient per notification

create table public.notification_recipients (
  id uuid default gen_random_uuid() primary key,
  notification_id uuid references public.notifications(id) on delete cascade not null,
  recipient_id uuid references public.members(id) on delete cascade not null,
  is_read boolean default false not null,
  read_at timestamptz,
  unique (notification_id, recipient_id)
);

alter table public.notification_recipients enable row level security;

create policy "recipient can read own notifications"
  on public.notification_recipients for select
  using (
    recipient_id = (select id from public.members where user_id = auth.uid())
  );

create policy "recipient can mark own notifications as read"
  on public.notification_recipients for update
  using (
    recipient_id = (select id from public.members where user_id = auth.uid())
  );

-- enable realtime on notification_recipients
alter publication supabase_realtime add table public.notification_recipients;


-- announcements

create table public.announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  author_id uuid references public.members(id) not null,
  target_role text not null default 'all',
  published_at timestamptz default now() not null,
  is_active boolean default true not null
);

alter table public.announcements enable row level security;

create policy "authenticated users can read active announcements"
  on public.announcements for select
  using (auth.uid() is not null and is_active = true);


-- certificates

create table public.certificates (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.members(id) on delete cascade not null,
  event_id uuid references public.events(id) not null,
  certificate_url text not null,
  issued_at timestamptz default now() not null,
  issued_by uuid references public.members(id) not null
);

alter table public.certificates enable row level security;

create policy "member can read own certificates"
  on public.certificates for select
  using (
    member_id = (select id from public.members where user_id = auth.uid())
  );


-- resources

create table public.resources (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  file_url text not null,
  uploaded_by uuid references public.members(id) not null,
  category text not null,
  created_at timestamptz default now() not null
);

alter table public.resources enable row level security;

create policy "authenticated users can read resources"
  on public.resources for select
  using (auth.uid() is not null);


-- income (treasurer only)

create table public.income (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  amount numeric(10, 2) not null,
  category text not null,
  date date not null,
  description text,
  added_by uuid references public.members(id) not null,
  created_at timestamptz default now() not null
);

alter table public.income enable row level security;

create policy "treasurer and admin can read income"
  on public.income for select
  using (
    exists (
      select 1 from public.member_roles mr
      join public.roles r on r.id = mr.role_id
      where mr.member_id = (select id from public.members where user_id = auth.uid())
      and r.name in ('treasurer', 'admin', 'faculty')
    )
  );


-- expenses (treasurer only)

create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  amount numeric(10, 2) not null,
  category text not null,
  date date not null,
  description text,
  added_by uuid references public.members(id) not null,
  receipt_url text,
  created_at timestamptz default now() not null
);

alter table public.expenses enable row level security;

create policy "treasurer and admin can read expenses"
  on public.expenses for select
  using (
    exists (
      select 1 from public.member_roles mr
      join public.roles r on r.id = mr.role_id
      where mr.member_id = (select id from public.members where user_id = auth.uid())
      and r.name in ('treasurer', 'admin', 'faculty')
    )
  );


-- transactions

create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('income', 'expense')),
  reference_id uuid not null,
  amount numeric(10, 2) not null,
  date date not null,
  created_at timestamptz default now() not null
);

alter table public.transactions enable row level security;

create policy "treasurer and admin can read transactions"
  on public.transactions for select
  using (
    exists (
      select 1 from public.member_roles mr
      join public.roles r on r.id = mr.role_id
      where mr.member_id = (select id from public.members where user_id = auth.uid())
      and r.name in ('treasurer', 'admin', 'faculty')
    )
  );


-- audit logs (insert-only, read by admin/faculty)

create table public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  action text not null,
  performed_by uuid references public.members(id),
  target_table text not null,
  target_id uuid not null,
  details jsonb,
  created_at timestamptz default now() not null
);

alter table public.audit_logs enable row level security;

create policy "admin and faculty can read audit logs"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.member_roles mr
      join public.roles r on r.id = mr.role_id
      where mr.member_id = (select id from public.members where user_id = auth.uid())
      and r.name in ('admin', 'faculty')
    )
  );


-- indexes for performance

create index idx_members_user_id on public.members(user_id);
create index idx_member_roles_member_id on public.member_roles(member_id);
create index idx_society_ids_code on public.society_ids(society_id_code);
create index idx_events_status on public.events(status);
create index idx_event_registrations_member on public.event_registrations(member_id);
create index idx_attendance_member on public.attendance(member_id);
create index idx_notification_recipients_recipient on public.notification_recipients(recipient_id);
create index idx_notification_recipients_read on public.notification_recipients(recipient_id, is_read);
create index idx_announcements_active on public.announcements(is_active);
create index idx_certificates_member on public.certificates(member_id);
create index idx_audit_logs_performed_by on public.audit_logs(performed_by);
