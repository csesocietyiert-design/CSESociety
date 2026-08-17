-- Fix certificates table - add missing columns
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE CASCADE;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_certificates_created_by ON certificates(created_by);
CREATE INDEX IF NOT EXISTS idx_certificates_created_at ON certificates(created_at);

-- Ensure event_name, date, and drive_link are NOT NULL
ALTER TABLE certificates 
ALTER COLUMN event_name SET NOT NULL,
ALTER COLUMN date SET NOT NULL,
ALTER COLUMN drive_link SET NOT NULL;
