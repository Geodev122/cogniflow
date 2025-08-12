/*
  # Comprehensive Therapist Dashboard System

  1. New Tables
    - `client_profiles` - Extended client information with emergency contacts
    - `treatment_plans` - AI-assisted treatment planning
    - `therapy_goals` - Individual therapy goals and objectives
    - `appointments` - Session scheduling
    - `session_notes` - AI-generated session documentation
    - `assessment_library` - Standardized assessment templates
    - `custom_forms` - Therapist-created forms
    - `form_assignments` - Assignment tracking with reminders
    - `assessment_reports` - Generated reports archive
    - `communication_logs` - Client communication history
    - `referrals` - Referral management
    - `resource_library` - Therapeutic resources
    - `practice_analytics` - Analytics and reporting data
    - `audit_logs` - HIPAA compliance tracking

  2. Security
    - Enable RLS on all tables
    - Role-based access policies
    - Audit trail for compliance

  3. Features
    - AI integration placeholders
    - Comprehensive client management
    - Assessment and screening tools
    - Treatment planning
    - Session management
    - Progress monitoring
    - Communication tools
    - Documentation and compliance
*/

-- Extended client profiles
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

-- Treatment plans
CREATE TABLE IF NOT EXISTS treatment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  therapist_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  case_formulation text,
  ai_suggestions jsonb DEFAULT '{}',
  treatment_approach text,
  estimated_duration text,
  status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'discontinued')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Therapy goals
CREATE TABLE IF NOT EXISTS therapy_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_plan_id uuid REFERENCES treatment_plans(id) ON DELETE CASCADE,
  goal_text text NOT NULL,
  target_date date,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  status text DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'modified', 'discontinued')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Appointments
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

-- Session notes
CREATE TABLE IF NOT EXISTS session_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  therapist_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_type text,
  presenting_issues text,
  interventions_used text,
  client_response text,
  homework_assigned text,
  progress_notes text,
  ai_generated_summary text,
  risk_assessment text,
  next_session_plan text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Assessment library (standardized assessments)
CREATE TABLE IF NOT EXISTS assessment_library (
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

-- Custom forms created by therapists
CREATE TABLE IF NOT EXISTS custom_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  questions jsonb NOT NULL DEFAULT '[]',
  is_template boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Form assignments with reminders
CREATE TABLE IF NOT EXISTS form_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  form_type text NOT NULL CHECK (form_type IN ('psychometric', 'custom', 'worksheet', 'exercise')),
  form_id uuid, -- References different tables based on form_type
  title text NOT NULL,
  instructions text,
  due_date date,
  reminder_frequency text DEFAULT 'none' CHECK (reminder_frequency IN ('none', 'daily', 'weekly', 'before_due')),
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'overdue')),
  assigned_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Assessment reports archive
CREATE TABLE IF NOT EXISTS assessment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  therapist_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  report_type text NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL,
  generated_by text DEFAULT 'therapist' CHECK (generated_by IN ('therapist', 'ai', 'system')),
  report_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Communication logs
CREATE TABLE IF NOT EXISTS communication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  communication_type text NOT NULL CHECK (communication_type IN ('email', 'phone', 'text', 'in_person', 'crisis', 'reminder')),
  subject text,
  content text,
  direction text NOT NULL CHECK (direction IN ('outgoing', 'incoming')),
  status text DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'delivered', 'read', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Referrals management
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referring_therapist_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  receiving_therapist_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  referral_reason text NOT NULL,
  specialization_needed text,
  urgency_level text DEFAULT 'routine' CHECK (urgency_level IN ('routine', 'urgent', 'crisis')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Resource library
CREATE TABLE IF NOT EXISTS resource_library (
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

-- Practice analytics
CREATE TABLE IF NOT EXISTS practice_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_date date DEFAULT CURRENT_DATE,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Audit logs for HIPAA compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  client_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address inet,
  user_agent text,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_profiles
CREATE POLICY "Therapists can manage their client profiles"
  ON client_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'therapist' 
      AND profiles.id = client_profiles.therapist_id
    )
  );

-- RLS Policies for treatment_plans
CREATE POLICY "Therapists can manage their treatment plans"
  ON treatment_plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'therapist' 
      AND profiles.id = treatment_plans.therapist_id
    )
  );

-- RLS Policies for therapy_goals
CREATE POLICY "Therapists can manage goals for their treatment plans"
  ON therapy_goals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM treatment_plans tp
      JOIN profiles p ON p.id = auth.uid()
      WHERE tp.id = therapy_goals.treatment_plan_id
      AND p.role = 'therapist'
      AND tp.therapist_id = p.id
    )
  );

-- RLS Policies for appointments
CREATE POLICY "Therapists can manage their appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'therapist' 
      AND profiles.id = appointments.therapist_id
    )
  );

CREATE POLICY "Clients can view their appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'client' 
      AND profiles.id = appointments.client_id
    )
  );

-- RLS Policies for session_notes
CREATE POLICY "Therapists can manage their session notes"
  ON session_notes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'therapist' 
      AND profiles.id = session_notes.therapist_id
    )
  );

-- RLS Policies for assessment_library
CREATE POLICY "All authenticated users can read assessment library"
  ON assessment_library
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for custom_forms
CREATE POLICY "Therapists can manage their custom forms"
  ON custom_forms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'therapist' 
      AND profiles.id = custom_forms.therapist_id
    )
  );

-- RLS Policies for form_assignments
CREATE POLICY "Therapists can manage their form assignments"
  ON form_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'therapist' 
      AND profiles.id = form_assignments.therapist_id
    )
  );

CREATE POLICY "Clients can view their form assignments"
  ON form_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'client' 
      AND profiles.id = form_assignments.client_id
    )
  );

-- RLS Policies for assessment_reports
CREATE POLICY "Therapists can manage their assessment reports"
  ON assessment_reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'therapist' 
      AND profiles.id = assessment_reports.therapist_id
    )
  );

-- RLS Policies for communication_logs
CREATE POLICY "Therapists can manage their communication logs"
  ON communication_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'therapist' 
      AND profiles.id = communication_logs.therapist_id
    )
  );

-- RLS Policies for referrals
CREATE POLICY "Therapists can manage referrals they create or receive"
  ON referrals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'therapist' 
      AND (profiles.id = referrals.referring_therapist_id OR profiles.id = referrals.receiving_therapist_id)
    )
  );

-- RLS Policies for resource_library
CREATE POLICY "All authenticated users can read public resources"
  ON resource_library
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Therapists can manage their own resources"
  ON resource_library
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'therapist' 
      AND profiles.id = resource_library.created_by
    )
  );

-- RLS Policies for practice_analytics
CREATE POLICY "Therapists can manage their practice analytics"
  ON practice_analytics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'therapist' 
      AND profiles.id = practice_analytics.therapist_id
    )
  );

-- RLS Policies for audit_logs
CREATE POLICY "Users can read their own audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_profiles_therapist_id ON client_profiles(therapist_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_client_id ON client_profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_therapist_id ON treatment_plans(therapist_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_client_id ON treatment_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_therapist_id ON appointments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_session_notes_therapist_id ON session_notes(therapist_id);
CREATE INDEX IF NOT EXISTS idx_form_assignments_therapist_id ON form_assignments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_form_assignments_client_id ON form_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_therapist_id ON communication_logs(therapist_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);


-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_client_profiles_updated_at BEFORE UPDATE ON client_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treatment_plans_updated_at BEFORE UPDATE ON treatment_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_therapy_goals_updated_at BEFORE UPDATE ON therapy_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_notes_updated_at BEFORE UPDATE ON session_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_forms_updated_at BEFORE UPDATE ON custom_forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resource_library_updated_at BEFORE UPDATE ON resource_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();