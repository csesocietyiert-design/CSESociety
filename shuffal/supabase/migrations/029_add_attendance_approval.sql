ALTER TABLE attendance_sessions
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE attendance_sessions
  DROP CONSTRAINT IF EXISTS attendance_sessions_approval_status_check;

ALTER TABLE attendance_sessions
  ADD CONSTRAINT attendance_sessions_approval_status_check
  CHECK (approval_status IN ('pending', 'approved'));

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_approval_status
  ON attendance_sessions(approval_status, date DESC);
