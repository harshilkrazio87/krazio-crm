-- Add status to commission_entries for approve/reject workflow
ALTER TABLE commission_entries
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

COMMENT ON COLUMN commission_entries.status IS 'pending | approved | rejected';
