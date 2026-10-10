CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  attendee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  marked_by_role VARCHAR(50) NOT NULL CHECK (
    marked_by_role IN ('general_secretary', 'cultural_secretary', 'technical_secretary')
  ),
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, attendee_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date
  ON attendance_sessions(date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_marked_at
  ON attendance_records(session_id, marked_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_records_attendee
  ON attendance_records(attendee_id);

ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
