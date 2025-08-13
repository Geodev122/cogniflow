-- Ensure app_usage_stats view runs with invoker privileges
ALTER VIEW public.app_usage_stats SET (security_invoker = on);
