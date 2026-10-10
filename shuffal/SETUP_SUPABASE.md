# Supabase Setup Guide for CSE Society Portal

## Prerequisites
- Supabase account (create at https://supabase.com)
- Node.js and npm installed

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Enter project details:
   - Project name: `cse-society`
   - Database password: Create a strong password
   - Region: Select your closest region
4. Wait for project to be created (5-10 minutes)

## Step 2: Get Credentials

1. Go to Project Settings → API
2. Copy these values:
   - `Project URL` → NEXT_PUBLIC_SUPABASE_URL
   - `anon public` key → NEXT_PUBLIC_SUPABASE_ANON_KEY

## Step 3: Set Up Environment Variables

1. Create a file `.env.local` in the project root:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Replace placeholders with actual values from Step 2

## Step 4: Create Database Schema

1. Go to Supabase dashboard → SQL Editor
2. Create a new query and run the SQL from `supabase/migrations/001_init.sql`
3. This will create:
   - `users` table with proper schema
   - `cse_id_counter` table for ID generation
   - Required indexes

## Step 5: Test the Application

1. Start the development server:
```bash
npm run dev
```

2. Navigate to http://localhost:3000/register
3. Create a new account:
   - Name: Enter any name
   - Email: Enter a valid email
   - Year: Select 1st-4th year
   - Password: At least 6 characters
   - CSE ID will be auto-generated

## CSE ID Algorithm (YYYssNN)

- **YYY**: Last 2 digits of admission year (23 for 2023)
- **ss**: Current session number (session starts from 01)
- **NN**: Sequential counter for that year/session (01, 02, 03...)

Example: `23F0101` means:
- Admitted in 2023
- Session: F (Friday)
- Sequence: 01 (first member that session)

## Database Schema Details

### Users Table
- `id`: UUID primary key
- `cse_id`: Unique CSE Society ID (YYYssNN format)
- `name`: Full name
- `email`: Email address (unique)
- `year`: Academic year (1-4)
- `password_hash`: Hashed password (never stored as plain text)
- `role`: User role (member, admin, executive, secretary, treasurer, yearRep, faculty)
- `department`: Department (default: CSE)
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

### CSE ID Counter Table
- `year`: Academic year (primary key)
- `session_num`: Current session number
- `sequence_num`: Latest sequence number for that year
- `last_updated`: Timestamp of last ID generation

## Attendance Management

1. In the Supabase SQL Editor, run `supabase/migrations/028_create_attendance_tables.sql` after the existing `users` table migrations.
2. Run `supabase/migrations/029_add_attendance_approval.sql` to add the admin approval workflow.
3. Run `supabase/migrations/030_allow_admin_manual_attendance.sql` to allow admin manual check-ins.
4. Sign in to the portal and open `/dashboard/attendance` to view sessions. General, Cultural, and Technical Secretaries can create or edit pending sessions and mark attendance with the QR scanner; an admin approves or deletes sessions and can manually mark attendance; other authenticated users have read-only access.
5. Once an admin approves a session, its event name and date cannot be edited by anyone. Only an admin can delete the session.
6. Open a session card to scan a member QR code or enter their Society ID manually. The QR code should contain the Society ID as plain text, as JSON using `societyId`/`cseId`, or as a URL query parameter using `societyId`/`cseId`.
7. Session attendee lists refresh automatically while open. Duplicate check-ins for the same member and session are rejected.

The API verifies the signed `cse_session` cookie and looks up the user role in `users`; it does not trust a role or user ID submitted by the browser. Attendance endpoints require `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to be configured.

## Security Features

✓ Passwords are hashed using PBKDF2 with salt
✓ Never stored or displayed in plain text
✓ Unique email and CSE ID constraints
✓ Role-based access control

## Troubleshooting

### Error: "No matching schema"
- Run the SQL migration again in Supabase SQL Editor
- Make sure you ran the complete `001_init.sql` file

### Error: "Invalid credentials"
- Verify `.env.local` has correct Supabase URL and key
- Check that NEXT_PUBLIC_ prefix is included
- Restart development server after changing .env

### Login fails with correct credentials
- Check browser console for specific error
- Verify user exists in Supabase dashboard → Authentication tab
- Confirm password matches (case-sensitive)

## Next Steps

1. Set up login with demo accounts in database
2. Implement role-based dashboard views
3. Add member management features
4. Set up event management system
5. Implement certificate system
