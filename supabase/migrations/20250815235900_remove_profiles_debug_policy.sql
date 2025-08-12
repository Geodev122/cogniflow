/*
  # Remove debug profile policy

  1. Drop wide-open `profiles_debug_access` policy
  2. Provide restricted diagnostic function for controlled profile access
     - Uses SECURITY DEFINER to bypass RLS
     - Execution limited to `service_role`
*/

-- Drop the temporary debug policy
DROP POLICY IF EXISTS profiles_debug_access ON profiles;

-- Create a restricted diagnostic function for profile access
CREATE OR REPLACE FUNCTION public.debug_get_profile(p_user_id uuid)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure only service role tokens can execute
  IF coalesce(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;

  RETURN QUERY
  SELECT * FROM public.profiles WHERE id = p_user_id;
END;
$$;

-- Limit execution to service role only
REVOKE ALL ON FUNCTION public.debug_get_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.debug_get_profile(uuid) TO service_role;
