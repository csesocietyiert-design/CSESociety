# Setup Supabase Database for CSE Society Portal

## Status: ✅ Environment Credentials Configured

Your `.env.local` now has real Supabase credentials pointing to:
- **Project:** zapbeeibgweptmvsnkyf
- **URL:** https://zapbeeibgweptmvsnkyf.supabase.co

## Step 1: Create Database Tables

Run this SQL in Supabase SQL Editor:

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (bottom left menu)
4. Click **New Query**
5. Paste the SQL from `SUPABASE_MIGRATION.sql`
6. Click **Run**

The SQL creates:
- `users` table with encrypted passwords
- `cse_id_counter` table for auto-generating CSE IDs
- Required indexes for performance

## Step 2: Test Registration

1. Dev server should auto-reload (if not, restart with `npm run dev`)
2. Go to http://localhost:3000/register
3. Fill form:
   - Name: Your name
   - Email: your@email.com
   - Year: 1st Year
   - Password: At least 6 characters
4. Click "Create Account"

## Step 3: Verify Data in Supabase

1. Go to Supabase Dashboard
2. Click **Table Editor** (left sidebar)
3. Select **users** table
4. You should see your registered user with:
   - Auto-generated CSE ID (e.g., 26F0101)
   - Encrypted password hash (NOT readable)
   - Your email
   - Year and role

## Step 4: Test Login

1. Go to http://localhost:3000/login
2. Enter:
   - CSE ID: The one generated from registration
   - Password: The password you used during registration
3. Should redirect to dashboard

## Security Features ✅

- Passwords encrypted with **bcryptjs** (industry standard)
- Each password has unique salt
- Passwords cannot be decrypted, only verified
- CSE ID auto-generated with algorithm: YYssNN
  - YY = 2-digit year (23, 24, 25, 26)
  - ss = session number (01, 02, etc.)
  - NN = sequence (01, 02, 03, etc.)

## Troubleshooting

**Error: "relation 'public.users' does not exist"**
- Tables haven't been created yet
- Run the SQL migration from SUPABASE_MIGRATION.sql

**Error: "Invalid CSE ID or password"**
- Make sure you entered CSE ID and password correctly (case-sensitive)
- Check that user exists in Supabase Table Editor

**New registrations not appearing in Supabase**
- Env credentials not loaded: restart dev server with `npm run dev`
- Check browser console for errors (F12)
- Verify NEXT_PUBLIC_SUPABASE_URL contains real URL (not placeholder)

**Password not being encrypted**
- Check if bcryptjs is installed: `npm list bcryptjs`
- If missing: `npm install bcryptjs`
