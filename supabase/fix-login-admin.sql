-- =============================================================================
-- FIX: "Login failed - Database error querying schema" for harsh.p@kraziocloud.com
-- Run in Supabase Dashboard → SQL Editor (Run as one block)
-- =============================================================================
-- If this user does NOT exist yet: create them first in Dashboard:
--   Authentication → Users → Add user → email: harsh.p@kraziocloud.com, password: Bluesky1?
-- Then run this script to set admin role and fix identity if needed.
--
-- This error usually means: broken/missing auth.identities or wrong auth.users setup.
-- Below we: ensure profile + admin role, and fix auth.identities.
-- =============================================================================

-- Step 1: Ensure profile exists for this email and set admin role
INSERT INTO public.profiles (id, email, full_name, role_id)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', 'Harsh P'),
  (SELECT id FROM public.roles WHERE slug IN ('admin', 'super_admin') ORDER BY slug DESC LIMIT 1)
FROM auth.users u
WHERE u.email = 'harsh.p@kraziocloud.com'
ON CONFLICT (id) DO UPDATE SET
  role_id = (SELECT id FROM public.roles WHERE slug IN ('admin', 'super_admin') ORDER BY slug DESC LIMIT 1),
  email = EXCLUDED.email,
  full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

-- Step 2: Fix auth.identities (required for email sign-in; missing/bad row causes "querying schema" error)
-- Delete any broken identity rows for this user, then insert correct one
DELETE FROM auth.identities
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'harsh.p@kraziocloud.com');

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  NOW(),
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'harsh.p@kraziocloud.com'
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
  );

-- Step 3: Ensure RLS allows reading own profile (no-op if already correct)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Done. Try logging in again with harsh.p@kraziocloud.com / Bluesky1?
