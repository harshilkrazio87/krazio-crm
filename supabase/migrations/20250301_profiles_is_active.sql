-- Add is_active to profiles for team page toggle
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
