@@ .. @@
 
 -- Enable RLS on all tables
 ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
 ALTER TABLE therapy_goals ENABLE ROW LEVEL SECURITY;
+
+-- Function: get_client_data
+-- Retrieves comprehensive client data for therapist dashboard
+CREATE OR REPLACE FUNCTION public.get_client_data(client_id uuid)
+RETURNS json
+LANGUAGE plpgsql
+SECURITY DEFINER
+SET search_path = 'public'
+AS $$
+DECLARE
+    result json;
+BEGIN
+    -- Check if user is authorized to access this client's data
+    IF NOT EXISTS (
+        SELECT 1 FROM therapist_client_relations tcr
+        WHERE tcr.client_id = get_client_data.client_id 
+        AND tcr.therapist_id = auth.uid()
+    ) AND auth.uid() != get_client_data.client_id THEN
+        RAISE EXCEPTION 'Access denied';
+    END IF;
+
+    SELECT json_build_object(
+        'client_profile', (
+            SELECT json_build_object(
+                'id', p.id,
+                'first_name', p.first_name,
+                'last_name', p.last_name,
+                'email', p.email,
+                'created_at', p.created_at,
+                'patient_code', p.patient_code,
+                'whatsapp_number', p.whatsapp_number
+            )
+            FROM profiles p
+            WHERE p.id = get_client_data.client_id
+        ),
+        'worksheets', (
+            SELECT COALESCE(json_agg(
+                json_build_object(
+                    'id', wa.id,
+                    'title', w.title,
+                    'status', wa.status,
+                    'assigned_at', wa.assigned_at,
+                    'completed_at', wa.completed_at,
+                    'responses', wa.responses
+                )
+            ), '[]'::json)
+            FROM worksheet_assignments wa
+            JOIN worksheets w ON w.id = wa.worksheet_id
+            WHERE wa.client_id = get_client_data.client_id
+        ),
+        'assessments', (
+            SELECT COALESCE(json_agg(
+                json_build_object(
+                    'id', pf.id,
+                    'title', pf.title,
+                    'form_type', pf.form_type,
+                    'status', pf.status,
+                    'score', pf.score,
+                    'created_at', pf.created_at,
+                    'completed_at', pf.completed_at,
+                    'responses', pf.responses
+                )
+            ), '[]'::json)
+            FROM psychometric_forms pf
+            WHERE pf.client_id = get_client_data.client_id
+        ),
+        'exercises', (
+            SELECT COALESCE(json_agg(
+                json_build_object(
+                    'id', te.id,
+                    'title', te.title,
+                    'exercise_type', te.exercise_type,
+                    'status', te.status,
+                    'progress', te.progress,
+                    'created_at', te.created_at,
+                    'last_played_at', te.last_played_at
+                )
+            ), '[]'::json)
+            FROM therapeutic_exercises te
+            WHERE te.client_id = get_client_data.client_id
+        ),
+        'progress', (
+            SELECT COALESCE(json_agg(
+                json_build_object(
+                    'id', pt.id,
+                    'metric_type', pt.metric_type,
+                    'value', pt.value,
+                    'recorded_at', pt.recorded_at,
+                    'source_type', pt.source_type
+                )
+            ), '[]'::json)
+            FROM progress_tracking pt
+            WHERE pt.client_id = get_client_data.client_id
+            ORDER BY pt.recorded_at DESC
+            LIMIT 50
+        )
+    ) INTO result;
+
+    RETURN result;
+END;
+$$;
+
+-- Function: update_user_role
+-- Updates user role with proper authorization
+CREATE OR REPLACE FUNCTION public.update_user_role(user_id uuid, new_role text)
+RETURNS boolean
+LANGUAGE plpgsql
+SECURITY DEFINER
+SET search_path = 'public'
+AS $$
+BEGIN
+    -- Only allow therapists to update client roles, or users to update their own role
+    IF auth.uid() != user_id AND NOT EXISTS (
+        SELECT 1 FROM profiles 
+        WHERE id = auth.uid() 
+        AND role = 'therapist'
+    ) THEN
+        RAISE EXCEPTION 'Access denied';
+    END IF;
+
+    -- Validate role
+    IF new_role NOT IN ('therapist', 'client') THEN
+        RAISE EXCEPTION 'Invalid role';
+    END IF;
+
+    -- Update the profile
+    UPDATE profiles 
+    SET role = new_role, 
+        updated_at = now()
+    WHERE id = user_id;
+
+    -- Update user_roles table if it exists
+    INSERT INTO user_roles (user_id, role, created_at)
+    VALUES (user_id, new_role, now())
+    ON CONFLICT (user_id) 
+    DO UPDATE SET role = new_role;
+
+    RETURN true;
+EXCEPTION
+    WHEN OTHERS THEN
+        RETURN false;
+END;
+$$;
+
+-- Function: get_patient_insights_summary
+-- Provides insights summary for therapist dashboard
+CREATE OR REPLACE FUNCTION public.get_patient_insights_summary(therapist_id uuid)
+RETURNS json
+LANGUAGE plpgsql
+SECURITY DEFINER
+SET search_path = 'public'
+AS $$
+DECLARE
+    result json;
+BEGIN
+    -- Check if user is a therapist
+    IF NOT EXISTS (
+        SELECT 1 FROM profiles 
+        WHERE id = auth.uid() 
+        AND role = 'therapist'
+        AND id = get_patient_insights_summary.therapist_id
+    ) THEN
+        RAISE EXCEPTION 'Access denied';
+    END IF;
+
+    SELECT json_build_object(
+        'total_clients', (
+            SELECT COUNT(*)
+            FROM therapist_client_relations tcr
+            WHERE tcr.therapist_id = get_patient_insights_summary.therapist_id
+        ),
+        'pending_assessments', (
+            SELECT COUNT(*)
+            FROM form_assignments fa
+            WHERE fa.therapist_id = get_patient_insights_summary.therapist_id
+            AND fa.status = 'assigned'
+            AND fa.form_type = 'psychometric'
+        ),
+        'completed_assessments', (
+            SELECT COUNT(*)
+            FROM form_assignments fa
+            WHERE fa.therapist_id = get_patient_insights_summary.therapist_id
+            AND fa.status = 'completed'
+            AND fa.form_type = 'psychometric'
+        ),
+        'upcoming_appointments', (
+            SELECT COUNT(*)
+            FROM appointments a
+            WHERE a.therapist_id = get_patient_insights_summary.therapist_id
+            AND a.appointment_date >= now()
+            AND a.appointment_date <= now() + interval '7 days'
+            AND a.status = 'scheduled'
+        ),
+        'high_risk_clients', (
+            SELECT COUNT(*)
+            FROM client_profiles cp
+            WHERE cp.therapist_id = get_patient_insights_summary.therapist_id
+            AND cp.risk_level IN ('high', 'crisis')
+        ),
+        'recent_activity', (
+            SELECT COALESCE(json_agg(
+                json_build_object(
+                    'client_name', p.first_name || ' ' || p.last_name,
+                    'activity_type', 'assessment_completed',
+                    'activity_date', fa.completed_at,
+                    'details', fa.title
+                )
+                ORDER BY fa.completed_at DESC
+            ), '[]'::json)
+            FROM form_assignments fa
+            JOIN profiles p ON p.id = fa.client_id
+            WHERE fa.therapist_id = get_patient_insights_summary.therapist_id
+            AND fa.status = 'completed'
+            AND fa.completed_at >= now() - interval '7 days'
+            LIMIT 5
+        )
+    ) INTO result;
+
+    RETURN result;
+END;
+$$;