# Quick Supabase Setup Guide

## Step 1: Create Supabase Project (5 minutes)

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - Organization: Select or create one
   - Project name: `cse-society`
   - Database password: Create strong password (save it!)
   - Region: Choose closest to you
   - Click "Create new project"
4. Wait for project to be created (5-10 minutes)

## Step 2: Get Your Credentials

1. Project dashboard → click "Connect" button
2. Copy: **Project URL** (looks like: https://your-project.supabase.co)
3. Go to Settings → API → Copy **anon public** key

## Step 3: Update Your .env.local File

Replace values in `shuffal/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Create Database Tables

1. In Supabase dashboard, go to SQL Editor
2. Click "New Query"
3. Paste this SQL:

```sql
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
```

4. Click "Run"

## Step 5: Test Registration

1. Restart dev server: `npm run dev`
2. Go to http://localhost:3000/register
3. Create new account
4. In Supabase dashboard → Table Editor → Select "users" table
5. You should see your registered user with encrypted password!

## Verify Password Encryption

- Passwords are encrypted with **bcryptjs** (industry standard)
- Never stored in plain text
- Cannot be decrypted (only verified against hash)
- Each password has unique salt

## Demo Credentials (Fallback Mode)

If Supabase is NOT configured, you can still login with:
- ID: 23F2601 | Pass: admin123
- ID: 23F2602 | Pass: user123
- ID: 23F2603 | Pass: exec123

But registrations won't save! Set up Supabase to persist data.
