# CSE Society Portal — Backend Implementation Plan

## Overview

The tech stack is Next.js + TypeScript + Supabase (PostgreSQL + Auth + Realtime + Storage).

Next.js handles both the frontend and the server-side backend logic through API Routes and Server Actions. There is no separate Express server. The `conflict` folder holds all server-side code organized into `controllers`, `models`, and `src`.

Supabase is the database and auth layer. We connect to it from Next.js server-side code only, never from the client directly.

---

## What the Backend Actually Is

In this stack, the backend means:

- Next.js API Routes (`/api/...`) inside `src/app/api/`
- Server Actions (functions that run on the server, called from components)
- Supabase client (server-side only) for database queries, auth, storage
- Row Level Security (RLS) policies on Supabase for data protection
- TypeScript types and models that define the shape of all data

The `conflict` folder maps to this:

```
conflict/
  src/           → Next.js project root (app router, api routes, server actions)
  models/        → TypeScript type definitions and interfaces for all entities
  controllers/   → Business logic functions (auth, members, events, notifications, etc.)
```

---

## Phase 1 — Project Initialization

Initialize the Next.js project inside `conflict/src`.

```
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

Install Supabase client:

```
npm install @supabase/supabase-js @supabase/ssr
```

Set up environment variables:

```
.env.local
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
```

---

## Phase 2 — Supabase Setup

Create the Supabase project on supabase.com.

Configure two Supabase clients:

1. Browser client — uses anon key, for client-side session management only
2. Server client — uses service role key, for API routes and server actions

File: `conflict/src/lib/supabase/server.ts` — server client  
File: `conflict/src/lib/supabase/client.ts` — browser client  
File: `conflict/src/lib/supabase/middleware.ts` — session refresh middleware

---

## Phase 3 — Database Schema

All tables are created inside Supabase dashboard or via SQL migrations.

### Core Tables

**users** — linked to Supabase Auth (auth.users)
```
id (uuid, references auth.users)
email
created_at
```

**members**
```
id
user_id (references users.id)
full_name
roll_number
year (1, 2, 3, 4)
department
phone
profile_photo_url
is_active
created_at
```

**society_ids**
```
id
member_id
society_id_code  (example: 23F2601)
issued_at
is_active
```

**roles**
```
id
name  (admin, vice_president, general_secretary, treasurer, technical_secretary, cultural_secretary, year_rep_1, year_rep_2, year_rep_3, year_rep_4, member, faculty)
```

**member_roles**
```
id
member_id
role_id
assigned_at
assigned_by
```

---

### Events

**events**
```
id
title
description
event_date
venue
capacity
created_by
status  (draft, published, completed, cancelled)
cover_image_url
created_at
```

**event_registrations**
```
id
event_id
member_id
registered_at
status  (registered, cancelled, attended)
```

**attendance**
```
id
event_id
member_id
marked_by
marked_at
status  (present, absent)
```

---

### Notifications

**notifications**
```
id
title
message
sender_id
sender_role
recipient_type  (all, role, year_rep, specific)
recipient_role  (nullable)
created_at
```

**notification_recipients**
```
id
notification_id
recipient_id
is_read
read_at
```

---

### Finance (Treasurer)

**income**
```
id
title
amount
category
date
description
added_by
created_at
```

**expenses**
```
id
title
amount
category
date
description
added_by
receipt_url
created_at
```

**transactions**
```
id
type  (income, expense)
reference_id
amount
date
created_at
```

---

### Other Tables

**announcements**
```
id
title
content
author_id
target_role  (all, specific role)
published_at
is_active
```

**certificates**
```
id
member_id
event_id
certificate_url
issued_at
issued_by
```

**resources**
```
id
title
file_url
uploaded_by
category
created_at
```

**audit_logs**
```
id
action
performed_by
target_table
target_id
details (jsonb)
created_at
```

---

## Phase 4 — Row Level Security

Enable RLS on every table.

Core rules:

- Users can only read their own profile
- Only admin/faculty can read all members
- Notifications: a user can only read rows in `notification_recipients` where `recipient_id = auth.uid()`
- Only roles with permission can insert into events, announcements, etc.
- Treasurer-only access to income/expenses/transactions
- Audit logs are insert-only from service role

---

## Phase 5 — Models (TypeScript Types)

Location: `conflict/models/`

Files:

```
conflict/models/
  member.ts
  role.ts
  event.ts
  notification.ts
  finance.ts
  announcement.ts
  certificate.ts
  resource.ts
  audit.ts
  index.ts
```

Each file exports TypeScript interfaces matching the database schema.

Example `member.ts`:

```ts
export interface Member {
  id: string
  user_id: string
  full_name: string
  roll_number: string
  year: 1 | 2 | 3 | 4
  department: string
  phone: string
  profile_photo_url: string | null
  is_active: boolean
  created_at: string
}

export interface SocietyId {
  id: string
  member_id: string
  society_id_code: string
  issued_at: string
  is_active: boolean
}
```

---

## Phase 6 — Controllers (Business Logic)

Location: `conflict/controllers/`

Files:

```
conflict/controllers/
  auth.ts
  members.ts
  roles.ts
  events.ts
  attendance.ts
  notifications.ts
  finance.ts
  announcements.ts
  certificates.ts
  resources.ts
  audit.ts
```

These are plain TypeScript functions. Each function receives inputs, interacts with Supabase, and returns results. They are called from API routes or Server Actions.

Example functions in `auth.ts`:

```
getSession()
signIn(email, password)
signOut()
getCurrentUser()
```

Example functions in `members.ts`:

```
getAllMembers()
getMemberById(id)
getMemberByUserId(userId)
getMemberBySocietyId(societyCode)
createMember(data)
updateMember(id, data)
deactivateMember(id)
```

Example functions in `notifications.ts`:

```
sendNotification(senderId, recipientType, recipientTarget, title, message)
getNotificationsForUser(userId)
markAsRead(notificationId, userId)
getNotificationHistory(userId)
```

---

## Phase 7 — API Routes

Location: `conflict/src/app/api/`

Structure:

```
api/
  auth/
    login/route.ts
    logout/route.ts
    session/route.ts
  members/
    route.ts              (GET all, POST create)
    [id]/route.ts         (GET one, PATCH update, DELETE)
    [id]/role/route.ts    (GET role, POST assign role)
  events/
    route.ts
    [id]/route.ts
    [id]/register/route.ts
    [id]/attendance/route.ts
  notifications/
    route.ts
    [id]/read/route.ts
    history/route.ts
  finance/
    income/route.ts
    expenses/route.ts
    transactions/route.ts
  announcements/
    route.ts
    [id]/route.ts
  certificates/
    route.ts
    [id]/route.ts
  resources/
    route.ts
    [id]/route.ts
  admin/
    society-id/route.ts
    audit-logs/route.ts
```

Each route calls the relevant controller function and returns a JSON response.

---

## Phase 8 — Middleware

File: `conflict/src/middleware.ts`

Handles:

- Session refresh on every request using Supabase SSR
- Route protection: redirect unauthenticated users to `/login`
- Role-based route protection: block access to `/admin/*`, `/treasurer/*`, etc. based on the user's role fetched from the database

---

## Phase 9 — Realtime (Notifications)

Supabase Realtime listens to inserts on `notification_recipients` filtered by `recipient_id = current user`.

This is set up on the client side inside the notification panel component. The server side simply writes to the database, and Supabase pushes the update to connected clients automatically.

No additional server setup is needed for this beyond enabling Realtime on the `notification_recipients` table in Supabase.

---

## Phase 10 — Storage

Supabase Storage buckets:

```
profile-photos    (one file per member, public read)
event-covers      (public read)
certificates      (authenticated read, restricted write)
resources         (authenticated read)
receipts          (treasurer + admin only)
```

Upload is handled via Supabase Storage client in server-side controller functions.

---

## Build Order

```
1. Initialize Next.js project inside conflict/src
2. Set up Supabase project and environment variables
3. Create Supabase server/client utility files
4. Write TypeScript models in conflict/models
5. Create all database tables and enable RLS in Supabase
6. Write controllers in conflict/controllers
7. Build API routes in conflict/src/app/api
8. Set up middleware for auth and role protection
9. Configure Supabase Storage buckets
10. Test each API route before moving to the next
```

---

## Open Question

The spec says not to build a separate Express backend. Next.js API routes serve the same purpose. The `conflict` folder holds the Next.js project (which is both frontend and backend in one). The `shuffal` folder is for the separate frontend if needed later, or it may not be needed at all since Next.js handles both.

Confirm if `conflict` should be the full Next.js project (recommended) or if you want a true Express-style separation despite the spec.

