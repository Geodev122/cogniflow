/*
  # Fix infinite recursion in profiles RLS policies

  1. Security Changes
    - Drop all existing problematic RLS policies on profiles table
    - Create simple, non-recursive policies that don't cause circular dependencies
    - Use auth.uid() directly instead of joining back to profiles table
*/

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_therapists_read_clients" ON profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Simple policy for therapists to read client profiles
-- This avoids recursion by not joining back to profiles table
CREATE POLICY "Therapists can view client profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'client' AND 
    EXISTS (
      SELECT 1 FROM therapist_client_relations tcr 
      WHERE tcr.therapist_id = auth.uid() 
      AND tcr.client_id = profiles.id
    )
  );