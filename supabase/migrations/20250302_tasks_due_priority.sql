-- Add due_date and priority to tasks for dashboard and filters
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

COMMENT ON COLUMN tasks.due_date IS 'Optional due date for the task';
COMMENT ON COLUMN tasks.priority IS 'high, medium, low';
