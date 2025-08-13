-- Final migration to reset profile table policies

-- Ensure row level security is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing profile policies
DROP POLICY IF EXISTS profiles_select_own ON profiles;
DROP POLICY IF EXISTS profiles_insert_own ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;
DROP POLICY IF EXISTS profiles_therapists_read_clients ON profiles;
DROP POLICY IF EXISTS profiles_therapist_view_clients ON profiles;
DROP POLICY IF EXISTS profiles_client_read_own ON profiles;
DROP POLICY IF EXISTS profiles_therapist_full_access ON profiles;
DROP POLICY IF EXISTS profiles_debug_access ON profiles;

-- Minimal, non-recursive profile policies
-- Users can create their own profile
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can read their own profile
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Therapists can read profiles of their clients
CREATE POLICY profiles_therapists_read_clients ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapist_client_relations tcr
      WHERE tcr.therapist_id = auth.uid()
        AND tcr.client_id = profiles.id
    )
  );
