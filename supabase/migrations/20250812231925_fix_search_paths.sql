-- Ensure security definer functions run with the public schema
ALTER FUNCTION public.update_updated_at() SET search_path = public;
ALTER FUNCTION public.profile_completion(uuid) SET search_path = public;
ALTER FUNCTION public.update_modified_column() SET search_path = public;
ALTER FUNCTION public.is_client() SET search_path = public;
ALTER FUNCTION public.update_timestamp_column() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.therapist_insights(uuid) SET search_path = public;
ALTER FUNCTION public.get_client_data(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.update_user_role(text, text) SET search_path = public;
ALTER FUNCTION public.check_user_role(text[]) SET search_path = public;
-- The following function signatures were not found in the repository.
-- Confirm argument types via psql before applying in production.
-- ALTER FUNCTION public.insert_progress_metric(...) SET search_path = public;
-- ALTER FUNCTION public.get_user_progress_summary(...) SET search_path = public;
-- ALTER FUNCTION public.get_patient_insights_summary(...) SET search_path = public;
-- ALTER FUNCTION public.get_progress_metrics(...) SET search_path = public;
-- ALTER FUNCTION public.get_therapist_insights(...) SET search_path = public;
-- ALTER FUNCTION public.insert_therapist_insight(...) SET search_path = public;
-- ALTER FUNCTION public.run_security_diagnostics(...) SET search_path = public;
-- ALTER FUNCTION public.auto_assign_user_role(...) SET search_path = public;
-- ALTER FUNCTION public.diagnose_security_invoker(...) SET search_path = public;
