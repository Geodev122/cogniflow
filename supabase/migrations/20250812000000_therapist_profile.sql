/*
  # Therapist profile support

  1. New Tables
    - `therapist_locations`
    - `therapist_stats`

  2. New Functions
    - `get_therapist_profile(id uuid)`
*/

-- Create therapist_locations table
CREATE TABLE IF NOT EXISTS therapist_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  address text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE therapist_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "therapist_manage_own_locations" ON therapist_locations
  USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);

-- Create therapist_stats table
CREATE TABLE IF NOT EXISTS therapist_stats (
  therapist_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_clients int DEFAULT 0,
  years_experience int DEFAULT 0,
  rating numeric DEFAULT 0,
  review_count int DEFAULT 0,
  response_time text DEFAULT 'N/A',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE therapist_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "therapist_manage_own_stats" ON therapist_stats
  USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);

-- Function to fetch full therapist profile
CREATE OR REPLACE FUNCTION get_therapist_profile(id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', p.id,
    'fullName', p.first_name || ' ' || p.last_name,
    'profilePicture', p.professional_details->>'profile_picture',
    'whatsappNumber', p.whatsapp_number,
    'email', p.email,
    'specializations', p.professional_details->'specializations',
    'languages', p.professional_details->'languages',
    'qualifications', p.professional_details->>'qualifications',
    'bio', p.professional_details->>'bio',
    'introVideo', p.professional_details->>'intro_video',
    'practiceLocations', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'address', tl.address,
            'isPrimary', tl.is_primary
          )
        ) FROM therapist_locations tl WHERE tl.therapist_id = p.id
      ), '[]'::jsonb
    ),
    'verificationStatus', p.verification_status,
    'membershipStatus', COALESCE(p.professional_details->>'membership_status', 'active'),
    'joinDate', p.created_at,
    'stats', jsonb_build_object(
      'totalClients', COALESCE(ts.total_clients, 0),
      'yearsExperience', COALESCE(ts.years_experience, 0),
      'rating', COALESCE(ts.rating, 0),
      'reviewCount', COALESCE(ts.review_count, 0),
      'responseTime', COALESCE(ts.response_time, 'N/A')
    )
  ) INTO result
  FROM profiles p
  LEFT JOIN therapist_stats ts ON ts.therapist_id = p.id
  WHERE p.id = get_therapist_profile.id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
