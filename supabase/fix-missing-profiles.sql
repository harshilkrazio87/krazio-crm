-- =============================================================================
-- FIX: Create profile for users who don't have one yet
-- (Run this in Supabase SQL Editor if you created users before running the main setup)
-- =============================================================================

-- One-time: insert profiles for all existing auth users
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Also add this function so the app can auto-create profile on first login
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

-- Allow logged-in users to call it
GRANT EXECUTE ON FUNCTION public.ensure_profile_for_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_profile_for_user() TO service_role;
