-- Run this ONCE in Supabase SQL Editor to allow the auto-migrate API to run SQL.
-- Required for /api/auto-migrate to work.

CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;
