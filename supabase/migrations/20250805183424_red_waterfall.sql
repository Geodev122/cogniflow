/*
  # Create CBT worksheets table

  1. New Tables
    - `cbt_worksheets`
      - `id` (uuid, primary key)
      - `therapist_id` (uuid, references profiles)
      - `client_id` (uuid, references profiles)
      - `type` (text, worksheet type like 'thought_record')
      - `title` (text, worksheet title)
      - `content` (jsonb, worksheet data)
      - `status` (enum: 'assigned', 'in_progress', 'completed')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `cbt_worksheets` table
    - Add policy for therapists to read worksheets for their clients
    - Add policy for clients to read their own worksheets
    - Add policy for therapists to create worksheets for their clients
    - Add policy for clients to update their own worksheets
    - Add policy for therapists to update worksheets for their clients
*/

CREATE TABLE IF NOT EXISTS cbt_worksheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'thought_record',
  title text NOT NULL,
  content jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_cbt_worksheets_client_id ON cbt_worksheets(client_id);
CREATE INDEX IF NOT EXISTS idx_cbt_worksheets_therapist_id ON cbt_worksheets(therapist_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cbt_worksheets_updated_at 
    BEFORE UPDATE ON cbt_worksheets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE cbt_worksheets ENABLE ROW LEVEL SECURITY;

-- Policy for therapists to read worksheets for their clients
CREATE POLICY "Therapists can read worksheets for their clients"
  ON cbt_worksheets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapist_client_relations tcr
      JOIN profiles p ON p.id = auth.uid()
      WHERE p.role = 'therapist'
      AND tcr.therapist_id = auth.uid()
      AND tcr.client_id = cbt_worksheets.client_id
    )
  );

-- Policy for clients to read their own worksheets
CREATE POLICY "Clients can read their own worksheets"
  ON cbt_worksheets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'client'
      AND profiles.id = cbt_worksheets.client_id
    )
  );

-- Policy for therapists to create worksheets for their clients
CREATE POLICY "Therapists can create worksheets for their clients"
  ON cbt_worksheets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM therapist_client_relations tcr
      JOIN profiles p ON p.id = auth.uid()
      WHERE p.role = 'therapist'
      AND tcr.therapist_id = auth.uid()
      AND tcr.client_id = cbt_worksheets.client_id
    )
  );

-- Policy for clients to update their own worksheets
CREATE POLICY "Clients can update their own worksheets"
  ON cbt_worksheets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'client'
      AND profiles.id = cbt_worksheets.client_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'client'
      AND profiles.id = cbt_worksheets.client_id
    )
  );

-- Policy for therapists to update worksheets for their clients
CREATE POLICY "Therapists can update worksheets for their clients"
  ON cbt_worksheets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapist_client_relations tcr
      JOIN profiles p ON p.id = auth.uid()
      WHERE p.role = 'therapist'
      AND tcr.therapist_id = auth.uid()
      AND tcr.client_id = cbt_worksheets.client_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM therapist_client_relations tcr
      JOIN profiles p ON p.id = auth.uid()
      WHERE p.role = 'therapist'
      AND tcr.therapist_id = auth.uid()
      AND tcr.client_id = cbt_worksheets.client_id
    )
  );