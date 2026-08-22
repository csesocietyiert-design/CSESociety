-- Replace the old demo admin with the current administrator account.

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_year_check;
ALTER TABLE public.users ADD CONSTRAINT users_year_check CHECK (year >= 0 AND year <= 4);

DELETE FROM public.users WHERE cse_id = '23F2601';

INSERT INTO public.users (
  cse_id,
  name,
  email,
  year,
  password_hash,
  role,
  department,
  is_verified
) VALUES (
  '23F2601',
  'Admin User',
  'adm,in@csesociety.com',
  0,
  '$2b$10$/86VVQiwXPSCFtRaCNEEsOSDWt21HSuOklni2za9.Uq66U3vi.Cme',
  'admin',
  'CSE',
  TRUE
);