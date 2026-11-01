This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Society Circulars

- Public circular list: `/circulars`; each published circular has a unique share link at `/circulars/<id>`. PDF files are served through the society domain rather than redirecting to a storage-provider URL.
- Admins can upload PDFs from `/dashboard/circulars` or the admin dashboard, entering an official title (separate from the PDF filename), circular date, and category. Published circular details can be edited or deleted from the admin list. The public list shows date and category in separate columns, while each circular also retains its upload timestamp.
- Apply `supabase/migrations/038_create_circulars.sql` in the Supabase SQL Editor before using circular uploads. It creates the circular metadata table and a private PDF storage bucket.
- Apply `supabase/migrations/039_add_circular_date_and_category.sql` after migration 038 to add circular dates and categories. Existing circulars are backfilled with their upload date and the `General` category.
- PDF uploads are limited to 4 MB. Published documents are publicly viewable, so only upload files approved for public sharing and remove confidential information first.

## E-Sports Event Registration

- Public participant form: `/event-registration` (no dashboard login required).
- Admin and secretary roster: `/dashboard/event-registrations`.
- Members verify their Society ID with a one-time code sent to the email already stored on their verified `users` record. The code expires after five minutes and is single-use.
- Choose First Half (BGMI or Free Fire), Second Half (Table Tennis or Chess), or both; exactly one game must be selected for each chosen half. Chess usernames are not collected.
- Non-members enter their details manually and pay per participant: ₹40 for First Half, ₹30 for Second Half, or ₹60 for Both Sessions. Their UPI transaction ID is required; a payment screenshot is optional.
- Solo and Duo participants enter a team name. Both Duo participants submit separately using the same team name. Verified Society members register free and should bring their Society ID card for entry attendance.
- The roster groups members before non-members and supports print, PDF, DOCX, payment review, attendance, and evaluation notes.
- Apply `supabase/migrations/036_create_event_registration.sql` in Supabase before enabling submissions. It creates the event-specific `esports_event_registrations` and `esports_event_registration_otps` tables and the private payment-proof storage bucket without altering other registration tables.
- Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, and `EVENT_OTP_PEPPER` in the deployment environment. Do not commit credentials. For Gmail, use an app password, not the account password.
- Confirmation email is sent after a registration is saved. Entry-pass delivery is coordinated by the event team; the roster includes email and WhatsApp contact links.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
