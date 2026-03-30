-- =============================================================================
-- Krazio Cloud CRM - Full database setup for Supabase
--
-- HOW TO RUN (one-time):
-- 1. Open https://supabase.com/dashboard → your project
-- 2. Go to SQL Editor → New query
-- 3. Paste this entire file and click Run
-- 4. In Authentication → Providers, ensure Email is enabled
-- 5. Create a user: Authentication → Users → Add user (or use Sign up in the app)
-- 6. (Optional) To make that user admin: Table Editor → profiles → set role_id
--    to the id of the "Super Admin" row in the roles table
-- =============================================================================

-- Enable UUID (Supabase usually has this already)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== ROLES ====================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  level INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ==================== PROFILES (required for login – links to auth.users) ====================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role_id UUID REFERENCES roles(id),
  manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_password_store (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_password_hash TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ==================== APP SETTINGS ====================
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== DEPARTMENTS, INDUSTRIES, TECHNOLOGIES ====================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS industries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS technologies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== LEAD STAGES & CUSTOM FIELDS ====================
CREATE TABLE IF NOT EXISTS lead_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  is_meeting_stage BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_custom_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  field_type TEXT NOT NULL,
  options JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== LEADS ====================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES lead_stages(id) ON DELETE SET NULL,
  company_name TEXT,
  website TEXT,
  linkedin_company_url TEXT,
  requirements TEXT,
  department_id UUID REFERENCES departments(id),
  industry_id UUID REFERENCES industries(id),
  technology_ids UUID[],
  custom_fields JSONB DEFAULT '{}',
  gemini_research JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  position TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  meeting_link TEXT,
  title TEXT,
  reminder_sent_30 BOOLEAN DEFAULT FALSE,
  reminder_sent_20 BOOLEAN DEFAULT FALSE,
  reminder_sent_10 BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE,
  admin_approved_success BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== TASKS ====================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  task_admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS task_assignees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(task_id, user_id)
);

CREATE TABLE IF NOT EXISTS task_timers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_completion_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  data_key TEXT,
  data_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== STICKY NOTES ====================
CREATE TABLE IF NOT EXISTS sticky_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  color TEXT DEFAULT 'yellow',
  position_x INT DEFAULT 0,
  position_y INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== COMMISSION ====================
CREATE TABLE IF NOT EXISTS commission_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  is_percentage BOOLEAN DEFAULT FALSE,
  trigger_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commission_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES commission_rules(id),
  amount DECIMAL(15,2) NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  project_amount DECIMAL(15,2),
  month INT,
  year INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== AUDIT LOGS & SESSIONS ====================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  location TEXT,
  browser TEXT
);

-- ==================== NOTIFICATIONS ====================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== RLS (Row Level Security) ====================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;

-- Allow users to read/update their own profile (required for login flow)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- (Profile insert is done by handle_new_user() trigger with SECURITY DEFINER, so no INSERT policy needed.)

DROP POLICY IF EXISTS "Users can read own sticky notes" ON sticky_notes;
CREATE POLICY "Users can read own sticky notes" ON sticky_notes FOR ALL USING (auth.uid() = user_id);

-- Allow authenticated users to use leads and tasks (tighten by role later)
DROP POLICY IF EXISTS "Allow read for authenticated" ON leads;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON leads;
DROP POLICY IF EXISTS "Allow update for authenticated" ON leads;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON leads;
CREATE POLICY "Allow read for authenticated" ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated" ON leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update for authenticated" ON leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated" ON leads FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow read for authenticated" ON tasks;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON tasks;
DROP POLICY IF EXISTS "Allow update for authenticated" ON tasks;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON tasks;
CREATE POLICY "Allow read for authenticated" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated" ON tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update for authenticated" ON tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated" ON tasks FOR DELETE TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_owner ON leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_admin ON tasks(task_admin_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_task ON task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user ON task_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_manager ON profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ==================== SEED DATA ====================
INSERT INTO roles (name, slug, level) VALUES
  ('Super Admin', 'super_admin', 100),
  ('Admin', 'admin', 90),
  ('Manager', 'manager', 50),
  ('User', 'user', 10)
ON CONFLICT (slug) DO NOTHING;

-- Seed lead stages (skip if any already exist)
INSERT INTO lead_stages (name, slug, order_index, is_meeting_stage)
SELECT * FROM (VALUES
  ('New', 'new', 0::int, FALSE),
  ('Contacted', 'contacted', 1, FALSE),
  ('Meeting Scheduled', 'meeting_scheduled', 2, TRUE),
  ('Meeting Done', 'meeting_done', 3, FALSE),
  ('Proposal', 'proposal', 4, FALSE),
  ('Won', 'won', 5, FALSE),
  ('Lost', 'lost', 6, FALSE)
) AS v(name, slug, order_index, is_meeting_stage)
WHERE NOT EXISTS (SELECT 1 FROM lead_stages LIMIT 1);

-- ==================== TRIGGER: Create profile when user signs up (REQUIRED FOR LOGIN) ====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow app to create profile on first login if missing (e.g. user was added before trigger)
CREATE OR REPLACE FUNCTION public.ensure_profile_for_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
  FROM auth.users
  WHERE id = auth.uid()
  ON CONFLICT (id) DO NOTHING;
END;
$$;
GRANT EXECUTE ON FUNCTION public.ensure_profile_for_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_profile_for_user() TO service_role;
