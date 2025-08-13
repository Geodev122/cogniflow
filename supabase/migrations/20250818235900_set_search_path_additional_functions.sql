-- Set search_path to public for additional security definer functions
ALTER FUNCTION public.insert_progress_metric() SET search_path = public;
ALTER FUNCTION public.get_user_progress_summary() SET search_path = public;
ALTER FUNCTION public.get_patient_insights_summary() SET search_path = public;
ALTER FUNCTION public.get_progress_metrics() SET search_path = public;
ALTER FUNCTION public.get_therapist_insights() SET search_path = public;
ALTER FUNCTION public.insert_therapist_insight() SET search_path = public;
ALTER FUNCTION public.run_security_diagnostics() SET search_path = public;
ALTER FUNCTION public.auto_assign_user_role() SET search_path = public;
ALTER FUNCTION public.diagnose_security_invoker() SET search_path = public;
