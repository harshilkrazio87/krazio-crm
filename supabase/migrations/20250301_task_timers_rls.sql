-- Fix: new row violates row-level security policy for table "task_timers"
-- Run this in Supabase SQL Editor if the app reports RLS errors on task_timers.

ALTER TABLE task_timers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own task_timers" ON task_timers;
CREATE POLICY "Users can select own task_timers" ON task_timers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own task_timers" ON task_timers;
CREATE POLICY "Users can insert own task_timers" ON task_timers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own task_timers" ON task_timers;
CREATE POLICY "Users can update own task_timers" ON task_timers
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own task_timers" ON task_timers;
CREATE POLICY "Users can delete own task_timers" ON task_timers
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
