CREATE TABLE IF NOT EXISTS public.workshop_registration_settings (
  event_key TEXT PRIMARY KEY,
  closes_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

ALTER TABLE public.workshop_registration_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.workshop_registration_settings (event_key, closes_at)
VALUES ('technical-workshop-meetup-2026', '2026-11-23 17:00:00+05:30')
ON CONFLICT (event_key) DO NOTHING;
