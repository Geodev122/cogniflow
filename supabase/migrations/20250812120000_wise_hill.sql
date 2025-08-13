/*
  # Therapist insights view and function (deprecated)

  This migration originally created the `therapist_insights_metrics` view
  and `therapist_insights` helper function. These have been replaced by
  the `therapist_insights_metrics` table introduced in a later migration.
  The original definitions are retained below for reference but commented out
  so they no longer execute when running migrations from scratch.
*/

-- CREATE OR REPLACE VIEW therapist_insights_metrics AS
-- SELECT
--   t.id AS therapist_id,
--   (
--     SELECT count(*) FROM form_assignments fa
--     WHERE fa.therapist_id = t.id
--       AND fa.status = 'assigned'
--       AND fa.due_date < CURRENT_DATE
--   ) AS overdue_assessments,
--   (
--     SELECT count(*) FROM therapist_client_relations tcr
--     WHERE tcr.therapist_id = t.id
--       AND NOT EXISTS (
--         SELECT 1
--         FROM appointments a
--         WHERE a.therapist_id = t.id
--           AND a.client_id = tcr.client_id
--           AND a.appointment_date >= (CURRENT_DATE - INTERVAL '30 days')
--       )
--   ) AS idle_clients
-- FROM profiles t
-- WHERE t.role = 'therapist';

-- CREATE OR REPLACE FUNCTION therapist_insights(id uuid)
-- RETURNS jsonb AS $$
-- DECLARE
--   metrics RECORD;
-- BEGIN
--   SELECT * INTO metrics FROM therapist_insights_metrics WHERE therapist_id = therapist_insights.id;
--
--   RETURN jsonb_build_array(
--     jsonb_build_object(
--       'title', 'Overdue Assessments',
--       'count', COALESCE(metrics.overdue_assessments, 0),
--       'message', COALESCE(metrics.overdue_assessments, 0) || ' assessment(s) overdue',
--       'icon', 'ClipboardList',
--       'severity', CASE WHEN metrics.overdue_assessments > 0 THEN 'warning' ELSE 'success' END
--     ),
--     jsonb_build_object(
--       'title', 'Idle Clients',
--       'count', COALESCE(metrics.idle_clients, 0),
--       'message', COALESCE(metrics.idle_clients, 0) || ' client(s) without recent sessions',
--       'icon', 'Clock',
--       'severity', CASE WHEN metrics.idle_clients > 0 THEN 'warning' ELSE 'success' END
--     )
--   );
-- END;
-- $$ LANGUAGE plpgsql SECURITY INVOKER;
