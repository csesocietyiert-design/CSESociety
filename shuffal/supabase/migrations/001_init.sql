CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cse_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1 AND year <= 4),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'executive', 'secretary', 'treasurer', 'yearRep', 'faculty')),
  department VARCHAR(100) DEFAULT 'CSE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_cse_id ON users(cse_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS cse_id_counter (
  year INTEGER PRIMARY KEY,
  session_num INTEGER NOT NULL DEFAULT 1,
  sequence_num INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

INSERT INTO cse_id_counter (year, session_num, sequence_num) VALUES 
  (2023, 1, 0),
  (2024, 1, 0),
  (2025, 1, 0),
  (2026, 1, 0)
ON CONFLICT (year) DO NOTHING;
