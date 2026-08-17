CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  drive_link TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificates_created_by ON certificates(created_by);
CREATE INDEX IF NOT EXISTS idx_certificates_created_at ON certificates(created_at);
CREATE INDEX IF NOT EXISTS idx_certificates_date ON certificates(date DESC);
