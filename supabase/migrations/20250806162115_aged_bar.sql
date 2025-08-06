/*
  # Fix profiles RLS infinite recursion

  1. Problem
    - RLS policies on profiles table are causing infinite recursion
    - Policies are likely referencing the profiles table within themselves
    - This creates a circular dependency loop

  2. Solution
    - Drop ALL existing policies on profiles table
    - Create simple, direct policies using only auth.uid()
    - Ensure no policy references the profiles table in its condition

  3. New Policies
    - Users can read their own profile: auth.uid() = id
    - Users can insert their own profile: auth.uid() = id  
    - Users can update their own profile: auth.uid() = id
    - Therapists can view clients via separate relation table
*/

-- Disable RLS temporarily to avoid locks
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_therapist_view_clients" ON profiles;
DROP POLICY IF EXISTS "profiles_client_read_own" ON profiles;
DROP POLICY IF EXISTS "profiles_therapist_full_access" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create therapist access policy using separate table lookup
-- This avoids recursion by not querying profiles table within the policy
CREATE POLICY "profiles_therapist_view_clients" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'client' AND 
    EXISTS (
      SELECT 1 FROM therapist_client_relations tcr
      WHERE tcr.client_id = profiles.id 
      AND tcr.therapist_id = auth.uid()
    )
  );