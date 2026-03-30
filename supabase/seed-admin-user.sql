-- =============================================================================
-- Add user harsh.p@kraziocloud.com as Admin with password Bluesky1?
-- Run in Supabase Dashboard → SQL Editor (as project owner / with sufficient privileges)
--
-- If this user ALREADY EXISTS (e.g. you signed up in the app), run only this:
--   UPDATE public.profiles SET role_id = (SELECT id FROM public.roles WHERE slug = 'admin' LIMIT 1)
--   WHERE id IN (SELECT id FROM auth.users WHERE email = 'harsh.p@kraziocloud.com');
-- =============================================================================

-- Ensure bcrypt available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  new_id uuid := gen_random_uuid();
  admin_role_id uuid;
BEGIN
  -- Get admin role (use 'admin' slug; if you use 'super_admin', change slug below)
  SELECT id INTO admin_role_id FROM public.roles WHERE slug = 'admin' LIMIT 1;
  IF admin_role_id IS NULL THEN
    SELECT id INTO admin_role_id FROM public.roles WHERE slug = 'super_admin' LIMIT 1;
  END IF;

  -- 1. Insert into auth.users (so they can log in)
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    new_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'harsh.p@kraziocloud.com',
    crypt('Bluesky1?', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW()
  );

  -- 2. Link identity for email sign-in (required for Supabase Auth)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_id,
    new_id,
    jsonb_build_object('sub', new_id::text, 'email', 'harsh.p@kraziocloud.com'),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  -- 3. Ensure profile exists (trigger may have created it; upsert to be safe)
  INSERT INTO public.profiles (id, email, full_name, role_id)
  VALUES (new_id, 'harsh.p@kraziocloud.com', 'Harsh P', admin_role_id)
  ON CONFLICT (id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    email   = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

  RAISE NOTICE 'User harsh.p@kraziocloud.com created with admin role (id: %)', new_id;
END $$;
