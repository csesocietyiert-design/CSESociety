-- Recommended notifications schema repair
-- Safe for fresh installs and partially migrated databases.

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  recipient_type VARCHAR(50) DEFAULT 'specific',
  target_year INTEGER,
  target_role VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS title VARCHAR(255);

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS message TEXT;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'info';

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS sender_id UUID;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(50) DEFAULT 'specific';

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS target_year INTEGER;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS target_role VARCHAR(50);

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill legacy column names if your project previously used a different schema.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'member_id'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'user_id'
  ) THEN
    UPDATE public.notifications
    SET user_id = member_id
    WHERE user_id IS NULL AND member_id IS NOT NULL;
  END IF;
END $$;

-- Older installs may retain a required member_id linked to the obsolete members table.
-- user_id is the current recipient relationship, so legacy rows must not block inserts.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'member_id'
  ) THEN
    ALTER TABLE public.notifications
      ALTER COLUMN member_id DROP NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'payload'
  ) THEN
    UPDATE public.notifications
    SET
      title = COALESCE(title, payload->>'title', payload->>'subject', 'Notification'),
      message = COALESCE(message, payload->>'message', payload->>'body', ''),
      type = COALESCE(type, payload->>'type', 'info')
    WHERE title IS NULL OR message IS NULL OR type IS NULL;
  END IF;
END $$;

-- Normalize nullable values so the app can safely read and write.
UPDATE public.notifications
SET title = COALESCE(title, 'Notification')
WHERE title IS NULL;

UPDATE public.notifications
SET message = COALESCE(message, '')
WHERE message IS NULL;

UPDATE public.notifications
SET type = COALESCE(type, 'info')
WHERE type IS NULL;

UPDATE public.notifications
SET is_read = COALESCE(is_read, FALSE)
WHERE is_read IS NULL;

UPDATE public.notifications
SET recipient_type = COALESCE(recipient_type, 'specific')
WHERE recipient_type IS NULL;

-- Set required constraints after backfilling.
ALTER TABLE public.notifications
  ALTER COLUMN user_id TYPE UUID USING user_id;

ALTER TABLE public.notifications
  ALTER COLUMN title SET NOT NULL;

ALTER TABLE public.notifications
  ALTER COLUMN message SET NOT NULL;

ALTER TABLE public.notifications
  ALTER COLUMN type SET DEFAULT 'info';

ALTER TABLE public.notifications
  ALTER COLUMN is_read SET DEFAULT FALSE;

ALTER TABLE public.notifications
  ALTER COLUMN recipient_type SET DEFAULT 'specific';

ALTER TABLE public.notifications
  ALTER COLUMN title SET DATA TYPE VARCHAR(255);

ALTER TABLE public.notifications
  ALTER COLUMN recipient_type SET DATA TYPE VARCHAR(50);

-- Only add the check constraints if they do not already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'notifications_type_check'
      AND conrelid = 'public.notifications'::regclass
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_type_check
      CHECK (type IN ('info', 'success', 'warning', 'error'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'notifications_recipient_type_check'
      AND conrelid = 'public.notifications'::regclass
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_recipient_type_check
      CHECK (recipient_type IN ('all', 'role', 'year_representative', 'specific'));
  END IF;
END $$;

-- Keep the table compatible with the app expectations.
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_sender_id_fkey;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON public.notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_type ON public.notifications(recipient_type);

-- The app uses its own local auth session, so the browser has no Supabase auth.uid().
-- Keep inserts server-only while allowing the dashboard to read notification rows.
GRANT SELECT ON public.notifications TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'notifications_read_for_dashboard'
  ) THEN
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    CREATE POLICY notifications_read_for_dashboard
      ON public.notifications
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
