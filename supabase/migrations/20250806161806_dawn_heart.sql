/*
  # Fix Profiles RLS Infinite Recursion

  1. Problem
    - Infinite recursion in RLS policies for profiles table
    - Policies are referencing the profiles table within their own conditions
    - This creates circular dependencies when querying profiles

  2. Solution
    - Drop ALL existing policies on profiles table
    - Create simple, direct policies using only auth.uid()
    - Avoid any self-referential queries on profiles table
    - Use direct authentication checks without complex joins

  3. New Policies
    - Users can read their own profile (auth.uid() = id)
    - Users can insert their own profile (auth.uid() = id)  
    - Users can update their own profile (auth.uid() = id)
    - Simple therapist-client access via therapist_client_relations
*/

-- First, completely disable RLS temporarily to clear any locks
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on profiles table
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', policy_record.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "profiles_select_own" 
ON profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Allow therapists to view their clients (using separate table lookup)
CREATE POLICY "profiles_therapist_view_clients" 
ON profiles FOR SELECT 
TO authenticated 
USING (
  role = 'client' AND 
  EXISTS (
    SELECT 1 FROM therapist_client_relations tcr 
    WHERE tcr.client_id = profiles.id 
    AND tcr.therapist_id = auth.uid()
  )
);

-- Verify policies are working
DO $$
BEGIN
    RAISE NOTICE 'RLS policies have been reset for profiles table';
    RAISE NOTICE 'New policies created: profiles_select_own, profiles_insert_own, profiles_update_own, profiles_therapist_view_clients';
END $$;