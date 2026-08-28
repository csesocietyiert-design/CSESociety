-- Repair notification columns required by normal, anonymous, and own-year messages.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sender_id UUID,
  ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(50) DEFAULT 'specific',
  ADD COLUMN IF NOT EXISTS target_year INTEGER,
  ADD COLUMN IF NOT EXISTS target_role VARCHAR(50),
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.notifications
SET
  title = COALESCE(title, 'Notification'),
  message = COALESCE(message, ''),
  type = COALESCE(type, 'info'),
  is_read = COALESCE(is_read, FALSE)
WHERE title IS NULL OR message IS NULL OR type IS NULL OR is_read IS NULL;

UPDATE public.notifications
SET
  recipient_type = COALESCE(recipient_type, 'specific'),
  is_anonymous = COALESCE(is_anonymous, FALSE)
WHERE recipient_type IS NULL OR is_anonymous IS NULL;

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_recipient_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_recipient_type_check
  CHECK (recipient_type IN ('all', 'role', 'year_representative', 'own_year', 'specific'));

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_sender_id_fkey;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON public.notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_type ON public.notifications(recipient_type);
