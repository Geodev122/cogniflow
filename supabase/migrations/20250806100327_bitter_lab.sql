/*
  # Database Setup Verification

  This migration checks if all required tables, functions, and policies are properly set up.
*/

-- Check if all required tables exist
DO $$
BEGIN
  -- List all tables that should exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE EXCEPTION 'Table profiles does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'therapist_client_relations') THEN
    RAISE EXCEPTION 'Table therapist_client_relations does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_profiles') THEN
    RAISE EXCEPTION 'Table client_profiles does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cbt_worksheets') THEN
    RAISE EXCEPTION 'Table cbt_worksheets does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'psychometric_forms') THEN
    RAISE EXCEPTION 'Table psychometric_forms does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'therapeutic_exercises') THEN
    RAISE EXCEPTION 'Table therapeutic_exercises does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'progress_tracking') THEN
    RAISE EXCEPTION 'Table progress_tracking does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessment_library') THEN
    RAISE EXCEPTION 'Table assessment_library does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_assignments') THEN
    RAISE EXCEPTION 'Table form_assignments does not exist';
  END IF;
  
  RAISE NOTICE 'All required tables exist';
END $$;

-- Check if RLS is enabled on all tables
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'profiles', 'therapist_client_relations', 'client_profiles', 
      'cbt_worksheets', 'psychometric_forms', 'therapeutic_exercises',
      'progress_tracking', 'assessment_library', 'form_assignments'
    )
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = table_record.tablename
      AND n.nspname = 'public'
      AND c.relrowsecurity = true
    ) THEN
      RAISE EXCEPTION 'RLS not enabled on table: %', table_record.tablename;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'RLS is enabled on all required tables';
END $$;

-- Check if update_updated_at_column function exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'update_updated_at_column'
    AND routine_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'Function update_updated_at_column does not exist';
  END IF;
  
  RAISE NOTICE 'Required functions exist';
END $$;