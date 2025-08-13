/*
  # Add Psychometrics and Exercises Tables

  1. New Tables
    - `psychometric_forms`
      - `id` (uuid, primary key)
      - `therapist_id` (uuid, foreign key)
      - `client_id` (uuid, foreign key)
      - `form_type` (text) - PHQ-9, GAD-7, Beck Depression, etc.
      - `title` (text)
      - `questions` (jsonb) - form questions and structure
      - `responses` (jsonb) - client responses
      - `score` (integer) - calculated score
      - `status` (text) - assigned, completed
      - `created_at` (timestamp)
      - `completed_at` (timestamp)

    - `therapeutic_exercises`
      - `id` (uuid, primary key)
      - `therapist_id` (uuid, foreign key)
      - `client_id` (uuid, foreign key)
      - `exercise_type` (text) - breathing, mindfulness, cognitive_restructuring
      - `title` (text)
      - `description` (text)
      - `game_config` (jsonb) - game settings and parameters
      - `progress` (jsonb) - completion progress and scores
      - `status` (text) - assigned, in_progress, completed
      - `created_at` (timestamp)
      - `last_played_at` (timestamp)

    - `progress_tracking`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key)
      - `metric_type` (text) - mood, anxiety, depression, etc.
      - `value` (integer) - score value
      - `source_type` (text) - psychometric, exercise, manual
      - `source_id` (uuid) - reference to source record
      - `recorded_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for therapists and clients
*/

-- Psychometric Forms Table
CREATE TABLE IF NOT EXISTS psychometric_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  form_type text NOT NULL DEFAULT 'custom',
  title text NOT NULL,
  questions jsonb DEFAULT '[]'::jsonb,
  responses jsonb DEFAULT '{}'::jsonb,
  score integer DEFAULT 0,
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed')),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Therapeutic Exercises Table
CREATE TABLE IF NOT EXISTS therapeutic_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_type text NOT NULL DEFAULT 'breathing',
  title text NOT NULL,
  description text,
  game_config jsonb DEFAULT '{}'::jsonb,
  progress jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  last_played_at timestamptz
);

-- Progress Tracking Table
CREATE TABLE IF NOT EXISTS progress_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_type text NOT NULL,
  value integer NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('psychometric', 'exercise', 'manual')),
  source_id uuid,
  recorded_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_psychometric_forms_client_id ON psychometric_forms(client_id);
CREATE INDEX IF NOT EXISTS idx_psychometric_forms_therapist_id ON psychometric_forms(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapeutic_exercises_client_id ON therapeutic_exercises(client_id);
CREATE INDEX IF NOT EXISTS idx_therapeutic_exercises_therapist_id ON therapeutic_exercises(therapist_id);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_client_id ON progress_tracking(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_recorded_at ON progress_tracking(recorded_at);

-- Enable RLS
ALTER TABLE psychometric_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapeutic_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Psychometric Forms
CREATE POLICY "Clients can read their own psychometric forms"
  ON psychometric_forms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'client'
      AND profiles.id = psychometric_forms.client_id
    )
  );

CREATE POLICY "Clients can update their own psychometric forms"
  ON psychometric_forms
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'client'
      AND profiles.id = psychometric_forms.client_id
    )
  );

CREATE POLICY "Therapists can manage psychometric forms for their clients"
  ON psychometric_forms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapist_client_relations tcr
      JOIN profiles p ON p.id = auth.uid()
      WHERE p.role = 'therapist'
      AND tcr.therapist_id = auth.uid()
      AND tcr.client_id = psychometric_forms.client_id
    )
  );

-- RLS Policies for Therapeutic Exercises
CREATE POLICY "Clients can read their own exercises"
  ON therapeutic_exercises
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'client'
      AND profiles.id = therapeutic_exercises.client_id
    )
  );

CREATE POLICY "Clients can update their own exercises"
  ON therapeutic_exercises
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'client'
      AND profiles.id = therapeutic_exercises.client_id
    )
  );

CREATE POLICY "Therapists can manage exercises for their clients"
  ON therapeutic_exercises
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapist_client_relations tcr
      JOIN profiles p ON p.id = auth.uid()
      WHERE p.role = 'therapist'
      AND tcr.therapist_id = auth.uid()
      AND tcr.client_id = therapeutic_exercises.client_id
    )
  );

-- RLS Policies for Progress Tracking
CREATE POLICY "Clients can read their own progress"
  ON progress_tracking
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'client'
      AND profiles.id = progress_tracking.client_id
    )
  );

CREATE POLICY "Therapists can read progress for their clients"
  ON progress_tracking
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapist_client_relations tcr
      JOIN profiles p ON p.id = auth.uid()
      WHERE p.role = 'therapist'
      AND tcr.therapist_id = auth.uid()
      AND tcr.client_id = progress_tracking.client_id
    )
  );

CREATE POLICY "System can insert progress tracking"
  ON progress_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (true);