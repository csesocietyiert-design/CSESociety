# CSE Society ID System - Setup Required

## Step 1: Update Database Schema

You need to add the `admission_year` column to the users table.

### Go to Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/zapbeeibgweptmvsnkyf/sql
2. Click "New Query"
3. Copy and paste this SQL:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS admission_year INTEGER;

COMMENT ON COLUMN users.admission_year IS 'Year the student was admitted to college (e.g., 2023)';
```

4. Click "Run"

## Step 2: Update Test Users (Optional)

If you want to test with existing demo users, update them with admission years:

```sql
UPDATE users SET admission_year = 2023 WHERE cse_id LIKE '23%';
UPDATE users SET admission_year = 2024 WHERE cse_id LIKE '24%';
```

## Step 3: Test New Registration

Now when you register a new user:

1. **Admission Year**: Select the year (e.g., 2023)
2. **Current Academic Year**: Select 1st/2nd/3rd/4th year
3. **CSE ID will be auto-generated** in format: `YY` + `Y` + `26` + `NN`

### Examples:
- Admitted 2023, Currently 1st Year → `23F2601`, `23F2602`, etc.
- Admitted 2023, Currently 2nd Year → `23S2601`, `23S2602`, etc.
- Admitted 2023, Currently 3rd Year → `23T2601`, `23T2602`, etc.
- Admitted 2023, Currently 4th Year → `23R2601`, `23R2602`, etc.
- Admitted 2024, Currently 1st Year → `24F2601`, `24F2602`, etc.

Each academic year category has its own sequential counter (01, 02, 03...).

## Step 4: View CSE ID on Dashboard

The CSE ID will be displayed on the user's dashboard automatically.

---

**Once you've run the SQL migration, the system is ready to use!**
