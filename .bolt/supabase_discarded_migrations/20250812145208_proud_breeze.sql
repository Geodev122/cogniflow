/*
  # Sync SQL Editor Changes

  This migration captures changes made through the Supabase SQL editor to ensure
  local migrations are in sync with the remote database state.

  ## Changes Applied
  1. Database Functions
     - Updated or created missing database functions
     - Fixed function signatures and return types
  
  2. Views
     - Ensured all views are properly created
     - Updated view definitions if needed
  
  3. Indexes
     - Added any missing performance indexes
     - Ensured proper indexing strategy
  
  4. RLS Policies
     - Synchronized RLS policies with current state
     - Fixed any policy conflicts
  
  5. Triggers
     - Updated trigger functions
     - Ensured proper trigger setup
*/

-- Ensure all required functions exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        created_at
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW)
        ),
        NOW()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Handle new user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (
        id,
        role,
        first_name,
        last_name,
        email
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger for new users if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION handle_new_user();
    END IF;
END $$;

-- Gamified apps session management functions
CREATE OR REPLACE FUNCTION start_app_session(
    p_app_id UUID,
    p_user_id UUID,
    p_session_type TEXT DEFAULT 'play'
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    INSERT INTO app_sessions (
        app_id,
        user_id,
        session_type,
        started_at,
        completion_status
    ) VALUES (
        p_app_id,
        p_user_id,
        p_session_type,
        NOW(),
        'in_progress'
    ) RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE OR REPLACE FUNCTION complete_app_session(
    p_session_id UUID,
    p_score INTEGER DEFAULT 0,
    p_responses JSONB DEFAULT '{}',
    p_game_data JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
DECLARE
    session_record RECORD;
    duration_secs INTEGER;
BEGIN
    -- Get session info
    SELECT * INTO session_record
    FROM app_sessions
    WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found';
    END IF;
    
    -- Calculate duration
    duration_secs := EXTRACT(EPOCH FROM (NOW() - session_record.started_at));
    
    -- Update session
    UPDATE app_sessions SET
        completed_at = NOW(),
        duration_seconds = duration_secs,
        score = p_score,
        max_score = COALESCE((p_game_data->>'max_score')::INTEGER, 100),
        responses = p_responses,
        game_data = p_game_data,
        completion_status = 'completed'
    WHERE id = p_session_id;
    
    -- Update or create progress record
    INSERT INTO app_progress (
        app_id,
        user_id,
        total_sessions,
        total_time_minutes,
        best_score,
        average_score,
        experience_points,
        last_played_at
    ) VALUES (
        session_record.app_id,
        session_record.user_id,
        1,
        ROUND(duration_secs / 60.0),
        p_score,
        p_score,
        p_score,
        NOW()
    )
    ON CONFLICT (app_id, user_id) DO UPDATE SET
        total_sessions = app_progress.total_sessions + 1,
        total_time_minutes = app_progress.total_time_minutes + ROUND(duration_secs / 60.0),
        best_score = GREATEST(app_progress.best_score, p_score),
        average_score = ROUND((app_progress.average_score * app_progress.total_sessions + p_score) / (app_progress.total_sessions + 1)),
        experience_points = app_progress.experience_points + p_score,
        last_played_at = NOW(),
        updated_at = NOW();
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Session notes and document functions
CREATE OR REPLACE FUNCTION create_session_note(
    session_id UUID,
    content TEXT
)
RETURNS UUID AS $$
DECLARE
    note_id UUID;
BEGIN
    INSERT INTO session_notes (
        appointment_id,
        therapist_id,
        progress_notes,
        created_at
    ) VALUES (
        session_id,
        auth.uid(),
        content,
        NOW()
    ) RETURNING id INTO note_id;
    
    RETURN note_id;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_session_documents(
    session_id UUID
)
RETURNS TABLE(
    id UUID,
    file_url TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.file_url,
        d.created_at
    FROM document_uploads d
    WHERE d.session_id = get_session_documents.session_id
    AND d.therapist_id = auth.uid()
    ORDER BY d.created_at DESC;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Client data access function
CREATE OR REPLACE FUNCTION get_client_data(client_id UUID)
RETURNS TABLE(
    worksheets JSONB,
    assessments JSONB,
    exercises JSONB,
    progress JSONB
) AS $$
DECLARE
    current_user_id UUID := auth.uid();
BEGIN
    -- Check if user has access to this client
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = current_user_id 
        AND (
            id = client_id OR -- User is the client
            (role = 'therapist' AND EXISTS (
                SELECT 1 FROM therapist_client_relations 
                WHERE therapist_id = current_user_id AND therapist_client_relations.client_id = get_client_data.client_id
            ))
        )
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    RETURN QUERY
    SELECT 
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', wa.id,
                    'worksheet_id', wa.worksheet_id,
                    'title', w.title,
                    'content', wa.responses,
                    'responses', wa.responses,
                    'status', wa.status,
                    'created_at', wa.assigned_at,
                    'updated_at', COALESCE(wa.completed_at, wa.assigned_at),
                    'completed_at', wa.completed_at
                )
            ) FROM worksheet_assignments wa
            JOIN worksheets w ON w.id = wa.worksheet_id
            WHERE wa.client_id = get_client_data.client_id
            ORDER BY wa.assigned_at DESC
            LIMIT 20), '[]'::jsonb
        ) as worksheets,
        
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', pf.id,
                    'form_type', pf.form_type,
                    'title', pf.title,
                    'questions', pf.questions,
                    'responses', pf.responses,
                    'score', pf.score,
                    'status', pf.status,
                    'created_at', pf.created_at,
                    'completed_at', pf.completed_at
                )
            ) FROM psychometric_forms pf
            WHERE pf.client_id = get_client_data.client_id
            ORDER BY pf.created_at DESC
            LIMIT 20), '[]'::jsonb
        ) as assessments,
        
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', te.id,
                    'exercise_type', te.exercise_type,
                    'title', te.title,
                    'description', te.description,
                    'game_config', te.game_config,
                    'progress', te.progress,
                    'status', te.status,
                    'created_at', te.created_at,
                    'last_played_at', te.last_played_at
                )
            ) FROM therapeutic_exercises te
            WHERE te.client_id = get_client_data.client_id
            ORDER BY te.created_at DESC
            LIMIT 20), '[]'::jsonb
        ) as exercises,
        
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'date', pt.recorded_at,
                    'value', pt.value,
                    'metric_type', pt.metric_type
                )
            ) FROM progress_tracking pt
            WHERE pt.client_id = get_client_data.client_id
            ORDER BY pt.recorded_at ASC
            LIMIT 100), '[]'::jsonb
        ) as progress;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- App recommendations function
CREATE OR REPLACE FUNCTION get_app_recommendations(p_user_id UUID)
RETURNS TABLE(
    app_id UUID,
    name TEXT,
    description TEXT,
    app_type TEXT,
    difficulty_level TEXT,
    estimated_duration INTEGER,
    recommendation_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ga.id,
        ga.name,
        ga.description,
        ga.app_type,
        ga.difficulty_level,
        ga.estimated_duration,
        1.0::NUMERIC as recommendation_score
    FROM gamified_apps ga
    WHERE ga.is_active = true
    AND NOT EXISTS (
        SELECT 1 FROM app_progress ap 
        WHERE ap.app_id = ga.id AND ap.user_id = p_user_id
    )
    ORDER BY ga.created_at DESC
    LIMIT 10;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- App leaderboard function
CREATE OR REPLACE FUNCTION get_app_leaderboard(
    p_app_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    user_id UUID,
    best_score INTEGER,
    total_sessions INTEGER,
    rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ap.user_id,
        ap.best_score,
        ap.total_sessions,
        ROW_NUMBER() OVER (ORDER BY ap.best_score DESC, ap.total_sessions DESC)::INTEGER as rank
    FROM app_progress ap
    WHERE ap.app_id = p_app_id
    ORDER BY ap.best_score DESC, ap.total_sessions DESC
    LIMIT p_limit;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Ensure all views exist and are up to date
DROP VIEW IF EXISTS app_usage_stats;
CREATE VIEW app_usage_stats AS
SELECT 
    ga.id as app_id,
    ga.name as app_name,
    ga.app_type,
    COUNT(DISTINCT aps.user_id) as unique_users,
    COUNT(aps.id) as total_sessions,
    AVG(aps.score) as average_score,
    AVG(aps.duration_seconds) as average_duration_seconds,
    COUNT(CASE WHEN aps.completion_status = 'completed' THEN 1 END) as completed_sessions,
    CASE 
        WHEN COUNT(aps.id) > 0 THEN 
            (COUNT(CASE WHEN aps.completion_status = 'completed' THEN 1 END)::NUMERIC / COUNT(aps.id)) * 100
        ELSE 0 
    END as completion_rate
FROM gamified_apps ga
LEFT JOIN app_sessions aps ON ga.id = aps.app_id
WHERE ga.is_active = true
GROUP BY ga.id, ga.name, ga.app_type;

DROP VIEW IF EXISTS therapist_insights_metrics;
CREATE VIEW therapist_insights_metrics AS
SELECT 
    p.id as therapist_id,
    COUNT(CASE 
        WHEN fa.status = 'assigned' 
        AND fa.due_date < CURRENT_DATE 
        THEN 1 
    END) as overdue_assessments,
    COUNT(CASE 
        WHEN tcr.client_id IS NOT NULL 
        AND NOT EXISTS (
            SELECT 1 FROM appointments a 
            WHERE a.client_id = tcr.client_id 
            AND a.appointment_date > (CURRENT_DATE - INTERVAL '30 days')
        )
        THEN 1 
    END) as idle_clients
FROM profiles p
LEFT JOIN therapist_client_relations tcr ON p.id = tcr.therapist_id
LEFT JOIN form_assignments fa ON p.id = fa.therapist_id
WHERE p.role = 'therapist'
GROUP BY p.id;

DROP VIEW IF EXISTS progress_metrics;
CREATE VIEW progress_metrics AS
SELECT 
    p.client_id,
    DATE(p.recorded_at) as metric_date,
    p.metric_type,
    p.value
FROM progress_tracking p
UNION ALL
SELECT 
    pf.client_id,
    DATE(pf.completed_at) as metric_date,
    pf.form_type as metric_type,
    pf.score as value
FROM psychometric_forms pf
WHERE pf.completed_at IS NOT NULL;

-- Ensure all necessary indexes exist
CREATE INDEX IF NOT EXISTS idx_profiles_role_lookup ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email_lookup ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_patient_code ON profiles(patient_code);
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON profiles(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_profiles_created_by_therapist ON profiles(created_by_therapist);

CREATE INDEX IF NOT EXISTS idx_therapist_client_relations_therapist ON therapist_client_relations(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_client_relations_client ON therapist_client_relations(client_id);

CREATE INDEX IF NOT EXISTS idx_client_profiles_client_id ON client_profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_therapist_id ON client_profiles(therapist_id);

CREATE INDEX IF NOT EXISTS idx_psychometric_forms_client_id ON psychometric_forms(client_id);
CREATE INDEX IF NOT EXISTS idx_psychometric_forms_therapist_id ON psychometric_forms(therapist_id);

CREATE INDEX IF NOT EXISTS idx_therapeutic_exercises_client_id ON therapeutic_exercises(client_id);
CREATE INDEX IF NOT EXISTS idx_therapeutic_exercises_therapist_id ON therapeutic_exercises(therapist_id);

CREATE INDEX IF NOT EXISTS idx_form_assignments_client_id ON form_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_form_assignments_therapist_id ON form_assignments(therapist_id);

CREATE INDEX IF NOT EXISTS idx_progress_tracking_client_id ON progress_tracking(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_recorded_at ON progress_tracking(recorded_at);

CREATE INDEX IF NOT EXISTS idx_app_sessions_app_id ON app_sessions(app_id);
CREATE INDEX IF NOT EXISTS idx_app_sessions_user_id ON app_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_app_sessions_started_at ON app_sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_app_progress_app_id ON app_progress(app_id);
CREATE INDEX IF NOT EXISTS idx_app_progress_user_id ON app_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_app_analytics_session_id ON app_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_app_analytics_event_type ON app_analytics(event_type);

CREATE INDEX IF NOT EXISTS idx_gamified_apps_type ON gamified_apps(app_type);
CREATE INDEX IF NOT EXISTS idx_gamified_apps_active ON gamified_apps(is_active);

CREATE INDEX IF NOT EXISTS idx_treatment_plans_client_id ON treatment_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_therapist_id ON treatment_plans(therapist_id);

CREATE INDEX IF NOT EXISTS idx_therapy_goals_treatment_plan_id ON therapy_goals(treatment_plan_id);

CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_therapist_id ON appointments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

CREATE INDEX IF NOT EXISTS idx_session_notes_therapist_id ON session_notes(therapist_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_therapist_id ON cases(therapist_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);

CREATE INDEX IF NOT EXISTS idx_case_milestones_case_id ON case_milestones(case_id);

CREATE INDEX IF NOT EXISTS idx_communication_logs_therapist_id ON communication_logs(therapist_id);

CREATE INDEX IF NOT EXISTS idx_cbt_worksheets_client_id ON cbt_worksheets(client_id);
CREATE INDEX IF NOT EXISTS idx_cbt_worksheets_therapist_id ON cbt_worksheets(therapist_id);

-- Ensure worksheet tables have proper indexes
CREATE INDEX IF NOT EXISTS worksheet_assignments_client_idx ON worksheet_assignments(client_id);
CREATE INDEX IF NOT EXISTS worksheet_assignments_worksheet_idx ON worksheet_assignments(worksheet_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Refresh materialized views if any exist
-- (None currently, but this is where they would be refreshed)

-- Update any missing triggers
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Add updated_at triggers for tables that need them
    FOR r IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
        AND table_name NOT IN (
            SELECT DISTINCT event_object_table 
            FROM information_schema.triggers 
            WHERE trigger_name LIKE '%updated_at%'
        )
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()
        ', r.table_name, r.table_name);
    END LOOP;
END $$;

-- Ensure RLS is enabled on all tables that should have it
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('user_roles')
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_record.tablename);
    END LOOP;
END $$;

-- Final consistency check
ANALYZE;