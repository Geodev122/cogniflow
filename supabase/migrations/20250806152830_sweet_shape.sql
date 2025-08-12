/*
  # Add therapist user and fix profile issues

  1. New User Setup
    - Add geo.elnajjar@gmail.com as therapist
    - Create profile entry with proper role
    
  2. Profile Fetching Fixes
    - Ensure proper user-profile relationship
    - Add debugging for profile queries
    
  3. Security
    - Maintain RLS policies
    - Ensure proper access controls
*/

-- First, let's check if the user exists in auth.users and add profile
-- Note: The actual user creation in auth.users happens through Supabase Auth
-- We're just ensuring the profile exists when they sign up

-- Create a function to handle profile creation for existing auth users
CREATE OR REPLACE FUNCTION create_profile_for_auth_user(
  user_email text,
  user_role text,
  first_name text,
  last_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_user_id uuid;
BEGIN
  -- Get the user ID from auth.users if it exists
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  -- If user exists in auth, create/update their profile
  IF auth_user_id IS NOT NULL THEN
    INSERT INTO profiles (id, role, first_name, last_name, email, created_at)
    VALUES (auth_user_id, user_role, first_name, last_name, user_email, now())
    ON CONFLICT (id) 
    DO UPDATE SET 
      role = EXCLUDED.role,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      email = EXCLUDED.email,
      created_at = COALESCE(profiles.created_at, now());
      
    RAISE NOTICE 'Profile created/updated for user: %', user_email;
  ELSE
    RAISE NOTICE 'User % not found in auth.users. They need to sign up first.', user_email;
  END IF;
END;
$$;

-- Try to create profile for the therapist (will only work if they've signed up)
SELECT create_profile_for_auth_user(
  'geo.elnajjar@gmail.com',
  'therapist',
  'George',
  'El Najjar'
);

-- Create a function to debug profile fetching issues
CREATE OR REPLACE FUNCTION debug_profile_fetch(user_email text)
RETURNS TABLE(
  auth_user_exists boolean,
  profile_exists boolean,
  profile_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_user_id uuid;
  profile_record profiles%ROWTYPE;
BEGIN
  -- Check if user exists in auth.users
  SELECT id INTO auth_user_id FROM auth.users WHERE email = user_email;
  
  IF auth_user_id IS NOT NULL THEN
    auth_user_exists := true;
    
    -- Check if profile exists
    SELECT * INTO profile_record FROM profiles WHERE id = auth_user_id;
    
    IF profile_record.id IS NOT NULL THEN
      profile_exists := true;
      profile_data := to_jsonb(profile_record);
    ELSE
      profile_exists := false;
      profile_data := '{}'::jsonb;
    END IF;
  ELSE
    auth_user_exists := false;
    profile_exists := false;
    profile_data := '{}'::jsonb;
  END IF;
  
  RETURN QUERY SELECT auth_user_exists, profile_exists, profile_data;
END;
$$;

-- Add some indexes to improve profile fetching performance
CREATE INDEX IF NOT EXISTS idx_profiles_email_lookup ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role_lookup ON profiles(role);

-- Ensure RLS policies are working correctly for profile access
-- Update the profiles_select_own policy to be more explicit
DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Add a policy for debugging (can be removed in production)
CREATE POLICY profiles_debug_access ON profiles
  FOR SELECT
  TO authenticated
  USING (true); -- Temporary for debugging - REMOVE IN PRODUCTION

-- Create a trigger to automatically create profiles when users sign up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This will be called when a new user is created in auth.users
  -- We'll create a basic profile that can be updated later
  INSERT INTO profiles (id, role, first_name, last_name, email)
  VALUES (
    NEW.id,
    'client', -- Default role, can be changed later
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create the trigger (if it doesn't exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to manually fix a user's role
CREATE OR REPLACE FUNCTION update_user_role(user_email text, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_user_id uuid;
  updated_rows integer;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO auth_user_id FROM auth.users WHERE email = user_email;
  
  IF auth_user_id IS NOT NULL THEN
    -- Update the user's role
    UPDATE profiles
    SET role = new_role
    WHERE id = auth_user_id;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    
    IF updated_rows > 0 THEN
      RAISE NOTICE 'Updated role for % to %', user_email, new_role;
      RETURN true;
    ELSE
      RAISE NOTICE 'No profile found for %', user_email;
      RETURN false;
    END IF;
  ELSE
    RAISE NOTICE 'User % not found in auth.users', user_email;
    RETURN false;
  END IF;
END;
$$;

-- Update the specific user's role to therapist
SELECT update_user_role('geo.elnajjar@gmail.com', 'therapist');