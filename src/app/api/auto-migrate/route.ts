import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const migrations = [
  `ALTER TABLE roles ADD COLUMN IF NOT EXISTS slug text`,
  `ALTER TABLE roles ADD COLUMN IF NOT EXISTS permissions jsonb default '{}'`,
  `UPDATE roles SET slug = lower(replace(name, ' ', '_')) WHERE slug IS NULL OR slug = ''`,
  `INSERT INTO roles (name, slug, level) VALUES ('Super Admin', 'super_admin', 100) ON CONFLICT (slug) DO NOTHING`,
  `INSERT INTO roles (name, slug, level) VALUES ('Admin', 'admin', 90) ON CONFLICT (slug) DO NOTHING`,
  `INSERT INTO roles (name, slug, level) VALUES ('Manager', 'manager', 50) ON CONFLICT (slug) DO NOTHING`,
  `INSERT INTO roles (name, slug, level) VALUES ('Sales', 'sales', 10) ON CONFLICT (slug) DO NOTHING`,
  `UPDATE profiles SET role_id = (SELECT id FROM roles WHERE slug = 'super_admin' LIMIT 1) WHERE email = 'admin@kraziocloud.com'`,
  `UPDATE profiles SET role_id = (SELECT id FROM roles WHERE slug = 'admin' LIMIT 1) WHERE email = 'harsh.p@kraziocloud.com'`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date timestamptz`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recur_type text`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recur_interval_days int`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recur_weekdays text[]`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recur_end_date timestamptz`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id uuid`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring_template boolean default false`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS numeric_data jsonb default '{}'`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_admin_id uuid`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS joining_date date`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id text`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active boolean default true`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS manager_id uuid`,
  `ALTER TABLE lead_meetings ADD COLUMN IF NOT EXISTS agenda text`,
  `ALTER TABLE lead_meetings ADD COLUMN IF NOT EXISTS duration_minutes int`,
  `ALTER TABLE lead_meetings ADD COLUMN IF NOT EXISTS status text default 'scheduled'`,
  `ALTER TABLE lead_stages ADD COLUMN IF NOT EXISTS requires_meeting boolean default false`,
  `ALTER TABLE lead_stages ADD COLUMN IF NOT EXISTS is_won boolean default false`,
  `ALTER TABLE lead_stages ADD COLUMN IF NOT EXISTS is_lost boolean default false`,
  `ALTER TABLE lead_stages ADD COLUMN IF NOT EXISTS color text`,
  `CREATE TABLE IF NOT EXISTS password_vault (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete cascade,
    company_name text not null,
    url text,
    username text,
    password_encrypted text not null,
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  )`,
  `CREATE TABLE IF NOT EXISTS sticky_notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete cascade,
    content text,
    color text default '#FEF08A',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  )`,
  `CREATE TABLE IF NOT EXISTS activity_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id),
    action text,
    entity_type text,
    entity_id uuid,
    details jsonb,
    browser text,
    ip_address text,
    location text,
    created_at timestamptz default now()
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    id uuid primary key default gen_random_uuid(),
    key text unique not null,
    value text,
    updated_at timestamptz default now()
  )`,
  `CREATE TABLE IF NOT EXISTS commission_rules (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    trigger_type text,
    amount numeric default 0,
    is_percentage boolean default false,
    description text,
    is_active boolean default true,
    created_at timestamptz default now()
  )`,
  `ALTER TABLE commission_rules ADD COLUMN IF NOT EXISTS description text`,
  `ALTER TABLE commission_rules ADD COLUMN IF NOT EXISTS is_active boolean default true`,
  `CREATE TABLE IF NOT EXISTS task_stages (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text unique,
    color text default '#6366f1',
    order_index int default 0,
    is_default boolean default false,
    created_at timestamptz default now()
  )`,
  `INSERT INTO task_stages (name, slug, color, order_index, is_default) VALUES
    ('Pending', 'pending', '#F59E0B', 0, true),
    ('In Progress', 'in_progress', '#3B82F6', 1, true),
    ('Completed', 'completed', '#22C55E', 2, true),
    ('Cancelled', 'cancelled', '#6B7280', 3, true)
  ON CONFLICT (slug) DO NOTHING`,
  `CREATE TABLE IF NOT EXISTS task_timers (
    id uuid primary key default gen_random_uuid(),
    task_id uuid references tasks(id) on delete cascade,
    user_id uuid references profiles(id),
    started_at timestamptz default now(),
    ended_at timestamptz,
    duration_seconds int,
    created_at timestamptz default now()
  )`,
  `ALTER TABLE task_timers ADD COLUMN IF NOT EXISTS subtask_id uuid references tasks(id) on delete cascade`,
  `ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "settings_auth_policy" ON app_settings`,
  `CREATE POLICY "settings_auth_policy" ON app_settings FOR ALL TO authenticated USING (true) WITH CHECK (true)`,
  `CREATE TABLE IF NOT EXISTS task_assignees (
    id uuid primary key default gen_random_uuid(),
    task_id uuid references tasks(id) on delete cascade,
    user_id uuid references profiles(id),
    assigned_at timestamptz default now()
  )`,
  `CREATE TABLE IF NOT EXISTS lead_notes (
    id uuid primary key default gen_random_uuid(),
    lead_id uuid references leads(id) on delete cascade,
    note text,
    created_by uuid references profiles(id),
    created_at timestamptz default now()
  )`,
  `CREATE TABLE IF NOT EXISTS lead_custom_fields (
    id uuid primary key default gen_random_uuid(),
    field_name text not null,
    field_type text default 'text',
    field_options jsonb,
    is_active boolean default true,
    created_at timestamptz default now()
  )`,
  `CREATE TABLE IF NOT EXISTS daily_productivity (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id),
    date date default current_date,
    total_seconds int default 0,
    updated_at timestamptz default now(),
    UNIQUE(user_id, date)
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id),
    title text,
    message text,
    type text default 'info',
    is_read boolean default false,
    link text,
    created_at timestamptz default now()
  )`,
  `ALTER TABLE notifications ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "notifications_select_own" ON notifications`,
  `CREATE POLICY "notifications_select_own" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid())`,
  `DROP POLICY IF EXISTS "notifications_update_own" ON notifications`,
  `CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`,
  `DROP POLICY IF EXISTS "notifications_insert" ON notifications`,
  `CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true)`,
];

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    const authHeader = request.headers.get("x-migrate-secret");
    if (authHeader !== process.env.MIGRATE_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json(
      {
        error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
        fix: "Add these to your .env.local file (create it in the project root if needed). Get the values from Supabase Dashboard → Project Settings → API: use Project URL for NEXT_PUBLIC_SUPABASE_URL and the 'service_role' secret key for SUPABASE_SERVICE_ROLE_KEY. Then restart the dev server (npm run dev).",
        needed: [
          "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co",
          "SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (your service_role key)",
        ],
      },
      { status: 500 }
    );
  }

  const supabase = createClient(url, key);

  const results: { sql: string; status: string; error?: string }[] = [];

  for (const sql of migrations) {
    try {
      const { error } = await supabase.rpc("exec_sql", { sql_query: sql });
      if (error) {
        results.push({
          sql: sql.substring(0, 80) + "...",
          status: "warning",
          error: error.message,
        });
      } else {
        results.push({ sql: sql.substring(0, 80) + "...", status: "ok" });
      }
    } catch (e: unknown) {
      results.push({
        sql: sql.substring(0, 80) + "...",
        status: "error",
        error: String(e),
      });
    }
  }

  try {
    await supabase.storage.createBucket("avatars", {
      public: true,
      fileSizeLimit: "5MB",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    });
  } catch {
    // Bucket likely already exists
  }

  const passed = results.filter((r) => r.status === "ok").length;
  return NextResponse.json({
    total: migrations.length,
    passed,
    failed: results.filter((r) => r.status === "error").length,
    results,
  });
}
