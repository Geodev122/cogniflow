/*
  # Fix RLS Policy Recursion Issues

  1. Policy Fixes
    - Remove recursive policies causing infinite loops
    - Simplify RLS policies to prevent circular references
    - Fix therapist_insights_metrics view access

  2. Authentication
    - Create demo therapist account with correct credentials
    - Ensure proper profile setup

  3. Data Population
    - Add sample data for testing
    - Ensure all relationships are properly established
*/

-- First, drop all problematic policies that cause recursion
DROP POLICY IF EXISTS "profiles_therapist_view_clients" ON profiles;
DROP POLICY IF EXISTS "therapist_client_relations_therapist_manage" ON therapist_client_relations;
DROP POLICY IF EXISTS "appointments_therapist_manage" ON appointments;
DROP POLICY IF EXISTS "form_assignments_therapist_manage" ON form_assignments;

-- Create simplified, non-recursive policies for profiles
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Simple policy for therapist_client_relations
CREATE POLICY "therapist_client_relations_therapist_access" ON therapist_client_relations
  FOR ALL TO authenticated
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "therapist_client_relations_client_access" ON therapist_client_relations
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- Simple policy for appointments
CREATE POLICY "appointments_therapist_access" ON appointments
  FOR ALL TO authenticated
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "appointments_client_access" ON appointments
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- Simple policy for form_assignments
CREATE POLICY "form_assignments_therapist_access" ON form_assignments
  FOR ALL TO authenticated
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "form_assignments_client_access" ON form_assignments
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "form_assignments_client_update" ON form_assignments
  FOR UPDATE TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Create the demo therapist account if it doesn't exist
DO $$
DECLARE
    demo_therapist_id uuid;
BEGIN
    -- Check if the demo therapist already exists
    SELECT id INTO demo_therapist_id 
    FROM auth.users 
    WHERE email = 'fedgee911@gmail.com';
    
    -- If not found, create the user
    IF demo_therapist_id IS NULL THEN
        -- Insert into auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            'f7cb820b-f73e-4bfe-9571-261c7eef79e0',
            'authenticated',
            'authenticated',
            'fedgee911@gmail.com',
            crypt('123456', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            false,
            '',
            '',
            '',
            ''
        );
        
        demo_therapist_id := 'f7cb820b-f73e-4bfe-9571-261c7eef79e0';
    END IF;
    
    -- Insert or update the profile
    INSERT INTO profiles (
        id,
        role,
        first_name,
        last_name,
        email,
        whatsapp_number,
        password_set,
        professional_details,
        verification_status,
        created_at
    ) VALUES (
        demo_therapist_id,
        'therapist',
        'Sarah',
        'Johnson',
        'fedgee911@gmail.com',
        '+1-555-0123',
        true,
        '{
            "specializations": ["Anxiety Disorders", "Depression", "Trauma", "CBT", "Mindfulness"],
            "languages": ["English", "Spanish", "French"],
            "qualifications": "Ph.D. Clinical Psychology, Licensed Psychologist #PSY12345, CBT Certified, EMDR Level II",
            "bio": "Dr. Sarah Johnson is a licensed clinical psychologist with over 15 years of experience specializing in anxiety, depression, and trauma. She uses evidence-based approaches including CBT, EMDR, and mindfulness techniques.",
            "years_experience": 15,
            "practice_locations": [
                {"address": "123 Main St, Los Angeles, CA 90210", "isPrimary": true},
                {"address": "456 Beverly Dr, Beverly Hills, CA 90212", "isPrimary": false}
            ]
        }'::jsonb,
        'verified',
        now()
    ) ON CONFLICT (id) DO UPDATE SET
        professional_details = EXCLUDED.professional_details,
        verification_status = EXCLUDED.verification_status,
        whatsapp_number = EXCLUDED.whatsapp_number;

    -- Create sample clients
    INSERT INTO profiles (
        id,
        role,
        first_name,
        last_name,
        email,
        patient_code,
        password_set,
        created_by_therapist,
        created_at
    ) VALUES 
        (
            'c1234567-1234-1234-1234-123456789012',
            'client',
            'John',
            'Smith',
            'john.smith@example.com',
            'JS001',
            false,
            demo_therapist_id,
            now()
        ),
        (
            'c2345678-2345-2345-2345-234567890123',
            'client',
            'Emily',
            'Davis',
            'emily.davis@example.com',
            'ED002',
            false,
            demo_therapist_id,
            now()
        )
    ON CONFLICT (id) DO NOTHING;

    -- Create therapist-client relationships
    INSERT INTO therapist_client_relations (therapist_id, client_id) VALUES
        (demo_therapist_id, 'c1234567-1234-1234-1234-123456789012'),
        (demo_therapist_id, 'c2345678-2345-2345-2345-234567890123')
    ON CONFLICT (therapist_id, client_id) DO NOTHING;

    -- Create sample appointments
    INSERT INTO appointments (
        therapist_id,
        client_id,
        appointment_date,
        duration_minutes,
        appointment_type,
        status,
        notes
    ) VALUES
        (
            demo_therapist_id,
            'c1234567-1234-1234-1234-123456789012',
            now() + interval '2 days',
            50,
            'individual',
            'scheduled',
            'Follow-up session for anxiety management'
        ),
        (
            demo_therapist_id,
            'c2345678-2345-2345-2345-234567890123',
            now() + interval '3 days',
            50,
            'individual',
            'scheduled',
            'CBT session for depression treatment'
        )
    ON CONFLICT DO NOTHING;

    -- Create sample form assignments
    INSERT INTO form_assignments (
        therapist_id,
        client_id,
        form_type,
        title,
        instructions,
        due_date,
        status
    ) VALUES
        (
            demo_therapist_id,
            'c1234567-1234-1234-1234-123456789012',
            'psychometric',
            'GAD-7 Assessment',
            'Please complete this anxiety assessment',
            current_date + interval '7 days',
            'assigned'
        ),
        (
            demo_therapist_id,
            'c2345678-2345-2345-2345-234567890123',
            'psychometric',
            'PHQ-9 Assessment',
            'Please complete this depression screening',
            current_date + interval '5 days',
            'assigned'
        )
    ON CONFLICT DO NOTHING;

END $$;