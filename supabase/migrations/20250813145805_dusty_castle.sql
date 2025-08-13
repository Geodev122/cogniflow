/*
  # Complete Backend Revision with Minimal Security RLS Policies

  1. Core Tables
    - `profiles` - User profiles with basic role-based access
    - `therapist_client_relations` - Simple therapist-client links
    - `client_profiles` - Extended client information
    - `appointments` - Session scheduling
    - `form_assignments` - Task assignments
    - `psychometric_forms` - Assessment forms
    - `therapeutic_exercises` - Interactive exercises
    - `progress_tracking` - Progress metrics
    - `assessment_library` - Available assessments
    - `custom_forms` - Custom form templates
    - `worksheets` - Worksheet templates
    - `worksheet_assignments` - Worksheet assignments

  2. Security
    - Minimal RLS policies using direct auth.uid() checks
    - No recursive policy dependencies
    - Simple role-based access control

  3. Functions
    - Essential utility functions for profile management
    - Progress calculation functions
    - Case management helpers
*/

-- Drop all existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident('policy_' || r.tablename || '_select') || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident('policy_' || r.tablename || '_insert') || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident('policy_' || r.tablename || '_update') || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident('policy_' || r.tablename || '_delete') || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Drop existing policies by name
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_therapist_view_clients" ON profiles;
DROP POLICY IF EXISTS "therapist_client_relations_therapist_manage" ON therapist_client_relations;
DROP POLICY IF EXISTS "therapist_client_relations_client_read" ON therapist_client_relations;

-- Core Tables with Minimal Security

-- 1. Profiles table - Basic user information
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('therapist', 'client')),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  patient_code text UNIQUE,
  whatsapp_number text,
  password_set boolean DEFAULT false,
  created_by_therapist uuid REFERENCES profiles(id),
  professional_details jsonb,
  verification_status text CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Minimal RLS for profiles - users can only see their own data
CREATE POLICY "profiles_own_data" ON profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Therapist-Client Relations
CREATE TABLE IF NOT EXISTS therapist_client_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(therapist_id, client_id)
);

ALTER TABLE therapist_client_relations ENABLE ROW LEVEL SECURITY;

-- Minimal RLS - only therapists can manage their relations
CREATE POLICY "relations_therapist_only" ON therapist_client_relations
  FOR ALL TO authenticated
  USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);

-- 3. Client Profiles - Extended client information
CREATE TABLE IF NOT EXISTS client_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  therapist_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  medical_history text,
  current_medications text,
  presenting_concerns text,
  therapy_history text,
  risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'moderate', 'high', 'crisis')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, therapist_id)
);

ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;

-- Minimal RLS - therapists can manage their client profiles
CREATE POLICY "client_profiles_therapist_access" ON client_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);

-- 4. Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_date timestamptz NOT NULL,
  duration_minutes integer DEFAULT 50,
  appointment_type text DEFAULT 'individual' CHECK (appointment_type IN ('individual', 'group', 'family', 'assessment')),
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Minimal RLS - therapists manage appointments
CREATE POLICY "appointments_therapist_access" ON appointments
  FOR ALL TO authenticated
  USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);

-- 5. Form Assignments
CREATE TABLE IF NOT EXISTS form_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  form_type text NOT NULL CHECK (form_type IN ('psychometric', 'custom', 'worksheet', 'exercise')),
  form_id uuid,
  title text NOT NULL,
  instructions text,
  due_date date,
  reminder_frequency text DEFAULT 'none' CHECK (reminder_frequency IN ('none', 'daily', 'weekly', 'before_due')),
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'overdue')),
  assigned_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE form_assignments ENABLE ROW LEVEL SECURITY;

-- Minimal RLS - therapists manage assignments, clients can view/update their own
CREATE POLICY "form_assignments_therapist_access" ON form_assignments
  FOR ALL TO authenticated
  USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "form_assignments_client_access" ON form_assignments
  FOR SELECT TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "form_assignments_client_update" ON form_assignments
  FOR UPDATE TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- 6. Psychometric Forms
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

ALTER TABLE psychometric_forms ENABLE ROW LEVEL SECURITY;

-- Minimal RLS
CREATE POLICY "psychometric_forms_therapist_access" ON psychometric_forms
  FOR ALL TO authenticated
  USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "psychometric_forms_client_access" ON psychometric_forms
  FOR SELECT TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "psychometric_forms_client_update" ON psychometric_forms
  FOR UPDATE TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- 7. Therapeutic Exercises
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

ALTER TABLE therapeutic_exercises ENABLE ROW LEVEL SECURITY;

-- Minimal RLS
CREATE POLICY "therapeutic_exercises_therapist_access" ON therapeutic_exercises
  FOR ALL TO authenticated
  USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "therapeutic_exercises_client_access" ON therapeutic_exercises
  FOR SELECT TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "therapeutic_exercises_client_update" ON therapeutic_exercises
  FOR UPDATE TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- 8. Progress Tracking
CREATE TABLE IF NOT EXISTS progress_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_type text NOT NULL,
  value integer NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('psychometric', 'exercise', 'manual')),
  source_id uuid,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;

-- Minimal RLS - open insert for system, read based on client
CREATE POLICY "progress_tracking_insert" ON progress_tracking
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "progress_tracking_client_read" ON progress_tracking
  FOR SELECT TO authenticated
  USING (auth.uid() = client_id);

-- 9. Assessment Library
CREATE TABLE IF NOT EXISTS assessment_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  abbreviation text,
  category text NOT NULL,
  description text,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  scoring_method jsonb DEFAULT '{}'::jsonb,
  interpretation_guide jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assessment_library ENABLE ROW LEVEL SECURITY;

-- Public read access for active assessments
CREATE POLICY "assessment_library_read" ON assessment_library
  FOR SELECT TO authenticated
  USING (is_active = true);

-- 10. Custom Forms
CREATE TABLE IF NOT EXISTS custom_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_template boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE custom_forms ENABLE ROW LEVEL SECURITY;

-- Minimal RLS
CREATE POLICY "custom_forms_therapist_access" ON custom_forms
  FOR ALL TO authenticated
  USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);

-- 11. Worksheets
CREATE TABLE IF NOT EXISTS worksheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE worksheets ENABLE ROW LEVEL SECURITY;

-- Minimal RLS
CREATE POLICY "worksheets_therapist_access" ON worksheets
  FOR ALL TO authenticated
  USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);

-- 12. Worksheet Assignments
CREATE TABLE IF NOT EXISTS worksheet_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worksheet_id uuid NOT NULL REFERENCES worksheets(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
  responses jsonb,
  assigned_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE worksheet_assignments ENABLE ROW LEVEL SECURITY;

-- Minimal RLS
CREATE POLICY "worksheet_assignments_client_access" ON worksheet_assignments
  FOR ALL TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- Essential Functions

-- Profile completion calculation
CREATE OR REPLACE FUNCTION profile_completion(user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  completion_score integer := 0;
  profile_record profiles%ROWTYPE;
BEGIN
  SELECT * INTO profile_record FROM profiles WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Basic info (20 points each)
  IF profile_record.whatsapp_number IS NOT NULL AND profile_record.whatsapp_number != '' THEN
    completion_score := completion_score + 20;
  END IF;
  
  IF profile_record.professional_details IS NOT NULL THEN
    completion_score := completion_score + 40;
  END IF;
  
  IF profile_record.verification_status IS NOT NULL THEN
    completion_score := completion_score + 40;
  END IF;
  
  RETURN completion_score;
END;
$$;

-- Get therapist profile with stats
CREATE OR REPLACE FUNCTION get_therapist_profile(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_data jsonb;
  client_count integer;
BEGIN
  -- Get basic profile
  SELECT to_jsonb(p.*) INTO profile_data
  FROM profiles p
  WHERE p.id = p_user_id;
  
  IF profile_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get client count
  SELECT COUNT(*) INTO client_count
  FROM therapist_client_relations
  WHERE therapist_id = p_user_id;
  
  -- Build complete profile
  profile_data := profile_data || jsonb_build_object(
    'fullName', profile_data->>'first_name' || ' ' || profile_data->>'last_name',
    'stats', jsonb_build_object(
      'totalClients', client_count,
      'yearsExperience', COALESCE((profile_data->'professional_details'->>'years_experience')::integer, 0),
      'rating', 4.8,
      'reviewCount', 0,
      'responseTime', '< 2 hours'
    )
  );
  
  RETURN profile_data;
END;
$$;

-- Create case with milestone
CREATE OR REPLACE FUNCTION create_case_with_milestone(p_client_id uuid, p_therapist_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  case_id uuid;
  case_number text;
BEGIN
  -- Generate case number
  case_number := 'CASE-' || EXTRACT(EPOCH FROM now())::bigint;
  
  -- Create case
  INSERT INTO cases (client_id, therapist_id, case_number, status)
  VALUES (p_client_id, p_therapist_id, case_number, 'active')
  RETURNING id INTO case_id;
  
  RETURN case_id;
END;
$$;

-- Session note creation
CREATE OR REPLACE FUNCTION create_session_note(session_id text, content text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  note_id uuid;
BEGIN
  INSERT INTO session_notes (therapist_id, progress_notes)
  VALUES (auth.uid(), content)
  RETURNING id INTO note_id;
  
  RETURN note_id;
END;
$$;

-- Get session documents
CREATE OR REPLACE FUNCTION get_session_documents(session_id text)
RETURNS TABLE(id uuid, file_url text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.file_url
  FROM document_uploads d
  WHERE d.therapist_id = auth.uid();
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_therapist_client_relations_therapist ON therapist_client_relations(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_client_relations_client ON therapist_client_relations(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_therapist ON appointments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_form_assignments_therapist ON form_assignments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_form_assignments_client ON form_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_client ON progress_tracking(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_date ON progress_tracking(recorded_at);

-- Populate Assessment Library
INSERT INTO assessment_library (id, name, abbreviation, category, description, questions, scoring_method, interpretation_guide) VALUES
(
  'phq9-assessment',
  'Patient Health Questionnaire-9',
  'PHQ-9',
  'depression',
  'Measures severity of depression symptoms over the past two weeks',
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
  '{
    "ranges": [
      {"min": 0, "max": 4, "label": "Minimal Depression", "description": "No or minimal depression symptoms"},
      {"min": 5, "max": 9, "label": "Mild Depression", "description": "Mild depression symptoms"},
      {"min": 10, "max": 14, "label": "Moderate Depression", "description": "Moderate depression symptoms"},
      {"min": 15, "max": 19, "label": "Moderately Severe Depression", "description": "Moderately severe depression symptoms"},
      {"min": 20, "max": 27, "label": "Severe Depression", "description": "Severe depression symptoms"}
    ]
  }'::jsonb
),
(
  'gad7-assessment',
  'Generalized Anxiety Disorder-7',
  'GAD-7',
  'anxiety',
  'Measures severity of generalized anxiety disorder symptoms',
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
  '{
    "ranges": [
      {"min": 0, "max": 4, "label": "Minimal Anxiety", "description": "No or minimal anxiety symptoms"},
      {"min": 5, "max": 9, "label": "Mild Anxiety", "description": "Mild anxiety symptoms"},
      {"min": 10, "max": 14, "label": "Moderate Anxiety", "description": "Moderate anxiety symptoms"},
      {"min": 15, "max": 21, "label": "Severe Anxiety", "description": "Severe anxiety symptoms"}
    ]
  }'::jsonb
);

-- Create demo therapist account
DO $$
DECLARE
  demo_therapist_id uuid := 'f7cb820b-f73e-4bfe-9571-261c7eef79e0';
  client1_id uuid := 'c1234567-1234-1234-1234-123456789012';
  client2_id uuid := 'c2345678-2345-2345-2345-234567890123';
BEGIN
  -- Insert demo therapist
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    demo_therapist_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'fedgee911@gmail.com',
    crypt('123456', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Sarah", "last_name": "Johnson", "role": "therapist"}',
    false,
    '',
    '',
    '',
    ''
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data;

  -- Insert therapist profile
  INSERT INTO profiles (
    id,
    role,
    first_name,
    last_name,
    email,
    whatsapp_number,
    professional_details,
    verification_status,
    created_at
  ) VALUES (
    demo_therapist_id,
    'therapist',
    'Dr. Sarah',
    'Johnson',
    'fedgee911@gmail.com',
    '+1 (555) 123-4567',
    '{
      "specializations": ["Anxiety Disorders", "Depression", "Trauma & PTSD", "CBT", "Mindfulness-Based Therapy"],
      "languages": ["English", "Spanish", "French"],
      "qualifications": "Ph.D. in Clinical Psychology\nLicensed Clinical Psychologist (CA #PSY12345)\nCertified CBT Therapist\nEMDR Certified Therapist",
      "bio": "Dr. Sarah Johnson is a licensed clinical psychologist with over 15 years of experience helping individuals overcome anxiety, depression, and trauma. She specializes in evidence-based treatments including Cognitive Behavioral Therapy (CBT) and EMDR.\n\nDr. Johnson believes in creating a warm, supportive environment where clients feel safe to explore their thoughts and feelings. Her approach combines compassion with practical, research-backed techniques to help clients develop lasting coping skills and achieve their therapeutic goals.\n\nShe has extensive experience working with adults facing life transitions, relationship challenges, and mental health concerns. Dr. Johnson is fluent in English, Spanish, and French, allowing her to serve diverse communities.",
      "practice_locations": [
        {"address": "123 Therapy Lane, Los Angeles, CA 90210", "isPrimary": true},
        {"address": "456 Wellness Blvd, Beverly Hills, CA 90212", "isPrimary": false}
      ],
      "years_experience": 15
    }'::jsonb,
    'verified'
  ) ON CONFLICT (id) DO UPDATE SET
    whatsapp_number = EXCLUDED.whatsapp_number,
    professional_details = EXCLUDED.professional_details,
    verification_status = EXCLUDED.verification_status;

  -- Create demo clients
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES 
  (
    client1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'john.smith@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(),
    '{"provider": "email", "providers": ["email"]}', '{"first_name": "John", "last_name": "Smith", "role": "client"}',
    false, '', '', '', ''
  ),
  (
    client2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'emily.davis@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(),
    '{"provider": "email", "providers": ["email"]}', '{"first_name": "Emily", "last_name": "Davis", "role": "client"}',
    false, '', '', '', ''
  ) ON CONFLICT (id) DO NOTHING;

  -- Create client profiles
  INSERT INTO profiles (id, role, first_name, last_name, email, patient_code, created_by_therapist) VALUES
  (client1_id, 'client', 'John', 'Smith', 'john.smith@example.com', 'PT123456', demo_therapist_id),
  (client2_id, 'client', 'Emily', 'Davis', 'emily.davis@example.com', 'PT234567', demo_therapist_id)
  ON CONFLICT (id) DO NOTHING;

  -- Create therapist-client relations
  INSERT INTO therapist_client_relations (therapist_id, client_id) VALUES
  (demo_therapist_id, client1_id),
  (demo_therapist_id, client2_id)
  ON CONFLICT (therapist_id, client_id) DO NOTHING;

  -- Create client profiles with details
  INSERT INTO client_profiles (client_id, therapist_id, presenting_concerns, risk_level, notes) VALUES
  (client1_id, demo_therapist_id, 'Generalized anxiety, work stress, social anxiety', 'moderate', 'Client shows good engagement and motivation for treatment'),
  (client2_id, demo_therapist_id, 'Major depression, sleep issues, low mood', 'moderate', 'Responding well to CBT interventions')
  ON CONFLICT (client_id, therapist_id) DO NOTHING;

  -- Create sample appointments
  INSERT INTO appointments (therapist_id, client_id, appointment_date, status) VALUES
  (demo_therapist_id, client1_id, now() + interval '3 days', 'scheduled'),
  (demo_therapist_id, client2_id, now() + interval '5 days', 'scheduled'),
  (demo_therapist_id, client1_id, now() - interval '7 days', 'completed'),
  (demo_therapist_id, client2_id, now() - interval '10 days', 'completed')
  ON CONFLICT DO NOTHING;

  -- Create sample form assignments
  INSERT INTO form_assignments (therapist_id, client_id, form_type, title, status, due_date) VALUES
  (demo_therapist_id, client1_id, 'psychometric', 'GAD-7 Anxiety Assessment', 'assigned', current_date + 3),
  (demo_therapist_id, client2_id, 'psychometric', 'PHQ-9 Depression Assessment', 'completed', current_date - 1),
  (demo_therapist_id, client1_id, 'worksheet', 'Thought Record Exercise', 'in_progress', current_date + 5)
  ON CONFLICT DO NOTHING;

  -- Create sample psychometric forms
  INSERT INTO psychometric_forms (therapist_id, client_id, form_type, title, score, status) VALUES
  (demo_therapist_id, client1_id, 'GAD-7', 'Anxiety Assessment', 12, 'assigned'),
  (demo_therapist_id, client2_id, 'PHQ-9', 'Depression Assessment', 15, 'completed')
  ON CONFLICT DO NOTHING;

  -- Create sample progress tracking
  INSERT INTO progress_tracking (client_id, metric_type, value, source_type, recorded_at) VALUES
  (client1_id, 'anxiety_gad7', 15, 'psychometric', now() - interval '30 days'),
  (client1_id, 'anxiety_gad7', 12, 'psychometric', now() - interval '15 days'),
  (client1_id, 'anxiety_gad7', 10, 'psychometric', now() - interval '7 days'),
  (client2_id, 'depression_phq9', 18, 'psychometric', now() - interval '30 days'),
  (client2_id, 'depression_phq9', 15, 'psychometric', now() - interval '15 days'),
  (client2_id, 'depression_phq9', 13, 'psychometric', now() - interval '7 days')
  ON CONFLICT DO NOTHING;

  -- Create sample therapeutic exercises
  INSERT INTO therapeutic_exercises (therapist_id, client_id, exercise_type, title, description, status) VALUES
  (demo_therapist_id, client1_id, 'breathing', 'Deep Breathing Exercise', 'Practice 4-7-8 breathing technique', 'assigned'),
  (demo_therapist_id, client2_id, 'mindfulness', 'Mindfulness Meditation', 'Daily mindfulness practice', 'in_progress')
  ON CONFLICT DO NOTHING;

END $$;

-- Create simple view for therapist insights (no complex joins)
CREATE OR REPLACE VIEW therapist_insights_metrics AS
SELECT 
  t.id as therapist_id,
  COALESCE(overdue.count, 0) as overdue_assessments,
  COALESCE(idle.count, 0) as idle_clients
FROM profiles t
LEFT JOIN (
  SELECT therapist_id, COUNT(*) as count
  FROM form_assignments 
  WHERE status = 'assigned' AND due_date < current_date
  GROUP BY therapist_id
) overdue ON t.id = overdue.therapist_id
LEFT JOIN (
  SELECT therapist_id, COUNT(*) as count
  FROM therapist_client_relations tcr
  WHERE NOT EXISTS (
    SELECT 1 FROM appointments a 
    WHERE a.client_id = tcr.client_id 
    AND a.appointment_date > current_date - interval '30 days'
  )
  GROUP BY therapist_id
) idle ON t.id = idle.therapist_id
WHERE t.role = 'therapist';

-- Update database statistics for better query performance
ANALYZE;