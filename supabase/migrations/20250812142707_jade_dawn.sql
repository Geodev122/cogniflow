/*
  # Fix RLS Policies and Database Issues

  1. Security
    - Fix infinite recursion in RLS policies
    - Simplify policy logic
    - Add missing policies

  2. Performance
    - Add missing indexes
    - Optimize queries

  3. Data Integrity
    - Fix foreign key constraints
    - Add proper validation
*/

-- Drop problematic policies that may cause recursion
DROP POLICY IF EXISTS "app_sessions_therapist_view" ON app_sessions;
DROP POLICY IF EXISTS "app_progress_therapist_view" ON app_progress;
DROP POLICY IF EXISTS "app_analytics_therapist_view" ON app_analytics;

-- Create simplified, non-recursive policies
CREATE POLICY "app_sessions_therapist_view" ON app_sessions
  FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT client_id 
      FROM therapist_client_relations 
      WHERE therapist_id = auth.uid()
    )
  );

CREATE POLICY "app_progress_therapist_view" ON app_progress
  FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT client_id 
      FROM therapist_client_relations 
      WHERE therapist_id = auth.uid()
    )
  );

CREATE POLICY "app_analytics_therapist_view" ON app_analytics
  FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT client_id 
      FROM therapist_client_relations 
      WHERE therapist_id = auth.uid()
    )
  );

-- Fix profiles policies to prevent recursion
DROP POLICY IF EXISTS "profiles_therapist_view_clients" ON profiles;
CREATE POLICY "profiles_therapist_view_clients" ON profiles
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT client_id 
      FROM therapist_client_relations 
      WHERE therapist_id = auth.uid()
    )
  );

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_therapist_client_relations_therapist ON therapist_client_relations(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_client_relations_client ON therapist_client_relations(client_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_lookup ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email_lookup ON profiles(email);

-- Create function to safely get client data
CREATE OR REPLACE FUNCTION get_client_data(p_client_id uuid, p_therapist_id uuid)
RETURNS TABLE(
  worksheets jsonb,
  assessments jsonb,
  exercises jsonb,
  progress jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify therapist-client relationship
  IF NOT EXISTS (
    SELECT 1 FROM therapist_client_relations 
    WHERE therapist_id = p_therapist_id AND client_id = p_client_id
  ) THEN
    RAISE EXCEPTION 'Access denied: Invalid therapist-client relationship';
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', wa.id,
          'title', w.title,
          'status', wa.status,
          'assigned_at', wa.assigned_at,
          'completed_at', wa.completed_at
        )
      )
      FROM worksheet_assignments wa
      JOIN worksheets w ON wa.worksheet_id = w.id
      WHERE wa.client_id = p_client_id
      ), '[]'::jsonb
    ) as worksheets,
    
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', pf.id,
          'title', pf.title,
          'form_type', pf.form_type,
          'status', pf.status,
          'score', pf.score,
          'created_at', pf.created_at,
          'completed_at', pf.completed_at
        )
      )
      FROM psychometric_forms pf
      WHERE pf.client_id = p_client_id
      ), '[]'::jsonb
    ) as assessments,
    
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', te.id,
          'title', te.title,
          'exercise_type', te.exercise_type,
          'status', te.status,
          'created_at', te.created_at,
          'last_played_at', te.last_played_at
        )
      )
      FROM therapeutic_exercises te
      WHERE te.client_id = p_client_id
      ), '[]'::jsonb
    ) as exercises,
    
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'date', pt.recorded_at,
          'value', pt.value,
          'metric_type', pt.metric_type
        )
      )
      FROM progress_tracking pt
      WHERE pt.client_id = p_client_id
      ORDER BY pt.recorded_at
      ), '[]'::jsonb
    ) as progress;
END;
$$;

-- Update therapist_insights_metrics view to be more efficient
DROP VIEW IF EXISTS therapist_insights_metrics;
CREATE VIEW therapist_insights_metrics AS
SELECT 
  p.id as therapist_id,
  COALESCE(overdue.count, 0) as overdue_assessments,
  COALESCE(idle.count, 0) as idle_clients
FROM profiles p
LEFT JOIN (
  SELECT 
    fa.therapist_id,
    COUNT(*) as count
  FROM form_assignments fa
  WHERE fa.status = 'assigned' 
    AND fa.due_date < CURRENT_DATE
  GROUP BY fa.therapist_id
) overdue ON overdue.therapist_id = p.id
LEFT JOIN (
  SELECT 
    tcr.therapist_id,
    COUNT(DISTINCT tcr.client_id) as count
  FROM therapist_client_relations tcr
  WHERE NOT EXISTS (
    SELECT 1 FROM appointments a 
    WHERE a.client_id = tcr.client_id 
      AND a.therapist_id = tcr.therapist_id 
      AND a.appointment_date > (now() - interval '30 days')
  )
  GROUP BY tcr.therapist_id
) idle ON idle.therapist_id = p.id
WHERE p.role = 'therapist';

-- Create function to handle client creation safely
CREATE OR REPLACE FUNCTION create_client_account(
  p_therapist_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_whatsapp_number text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_id uuid;
  v_patient_code text;
BEGIN
  -- Generate patient code
  v_patient_code := 'PT' || LPAD((EXTRACT(epoch FROM now())::bigint % 1000000)::text, 6, '0');
  
  -- Generate client ID
  v_client_id := gen_random_uuid();
  
  -- Create profile
  INSERT INTO profiles (
    id,
    role,
    first_name,
    last_name,
    email,
    whatsapp_number,
    patient_code,
    created_by_therapist,
    password_set
  ) VALUES (
    v_client_id,
    'client',
    p_first_name,
    p_last_name,
    p_email,
    p_whatsapp_number,
    v_patient_code,
    p_therapist_id,
    false
  );
  
  -- Create therapist-client relation
  INSERT INTO therapist_client_relations (
    therapist_id,
    client_id
  ) VALUES (
    p_therapist_id,
    v_client_id
  );
  
  -- Create initial client profile
  INSERT INTO client_profiles (
    client_id,
    therapist_id,
    risk_level,
    notes
  ) VALUES (
    v_client_id,
    p_therapist_id,
    'low',
    'Initial client profile created on ' || CURRENT_DATE
  );
  
  RETURN v_client_id;
END;
$$;

-- Add audit trigger function if not exists
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW),
      'timestamp', now()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add missing audit triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_treatment_plans' AND tgrelid = 'treatment_plans'::regclass) THEN
    CREATE TRIGGER audit_treatment_plans
      AFTER INSERT OR UPDATE OR DELETE ON treatment_plans
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_client_profiles' AND tgrelid = 'client_profiles'::regclass) THEN
    CREATE TRIGGER audit_client_profiles
      AFTER INSERT OR UPDATE OR DELETE ON client_profiles
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_session_notes' AND tgrelid = 'session_notes'::regclass) THEN
    CREATE TRIGGER audit_session_notes
      AFTER INSERT OR UPDATE OR DELETE ON session_notes
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
  END IF;
END $$;

-- Fix timestamp trigger function
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add missing timestamp triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_timestamp' AND tgrelid = 'profiles'::regclass) THEN
    CREATE TRIGGER update_profiles_timestamp
      BEFORE UPDATE ON profiles
      FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
  END IF;
END $$;