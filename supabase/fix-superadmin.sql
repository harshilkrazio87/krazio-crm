-- Run this in Supabase SQL Editor to fix super admin role recognition.
-- Replace 'admin@kraziocloud.com' with your actual admin email if different.

-- 1. Check existing roles
SELECT * FROM roles;

-- 2. Ensure slug column exists and is populated
  ALTER TABLE roles ADD COLUMN IF NOT EXISTS slug text;
  UPDATE roles SET slug = lower(replace(name, ' ', '_')) WHERE slug IS NULL OR slug = '';
ALTER TABLE roles ADD COLUMN IF NOT EXISTS slug text;
UPDATE roles SET slug = lower(replace(name, ' ', '_')) WHERE slug IS NULL OR slug = '';

-- 3. Ensure required roles exist (roles table has: id, name, slug, level)
INSERT INTO roles (name, slug, level) VALUES
  ('Super Admin', 'super_admin', 100),
  ('Admin', 'admin', 90),
  ('Manager', 'manager', 50),
  ('Sales', 'sales', 10)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, level = EXCLUDED.level;

-- 4. Assign super_admin role to your admin user (replace email if needed)
UPDATE profiles
SET role_id = (SELECT id FROM roles WHERE slug = 'super_admin' LIMIT 1)
WHERE email = 'admin@kraziocloud.com';

-- Also by auth.users in case profile email differs
UPDATE profiles
SET role_id = (SELECT id FROM roles WHERE slug = 'super_admin' LIMIT 1)
WHERE id IN (SELECT id FROM auth.users WHERE email = 'admin@kraziocloud.com');

-- 5. Verify
SELECT p.id, p.email, p.full_name, p.role_id, r.name as role_name, r.slug as role_slug
FROM profiles p
LEFT JOIN roles r ON p.role_id = r.id
WHERE p.email = 'admin@kraziocloud.com'
   OR p.id IN (SELECT id FROM auth.users WHERE email = 'admin@kraziocloud.com');
