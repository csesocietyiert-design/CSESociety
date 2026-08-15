# CSE Society Portal - Project Startup Guide

## Quick Start (All-in-One)

This is a **Next.js full-stack application** - frontend and backend run together on one dev server.

### Start Development Server (Recommended)

```bash
cd "e:\CSE Society Website\CSE Society\shuffal"
npm run dev
```

**Output:**
```
> shuffal@0.1.0 dev
> next dev

  ▲ Next.js 16.3.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
```

Open browser: **http://localhost:3000**

---

## Production Build

### 1. Build the Project

```bash
cd "e:\CSE Society Website\CSE Society\shuffal"
npm run build
```

### 2. Start Production Server

```bash
npm start
```

Runs on: **http://localhost:3000**

---

## Project Structure

```
shuffal/
├── app/                    ← Frontend pages & API routes
│   ├── page.tsx           ← Home page (redirects to login)
│   ├── login/             ← Login page
│   ├── register/          ← Registration page
│   ├── dashboard/         ← Dashboard page
│   ├── api/               ← API routes (if needed)
│   └── globals.css        ← Global styles
├── lib/
│   ├── store.ts           ← Zustand auth store (state management)
│   ├── supabase.ts        ← Supabase client config
│   └── auth-utils.ts      ← Password encryption & CSE ID generation
├── components/            ← Reusable React components
│   ├── Sidebar.tsx
│   ├── Navbar.tsx
│   └── dashboards/        ← Role-based dashboards
├── .env.local             ← Supabase credentials
├── package.json           ← Dependencies
└── tsconfig.json          ← TypeScript config
```

---

## Available npm Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload

# Production
npm run build        # Build for production
npm start            # Start production server

# Linting
npm run lint         # Run ESLint
```

---

## Frontend Entry Points

| URL | Page | Purpose |
|-----|------|---------|
| http://localhost:3000 | Home | Redirects to login |
| http://localhost:3000/login | Login | User authentication |
| http://localhost:3000/register | Register | New account creation |
| http://localhost:3000/dashboard | Dashboard | Role-based user dashboard |

---

## Backend Integration

**Backend is built into Next.js** - no separate server needed!

### API Routes Location
- All API routes: `shuffal/app/api/`
- Can add routes like: `shuffal/app/api/users/` → `http://localhost:3000/api/users`

### Server-Side Logic
- Authentication: `lib/store.ts` (Zustand)
- Database: `lib/supabase.ts` (Supabase client)
- Utils: `lib/auth-utils.ts` (Password hashing, CSE ID generation)

---

## Environment Setup

### Required Files

**.env.local** (already configured)
```env
NEXT_PUBLIC_SUPABASE_URL=https://zapbeeibgweptmvsnkyf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### First Time Setup

1. **Install dependencies:**
   ```bash
   cd "e:\CSE Society Website\CSE Society\shuffal"
   npm install
   ```

2. **Create Supabase tables:**
   - Go to Supabase Dashboard → SQL Editor
   - Run SQL from `SUPABASE_MIGRATION.sql`

3. **Start dev server:**
   ```bash
   npm run dev
   ```

---

## Testing the Application

### Demo Login Credentials (Fallback Mode)

```
CSE ID: 23F2601
Password: admin123
```

```
CSE ID: 23F2602
Password: user123
```

```
CSE ID: 23F2603
Password: exec123
```

### Test Registration

1. Go to http://localhost:3000/register
2. Fill form with any info
3. Click "Create Account"
4. Check Supabase Table Editor → users table for the new record

---

## Common Commands Summary

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Start dev server | `npm run dev` |
| Build for production | `npm run build` |
| Run production build | `npm start` |
| Check for lint errors | `npm run lint` |

---

## Troubleshooting

### Port 3000 Already in Use
```bash
# Windows - Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Clear Next.js Cache
```bash
rm -r .next
npm run dev
```

### Rebuild Dependencies
```bash
rm -r node_modules package-lock.json
npm install
npm run dev
```

### Module Not Found Error
```bash
npm install
npm run dev
```

---

## Project is Ready! 🚀

**Start Command:**
```bash
cd "e:\CSE Society Website\CSE Society\shuffal" && npm run dev
```

**Access at:** http://localhost:3000

All data is saved to Supabase. Passwords are encrypted with bcryptjs. CSE IDs are auto-generated!
