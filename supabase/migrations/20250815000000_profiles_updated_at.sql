-- Add column if not exists
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create function if not exists (using CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_profiles_timestamp ON profiles;

-- Create trigger
CREATE TRIGGER update_profiles_timestamp
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();