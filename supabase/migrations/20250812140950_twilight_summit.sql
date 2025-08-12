/*
  # Fix Case Management Schema

  1. New Tables
    - `cases` - Case tracking and management
    - `case_milestones` - Case progress milestones
    - `diagnostic_codes` - DSM-5-TR and ICD-11 diagnostic codes
    - `case_formulations` - Clinical formulations and diagnostic impressions
    - `in_between_sessions` - Between-session task tracking
    - Updates to `resource_library` and `assessment_library`

  2. Security
    - Enable RLS on all new tables
    - Add policies for therapist and client access
    - Ensure proper data isolation

  3. Functions
    - Case creation and milestone tracking
    - Profile completion calculation
    - Therapist insights and analytics

  4. Data
    - Populate diagnostic codes for DSM-5-TR and ICD-11
    - Add assessment library entries
    - Add resource library sample data
*/

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "cases_therapist_access" ON cases;
DROP POLICY IF EXISTS "cases_client_read" ON cases;
DROP POLICY IF EXISTS "case_milestones_therapist_access" ON case_milestones;
DROP POLICY IF EXISTS "case_milestones_client_read" ON case_milestones;
DROP POLICY IF EXISTS "diagnostic_codes_read_all" ON diagnostic_codes;
DROP POLICY IF EXISTS "case_formulations_therapist_access" ON case_formulations;
DROP POLICY IF EXISTS "in_between_sessions_therapist_access" ON in_between_sessions;
DROP POLICY IF EXISTS "in_between_sessions_client_access" ON in_between_sessions;
DROP POLICY IF EXISTS "resource_library_read_public" ON resource_library;
DROP POLICY IF EXISTS "resource_library_therapist_manage_own" ON resource_library;
DROP POLICY IF EXISTS "assessment_library_read_active" ON assessment_library;

-- Create cases table if not exists
CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  therapist_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  case_number text NOT NULL UNIQUE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived', 'transferred')),
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create case_milestones table if not exists
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

-- Create diagnostic_codes table if not exists
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

-- Create case_formulations table if not exists
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

-- Create in_between_sessions table if not exists
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

-- Update resource_library table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resource_library') THEN
    CREATE TABLE resource_library (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      category text NOT NULL CHECK (category IN ('worksheet', 'educational', 'intervention', 'protocol', 'research')),
      subcategory text,
      description text,
      content_type text CHECK (content_type IN ('pdf', 'text', 'video', 'audio', 'interactive')),
      content_url text,
      content_data jsonb,
      tags text[],
      difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
      evidence_level text CHECK (evidence_level IN ('research_based', 'clinical_consensus', 'expert_opinion')),
      created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
      is_public boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Update assessment_library table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessment_library') THEN
    CREATE TABLE assessment_library (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      abbreviation text,
      category text NOT NULL,
      description text,
      questions jsonb NOT NULL DEFAULT '[]',
      scoring_method jsonb DEFAULT '{}',
      interpretation_guide jsonb DEFAULT '{}',
      is_active boolean DEFAULT true,
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_formulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_between_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_library ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cases (with new names to avoid conflicts)
CREATE POLICY "cases_therapist_manage" ON cases
  FOR ALL TO authenticated
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "cases_client_view" ON cases
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- Create RLS policies for case_milestones
CREATE POLICY "case_milestones_therapist_manage" ON case_milestones
  FOR ALL TO authenticated
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

CREATE POLICY "case_milestones_client_view" ON case_milestones
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM cases 
    WHERE cases.id = case_milestones.case_id 
    AND cases.client_id = auth.uid()
  ));

-- Create RLS policies for diagnostic_codes
CREATE POLICY "diagnostic_codes_public_read" ON diagnostic_codes
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Create RLS policies for case_formulations
CREATE POLICY "case_formulations_therapist_manage" ON case_formulations
  FOR ALL TO authenticated
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

-- Create RLS policies for in_between_sessions
CREATE POLICY "in_between_sessions_therapist_manage" ON in_between_sessions
  FOR ALL TO authenticated
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

CREATE POLICY "in_between_sessions_client_manage" ON in_between_sessions
  FOR ALL TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Create RLS policies for resource_library
CREATE POLICY "resource_library_public_access" ON resource_library
  FOR SELECT TO authenticated
  USING (is_public = true);

CREATE POLICY "resource_library_creator_manage" ON resource_library
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'therapist' 
    AND p.id = resource_library.created_by
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'therapist' 
    AND p.id = resource_library.created_by
  ));

-- Create RLS policies for assessment_library
CREATE POLICY "assessment_library_public_read" ON assessment_library
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_therapist_id ON cases(therapist_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_case_milestones_case_id ON case_milestones(case_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_codes_system ON diagnostic_codes(system);
CREATE INDEX IF NOT EXISTS idx_case_formulations_case_id ON case_formulations(case_id);
CREATE INDEX IF NOT EXISTS idx_in_between_sessions_case_id ON in_between_sessions(case_id);
CREATE INDEX IF NOT EXISTS idx_in_between_sessions_client_id ON in_between_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_in_between_sessions_submitted_at ON in_between_sessions(submitted_at);

-- Create function to generate case numbers
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS text AS $$
BEGIN
  RETURN 'CASE-' || to_char(now(), 'YYYY') || '-' || LPAD((EXTRACT(epoch FROM now())::bigint % 100000)::text, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Create function to create case with milestone
CREATE OR REPLACE FUNCTION create_case_with_milestone(
  p_client_id uuid,
  p_therapist_id uuid
)
RETURNS uuid AS $$
DECLARE
  v_case_id uuid;
  v_case_number text;
BEGIN
  -- Generate case number
  v_case_number := generate_case_number();
  
  -- Create case
  INSERT INTO cases (client_id, therapist_id, case_number)
  VALUES (p_client_id, p_therapist_id, v_case_number)
  RETURNING id INTO v_case_id;
  
  -- Log first milestone
  INSERT INTO case_milestones (case_id, milestone_number, milestone_name, description, status)
  VALUES (v_case_id, 1, 'Intake Complete', 'Client intake and initial assessment completed', 'completed');
  
  RETURN v_case_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log milestones
CREATE OR REPLACE FUNCTION log_milestone(
  p_case_id uuid,
  p_milestone_number integer,
  p_milestone_name text,
  p_description text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO case_milestones (case_id, milestone_number, milestone_name, description, status, completed_at)
  VALUES (p_case_id, p_milestone_number, p_milestone_name, p_description, 'completed', now())
  ON CONFLICT (case_id, milestone_number) 
  DO UPDATE SET 
    status = 'completed',
    completed_at = now(),
    description = COALESCE(EXCLUDED.description, case_milestones.description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get case timeline
CREATE OR REPLACE FUNCTION get_case_timeline(p_case_id uuid)
RETURNS TABLE (
  milestone_number integer,
  milestone_name text,
  description text,
  status text,
  completed_at timestamptz,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.milestone_number,
    cm.milestone_name,
    cm.description,
    cm.status,
    cm.completed_at,
    cm.created_at
  FROM case_milestones cm
  WHERE cm.case_id = p_case_id
  ORDER BY cm.milestone_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get therapist profile
CREATE OR REPLACE FUNCTION get_therapist_profile(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_profile jsonb;
  v_client_count integer;
BEGIN
  -- Get client count
  SELECT COUNT(*) INTO v_client_count
  FROM therapist_client_relations
  WHERE therapist_id = p_user_id;
  
  -- Build profile
  SELECT jsonb_build_object(
    'id', p.id,
    'fullName', p.first_name || ' ' || p.last_name,
    'whatsappNumber', COALESCE(p.whatsapp_number, ''),
    'email', p.email,
    'specializations', COALESCE((p.professional_details->>'specializations')::jsonb, '[]'::jsonb),
    'languages', COALESCE((p.professional_details->>'languages')::jsonb, '[]'::jsonb),
    'qualifications', COALESCE(p.professional_details->>'qualifications', ''),
    'bio', COALESCE(p.professional_details->>'bio', ''),
    'practiceLocations', COALESCE((p.professional_details->>'practice_locations')::jsonb, '[]'::jsonb),
    'verificationStatus', COALESCE(p.verification_status, 'pending'),
    'membershipStatus', 'active',
    'joinDate', p.created_at,
    'stats', jsonb_build_object(
      'totalClients', v_client_count,
      'yearsExperience', EXTRACT(YEAR FROM age(now(), p.created_at)),
      'rating', 4.5,
      'reviewCount', 0,
      'responseTime', '< 24h'
    )
  ) INTO v_profile
  FROM profiles p
  WHERE p.id = p_user_id AND p.role = 'therapist';
  
  RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate profile completion
CREATE OR REPLACE FUNCTION calculate_profile_completion(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_completion integer := 0;
  v_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  
  -- Basic info (33%)
  IF v_profile.whatsapp_number IS NOT NULL AND v_profile.whatsapp_number != '' THEN
    v_completion := v_completion + 33;
  END IF;
  
  -- Professional details (33%)
  IF v_profile.professional_details IS NOT NULL AND 
     v_profile.professional_details->>'specializations' IS NOT NULL THEN
    v_completion := v_completion + 33;
  END IF;
  
  -- Verification (34%)
  IF v_profile.verification_status IS NOT NULL THEN
    v_completion := v_completion + 34;
  END IF;
  
  RETURN v_completion;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get therapist insights
CREATE OR REPLACE FUNCTION get_therapist_insights(p_therapist_id uuid)
RETURNS TABLE (
  overdue_assessments bigint,
  idle_clients bigint,
  completion_rate numeric,
  avg_response_time text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(
      (SELECT COUNT(*) 
       FROM form_assignments fa 
       WHERE fa.therapist_id = p_therapist_id 
       AND fa.status = 'assigned' 
       AND fa.due_date < CURRENT_DATE), 0
    ) as overdue_assessments,
    COALESCE(
      (SELECT COUNT(DISTINCT tcr.client_id)
       FROM therapist_client_relations tcr
       LEFT JOIN appointments a ON a.client_id = tcr.client_id 
         AND a.therapist_id = tcr.therapist_id 
         AND a.appointment_date > (now() - interval '30 days')
       WHERE tcr.therapist_id = p_therapist_id 
       AND a.id IS NULL), 0
    ) as idle_clients,
    COALESCE(
      (SELECT ROUND(
        (COUNT(*) FILTER (WHERE status = 'completed')::numeric / 
         NULLIF(COUNT(*), 0)) * 100, 1
       )
       FROM form_assignments 
       WHERE therapist_id = p_therapist_id), 0
    ) as completion_rate,
    '< 24h' as avg_response_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_formulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_between_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_library ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cases (with unique names)
CREATE POLICY "cases_therapist_full_access" ON cases
  FOR ALL TO authenticated
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "cases_client_read_only" ON cases
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- Create RLS policies for case_milestones
CREATE POLICY "case_milestones_therapist_full_access" ON case_milestones
  FOR ALL TO authenticated
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

CREATE POLICY "case_milestones_client_read_only" ON case_milestones
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM cases 
    WHERE cases.id = case_milestones.case_id 
    AND cases.client_id = auth.uid()
  ));

-- Create RLS policies for diagnostic_codes
CREATE POLICY "diagnostic_codes_authenticated_read" ON diagnostic_codes
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Create RLS policies for case_formulations
CREATE POLICY "case_formulations_therapist_full_access" ON case_formulations
  FOR ALL TO authenticated
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

-- Create RLS policies for in_between_sessions
CREATE POLICY "in_between_sessions_therapist_full_access" ON in_between_sessions
  FOR ALL TO authenticated
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

CREATE POLICY "in_between_sessions_client_full_access" ON in_between_sessions
  FOR ALL TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Create RLS policies for resource_library
CREATE POLICY "resource_library_public_read_access" ON resource_library
  FOR SELECT TO authenticated
  USING (is_public = true);

CREATE POLICY "resource_library_creator_full_access" ON resource_library
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'therapist' 
    AND p.id = resource_library.created_by
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'therapist' 
    AND p.id = resource_library.created_by
  ));

-- Create RLS policies for assessment_library
CREATE POLICY "assessment_library_authenticated_read" ON assessment_library
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_therapist_id ON cases(therapist_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_case_milestones_case_id ON case_milestones(case_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_codes_system ON diagnostic_codes(system);
CREATE INDEX IF NOT EXISTS idx_case_formulations_case_id ON case_formulations(case_id);
CREATE INDEX IF NOT EXISTS idx_in_between_sessions_case_id ON in_between_sessions(case_id);
CREATE INDEX IF NOT EXISTS idx_in_between_sessions_client_id ON in_between_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_in_between_sessions_submitted_at ON in_between_sessions(submitted_at);

-- Insert diagnostic codes for DSM-5-TR
INSERT INTO diagnostic_codes (code, name, system, criteria, category) VALUES
('300.02', 'Generalized Anxiety Disorder', 'DSM-5-TR', 
 '["Excessive anxiety/worry more days than not for 6+ months", "Difficulty controlling worry", "≥3 associated symptoms (restlessness, fatigue, irritability, concentration problems, muscle tension, sleep disturbance)"]'::jsonb,
 'Anxiety Disorders'),
('296.23', 'Major Depressive Disorder, Single Episode, Severe', 'DSM-5-TR',
 '["≥5 symptoms during 2-week period", "Depressed mood or loss of interest/pleasure", "Significant impairment in functioning", "Not attributable to substance use or medical condition"]'::jsonb,
 'Depressive Disorders'),
('309.81', 'Posttraumatic Stress Disorder', 'DSM-5-TR',
 '["Exposure to actual or threatened death, serious injury, or sexual violence", "Intrusion symptoms (memories, dreams, flashbacks)", "Avoidance of trauma-related stimuli", "Negative alterations in cognitions and mood", "Alterations in arousal and reactivity"]'::jsonb,
 'Trauma and Stressor-Related Disorders'),
('300.23', 'Social Anxiety Disorder', 'DSM-5-TR',
 '["Marked fear/anxiety about social situations", "Fear of negative evaluation", "Social situations avoided or endured with distress", "Duration ≥6 months"]'::jsonb,
 'Anxiety Disorders'),
('300.3', 'Obsessive-Compulsive Disorder', 'DSM-5-TR',
 '["Presence of obsessions, compulsions, or both", "Time-consuming (>1 hour/day) or significant distress", "Not attributable to substance use"]'::jsonb,
 'Obsessive-Compulsive and Related Disorders')
ON CONFLICT (code, system) DO NOTHING;

-- Insert diagnostic codes for ICD-11
INSERT INTO diagnostic_codes (code, name, system, criteria, category) VALUES
('6B00', 'Generalized Anxiety Disorder', 'ICD-11',
 '["Persistent worry/unease most days for several months", "Associated with tension, sleep disturbance, concentration difficulties", "Significant distress or impairment in functioning"]'::jsonb,
 'Anxiety and Fear-Related Disorders'),
('6A70', 'Single Episode Depressive Disorder', 'ICD-11',
 '["Depressed mood or diminished interest in activities", "Duration of at least 2 weeks", "Associated symptoms (appetite changes, sleep disturbance, fatigue, concentration problems)", "Significant distress or impairment"]'::jsonb,
 'Mood Disorders'),
('6B40', 'Post Traumatic Stress Disorder', 'ICD-11',
 '["Exposure to extremely threatening or horrific event", "Re-experiencing the event in the present", "Deliberate avoidance of reminders", "Persistent perceptions of heightened current threat"]'::jsonb,
 'Disorders Specifically Associated with Stress'),
('6B04', 'Social Anxiety Disorder', 'ICD-11',
 '["Marked and excessive fear/anxiety in social situations", "Fear of negative evaluation by others", "Social situations consistently avoided or endured with distress"]'::jsonb,
 'Anxiety and Fear-Related Disorders'),
('6B20', 'Obsessive-Compulsive Disorder', 'ICD-11',
 '["Presence of persistent obsessions and/or compulsions", "Obsessions/compulsions are time-consuming or cause distress", "Not due to substance use or medical condition"]'::jsonb,
 'Obsessive-Compulsive or Related Disorders')
ON CONFLICT (code, system) DO NOTHING;

-- Insert assessment library data
INSERT INTO assessment_library (name, abbreviation, category, description, questions, scoring_method, interpretation_guide) VALUES
('Patient Health Questionnaire-9', 'PHQ-9', 'Depression', 'Measures severity of depression symptoms over the past two weeks',
 '[
   {"id": "phq9_1", "text": "Little interest or pleasure in doing things", "type": "scale", "scale_min": 0, "scale_max": 3},
   {"id": "phq9_2", "text": "Feeling down, depressed, or hopeless", "type": "scale", "scale_min": 0, "scale_max": 3},
   {"id": "phq9_3", "text": "Trouble falling or staying asleep, or sleeping too much", "type": "scale", "scale_min": 0, "scale_max": 3},
   {"id": "phq9_4", "text": "Feeling tired or having little energy", "type": "scale", "scale_min": 0, "scale_max": 3},
   {"id": "phq9_5", "text": "Poor appetite or overeating", "type": "scale", "scale_min": 0, "scale_max": 3},
   {"id": "phq9_6", "text": "Feeling bad about yourself or that you are a failure", "type": "scale", "scale_min": 0, "scale_max": 3},
   {"id": "phq9_7", "text": "Trouble concentrating on things", "type": "scale", "scale_min": 0, "scale_max": 3},
   {"id": "phq9_8", "text": "Moving or speaking slowly, or being fidgety/restless", "type": "scale", "scale_min": 0, "scale_max": 3},
   {"id": "phq9_9", "text": "Thoughts that you would be better off dead or hurting yourself", "type": "scale", "scale_min": 0, "scale_max": 3}
 ]'::jsonb,
 '{"method": "sum", "max_score": 27}'::jsonb,
 '[
   {"min": 0, "max": 4, "label": "Minimal Depression", "description": "No or minimal depression symptoms"},
   {"min": 5, "max": 9, "label": "Mild Depression", "description": "Mild depression symptoms"},
   {"min": 10, "max": 14, "label": "Moderate Depression", "description": "Moderate depression symptoms"},
   {"min": 15, "max": 19, "label": "Moderately Severe Depression", "description": "Moderately severe depression symptoms"},
   {"min": 20, "max": 27, "label": "Severe Depression", "description": "Severe depression symptoms"}
 ]'::jsonb),

('Generalized Anxiety Disorder-7', 'GAD-7', 'Anxiety', 'Measures severity of generalized anxiety disorder symptoms',
 '[
   {"id": "gad7_1", "text": "Feeling nervous, anxious, or on edge", "type": "scale", "scale_min": 0, "scale_max": 3},
   {"id": "gad7_2", "text": "Not being able to stop or control worrying", "type": "scale", "scale_min": 0, "scale_max": 3},
   {"id": "gad7_3", "text": "Worrying too much about different things", "type": "scale", "scale_min": 0, "scale_max": 3},
   {"id": "gad7_4", "text": "Trouble relaxing", "type": "scale", "scale_min": 0, "scale_max": 3},
   {"id": "gad7_5", "text": "Being so restless that it is hard to sit still", "type": "scale", "scale_min": 0, "scale_max": 3},
   {"id": "gad7_6", "text": "Becoming easily annoyed or irritable", "type": "scale", "scale_min": 0, "scale_max": 3},
   {"id": "gad7_7", "text": "Feeling afraid as if something awful might happen", "type": "scale", "scale_min": 0, "scale_max": 3}
 ]'::jsonb,
 '{"method": "sum", "max_score": 21}'::jsonb,
 '[
   {"min": 0, "max": 4, "label": "Minimal Anxiety", "description": "No or minimal anxiety symptoms"},
   {"min": 5, "max": 9, "label": "Mild Anxiety", "description": "Mild anxiety symptoms"},
   {"min": 10, "max": 14, "label": "Moderate Anxiety", "description": "Moderate anxiety symptoms"},
   {"min": 15, "max": 21, "label": "Severe Anxiety", "description": "Severe anxiety symptoms"}
 ]'::jsonb),

('Beck Depression Inventory-II', 'BDI-II', 'Depression', 'Measures severity of depression symptoms in adolescents and adults',
 '[
   {"id": "bdi_1", "text": "Sadness", "type": "multiple_choice", "options": ["I do not feel sad", "I feel sad much of the time", "I am sad all the time", "I am so sad or unhappy that I cannot stand it"]},
   {"id": "bdi_2", "text": "Pessimism", "type": "multiple_choice", "options": ["I am not discouraged about my future", "I feel more discouraged about my future than I used to be", "I do not expect things to work out for me", "I feel my future is hopeless and will only get worse"]},
   {"id": "bdi_3", "text": "Past Failure", "type": "multiple_choice", "options": ["I do not feel like a failure", "I have failed more than I should have", "As I look back, I see a lot of failures", "I feel I am a total failure as a person"]}
 ]'::jsonb,
 '{"method": "sum", "max_score": 63}'::jsonb,
 '[
   {"min": 0, "max": 13, "label": "Minimal Depression", "description": "These ups and downs are considered normal"},
   {"min": 14, "max": 19, "label": "Mild Depression", "description": "Mild mood disturbance"},
   {"min": 20, "max": 28, "label": "Moderate Depression", "description": "Moderate depression"},
   {"min": 29, "max": 63, "label": "Severe Depression", "description": "Severe depression"}
 ]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Insert resource library data
INSERT INTO resource_library (title, category, subcategory, description, content_type, tags, difficulty_level, evidence_level, is_public) VALUES
('CBT Thought Record Worksheet', 'worksheet', 'Cognitive Restructuring', 'Classic thought challenging worksheet for identifying and restructuring negative thoughts', 'interactive', 
 ARRAY['CBT', 'thoughts', 'cognitive', 'homework'], 'beginner', 'research_based', true),

('Daily Mood Tracking Sheet', 'worksheet', 'Mood Monitoring', 'Simple daily mood tracking tool with triggers and coping strategies', 'interactive',
 ARRAY['mood', 'tracking', 'daily', 'self-monitoring'], 'beginner', 'clinical_consensus', true),

('Anxiety Management Protocol', 'protocol', 'Anxiety Treatment', 'Evidence-based protocol for treating generalized anxiety disorder', 'text',
 ARRAY['anxiety', 'protocol', 'GAD', 'treatment'], 'intermediate', 'research_based', true),

('Introduction to CBT Principles', 'educational', 'Psychoeducation', 'Comprehensive guide to cognitive behavioral therapy fundamentals', 'text',
 ARRAY['CBT', 'education', 'fundamentals', 'theory'], 'beginner', 'research_based', true),

('Mindfulness-Based Interventions', 'educational', 'Psychoeducation', 'Video series on implementing mindfulness techniques in therapy', 'video',
 ARRAY['mindfulness', 'video', 'techniques', 'meditation'], 'intermediate', 'research_based', true),

('Breathing Exercise Protocol', 'intervention', 'Therapeutic Exercises', 'Guided breathing exercises for anxiety and stress management', 'interactive',
 ARRAY['breathing', 'anxiety', 'stress', 'relaxation'], 'beginner', 'research_based', true),

('Cognitive Restructuring Game', 'intervention', 'Therapeutic Exercises', 'Interactive game for practicing thought challenging skills', 'interactive',
 ARRAY['cognitive', 'game', 'thoughts', 'CBT'], 'intermediate', 'clinical_consensus', true),

('Depression Treatment Research', 'research', 'Evidence Base', 'Latest research on effective depression treatment modalities', 'pdf',
 ARRAY['depression', 'research', 'evidence', 'treatment'], 'advanced', 'research_based', true)
ON CONFLICT (title) DO NOTHING;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cases_updated_at') THEN
    CREATE TRIGGER update_cases_updated_at
      BEFORE UPDATE ON cases
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_case_formulations_updated_at') THEN
    CREATE TRIGGER update_case_formulations_updated_at
      BEFORE UPDATE ON case_formulations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_resource_library_updated_at') THEN
    CREATE TRIGGER update_resource_library_updated_at
      BEFORE UPDATE ON resource_library
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Drop and recreate views to avoid conflicts
DROP VIEW IF EXISTS therapist_insights_metrics;
DROP VIEW IF EXISTS progress_metrics;

-- Create view for therapist insights metrics
CREATE VIEW therapist_insights_metrics AS
SELECT 
  tcr.therapist_id,
  COALESCE(overdue.overdue_assessments, 0) as overdue_assessments,
  COALESCE(idle.idle_clients, 0) as idle_clients
FROM (
  SELECT DISTINCT therapist_id 
  FROM therapist_client_relations
) tcr
LEFT JOIN (
  SELECT 
    fa.therapist_id,
    COUNT(*) as overdue_assessments
  FROM form_assignments fa
  WHERE fa.status = 'assigned' 
  AND fa.due_date < CURRENT_DATE
  GROUP BY fa.therapist_id
) overdue ON overdue.therapist_id = tcr.therapist_id
LEFT JOIN (
  SELECT 
    tcr.therapist_id,
    COUNT(DISTINCT tcr.client_id) as idle_clients
  FROM therapist_client_relations tcr
  LEFT JOIN appointments a ON a.client_id = tcr.client_id 
    AND a.therapist_id = tcr.therapist_id 
    AND a.appointment_date > (now() - interval '30 days')
  WHERE a.id IS NULL
  GROUP BY tcr.therapist_id
) idle ON idle.therapist_id = tcr.therapist_id;

-- Create progress metrics view
CREATE VIEW progress_metrics AS
SELECT 
  pt.client_id,
  pt.recorded_at::date as metric_date,
  pt.metric_type,
  pt.value
FROM progress_tracking pt
UNION ALL
SELECT 
  pf.client_id,
  pf.completed_at::date as metric_date,
  pf.form_type as metric_type,
  pf.score as value
FROM psychometric_forms pf
WHERE pf.completed_at IS NOT NULL
UNION ALL
SELECT 
  a.client_id,
  a.appointment_date::date as metric_date,
  'session_attendance' as metric_type,
  1 as value
FROM appointments a
WHERE a.status = 'completed';