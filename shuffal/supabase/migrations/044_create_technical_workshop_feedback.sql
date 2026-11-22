CREATE TABLE IF NOT EXISTS public.technical_workshop_feedback_otps (
  society_id VARCHAR(20) PRIMARY KEY,
  member_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_sent_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  verified_token_hash TEXT,
  used_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.technical_workshop_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL DEFAULT 'technical-workshop-meetup-2026',
  member_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  society_id VARCHAR(20) NOT NULL,
  overall_rating SMALLINT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  content_rating SMALLINT NOT NULL CHECK (content_rating BETWEEN 1 AND 5),
  speaker_rating SMALLINT NOT NULL CHECK (speaker_rating BETWEEN 1 AND 5),
  organization_rating SMALLINT NOT NULL CHECK (organization_rating BETWEEN 1 AND 5),
  highlight TEXT NOT NULL,
  suggestions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_key, member_user_id)
);

ALTER TABLE public.technical_workshop_feedback_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_workshop_feedback ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
