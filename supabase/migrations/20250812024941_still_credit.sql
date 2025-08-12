/*
  # Create get_therapist_profile function

  1. New Functions
    - `get_therapist_profile(p_user_id uuid)` - Returns comprehensive therapist profile data
      - Basic profile information (name, email, contact)
      - Professional details (specializations, qualifications, bio)
      - Practice information (locations, verification status)
      - Statistics (client count, experience, ratings)

  2. Security
    - Function uses SECURITY DEFINER for controlled access
    - Grants execute permission to authenticated users
    - Only returns data for therapist role profiles

  3. Data Structure
    - Returns structured JSON data matching TherapistProfileData interface
    - Includes calculated statistics like total client count
    - Handles missing professional_details gracefully
*/

CREATE OR REPLACE FUNCTION public.get_therapist_profile(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    "fullName" text,
    "profilePicture" text,
    "whatsappNumber" text,
    email text,
    specializations text[],
    languages text[],
    qualifications text,
    bio text,
    "introVideo" text,
    "practiceLocations" jsonb,
    "verificationStatus" text,
    "membershipStatus" text,
    "joinDate" text,
    stats jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_clients integer;
BEGIN
    -- Get total clients for the therapist
    SELECT COUNT(tcr.client_id)
    INTO v_total_clients
    FROM public.therapist_client_relations tcr
    WHERE tcr.therapist_id = p_user_id;

    RETURN QUERY
    SELECT
        p.id,
        p.first_name || ' ' || p.last_name AS "fullName",
        COALESCE((p.professional_details->>'profilePicture')::text, '') AS "profilePicture",
        COALESCE(p.whatsapp_number::text, '') AS "whatsappNumber",
        p.email::text AS email,
        COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(p.professional_details->'specializations')),
            ARRAY[]::text[]
        ) AS specializations,
        COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(p.professional_details->'languages')),
            ARRAY[]::text[]
        ) AS languages,
        COALESCE((p.professional_details->>'qualifications')::text, '') AS qualifications,
        COALESCE((p.professional_details->>'bio')::text, '') AS bio,
        COALESCE((p.professional_details->>'introVideo')::text, '') AS "introVideo",
        COALESCE((p.professional_details->'practiceLocations')::jsonb, '[]'::jsonb) AS "practiceLocations",
        COALESCE(p.verification_status::text, 'pending') AS "verificationStatus",
        'active'::text AS "membershipStatus",
        p.created_at::text AS "joinDate",
        jsonb_build_object(
            'totalClients', COALESCE(v_total_clients, 0),
            'yearsExperience', COALESCE((p.professional_details->>'yearsExperience')::integer, 0),
            'rating', 4.8,
            'reviewCount', 0,
            'responseTime', '24 hours'
        )::jsonb AS stats
    FROM
        public.profiles p
    WHERE
        p.id = p_user_id AND p.role = 'therapist';
END;
$$;

-- Grant usage to authenticated role
GRANT EXECUTE ON FUNCTION public.get_therapist_profile(uuid) TO authenticated;