-- Create view to aggregate assessment scores and session attendance
CREATE OR REPLACE VIEW progress_metrics AS
  -- Psychometric form scores
  SELECT
    pf.client_id,
    pf.completed_at::date AS metric_date,
    pf.form_type AS metric_type,
    pf.score AS value
  FROM psychometric_forms pf
  WHERE pf.status = 'completed' AND pf.completed_at IS NOT NULL
  UNION ALL
  -- Session attendance counts
  SELECT
    a.client_id,
    a.appointment_date::date AS metric_date,
    'session_attendance' AS metric_type,
    COUNT(*)::int AS value
  FROM appointments a
  WHERE a.status = 'completed'
  GROUP BY a.client_id, a.appointment_date::date;
