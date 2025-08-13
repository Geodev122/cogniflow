-- Drop existing functions
DROP FUNCTION IF EXISTS public.is_client();
DROP FUNCTION IF EXISTS public.profile_completion(user_id uuid);
DROP FUNCTION IF EXISTS public.run_security_diagnostics();
DROP FUNCTION IF EXISTS public.get_therapist_insights(therapist_id uuid);
DROP FUNCTION IF EXISTS public.insert_progress_metric(p_client_id uuid, p_metric_type text, p_value numeric, p_source_type text, p_source_id uuid);
DROP FUNCTION IF EXISTS public.diagnose_security_invoker();
DROP FUNCTION IF EXISTS public.insert_therapist_insight(p_therapist_id uuid, p_patient_id uuid, p_metric_type text, p_metric_value numeric, p_metric_context jsonb);
DROP FUNCTION IF EXISTS public.get_client_data(client_id uuid);
DROP FUNCTION IF EXISTS public.update_user_role(p_user_id uuid, p_role text);
DROP FUNCTION IF EXISTS public.get_patient_insights_summary(patient_id uuid);

-- Recreation of functions will happen in the previous script

-- Fix is_client function
CREATE OR REPLACE FUNCTION public.is_client()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'client'
  );
END;
$$;

-- Fix profile_completion function
CREATE OR REPLACE FUNCTION public.profile_completion(user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  completion_score integer := 0;
  profile_data record;
BEGIN
  SELECT * INTO profile_data
  FROM profiles
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Basic info (20 points)
  IF profile_data.first_name IS NOT NULL AND profile_data.last_name IS NOT NULL THEN
    completion_score := completion_score + 20;
  END IF;
  
  -- Contact info (20 points)
  IF profile_data.whatsapp_number IS NOT NULL THEN
    completion_score := completion_score + 20;
  END IF;
  
  -- Professional details (60 points)
  IF profile_data.professional_details IS NOT NULL THEN
    completion_score := completion_score + 60;
  END IF;
  
  RETURN completion_score;
END;
$$;


-- Fix run_security_diagnostics function
CREATE OR REPLACE FUNCTION public.run_security_diagnostics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb := '{}';
  rls_enabled_count integer;
  total_tables_count integer;
BEGIN
  -- Check RLS status
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = true;
  
  SELECT COUNT(*) INTO total_tables_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r';
  
  result := jsonb_build_object(
    'rls_enabled_tables', rls_enabled_count,
    'total_tables', total_tables_count,
    'rls_coverage_percentage', ROUND((rls_enabled_count::numeric / total_tables_count::numeric) * 100, 2)
  );
  
  RETURN result;
END;
$$;

-- Fix get_therapist_insights function
CREATE OR REPLACE FUNCTION public.get_therapist_insights(therapist_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb := '{}';
  client_count integer;
  assessment_count integer;
BEGIN
  -- Get client count
  SELECT COUNT(*) INTO client_count
  FROM therapist_client_relations
  WHERE therapist_id = get_therapist_insights.therapist_id;
  
  -- Get assessment count
  SELECT COUNT(*) INTO assessment_count
  FROM form_assignments
  WHERE therapist_id = get_therapist_insights.therapist_id
    AND form_type = 'psychometric';
  
  result := jsonb_build_object(
    'total_clients', client_count,
    'total_assessments', assessment_count,
    'generated_at', NOW()
  );
  
  RETURN result;
END;
$$;

-- Fix insert_progress_metric function
CREATE OR REPLACE FUNCTION public.insert_progress_metric(
  p_client_id uuid,
  p_metric_type text,
  p_value numeric,
  p_source_type text DEFAULT 'manual',
  p_source_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO progress_tracking (
    client_id,
    metric_type,
    value,
    source_type,
    source_id
  ) VALUES (
    p_client_id,
    p_metric_type,
    p_value,
    p_source_type,
    p_source_id
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Fix diagnose_security_invoker function
CREATE OR REPLACE FUNCTION public.diagnose_security_invoker()
RETURNS table(
  function_name text,
  security_type text,
  has_search_path boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.proname::text as function_name,
    CASE 
      WHEN p.prosecdef THEN 'SECURITY DEFINER'
      ELSE 'SECURITY INVOKER'
    END as security_type,
    (p.proconfig IS NOT NULL AND 
     EXISTS(SELECT 1 FROM unnest(p.proconfig) AS config WHERE config LIKE 'search_path=%')
    ) as has_search_path
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind = 'f';
END;
$$;

-- Fix insert_therapist_insight function
CREATE OR REPLACE FUNCTION public.insert_therapist_insight(
  p_therapist_id uuid,
  p_patient_id uuid,
  p_metric_type text,
  p_metric_value numeric,
  p_metric_context jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix get_client_data function
CREATE OR REPLACE FUNCTION public.get_client_data(client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb := '{}';
  worksheets_data jsonb;
  assessments_data jsonb;
  exercises_data jsonb;
  progress_data jsonb;
BEGIN
  -- Get worksheets
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', wa.id,
      'title', w.title,
      'status', wa.status,
      'assigned_at', wa.assigned_at,
      'completed_at', wa.completed_at
    )
  ), '[]'::jsonb) INTO worksheets_data
  FROM worksheet_assignments wa
  JOIN worksheets w ON w.id = wa.worksheet_id
  WHERE wa.client_id = get_client_data.client_id;
  
  -- Get assessments
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', pf.id,
      'title', pf.title,
      'status', pf.status,
      'score', pf.score,
      'created_at', pf.created_at,
      'completed_at', pf.completed_at
    )
  ), '[]'::jsonb) INTO assessments_data
  FROM psychometric_forms pf
  WHERE pf.client_id = get_client_data.client_id;
  
  -- Get exercises
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', te.id,
      'title', te.title,
      'exercise_type', te.exercise_type,
      'status', te.status,
      'progress', te.progress,
      'created_at', te.created_at,
      'last_played_at', te.last_played_at
    )
  ), '[]'::jsonb) INTO exercises_data
  FROM therapeutic_exercises te
  WHERE te.client_id = get_client_data.client_id;
  
  -- Get progress
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', pt.id,
      'metric_type', pt.metric_type,
      'value', pt.value,
      'recorded_at', pt.recorded_at,
      'source_type', pt.source_type
    )
  ), '[]'::jsonb) INTO progress_data
  FROM progress_tracking pt
  WHERE pt.client_id = get_client_data.client_id
  ORDER BY pt.recorded_at DESC;
  
  result := jsonb_build_object(
    'worksheets', worksheets_data,
    'assessments', assessments_data,
    'exercises', exercises_data,
    'progress', progress_data
  );
  
  RETURN result;
END;
$$;

-- Fix update_user_role function
CREATE OR REPLACE FUNCTION public.update_user_role(
  p_user_id uuid,
  p_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Validate role
  IF p_role NOT IN ('therapist', 'client') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;
  
  -- Update user role
  UPDATE profiles
  SET role = p_role,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Insert or update user_roles table
  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id)
  DO UPDATE SET role = EXCLUDED.role;
  
  RETURN FOUND;
END;
$$;

-- Fix function_name function (appears to be a placeholder)
DROP FUNCTION IF EXISTS public.function_name();

-- Fix get_patient_insights_summary function
CREATE OR REPLACE FUNCTION public.get_patient_insights_summary(patient_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb := '{}';
  latest_assessments jsonb;
  progress_trends jsonb;
  risk_indicators jsonb;
BEGIN
  -- Get latest assessments
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'assessment_name', pf.title,
      'score', pf.score,
      'completed_at', pf.completed_at,
      'status', pf.status
    )
  ), '[]'::jsonb) INTO latest_assessments
  FROM psychometric_forms pf
  WHERE pf.client_id = patient_id
    AND pf.completed_at IS NOT NULL
  ORDER BY pf.completed_at DESC
  LIMIT 5;
  
  -- Get progress trends
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'metric_type', pt.metric_type,
      'value', pt.value,
      'recorded_at', pt.recorded_at
    )
  ), '[]'::jsonb) INTO progress_trends
  FROM progress_tracking pt
  WHERE pt.client_id = patient_id
  ORDER BY pt.recorded_at DESC
  LIMIT 10;
  
  -- Get risk indicators
  SELECT jsonb_build_object(
    'risk_level', cp.risk_level,
    'last_updated', cp.updated_at
  ) INTO risk_indicators
  FROM client_profiles cp
  WHERE cp.client_id = patient_id;
  
  result := jsonb_build_object(
    'latest_assessments', latest_assessments,
    'progress_trends', progress_trends,
    'risk_indicators', risk_indicators,
    'generated_at', NOW()
  );
  
  RETURN result;
END;
$$;