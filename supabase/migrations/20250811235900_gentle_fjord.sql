/*
  # Add profile completion fields and function

  1. Changes
    - Add professional_details and verification_status columns to profiles table
    - Create profile_completion(id uuid) function returning percent complete
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'professional_details'
  ) THEN
    ALTER TABLE profiles ADD COLUMN professional_details jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN verification_status text;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION profile_completion(id uuid)
RETURNS int AS $$
DECLARE
  total_steps int := 3;
  completed int := 0;
  p record;
BEGIN
  SELECT whatsapp_number, professional_details, verification_status
    INTO p
    FROM profiles
    WHERE profiles.id = profile_completion.id;

  IF p.whatsapp_number IS NOT NULL THEN
    completed := completed + 1;
  END IF;
  IF p.professional_details IS NOT NULL THEN
    completed := completed + 1;
  END IF;
  IF p.verification_status IS NOT NULL THEN
    completed := completed + 1;
  END IF;

  RETURN (completed * 100 / total_steps);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
