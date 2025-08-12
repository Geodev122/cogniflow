/*
  # Comprehensive Security Policies for CogniFlow

  1. Security Overview
    - Enable RLS on all tables
    - Create role-based access policies
    - Implement data isolation between therapists
    - Protect client data with strict access controls
    - Audit trail and compliance features

  2. Access Patterns
    - Therapists can only access their own clients and data
    - Clients can only access their own data
    - No cross-therapist data access
    - Admin functions for system management

  3. Security Features
    - Row Level Security (RLS) enabled
    - JWT-based authentication
    - Role-based authorization
    - Data encryption at rest
    - Audit logging
*/

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_client_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbt_worksheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychometric_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapeutic_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Enable insert access for users to create their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users on their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update access for users on their own profile" ON profiles;
DROP POLICY IF EXISTS "Therapists can manage their client profiles" ON client_profiles;
DROP POLICY IF EXISTS "Therapists can manage their treatment plans" ON treatment_plans;
DROP POLICY IF EXISTS "Therapists can manage goals for their treatment plans" ON therapy_goals;
DROP POLICY IF EXISTS "Therapists can manage their custom forms" ON custom_forms;
DROP POLICY IF EXISTS "Therapists can create client relationships" ON therapist_client_relations;
DROP POLICY IF EXISTS "Therapists can read their client relationships" ON therapist_client_relations;
DROP POLICY IF EXISTS "Clients can read their therapist relationships" ON therapist_client_relations;
DROP POLICY IF EXISTS "Therapists can manage their appointments" ON appointments;
DROP POLICY IF EXISTS "Clients can view their appointments" ON appointments;
DROP POLICY IF EXISTS "Therapists can manage their session notes" ON session_notes;
DROP POLICY IF EXISTS "All authenticated users can read assessment library" ON assessment_library;
DROP POLICY IF EXISTS "Therapists can manage their form assignments" ON form_assignments;
DROP POLICY IF EXISTS "Clients can view their form assignments" ON form_assignments;
DROP POLICY IF EXISTS "Therapists can manage their assessment reports" ON assessment_reports;
DROP POLICY IF EXISTS "Therapists can manage their communication logs" ON communication_logs;
DROP POLICY IF EXISTS "Therapists can create worksheets for their clients" ON cbt_worksheets;
DROP POLICY IF EXISTS "Therapists can read worksheets for their clients" ON cbt_worksheets;
DROP POLICY IF EXISTS "Therapists can update worksheets for their clients" ON cbt_worksheets;
DROP POLICY IF EXISTS "Clients can read their own worksheets" ON cbt_worksheets;
DROP POLICY IF EXISTS "Clients can update their own worksheets" ON cbt_worksheets;
DROP POLICY IF EXISTS "Therapists can manage referrals they create or receive" ON referrals;
DROP POLICY IF EXISTS "All authenticated users can read public resources" ON resource_library;
DROP POLICY IF EXISTS "Therapists can manage their own resources" ON resource_library;
DROP POLICY IF EXISTS "Therapists can manage their practice analytics" ON practice_analytics;
DROP POLICY IF EXISTS "Users can read their own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Therapists can manage psychometric forms for their clients" ON psychometric_forms;
DROP POLICY IF EXISTS "Clients can read their own psychometric forms" ON psychometric_forms;
DROP POLICY IF EXISTS "Clients can update their own psychometric forms" ON psychometric_forms;
DROP POLICY IF EXISTS "Therapists can manage exercises for their clients" ON therapeutic_exercises;
DROP POLICY IF EXISTS "Clients can read their own exercises" ON therapeutic_exercises;
DROP POLICY IF EXISTS "Clients can update their own exercises" ON therapeutic_exercises;
DROP POLICY IF EXISTS "Therapists can read progress for their clients" ON progress_tracking;
DROP POLICY IF EXISTS "Clients can read their own progress" ON progress_tracking;
DROP POLICY IF EXISTS "System can insert progress tracking" ON progress_tracking;

-- =============================================
-- PROFILES TABLE POLICIES
-- =============================================

-- Users can create their own profile
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Therapists can read basic info of their clients
CREATE POLICY "profiles_therapists_read_clients" ON profiles
  FOR SELECT TO authenticated
  USING (
    role = 'client' AND
    EXISTS (
      SELECT 1 FROM therapist_client_relations tcr
      JOIN profiles p ON p.id = auth.uid()
      WHERE tcr.therapist_id = auth.uid()
        AND tcr.client_id = profiles.id
        AND p.role = 'therapist'
    )
  );

-- =============================================
-- CLIENT PROFILES TABLE POLICIES
-- =============================================

-- Therapists can manage client profiles for their clients only
CREATE POLICY "client_profiles_therapist_full_access" ON client_profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = client_profiles.therapist_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = client_profiles.therapist_id
    )
  );

-- Clients can read their own profile (limited fields)
CREATE POLICY "client_profiles_client_read_own" ON client_profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'client'
        AND p.id = client_profiles.client_id
    )
  );

-- =============================================
-- THERAPIST-CLIENT RELATIONS POLICIES
-- =============================================

-- Therapists can create and manage client relationships
CREATE POLICY "therapist_client_relations_therapist_manage" ON therapist_client_relations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = therapist_client_relations.therapist_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = therapist_client_relations.therapist_id
    )
  );

-- Clients can read their therapist relationships
CREATE POLICY "therapist_client_relations_client_read" ON therapist_client_relations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'client'
        AND p.id = therapist_client_relations.client_id
    )
  );

-- =============================================
-- TREATMENT PLANS POLICIES
-- =============================================

-- Therapists can manage treatment plans for their clients
CREATE POLICY "treatment_plans_therapist_manage" ON treatment_plans
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = treatment_plans.therapist_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = treatment_plans.therapist_id
    )
  );

-- Clients can read their own treatment plans
CREATE POLICY "treatment_plans_client_read" ON treatment_plans
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'client'
        AND p.id = treatment_plans.client_id
    )
  );

-- =============================================
-- THERAPY GOALS POLICIES
-- =============================================

-- Therapists can manage goals for their treatment plans
CREATE POLICY "therapy_goals_therapist_manage" ON therapy_goals
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM treatment_plans tp
      JOIN profiles p ON p.id = auth.uid()
      WHERE tp.id = therapy_goals.treatment_plan_id
        AND p.role = 'therapist'
        AND tp.therapist_id = p.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM treatment_plans tp
      JOIN profiles p ON p.id = auth.uid()
      WHERE tp.id = therapy_goals.treatment_plan_id
        AND p.role = 'therapist'
        AND tp.therapist_id = p.id
    )
  );

-- Clients can read their own therapy goals
CREATE POLICY "therapy_goals_client_read" ON therapy_goals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM treatment_plans tp
      JOIN profiles p ON p.id = auth.uid()
      WHERE tp.id = therapy_goals.treatment_plan_id
        AND p.role = 'client'
        AND tp.client_id = p.id
    )
  );

-- =============================================
-- APPOINTMENTS POLICIES
-- =============================================

-- Therapists can manage their appointments
CREATE POLICY "appointments_therapist_manage" ON appointments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = appointments.therapist_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = appointments.therapist_id
    )
  );

-- Clients can read their own appointments
CREATE POLICY "appointments_client_read" ON appointments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'client'
        AND p.id = appointments.client_id
    )
  );

-- =============================================
-- SESSION NOTES POLICIES
-- =============================================

-- Therapists can manage session notes for their clients
CREATE POLICY "session_notes_therapist_manage" ON session_notes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = session_notes.therapist_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = session_notes.therapist_id
    )
  );

-- =============================================
-- ASSESSMENT LIBRARY POLICIES
-- =============================================

-- All authenticated users can read active assessments
CREATE POLICY "assessment_library_read_active" ON assessment_library
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Only system admins can manage assessment library (future feature)
-- CREATE POLICY "assessment_library_admin_manage" ON assessment_library
--   FOR ALL TO authenticated
--   USING (auth.jwt() ->> 'role' = 'admin');

-- =============================================
-- FORM ASSIGNMENTS POLICIES
-- =============================================

-- Therapists can manage form assignments for their clients
CREATE POLICY "form_assignments_therapist_manage" ON form_assignments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = form_assignments.therapist_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = form_assignments.therapist_id
    )
  );

-- Clients can read and update their own form assignments
CREATE POLICY "form_assignments_client_read_update" ON form_assignments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'client'
        AND p.id = form_assignments.client_id
    )
  );

CREATE POLICY "form_assignments_client_update" ON form_assignments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'client'
        AND p.id = form_assignments.client_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'client'
        AND p.id = form_assignments.client_id
    )
  );

-- =============================================
-- CBT WORKSHEETS POLICIES
-- =============================================

-- Therapists can manage worksheets for their clients
CREATE POLICY "cbt_worksheets_therapist_manage" ON cbt_worksheets
  FOR ALL TO authenticated
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

-- Clients can read and update their own worksheets
CREATE POLICY "cbt_worksheets_client_read_update" ON cbt_worksheets
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'client'
        AND p.id = cbt_worksheets.client_id
    )
  );

CREATE POLICY "cbt_worksheets_client_update" ON cbt_worksheets
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'client'
        AND p.id = cbt_worksheets.client_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'client'
        AND p.id = cbt_worksheets.client_id
    )
  );

-- =============================================
-- PSYCHOMETRIC FORMS POLICIES
-- =============================================

-- Therapists can manage psychometric forms for their clients
CREATE POLICY "psychometric_forms_therapist_manage" ON psychometric_forms
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapist_client_relations tcr
      JOIN profiles p ON p.id = auth.uid()
      WHERE p.role = 'therapist'
        AND tcr.therapist_id = auth.uid()
        AND tcr.client_id = psychometric_forms.client_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM therapist_client_relations tcr
      JOIN profiles p ON p.id = auth.uid()
      WHERE p.role = 'therapist'
        AND tcr.therapist_id = auth.uid()
        AND tcr.client_id = psychometric_forms.client_id
    )
  );

-- Clients can read and update their own psychometric forms
CREATE POLICY "psychometric_forms_client_read_update" ON psychometric_forms
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'client'
        AND p.id = psychometric_forms.client_id
    )
  );

CREATE POLICY "psychometric_forms_client_update" ON psychometric_forms
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'client'
        AND p.id = psychometric_forms.client_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'client'
        AND p.id = psychometric_forms.client_id
    )
  );

-- =============================================
-- THERAPEUTIC EXERCISES POLICIES
-- =============================================

-- Therapists can manage exercises for their clients
CREATE POLICY "therapeutic_exercises_therapist_manage" ON therapeutic_exercises
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapist_client_relations tcr
      JOIN profiles p ON p.id = auth.uid()
      WHERE p.role = 'therapist'
        AND tcr.therapist_id = auth.uid()
        AND tcr.client_id = therapeutic_exercises.client_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM therapist_client_relations tcr
      JOIN profiles p ON p.id = auth.uid()
      WHERE p.role = 'therapist'
        AND tcr.therapist_id = auth.uid()
        AND tcr.client_id = therapeutic_exercises.client_id
    )
  );

-- Clients can read and update their own exercises
CREATE POLICY "therapeutic_exercises_client_read_update" ON therapeutic_exercises
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'client'
        AND p.id = therapeutic_exercises.client_id
    )
  );

CREATE POLICY "therapeutic_exercises_client_update" ON therapeutic_exercises
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'client'
        AND p.id = therapeutic_exercises.client_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'client'
        AND p.id = therapeutic_exercises.client_id
    )
  );

-- =============================================
-- PROGRESS TRACKING POLICIES
-- =============================================

-- Therapists can read progress for their clients
CREATE POLICY "progress_tracking_therapist_read" ON progress_tracking
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapist_client_relations tcr
      JOIN profiles p ON p.id = auth.uid()
      WHERE p.role = 'therapist'
        AND tcr.therapist_id = auth.uid()
        AND tcr.client_id = progress_tracking.client_id
    )
  );

-- Clients can read their own progress
CREATE POLICY "progress_tracking_client_read" ON progress_tracking
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'client'
        AND p.id = progress_tracking.client_id
    )
  );

-- System can insert progress tracking (for automated scoring)
CREATE POLICY "progress_tracking_system_insert" ON progress_tracking
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- =============================================
-- CUSTOM FORMS POLICIES
-- =============================================

-- Therapists can manage their own custom forms
CREATE POLICY "custom_forms_therapist_manage" ON custom_forms
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = custom_forms.therapist_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = custom_forms.therapist_id
    )
  );

-- =============================================
-- ASSESSMENT REPORTS POLICIES
-- =============================================

-- Therapists can manage their assessment reports
CREATE POLICY "assessment_reports_therapist_manage" ON assessment_reports
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = assessment_reports.therapist_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = assessment_reports.therapist_id
    )
  );

-- =============================================
-- COMMUNICATION LOGS POLICIES
-- =============================================

-- Therapists can manage their communication logs
CREATE POLICY "communication_logs_therapist_manage" ON communication_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = communication_logs.therapist_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = communication_logs.therapist_id
    )
  );

-- =============================================
-- REFERRALS POLICIES
-- =============================================

-- Therapists can manage referrals they create or receive
CREATE POLICY "referrals_therapist_manage" ON referrals
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND (p.id = referrals.referring_therapist_id OR p.id = referrals.receiving_therapist_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND (p.id = referrals.referring_therapist_id OR p.id = referrals.receiving_therapist_id)
    )
  );

-- =============================================
-- RESOURCE LIBRARY POLICIES
-- =============================================

-- All authenticated users can read public resources
CREATE POLICY "resource_library_read_public" ON resource_library
  FOR SELECT TO authenticated
  USING (is_public = true);

-- Therapists can manage their own resources
CREATE POLICY "resource_library_therapist_manage_own" ON resource_library
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = resource_library.created_by
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = resource_library.created_by
    )
  );

-- =============================================
-- PRACTICE ANALYTICS POLICIES
-- =============================================

-- Therapists can manage their practice analytics
CREATE POLICY "practice_analytics_therapist_manage" ON practice_analytics
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = practice_analytics.therapist_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'therapist'
        AND p.id = practice_analytics.therapist_id
    )
  );

-- =============================================
-- AUDIT LOGS POLICIES
-- =============================================

-- Users can read their own audit logs
CREATE POLICY "audit_logs_read_own" ON audit_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- System can insert audit logs
CREATE POLICY "audit_logs_system_insert" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- =============================================
-- SECURITY FUNCTIONS
-- =============================================

-- Function to check if user is a therapist
CREATE OR REPLACE FUNCTION is_therapist()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'therapist'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is a client
CREATE OR REPLACE FUNCTION is_client()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'client'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if therapist has access to client
CREATE OR REPLACE FUNCTION therapist_has_client_access(client_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM therapist_client_relations tcr
    JOIN profiles p ON p.id = auth.uid()
    WHERE tcr.therapist_id = auth.uid()
      AND tcr.client_id = client_uuid
      AND p.role = 'therapist'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- AUDIT TRIGGER FUNCTION
-- =============================================

-- Function to log data changes for audit trail
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    client_id,
    details,
    created_at
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_TABLE_NAME = 'client_profiles' THEN COALESCE(NEW.client_id, OLD.client_id)
      WHEN TG_TABLE_NAME = 'cbt_worksheets' THEN COALESCE(NEW.client_id, OLD.client_id)
      WHEN TG_TABLE_NAME = 'psychometric_forms' THEN COALESCE(NEW.client_id, OLD.client_id)
      WHEN TG_TABLE_NAME = 'therapeutic_exercises' THEN COALESCE(NEW.client_id, OLD.client_id)
      WHEN TG_TABLE_NAME = 'appointments' THEN COALESCE(NEW.client_id, OLD.client_id)
      WHEN TG_TABLE_NAME = 'session_notes' THEN COALESCE(NEW.client_id, OLD.client_id)
      ELSE NULL
    END,
    jsonb_build_object(
      'old', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
      'new', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
    ),
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for sensitive tables
DROP TRIGGER IF EXISTS audit_client_profiles ON client_profiles;
CREATE TRIGGER audit_client_profiles
  AFTER INSERT OR UPDATE OR DELETE ON client_profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_session_notes ON session_notes;
CREATE TRIGGER audit_session_notes
  AFTER INSERT OR UPDATE OR DELETE ON session_notes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_treatment_plans ON treatment_plans;
CREATE TRIGGER audit_treatment_plans
  AFTER INSERT OR UPDATE OR DELETE ON treatment_plans
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- ADDITIONAL SECURITY MEASURES
-- =============================================

-- Ensure sensitive data is encrypted (handled by Supabase at rest)
-- Add constraints for data validation
ALTER TABLE profiles ADD CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE client_profiles ADD CONSTRAINT valid_risk_level CHECK (risk_level IN ('low', 'moderate', 'high', 'crisis'));

-- Create indexes for performance on security-critical queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_therapist_client_relations_therapist ON therapist_client_relations(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_client_relations_client ON therapist_client_relations(client_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;


-- Create a helper function for role-based access
CREATE OR REPLACE FUNCTION check_user_role(allowed_roles text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE 
    user_role text;
BEGIN
    user_role := (auth.jwt() ->> 'user_role');
    RETURN user_role = ANY(allowed_roles);
END;
$$;

-- Revoke execute permissions to prevent API exposure
REVOKE EXECUTE ON FUNCTION check_user_role(text[]) FROM anon, authenticated;

-- Enable Row Level Security
ALTER TABLE public.assessment_library ENABLE ROW LEVEL SECURITY;

-- Remove the problematic index
-- CREATE INDEX idx_assessment_library_role 
-- ON public.assessment_library 
-- USING btree ((auth.jwt() ->> 'user_role'));

-- 1. View assessments policy (admins and therapists)
CREATE POLICY "View assessments" 
ON public.assessment_library 
FOR SELECT 
TO authenticated 
USING (check_user_role(ARRAY['admin', 'therapist']));

-- 2. Insert assessments policy (admins and therapists)
CREATE POLICY "Insert assessments" 
ON public.assessment_library 
FOR INSERT 
TO authenticated 
WITH CHECK (check_user_role(ARRAY['admin', 'therapist']));

-- 3. Update assessments policy (admins only)
CREATE POLICY "Update assessments" 
ON public.assessment_library 
FOR UPDATE 
TO authenticated 
USING (check_user_role(ARRAY['admin']))
WITH CHECK (check_user_role(ARRAY['admin']));

-- 4. Delete assessments policy (admins only)
CREATE POLICY "Delete assessments" 
ON public.assessment_library 
FOR DELETE 
TO authenticated 
USING (check_user_role(ARRAY['admin']));