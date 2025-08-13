/*
  # Create therapist-client relations table

  1. New Tables
    - `therapist_client_relations`
      - `id` (uuid, primary key)
      - `therapist_id` (uuid, references profiles)
      - `client_id` (uuid, references profiles)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `therapist_client_relations` table
    - Add policy for therapists to read their client relationships
    - Add policy for clients to read their therapist relationships
    - Add policy for therapists to create new client relationships
*/

CREATE TABLE IF NOT EXISTS therapist_client_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(therapist_id, client_id)
);

ALTER TABLE therapist_client_relations ENABLE ROW LEVEL SECURITY;

-- Policy for therapists to read their client relationships
CREATE POLICY "Therapists can read their client relationships"
  ON therapist_client_relations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'therapist'
      AND profiles.id = therapist_client_relations.therapist_id
    )
  );

-- Policy for clients to read their therapist relationships
CREATE POLICY "Clients can read their therapist relationships"
  ON therapist_client_relations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'client'
      AND profiles.id = therapist_client_relations.client_id
    )
  );

-- Policy for therapists to create new client relationships
CREATE POLICY "Therapists can create client relationships"
  ON therapist_client_relations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'therapist'
      AND profiles.id = therapist_client_relations.therapist_id
    )
  );