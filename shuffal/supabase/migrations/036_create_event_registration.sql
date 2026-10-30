CREATE TABLE IF NOT EXISTS public.event_registration_otps (
  society_id VARCHAR(20) PRIMARY KEY REFERENCES public.users(cse_id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_sent_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  verified_token_hash TEXT,
  used_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL DEFAULT 'esports-2026',
  participant_type TEXT NOT NULL CHECK (participant_type IN ('member', 'non_member')),
  member_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  society_id VARCHAR(20),
  full_name VARCHAR(255) NOT NULL,
  college_roll_number VARCHAR(50),
  department VARCHAR(100),
  year INTEGER CHECK (year IS NULL OR (year >= 1 AND year <= 6)),
  whatsapp_phone VARCHAR(25),
  email VARCHAR(255) NOT NULL,
  session_selection TEXT NOT NULL CHECK (session_selection IN ('first_half', 'second_half', 'both')),
  games TEXT[] NOT NULL DEFAULT '{}',
  team_format TEXT NOT NULL CHECK (team_format IN ('solo', 'duo')),
  team_name VARCHAR(80),
  bgmi_ign VARCHAR(80),
  bgmi_uid VARCHAR(40),
  free_fire_ign VARCHAR(80),
  free_fire_uid VARCHAR(40),
  chess_username VARCHAR(80),
  fee_amount INTEGER NOT NULL CHECK (fee_amount IN (0, 30, 40, 60)),
  payment_transaction_id VARCHAR(80),
  payment_screenshot_path TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('waived', 'pending', 'verified', 'rejected')),
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'whatsapp')),
  pass_status TEXT NOT NULL DEFAULT 'pending' CHECK (pass_status IN ('pending', 'sent')),
  pass_token_hash TEXT,
  pass_sent_at TIMESTAMPTZ,
  attendance_status TEXT NOT NULL DEFAULT 'registered' CHECK (attendance_status IN ('registered', 'checked_in', 'no_show')),
  evaluation_score NUMERIC(8, 2),
  evaluation_notes TEXT,
  rules_accepted BOOLEAN NOT NULL DEFAULT FALSE CHECK (rules_accepted),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT event_registration_member_identity CHECK (
    (participant_type = 'member' AND member_user_id IS NOT NULL AND society_id IS NOT NULL)
    OR (participant_type = 'non_member' AND member_user_id IS NULL AND society_id IS NULL)
  ),
  CONSTRAINT event_registration_non_member_payment CHECK (
    (participant_type = 'member' AND fee_amount = 0 AND payment_status = 'waived')
    OR (participant_type = 'non_member' AND fee_amount > 0 AND payment_transaction_id IS NOT NULL AND payment_status <> 'waived')
  ),
  CONSTRAINT event_registration_non_member_phone CHECK (
    participant_type = 'member' OR whatsapp_phone IS NOT NULL
  )
);

ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS member_user_id UUID
  REFERENCES public.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_registrations_member_event
  ON public.event_registrations (event_key, member_user_id)
  WHERE member_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_registrations_transaction_id
  ON public.event_registrations (LOWER(payment_transaction_id))
  WHERE payment_transaction_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_registrations_pass_token
  ON public.event_registrations (pass_token_hash)
  WHERE pass_token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_registrations_roster
  ON public.event_registrations (event_key, participant_type, created_at);

ALTER TABLE public.event_registration_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-payment-proofs',
  'event-payment-proofs',
  FALSE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = FALSE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

NOTIFY pgrst, 'reload schema';
