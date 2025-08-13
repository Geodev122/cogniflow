/*
  # CogniFlow Workflow Implementation

  1. New Tables
    - `cases` - Main case management table
    - `case_milestones` - Track workflow milestones
    - `in_between_sessions` - Between-session progress tracking
    - `diagnostic_codes` - DSM-5-TR and ICD-11 reference codes
    - `case_formulations` - Diagnostic formulations and treatment plans

  2. Security
    - Enable RLS on all new tables
    - Add policies for therapist access to their cases
    - Add policies for client access to their own data

  3. Functions
    - `create_case` - Initialize new case with milestones
    - `log_milestone` - Track workflow progress
    - `get_case_timeline` - Retrieve case progress timeline
*/

-- Cases table for main case management
CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  therapist_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  case_number text UNIQUE NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived', 'transferred')),
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Case milestones tracking
CREATE TABLE IF NOT EXISTS case_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  milestone_number integer NOT NULL,
  milestone_name text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- In-between sessions progress tracking
CREATE TABLE IF NOT EXISTS in_between_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_type text NOT NULL CHECK (task_type IN ('mood_log', 'thought_record', 'assessment_checkin', 'homework', 'exercise')),
  task_title text NOT NULL,
  task_data jsonb DEFAULT '{}',
  client_response jsonb DEFAULT '{}',
  mood_rating integer CHECK (mood_rating >= 1 AND mood_rating <= 10),
  client_notes text,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Diagnostic codes reference
CREATE TABLE IF NOT EXISTS diagnostic_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  system text NOT NULL CHECK (system IN ('DSM-5-TR', 'ICD-11')),
  criteria jsonb DEFAULT '[]',
  description text,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Case formulations
CREATE TABLE IF NOT EXISTS case_formulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  therapist_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dsm_code text,
  icd_code text,
  diagnostic_impression text,
  case_formulation text,
  maintaining_factors text,
  treatment_recommendations text,
  formulation_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_between_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_formulations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cases
CREATE POLICY "cases_therapist_access"
  ON cases
  FOR ALL
  TO authenticated
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "cases_client_read"
  ON cases
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- RLS Policies for case_milestones
CREATE POLICY "case_milestones_therapist_access"
  ON case_milestones
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM cases 
    WHERE cases.id = case_milestones.case_id 
    AND cases.therapist_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM cases 
    WHERE cases.id = case_milestones.case_id 
    AND cases.therapist_id = auth.uid()
  ));

CREATE POLICY "case_milestones_client_read"
  ON case_milestones
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM cases 
    WHERE cases.id = case_milestones.case_id 
    AND cases.client_id = auth.uid()
  ));

-- RLS Policies for in_between_sessions
CREATE POLICY "in_between_sessions_therapist_access"
  ON in_between_sessions
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM cases 
    WHERE cases.id = in_between_sessions.case_id 
    AND cases.therapist_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM cases 
    WHERE cases.id = in_between_sessions.case_id 
    AND cases.therapist_id = auth.uid()
  ));

CREATE POLICY "in_between_sessions_client_access"
  ON in_between_sessions
  FOR ALL
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- RLS Policies for diagnostic_codes (read-only for all authenticated users)
CREATE POLICY "diagnostic_codes_read_all"
  ON diagnostic_codes
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for case_formulations
CREATE POLICY "case_formulations_therapist_access"
  ON case_formulations
  FOR ALL
  TO authenticated
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cases_therapist_id ON cases(therapist_id);
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_case_milestones_case_id ON case_milestones(case_id);
CREATE INDEX IF NOT EXISTS idx_in_between_sessions_case_id ON in_between_sessions(case_id);
CREATE INDEX IF NOT EXISTS idx_in_between_sessions_client_id ON in_between_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_in_between_sessions_submitted_at ON in_between_sessions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_diagnostic_codes_system ON diagnostic_codes(system);
CREATE INDEX IF NOT EXISTS idx_case_formulations_case_id ON case_formulations(case_id);

-- Triggers for updated_at
CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_formulations_updated_at
  BEFORE UPDATE ON case_formulations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create a new case with initial milestones
CREATE OR REPLACE FUNCTION create_case(
  p_client_id uuid,
  p_therapist_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_case_id uuid;
  v_case_number text;
BEGIN
  -- Generate case number
  v_case_number := 'CASE-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 8);
  
  -- Create case
  INSERT INTO cases (client_id, therapist_id, case_number)
  VALUES (p_client_id, p_therapist_id, v_case_number)
  RETURNING id INTO v_case_id;
  
  -- Create initial milestones
  INSERT INTO case_milestones (case_id, milestone_number, milestone_name, description) VALUES
  (v_case_id, 1, 'Intake Complete', 'Client intake and initial assessment completed'),
  (v_case_id, 2, 'Goals Defined', 'Case formulation and SMART goals established'),
  (v_case_id, 3, 'In-Between Progress Recorded', 'Between-session progress tracking active'),
  (v_case_id, 4, 'Session Completed', 'Regular therapy sessions documented'),
  (v_case_id, 5, 'Insights Generated', 'Progress analytics and insights available'),
  (v_case_id, 6, 'Case Closed', 'Treatment completed or case transferred');
  
  RETURN v_case_id;
END;
$$;

-- Function to log milestone completion
CREATE OR REPLACE FUNCTION log_milestone(
  p_case_id uuid,
  p_milestone_number integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE case_milestones
  SET status = 'completed',
      completed_at = now()
  WHERE case_id = p_case_id 
    AND milestone_number = p_milestone_number
    AND status != 'completed';
END;
$$;

-- Function to get case timeline
CREATE OR REPLACE FUNCTION get_case_timeline(
  p_case_id uuid
) RETURNS TABLE (
  milestone_number integer,
  milestone_name text,
  status text,
  completed_at timestamptz,
  days_to_complete integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.milestone_number,
    cm.milestone_name,
    cm.status,
    cm.completed_at,
    CASE 
      WHEN cm.completed_at IS NOT NULL 
      THEN EXTRACT(days FROM cm.completed_at - cm.created_at)::integer
      ELSE NULL
    END as days_to_complete
  FROM case_milestones cm
  WHERE cm.case_id = p_case_id
  ORDER BY cm.milestone_number;
END;
$$;

-- Insert sample diagnostic codes
INSERT INTO diagnostic_codes (code, name, system, criteria, category) VALUES
-- DSM-5-TR Codes
('300.02', 'Generalized Anxiety Disorder', 'DSM-5-TR', 
 '["Excessive anxiety/worry more days than not for 6+ months", "Difficulty controlling worry", "≥3 associated symptoms (restlessness, fatigue, irritability, etc.)"]'::jsonb,
 'Anxiety Disorders'),
('296.23', 'Major Depressive Disorder, Single Episode, Severe', 'DSM-5-TR',
 '["≥5 symptoms during 2-week period", "Depressed mood or loss of interest/pleasure", "Significant impairment in functioning", "Not attributable to substance use or medical condition"]'::jsonb,
 'Depressive Disorders'),
('309.81', 'Posttraumatic Stress Disorder', 'DSM-5-TR',
 '["Exposure to actual or threatened death, serious injury, or sexual violence", "Intrusion symptoms (memories, dreams, flashbacks)", "Avoidance of trauma-related stimuli", "Negative alterations in cognitions and mood", "Alterations in arousal and reactivity"]'::jsonb,
 'Trauma and Stressor-Related Disorders'),

-- ICD-11 Codes
('6B00', 'Generalized Anxiety Disorder', 'ICD-11',
 '["Persistent worry/unease most days for several months", "Associated with tension, sleep disturbance, concentration difficulties", "Significant distress or impairment in functioning"]'::jsonb,
 'Anxiety and Fear-Related Disorders'),
('6A70', 'Single Episode Depressive Disorder', 'ICD-11',
 '["Depressed mood or diminished interest in activities", "Duration of at least 2 weeks", "Associated symptoms (appetite changes, sleep disturbance, fatigue, concentration problems)", "Significant distress or impairment"]'::jsonb,
 'Mood Disorders'),
('6B40', 'Post Traumatic Stress Disorder', 'ICD-11',
 '["Exposure to extremely threatening or horrific event", "Re-experiencing the event in the present", "Deliberate avoidance of reminders", "Persistent perceptions of heightened current threat"]'::jsonb,
 'Disorders Specifically Associated with Stress')

ON CONFLICT DO NOTHING;