# Krazio Cloud CRM

A SaaS CRM with **task management**, **lead management**, **team hierarchy**, **reports**, **commission**, **roles & permissions**, and **sticky notes**. Built with Next.js, Tailwind CSS, Supabase, and shadcn/ui.

## Features

- **Tasks**: Main tasks and subtasks, assignees, task admin, recurring (day/week/month), per-task and per-subtask timers, status workflow.
- **Leads**: Custom stages, custom fields (admin), company/contact details, departments/industries/technologies (admin-managed), notes/MOM, meetings with reminders (30/20/10 min), optional Gemini API for “Generate details” research.
- **Team**: Hierarchy (super admin → admin → managers → users), roles & permissions, audit logs (browser/location when enabled).
- **Reports**: Task completion and lead stats for managers; admin/super admin reports.
- **Commission**: Rules (flat ₹ or %), e.g. ₹100 per successful meeting or % of project amount; admin approves; monthly and per-user views.
- **Sticky notes**: Per-user, create/edit/delete.
- **Settings**: Dark/light mode, logo (admin). SMTP and Gemini API keys configurable from Admin.
- **Auth**: Login, forgot password, reset password. Supabase Auth; optional SMTP for custom emails.

## Tech stack

- **Next.js 14** (App Router)
- **Tailwind CSS** + **shadcn/ui** (Radix)
- **Supabase** (Auth + PostgreSQL)
- **TypeScript**

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase & database

**Option A – Run SQL from this project (recommended)**

1. Get your database password: Supabase Dashboard → **Project Settings** → **Database** (under “Database password”).
2. In `.env.local` add (get the connection string from **Project Settings → Database**; replace `YOUR-PASSWORD` with your database password):
   ```bash
   DATABASE_URL=postgresql://postgres:YOUR-PASSWORD@db.YOUR-PROJECT-REF.supabase.co:5432/postgres
   ```
3. Run the setup script (creates all tables and the signup trigger):
   ```bash
   npm run db:setup
   ```

**Option B – Run SQL in the dashboard**

1. Open your project at [supabase.com](https://supabase.com) → **SQL Editor** → New query.
2. Paste the contents of `supabase/setup-database.sql` and click **Run**.

Then in **Authentication → Providers**, enable **Email**.

### 3. Environment variables

Copy the example env and set your Supabase keys:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You’ll be redirected to `/login`. Create a user via Supabase Dashboard (**Authentication → Users → Add user**) or enable sign-up in Auth settings; the trigger will create a profile.

### 5. First admin

- Assign a role to the first user: in Supabase **Table Editor → profiles**, set `role_id` to the role you want (e.g. super_admin from the `roles` table).
- Or run: `update profiles set role_id = (select id from roles where slug = 'super_admin' limit 1) where email = 'your@email.com';`

## Project structure

- `src/app/` – Routes: `(auth)` (login, forgot-password, reset-password), `(dashboard)` (dashboard, tasks, leads, team, reports, commission, sticky-notes, settings, admin).
- `src/components/` – UI (shadcn) and feature components (tasks, leads, team, admin, settings, sticky-notes).
- `src/lib/` – Supabase client (browser + server), utils.
- `src/types/` – Shared types.
- `supabase/` – `setup-database.sql` (full schema; run via `npm run db:setup` or in SQL Editor), `migrations/` (optional).
- `scripts/run-db-setup.js` – Runs `setup-database.sql` using `DATABASE_URL` from `.env.local`.

## Notes

- **SMTP**: Supabase sends auth emails by default. For custom SMTP (e.g. Gmail), store config in `app_settings` (key `smtp`) and implement a server action or API that sends mail (e.g. nodemailer).
- **Gemini**: Store the API key in `app_settings` (key `gemini_api_key`). The “Generate details” flow can call Gemini and save result in `leads.gemini_research`.
- **Password visibility for admin**: Schema has `user_password_store`; implement encryption and “login as” in a server action with proper admin checks.
- **Recurring tasks**: Shown after 12:01 AM via recurrence_rule; you can add a cron or scheduled job to create the next occurrence.
- **Meeting reminders**: Use a cron job or Supabase Edge Function to check `lead_meetings` and send notifications (in-app and/or email) at 30/20/10 minutes before.

## Build

```bash
npm run build
npm start
```

## License

MIT
