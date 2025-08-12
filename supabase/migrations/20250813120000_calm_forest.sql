/*
  # Create client_activity table and recent activity function

  1. New Table
    - client_activity: logs client-related events

  2. Security
    - Enable RLS with policies for therapists

  3. Functions
    - get_recent_activity: returns recent activity with client names
*/

-- Create client_activity table
CREATE TABLE IF NOT EXISTS client_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  details text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE client_activity ENABLE ROW LEVEL SECURITY;

-- Therapists can view their own activity
CREATE POLICY "Therapists can read own activity"
  ON client_activity
  FOR SELECT
  TO authenticated
  USING (therapist_id = auth.uid());

-- Therapists can insert their own activity
CREATE POLICY "Therapists can insert own activity"
  ON client_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (therapist_id = auth.uid());

-- Function to get recent activity with client names
CREATE OR REPLACE FUNCTION get_recent_activity(therapist_id uuid, limit_count int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  client_id uuid,
  client_first_name text,
  client_last_name text,
  type text,
  details text,
  created_at timestamptz
) AS $$
  SELECT ca.id,
         ca.client_id,
         p.first_name,
         p.last_name,
         ca.type,
         ca.details,
         ca.created_at
    FROM client_activity ca
    JOIN profiles p ON p.id = ca.client_id
   WHERE ca.therapist_id = get_recent_activity.therapist_id
   ORDER BY ca.created_at DESC
   LIMIT limit_count;
$$ LANGUAGE sql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION get_recent_activity(uuid, int) TO authenticated;
