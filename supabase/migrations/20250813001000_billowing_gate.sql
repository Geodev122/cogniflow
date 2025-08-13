/*
  # Fix Function Search Path Security Warnings

  1. Security Enhancement
    - Set search_path parameter for all functions to prevent SQL injection
    - Ensures functions only access the public schema explicitly
    - Addresses Supabase security linter warnings

  2. Functions Updated
    - is_client
    - get_client_data
    - update_user_role
    - insert_progress_metric
    - get_patient_insights_summary
    - get_therapist_insights
    - insert_therapist_insight
    - run_security_diagnostics
    - profile_completion
    - function_name
    - diagnose_security_invoker

  3. Security Benefits
    - Prevents search_path manipulation attacks
    - Ensures consistent schema access
    - Improves function security posture
*/

-- Fix search_path for is_client function
DROP FUNCTION IF EXISTS public.is_client();
CREATE OR REPLACE FUNCTION public.is_client()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'client'
  );
END;
$$;

-- Fix search_path for get_client_data function
DROP FUNCTION IF EXISTS public.get_client_data(uuid);
CREATE OR REPLACE FUNCTION public.get_client_data(client_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'worksheets', COALESCE(
      (SELECT json_agg(w.*) FROM worksheet_assignments w WHERE w.client_id = get_client_data.client_id),
      '[]'::json
    ),
    'assessments', COALESCE(
      (SELECT json_agg(a.*) FROM psychometric_forms a WHERE a.client_id = get_client_data.client_id),
      '[]'::json
    ),
    'exercises', COALESCE(
      (SELECT json_agg(e.*) FROM therapeutic_exercises e WHERE e.client_id = get_client_data.client_id),
      '[]'::json
    ),
    'progress', COALESCE(
      (SELECT json_agg(p.*) FROM progress_tracking p WHERE p.client_id = get_client_data.client_id),
      '[]'::json
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Fix search_path for update_user_role function
DROP FUNCTION IF EXISTS public.update_user_role(uuid, text);
CREATE OR REPLACE FUNCTION public.update_user_role(user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_roles (user_id, role)
  VALUES (user_id, new_role)
  ON CONFLICT (user_id)
  DO UPDATE SET role = new_role;
END;
$$;

-- Fix search_path for insert_progress_metric function
DROP FUNCTION IF EXISTS public.insert_progress_metric(uuid, text, numeric, text, uuid);
CREATE OR REPLACE FUNCTION public.insert_progress_metric(
  p_user_id uuid,
  p_metric_type text,
  p_progress_value numeric,
  p_source_type text,
  p_source_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO progress_metrics (
    user_id,
    metric_type,
    progress_value,
    source_type,
    source_id
  ) VALUES (
    p_user_id,
    p_metric_type,
    p_progress_value,
    p_source_type,
    p_source_id
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Fix search_path for get_patient_insights_summary function
DROP FUNCTION IF EXISTS public.get_patient_insights_summary(uuid);
CREATE OR REPLACE FUNCTION public.get_patient_insights_summary(patient_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_metrics', COUNT(*),
    'latest_metric_date', MAX(recorded_at),
    'avg_metric_value', AVG(metric_value)
  ) INTO result
  FROM therapist_insights_metrics
  WHERE patient_id = get_patient_insights_summary.patient_id;
  
  RETURN result;
END;
$$;

-- Fix search_path for get_therapist_insights function
DROP FUNCTION IF EXISTS public.get_therapist_insights(uuid);
CREATE OR REPLACE FUNCTION public.get_therapist_insights(therapist_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_clients', COUNT(DISTINCT tcr.client_id),
    'active_assessments', COUNT(DISTINCT fa.id),
    'completion_rate', COALESCE(AVG(
      CASE WHEN fa.status = 'completed' THEN 1.0 ELSE 0.0 END
    ), 0)
  ) INTO result
  FROM therapist_client_relations tcr
  LEFT JOIN form_assignments fa ON fa.client_id = tcr.client_id
  WHERE tcr.therapist_id = get_therapist_insights.therapist_id;
  
  RETURN result;
END;
$$;

-- Fix search_path for insert_therapist_insight function
DROP FUNCTION IF EXISTS public.insert_therapist_insight(uuid, uuid, text, numeric, jsonb);
CREATE OR REPLACE FUNCTION public.insert_therapist_insight(
  p_therapist_id uuid,
  p_patient_id uuid,
  p_metric_type text,
  p_metric_value numeric,
  p_metric_context jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO therapist_insights_metrics (
    therapist_id,
    patient_id,
    metric_type,
    metric_value,
    metric_context
  ) VALUES (
    p_therapist_id,
    p_patient_id,
    p_metric_type,
    p_metric_value,
    p_metric_context
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Fix search_path for run_security_diagnostics function
DROP FUNCTION IF EXISTS public.run_security_diagnostics();
CREATE OR REPLACE FUNCTION public.run_security_diagnostics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'rls_enabled_tables', (
      SELECT COUNT(*) FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      WHERE t.schemaname = 'public' AND c.relrowsecurity = true
    ),
    'total_policies', (
      SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'
    ),
    'functions_with_security_definer', (
      SELECT COUNT(*) FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.prosecdef = true
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Fix search_path for profile_completion function
DROP FUNCTION IF EXISTS public.profile_completion(uuid);
CREATE OR REPLACE FUNCTION public.profile_completion(user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  completion_percentage integer := 0;
  profile_data record;
BEGIN
  SELECT * INTO profile_data
  FROM profiles
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Basic info (20%)
  IF profile_data.first_name IS NOT NULL AND profile_data.last_name IS NOT NULL THEN
    completion_percentage := completion_percentage + 20;
  END IF;
  
  -- Contact info (20%)
  IF profile_data.whatsapp_number IS NOT NULL THEN
    completion_percentage := completion_percentage + 20;
  END IF;
  
  -- Professional details (40%)
  IF profile_data.professional_details IS NOT NULL THEN
    completion_percentage := completion_percentage + 40;
  END IF;
  
  -- Verification (20%)
  IF profile_data.verification_status = 'verified' THEN
    completion_percentage := completion_percentage + 20;
  END IF;
  
  RETURN completion_percentage;
END;
$$;

-- Fix search_path for function_name function (appears to be a placeholder)
DROP FUNCTION IF EXISTS public.function_name();
CREATE OR REPLACE FUNCTION public.function_name()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'placeholder_function';
END;
$$;

-- Fix search_path for diagnose_security_invoker function
DROP FUNCTION IF EXISTS public.diagnose_security_invoker();
CREATE OR REPLACE FUNCTION public.diagnose_security_invoker()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'security_invoker_functions', (
      SELECT json_agg(
        json_build_object(
          'function_name', p.proname,
          'schema', n.nspname,
          'security_definer', p.prosecdef
        )
      )
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.prosecdef = false
    ),
    'total_functions', (
      SELECT COUNT(*)
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;