ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_recipient_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_recipient_type_check
  CHECK (recipient_type IN ('all', 'role', 'year_representative', 'own_year', 'specific'));
