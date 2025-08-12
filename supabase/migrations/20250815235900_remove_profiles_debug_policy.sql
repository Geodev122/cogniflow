-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.debug_get_profile(uuid);

-- Create a restricted diagnostic function for profile access
CREATE OR REPLACE FUNCTION public.debug_get_profile(p_user_id uuid)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles;
BEGIN
  -- Validate input
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  -- Ensure only service role tokens can execute
  IF coalesce(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'Insufficient privileges: Service role required';
  END IF;

  -- Retrieve the profile
  SELECT * INTO v_profile 
  FROM public.profiles 
  WHERE id = p_user_id;

  -- Check if profile exists
  IF v_profile IS NULL THEN
    RAISE EXCEPTION 'No profile found for user ID: %', p_user_id;
  END IF;

  RETURN v_profile;
END;
$$;

-- Limit execution to service role only
REVOKE ALL ON FUNCTION public.debug_get_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.debug_get_profile(uuid) TO service_role;

-- Optional: Create an additional function for retrieving multiple profiles
CREATE OR REPLACE FUNCTION public.debug_get_profiles(p_user_ids uuid[])
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input
  IF p_user_ids IS NULL OR array_length(p_user_ids, 1) = 0 THEN
    RAISE EXCEPTION 'User ID array cannot be null or empty';
  END IF;

  -- Ensure only service role tokens can execute
  IF coalesce(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'Insufficient privileges: Service role required';
  END IF;

  -- Return multiple profiles
  RETURN QUERY 
  SELECT * 
  FROM public.profiles 
  WHERE id = ANY(p_user_ids);
END;
$$;

-- Limit execution of multiple profiles function to service role
REVOKE ALL ON FUNCTION public.debug_get_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.debug_get_profiles(uuid[]) TO service_role;