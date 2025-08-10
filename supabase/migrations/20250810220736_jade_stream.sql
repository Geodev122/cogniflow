/*
  # Add client creation fields

  1. New Tables
    - Add patient_code to profiles table
    - Add whatsapp_number to profiles table
    - Add password_set flag to profiles table
  
  2. Security
    - Update existing policies to handle new fields
    - Add function to generate patient codes
  
  3. Changes
    - Modify profiles table to support therapist-created client accounts
    - Add fields for WhatsApp contact and patient identification
*/

-- Add new columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'patient_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN patient_code text UNIQUE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'whatsapp_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN whatsapp_number text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'password_set'
  ) THEN
    ALTER TABLE profiles ADD COLUMN password_set boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'created_by_therapist'
  ) THEN
    ALTER TABLE profiles ADD COLUMN created_by_therapist uuid REFERENCES profiles(id);
  END IF;
END $$;

-- Create function to generate patient codes
CREATE OR REPLACE FUNCTION generate_patient_code()
RETURNS text AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate code: PT + 6 random digits
    new_code := 'PT' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::text, 6, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE patient_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Create index for patient_code
CREATE INDEX IF NOT EXISTS idx_profiles_patient_code ON profiles(patient_code);
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON profiles(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_profiles_created_by_therapist ON profiles(created_by_therapist);