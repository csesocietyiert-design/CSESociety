# CSE Society Auth + ID System - Full Setup Guide

Note ID: `AUTH-2026-08-15`

This project has been updated so the authentication flow and CSE Society ID generation work correctly. The EIS auth was not working properly, so the project was fixed to use a working Supabase-based login/register flow.

## 1) Current Status

The system is now set up to:
- register users with a secure backend API
- hash passwords with bcrypt
- log in using the CSE ID and password
- auto-generate CSE Society IDs
- auto-calculate the admission year based on the selected academic year
- show the CSE ID on the member dashboard

## 2) Required Supabase Database Setup

Open the Supabase SQL editor and run the following SQL.

### A. Create the missing counter table

If you see this error:

```sql
ERROR: relation "cse_id_counter" does not exist
```

run this first:

```sql
CREATE TABLE IF NOT EXISTS cse_id_counter (
  year INTEGER NOT NULL,
  session_num INTEGER NOT NULL DEFAULT 1,
  sequence_num INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (year)
);

INSERT INTO cse_id_counter (year, session_num, sequence_num)
VALUES (2023, 1, 0), (2024, 1, 0), (2025, 1, 0), (2026, 1, 0)
ON CONFLICT (year) DO NOTHING;
```

### B. Add admission year column to users

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS admission_year INTEGER;

COMMENT ON COLUMN users.admission_year IS 'Year the student was admitted to college (e.g., 2023)';
```

### C. Ensure all required user fields exist

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS cse_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_year INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
```

## 3) Reset the Database for Fresh Testing

If you want to delete all users and start fresh, run:

```sql
DELETE FROM users;
DELETE FROM cse_id_counter;

INSERT INTO cse_id_counter (year, session_num, sequence_num)
VALUES (2023, 1, 0), (2024, 1, 0), (2025, 1, 0), (2026, 1, 0)
ON CONFLICT (year) DO UPDATE SET sequence_num = 0;
```

## 4) CSE ID Format

The ID format is:

```text
YY + Y + SS + NN
```

Example:
- `23F2601`
- `24S2601`
- `25T2601`
- `26R2601`

Where:
- `YY` = last two digits of admission year
- `Y` = current year letter
  - `1` → `F`
  - `2` → `S`
  - `3` → `T`
  - `4` → `R`
- `SS` = session code, currently `26`
- `NN` = sequence number, starting from `01`

## 5) Auto-Admission Year Logic

When the user selects their current academic year, the admission year is auto-calculated.

Example:
- If user selects `1st Year`, admission year becomes `2026`
- If user selects `2nd Year`, admission year becomes `2025`
- If user selects `3rd Year`, admission year becomes `2024`
- If user selects `4th Year`, admission year becomes `2023`

This logic is implemented in the registration form.

## 6) Registration Flow

When a user registers:
1. Enter name, email, password, confirm password
2. Select current academic year
3. Admission year is auto-filled
4. The backend generates a unique CSE ID
5. Password is hashed before storage
6. The user is created in Supabase

## 7) Login Flow

Users log in using:
- CSE ID
- password

The login API verifies the user in the `users` table and compares the password hash using bcrypt.

## 8) Dashboard Behavior

After login, the dashboard shows:
- the user profile
- the generated CSE ID
- the current academic year
- the role information

## 9) Important Notes

- The project uses the Supabase service role key on the backend for secure queries.
- RLS on the `users` table should be disabled or carefully configured for this app workflow.
- If the app still shows auth errors, confirm that the `users` table exists and the env values are correct.

## 10) Final Status

The auth system and CSE ID generation are now working properly for the project. The EIS auth issue was resolved by switching to a working Supabase-backed auth flow and a stable CSE ID generator.

---

This setup is complete and ready for fresh testing.

