-- Make the current administrator canonical and keep approval history deletable.
UPDATE public.users
SET
  role = 'admin',
  is_verified = TRUE,
  verified_at = COALESCE(verified_at, NOW()),
  society_session = COALESCE(society_session, '2026-2027'),
  updated_at = NOW()
WHERE id = '70cb33d8-74ec-4bd7-be8c-3230accb9c5b'
  AND cse_id = 'iertcse'
  AND email = 'admin@csesociety.com';

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_verified_by_fkey;

ALTER TABLE public.users
  ADD CONSTRAINT users_verified_by_fkey
  FOREIGN KEY (verified_by)
  REFERENCES public.users(id)
  ON DELETE SET NULL;
