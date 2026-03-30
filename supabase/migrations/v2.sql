-- =============================================================================
-- Krazio CRM v2 Schema Fixes
-- Applied automatically: run once from project root:  npm run db:v2
-- (Uses DATABASE_URL in .env.local. Do not ask to run manually in Supabase again.)
-- =============================================================================

-- Fix tasks table missing columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date timestamptz;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recur_type text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recur_interval_days int;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recur_weekdays text[];
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recur_end_date timestamptz;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS numeric_data jsonb default '{}';

-- parent_task_id may already exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'parent_task_id') THEN
    ALTER TABLE tasks ADD COLUMN parent_task_id uuid references tasks(id);
  END IF;
END $$;

-- Subtasks: create if not exists (some setups use tasks.parent_task_id instead)
CREATE TABLE IF NOT EXISTS subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  title text not null,
  description text,
  status text default 'pending',
  priority text default 'medium',
  due_date timestamptz,
  assigned_to uuid references profiles(id),
  recur_type text,
  recur_interval_days int,
  recur_weekdays text[],
  created_at timestamptz default now()
);

ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS recur_type text;
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS recur_interval_days int;
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS recur_weekdays text[];
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS priority text default 'medium';
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS due_date timestamptz;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subtasks' AND column_name = 'assigned_to') THEN
    ALTER TABLE subtasks ADD COLUMN assigned_to uuid references profiles(id);
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Password vault
CREATE TABLE IF NOT EXISTS password_vault (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  company_name text not null,
  url text,
  username text,
  password_encrypted text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Departments: add columns if table exists
ALTER TABLE departments ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS sop_content text;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS sop_fields jsonb default '[]';
ALTER TABLE departments ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();

-- SOP Tasks
CREATE TABLE IF NOT EXISTS sop_tasks (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references departments(id) on delete cascade,
  title text not null,
  description text,
  priority text default 'medium',
  order_index int default 0,
  created_at timestamptz default now()
);

-- Reminder logs
CREATE TABLE IF NOT EXISTS reminder_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  task_ids uuid[],
  shown_at timestamptz default now()
);

-- Lead meetings
ALTER TABLE lead_meetings ADD COLUMN IF NOT EXISTS agenda text;
ALTER TABLE lead_meetings ADD COLUMN IF NOT EXISTS duration_minutes int;
ALTER TABLE lead_meetings ADD COLUMN IF NOT EXISTS status text default 'scheduled';

-- Lead stages
ALTER TABLE lead_stages ADD COLUMN IF NOT EXISTS requires_meeting boolean default false;
ALTER TABLE lead_stages ADD COLUMN IF NOT EXISTS is_won boolean default false;
ALTER TABLE lead_stages ADD COLUMN IF NOT EXISTS is_lost boolean default false;
ALTER TABLE lead_stages ADD COLUMN IF NOT EXISTS color text;

-- Task custom fields
CREATE TABLE IF NOT EXISTS task_custom_fields (
  id uuid primary key default gen_random_uuid(),
  field_name text not null,
  field_type text default 'text',
  field_options jsonb,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_id uuid references departments(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS joining_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id text;

-- Daily productivity
CREATE TABLE IF NOT EXISTS daily_productivity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  date date default current_date,
  total_seconds int default 0,
  updated_at timestamptz default now(),
  UNIQUE(user_id, date)
);

-- Default lead stages (only if table is empty; adjust if your lead_stages has different columns)
INSERT INTO lead_stages (name, slug, order_index, is_meeting_stage, requires_meeting, is_won, is_lost)
SELECT 'New Lead', 'new_lead', 1, false, false, false, false
WHERE NOT EXISTS (SELECT 1 FROM lead_stages LIMIT 1);

-- RLS / grants (optional)
ALTER TABLE password_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_productivity ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;
