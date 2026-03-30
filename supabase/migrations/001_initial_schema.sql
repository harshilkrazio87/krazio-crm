-- Krazio Cloud CRM - Initial Schema
-- Run this in Supabase SQL Editor or via Supabase CLI

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== ROLES & PERMISSIONS ====================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  level INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ==================== PROFILES (extends auth.users) ====================
CREATE TABLE profiles (
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

-- Password visibility for admin (store last known / allow login-as) - encrypted in app
CREATE TABLE user_password_store (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_password_hash TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ==================== SETTINGS ====================
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SMTP config
-- Gemini API key stored in app_settings key='gemini_api_key'
-- Logo URL in app_settings key='logo_url'
-- Theme default in app_settings key='theme'

-- ==================== DEPARTMENTS, INDUSTRIES, TECHNOLOGIES ====================
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE industries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE technologies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== LEAD STAGES & CUSTOM FIELDS ====================
CREATE TABLE lead_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  is_meeting_stage BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lead_custom_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  field_type TEXT NOT NULL,
  options JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== LEADS ====================
CREATE TABLE leads (
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

CREATE TABLE lead_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  position TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lead_meetings (
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
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  task_admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE task_assignees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(task_id, user_id)
);

CREATE TABLE task_timers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE task_completion_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  data_key TEXT,
  data_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== STICKY NOTES ====================
CREATE TABLE sticky_notes (
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
CREATE TABLE commission_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  is_percentage BOOLEAN DEFAULT FALSE,
  trigger_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE commission_entries (
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

-- ==================== AUDIT LOGS ====================
CREATE TABLE audit_logs (
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

-- ==================== SESSION / LOCATION (for admin view) ====================
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  location TEXT,
  browser TEXT
);

-- ==================== NOTIFICATIONS ====================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== RLS POLICIES (simplified; tighten per role in app) ====================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read own sticky notes" ON sticky_notes FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_leads_owner ON leads(owner_id);
CREATE INDEX idx_leads_stage ON leads(stage_id);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_admin ON tasks(task_admin_id);
CREATE INDEX idx_task_assignees_task ON task_assignees(task_id);
CREATE INDEX idx_task_assignees_user ON task_assignees(user_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_profiles_manager ON profiles(manager_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Seed default roles
INSERT INTO roles (name, slug, level) VALUES
  ('Super Admin', 'super_admin', 100),
  ('Admin', 'admin', 90),
  ('Manager', 'manager', 50),
  ('User', 'user', 10);

-- Seed default lead stages
INSERT INTO lead_stages (name, slug, order_index, is_meeting_stage) VALUES
  ('New', 'new', 0, FALSE),
  ('Contacted', 'contacted', 1, FALSE),
  ('Meeting Scheduled', 'meeting_scheduled', 2, TRUE),
  ('Meeting Done', 'meeting_done', 3, FALSE),
  ('Proposal', 'proposal', 4, FALSE),
  ('Won', 'won', 5, FALSE),
  ('Lost', 'lost', 6, FALSE);
