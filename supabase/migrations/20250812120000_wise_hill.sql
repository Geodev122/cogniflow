/*
  # Deprecated therapist insights view

  This migration previously created the `therapist_insights_metrics` view and
  accompanying `therapist_insights` function. The view has been replaced by a
  real table in a later migration.
*/

-- Remove legacy view and function if they still exist
DROP VIEW IF EXISTS therapist_insights_metrics CASCADE;
DROP FUNCTION IF EXISTS therapist_insights(id uuid);
