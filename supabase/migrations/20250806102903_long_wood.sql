/*
  # Fix RLS policies for profiles table

  1. Security Updates
    - Drop existing restrictive policies that may be blocking profile access
    - Create new policies that allow authenticated users to read their own profiles
    - Ensure users can insert and update their own profiles during registration

  2. Policy Changes
    - Allow SELECT for authenticated users on their own profile
    - Allow INSERT for authenticated users to create their own profile
    - Allow UPDATE for authenticated users on their own profile
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policies that allow proper access
CREATE POLICY "Enable read access for users on their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable insert access for users to create their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update access for users on their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;