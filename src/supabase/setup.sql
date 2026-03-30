-- =============================================================================
-- Krazio Cloud CRM - Database setup (run in Supabase SQL Editor)
-- For full schema run: supabase/setup-database.sql
-- Required tables: profiles, roles, permissions, role_permissions, app_settings,
-- departments, industries, technologies, lead_stages, leads, lead_contacts,
-- lead_notes, lead_meetings, tasks, task_assignees, task_timers, task_completion_data,
-- sticky_notes, commission_rules, commission_entries, audit_logs, user_sessions,
-- notifications
-- =============================================================================

CREATE OR REPLACE FUNCTION public.ensure_profile_for_user()
RETURNS void AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
  FROM auth.users
  WHERE id = auth.uid()
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.ensure_profile_for_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_profile_for_user() TO service_role;
