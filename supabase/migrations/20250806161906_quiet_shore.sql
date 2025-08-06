/*
  # Create safe profile fetching function

  1. New Functions
    - `get_user_profile_safe` - Bypasses RLS to safely fetch user profiles
    - Uses SECURITY DEFINER to run with elevated privileges
    - Includes proper access controls within the function

  2. Security
    - Function runs as superuser to bypass problematic RLS
    - Internal checks ensure users can only access their own data
    - Therapists can access client data through relations table
*/

-- Create a safe function to get user profile that bypasses RLS
CREATE OR REPLACE FUNCTION get_user_profile_safe(user_id uuid)
RETURNS TABLE (
  id uuid,
  role text,
  first_name text,
  last_name text,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the requesting user is the same as the profile being requested
  -- OR if the requesting user is a therapist who has access to this client
  IF auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM therapist_client_relations tcr
    JOIN profiles p ON p.id = auth.uid()
    WHERE tcr.therapist_id = auth.uid() 
    AND tcr.client_id = user_id
    AND p.role = 'therapist'
  ) THEN
    RETURN QUERY
    SELECT p.id, p.role, p.first_name, p.last_name, p.email
    FROM profiles p
    WHERE p.id = user_id;
  ELSE
    -- Return empty result if no access
    RETURN;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_profile_safe(uuid) TO authenticated;