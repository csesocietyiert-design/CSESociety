CREATE TABLE IF NOT EXISTS public.workshop_registration_otps (
  identity_key TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_sent_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  verified_token_hash TEXT,
  used_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workshop_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL DEFAULT 'technical-workshop-meetup-2026',
  participant_category TEXT NOT NULL CHECK (participant_category IN ('society', 'iert', 'iit_madras')),
  society_id VARCHAR(20),
  member_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  aktu_roll_number VARCHAR(50),
  branch VARCHAR(100),
  year INTEGER,
  whatsapp_phone VARCHAR(25),
  iit_roll_number VARCHAR(50),
  join_chance VARCHAR(20),
  suggestion TEXT,
  fee_amount INTEGER NOT NULL CHECK (fee_amount IN (0, 149)),
  payment_transaction_id VARCHAR(80),
  declaration_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  rules_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  attendance_status TEXT NOT NULL DEFAULT 'registered',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workshop_registrations_category_identity
  ON public.workshop_registrations (
    event_key,
    LOWER(COALESCE(society_id, aktu_roll_number, iit_roll_number, email))
  );

ALTER TABLE public.workshop_registration_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_registrations ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
