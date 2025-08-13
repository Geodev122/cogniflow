/*
  # therapist_insights_metrics table

  1. New Table
    - therapist_insights_metrics stores metrics about therapist insights
  2. RLS
    - Enabled
    - Therapists can manage their own metrics
*/

CREATE TABLE therapist_insights_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  metric_type text NOT NULL,
  metric_value numeric,
  metric_context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE therapist_insights_metrics ENABLE ROW LEVEL SECURITY;

CREATE INDEX therapist_insights_metrics_therapist_id_idx ON therapist_insights_metrics (therapist_id);
CREATE INDEX therapist_insights_metrics_patient_id_idx ON therapist_insights_metrics (patient_id);
CREATE INDEX therapist_insights_metrics_metric_type_idx ON therapist_insights_metrics (metric_type);

-- RLS policies
CREATE POLICY "therapist_insights_metrics_select_own" ON therapist_insights_metrics
  FOR SELECT USING (auth.uid() = therapist_id);

CREATE POLICY "therapist_insights_metrics_insert_own" ON therapist_insights_metrics
  FOR INSERT WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "therapist_insights_metrics_update_own" ON therapist_insights_metrics
  FOR UPDATE USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "therapist_insights_metrics_delete_own" ON therapist_insights_metrics
  FOR DELETE USING (auth.uid() = therapist_id);

-- Functions
DROP FUNCTION IF EXISTS public.insert_therapist_insight(uuid, uuid, text, numeric, jsonb);
CREATE OR REPLACE FUNCTION public.insert_therapist_insight(
  p_therapist_id uuid,
  p_patient_id uuid,
  p_metric_type text,
  p_metric_value numeric,
  p_metric_context jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO therapist_insights_metrics (
    therapist_id, patient_id, metric_type, metric_value, metric_context
  ) VALUES (
    p_therapist_id, p_patient_id, p_metric_type, p_metric_value, p_metric_context
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

DROP FUNCTION IF EXISTS public.get_patient_insights_summary(uuid);
CREATE OR REPLACE FUNCTION public.get_patient_insights_summary(patient_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_metrics', COUNT(*),
    'latest_metric_date', MAX(created_at),
    'avg_metric_value', AVG(metric_value)
  ) INTO result
  FROM therapist_insights_metrics
  WHERE patient_id = get_patient_insights_summary.patient_id;

  RETURN result;
END;
$$;

DROP FUNCTION IF EXISTS public.get_therapist_insights(uuid);
CREATE OR REPLACE FUNCTION public.get_therapist_insights(therapist_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_metrics', COUNT(*),
    'latest_metric_date', MAX(created_at),
    'avg_metric_value', AVG(metric_value)
  ) INTO result
  FROM therapist_insights_metrics
  WHERE therapist_id = get_therapist_insights.therapist_id;

  RETURN result;
END;
$$;
