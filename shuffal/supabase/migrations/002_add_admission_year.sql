-- Add admission_year column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS admission_year INTEGER;

-- Add a comment to the column
COMMENT ON COLUMN users.admission_year IS 'Year the student was admitted to college (e.g., 2023)';
