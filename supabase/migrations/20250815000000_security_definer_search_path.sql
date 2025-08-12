--
-- Ensure SECURITY DEFINER functions use the public schema
-- and re-grant execute permissions after updates
--

-- Profile management functions
ALTER FUNCTION create_profile_for_auth_user(text, text, text, text) SET search_path = public;
ALTER FUNCTION debug_profile_fetch(text) SET search_path = public;
ALTER FUNCTION handle_new_user() SET search_path = public;
ALTER FUNCTION update_user_role(text, text) SET search_path = public;

-- Access helper functions
ALTER FUNCTION is_therapist() SET search_path = public;
ALTER FUNCTION is_client() SET search_path = public;
ALTER FUNCTION therapist_has_client_access(uuid) SET search_path = public;
ALTER FUNCTION audit_trigger_function() SET search_path = public;

-- Therapist profile function
ALTER FUNCTION public.get_therapist_profile(uuid) SET search_path = public;

-- Session document functions
ALTER FUNCTION create_session_note(uuid, text) SET search_path = public;
ALTER FUNCTION get_session_documents(uuid) SET search_path = public;

-- Gamified app functions
ALTER FUNCTION start_app_session(uuid, uuid, text) SET search_path = public;
ALTER FUNCTION complete_app_session(uuid, integer, jsonb, jsonb) SET search_path = public;
ALTER FUNCTION get_app_leaderboard(uuid, integer) SET search_path = public;
ALTER FUNCTION get_app_recommendations(uuid) SET search_path = public;

-- Case management functions
ALTER FUNCTION create_case(uuid, uuid) SET search_path = public;
ALTER FUNCTION log_milestone(uuid, integer) SET search_path = public;
ALTER FUNCTION get_case_timeline(uuid) SET search_path = public;

-- Client management functions
ALTER FUNCTION get_client_data(uuid, uuid) SET search_path = public;
ALTER FUNCTION create_client_account(uuid, text, text, text, text) SET search_path = public;

-- Re-grant execute permissions
GRANT EXECUTE ON FUNCTION create_profile_for_auth_user(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION debug_profile_fetch(text) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION is_therapist() TO authenticated;
GRANT EXECUTE ON FUNCTION is_client() TO authenticated;
GRANT EXECUTE ON FUNCTION therapist_has_client_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION audit_trigger_function() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_therapist_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_session_note(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_session_documents(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION start_app_session(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_app_session(uuid, integer, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION get_app_leaderboard(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_app_recommendations(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_case(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION log_milestone(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_case_timeline(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_data(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_client_account(uuid, text, text, text, text) TO authenticated;
