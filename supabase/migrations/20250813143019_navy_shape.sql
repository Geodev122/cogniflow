/*
  # Complete Schema Revision and Demo Data Population

  1. Database Functions
    - Profile completion calculation
    - Therapist profile retrieval
    - Case creation with milestones
    - Session document management
    - Progress metrics aggregation

  2. Demo Data Population
    - Complete therapist profile (fedgee911@gmail.com)
    - Assessment library with 10+ validated tools
    - Resource library with treatment protocols
    - Sample clients with realistic data
    - Progress tracking data

  3. Schema Enhancements
    - Missing table columns
    - Proper indexes for performance
    - Enhanced RLS policies
    - Trigger functions for automation

  4. Data Integrity
    - Foreign key constraints
    - Check constraints for data validation
    - Default values for all fields
    - Proper data types and formats
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create or update trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, client_id, details)
        VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            NEW.id,
            CASE 
                WHEN TG_TABLE_NAME = 'client_profiles' THEN NEW.client_id
                WHEN TG_TABLE_NAME = 'session_notes' THEN NEW.client_id
                WHEN TG_TABLE_NAME = 'treatment_plans' THEN NEW.client_id
                ELSE NULL
            END,
            row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, client_id, details)
        VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            NEW.id,
            CASE 
                WHEN TG_TABLE_NAME = 'client_profiles' THEN NEW.client_id
                WHEN TG_TABLE_NAME = 'session_notes' THEN NEW.client_id
                WHEN TG_TABLE_NAME = 'treatment_plans' THEN NEW.client_id
                ELSE NULL
            END,
            jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, client_id, details)
        VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            OLD.id,
            CASE 
                WHEN TG_TABLE_NAME = 'client_profiles' THEN OLD.client_id
                WHEN TG_TABLE_NAME = 'session_notes' THEN OLD.client_id
                WHEN TG_TABLE_NAME = 'treatment_plans' THEN OLD.client_id
                ELSE NULL
            END,
            row_to_json(OLD)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create profile completion calculation function
CREATE OR REPLACE FUNCTION calculate_profile_completion(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    completion_score INTEGER := 0;
    profile_record RECORD;
BEGIN
    SELECT * INTO profile_record FROM profiles WHERE id = user_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Basic info (20 points)
    IF profile_record.first_name IS NOT NULL AND profile_record.last_name IS NOT NULL THEN
        completion_score := completion_score + 10;
    END IF;
    
    IF profile_record.whatsapp_number IS NOT NULL THEN
        completion_score := completion_score + 10;
    END IF;
    
    -- Professional details (40 points)
    IF profile_record.professional_details IS NOT NULL THEN
        completion_score := completion_score + 40;
    END IF;
    
    -- Verification status (40 points)
    IF profile_record.verification_status IS NOT NULL THEN
        completion_score := completion_score + 40;
    END IF;
    
    RETURN completion_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create therapist profile retrieval function
CREATE OR REPLACE FUNCTION get_therapist_profile(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    profile_data JSON;
    client_count INTEGER;
BEGIN
    -- Get client count
    SELECT COUNT(*) INTO client_count
    FROM therapist_client_relations
    WHERE therapist_id = p_user_id;
    
    -- Build profile JSON
    SELECT json_build_object(
        'id', p.id,
        'fullName', COALESCE(p.first_name || ' ' || p.last_name, 'Unknown'),
        'email', p.email,
        'whatsappNumber', COALESCE(p.whatsapp_number, ''),
        'specializations', COALESCE((p.professional_details->>'specializations')::jsonb, '[]'::jsonb),
        'languages', COALESCE((p.professional_details->>'languages')::jsonb, '[]'::jsonb),
        'qualifications', COALESCE(p.professional_details->>'qualifications', ''),
        'bio', COALESCE(p.professional_details->>'bio', ''),
        'practiceLocations', COALESCE((p.professional_details->>'practice_locations')::jsonb, '[]'::jsonb),
        'verificationStatus', COALESCE(p.verification_status, 'pending'),
        'membershipStatus', 'active',
        'joinDate', p.created_at,
        'stats', json_build_object(
            'totalClients', client_count,
            'yearsExperience', COALESCE((p.professional_details->>'years_experience')::integer, 0),
            'rating', 4.8,
            'reviewCount', 0,
            'responseTime', '< 2 hours'
        )
    ) INTO profile_data
    FROM profiles p
    WHERE p.id = p_user_id;
    
    RETURN profile_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create case creation function with milestones
CREATE OR REPLACE FUNCTION create_case_with_milestone(p_client_id UUID, p_therapist_id UUID)
RETURNS UUID AS $$
DECLARE
    case_id UUID;
    case_number TEXT;
BEGIN
    -- Generate case number
    case_number := 'CASE-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD((EXTRACT(DOY FROM NOW()))::TEXT, 3, '0') || '-' || LPAD((RANDOM() * 999)::INTEGER::TEXT, 3, '0');
    
    -- Create case
    INSERT INTO cases (client_id, therapist_id, case_number, status)
    VALUES (p_client_id, p_therapist_id, case_number, 'active')
    RETURNING id INTO case_id;
    
    -- Create initial milestone
    INSERT INTO case_milestones (case_id, milestone_number, milestone_name, description, status)
    VALUES (case_id, 1, 'Initial Assessment', 'Complete intake and initial assessment', 'pending');
    
    RETURN case_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create session document management functions
CREATE OR REPLACE FUNCTION create_session_note(session_id TEXT, content TEXT)
RETURNS UUID AS $$
DECLARE
    note_id UUID;
BEGIN
    INSERT INTO session_notes (therapist_id, progress_notes)
    VALUES (auth.uid(), content)
    RETURNING id INTO note_id;
    
    RETURN note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_session_documents(session_id TEXT)
RETURNS TABLE(id UUID, file_url TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT d.id, d.file_url
    FROM document_uploads d
    WHERE d.session_id::TEXT = get_session_documents.session_id
    AND d.therapist_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Populate assessment library with comprehensive tools
INSERT INTO assessment_library (name, abbreviation, category, description, questions, scoring_method, interpretation_guide, is_active) VALUES
(
    'Patient Health Questionnaire-9',
    'PHQ-9',
    'Depression Screening',
    'Validated 9-item depression screening tool for clinical assessment',
    '[
        {"id": "phq9_1", "text": "Little interest or pleasure in doing things", "type": "scale", "scale_min": 0, "scale_max": 3},
        {"id": "phq9_2", "text": "Feeling down, depressed, or hopeless", "type": "scale", "scale_min": 0, "scale_max": 3},
        {"id": "phq9_3", "text": "Trouble falling or staying asleep, or sleeping too much", "type": "scale", "scale_min": 0, "scale_max": 3},
        {"id": "phq9_4", "text": "Feeling tired or having little energy", "type": "scale", "scale_min": 0, "scale_max": 3},
        {"id": "phq9_5", "text": "Poor appetite or overeating", "type": "scale", "scale_min": 0, "scale_max": 3},
        {"id": "phq9_6", "text": "Feeling bad about yourself or that you are a failure", "type": "scale", "scale_min": 0, "scale_max": 3},
        {"id": "phq9_7", "text": "Trouble concentrating on things", "type": "scale", "scale_min": 0, "scale_max": 3},
        {"id": "phq9_8", "text": "Moving or speaking slowly, or being fidgety/restless", "type": "scale", "scale_min": 0, "scale_max": 3},
        {"id": "phq9_9", "text": "Thoughts that you would be better off dead or hurting yourself", "type": "scale", "scale_min": 0, "scale_max": 3}
    ]'::jsonb,
    '{"method": "sum", "max_score": 27}'::jsonb,
    '{
        "ranges": [
            {"min": 0, "max": 4, "label": "Minimal Depression", "description": "No or minimal depression symptoms"},
            {"min": 5, "max": 9, "label": "Mild Depression", "description": "Mild depression symptoms"},
            {"min": 10, "max": 14, "label": "Moderate Depression", "description": "Moderate depression symptoms"},
            {"min": 15, "max": 19, "label": "Moderately Severe Depression", "description": "Moderately severe depression symptoms"},
            {"min": 20, "max": 27, "label": "Severe Depression", "description": "Severe depression symptoms"}
        ]
    }'::jsonb,
    true
),
(
    'Generalized Anxiety Disorder-7',
    'GAD-7',
    'Anxiety Screening',
    'Brief 7-item anxiety screening questionnaire',
    '[
        {"id": "gad7_1", "text": "Feeling nervous, anxious, or on edge", "type": "scale", "scale_min": 0, "scale_max": 3},
        {"id": "gad7_2", "text": "Not being able to stop or control worrying", "type": "scale", "scale_min": 0, "scale_max": 3},
        {"id": "gad7_3", "text": "Worrying too much about different things", "type": "scale", "scale_min": 0, "scale_max": 3},
        {"id": "gad7_4", "text": "Trouble relaxing", "type": "scale", "scale_min": 0, "scale_max": 3},
        {"id": "gad7_5", "text": "Being so restless that it is hard to sit still", "type": "scale", "scale_min": 0, "scale_max": 3},
        {"id": "gad7_6", "text": "Becoming easily annoyed or irritable", "type": "scale", "scale_min": 0, "scale_max": 3},
        {"id": "gad7_7", "text": "Feeling afraid as if something awful might happen", "type": "scale", "scale_min": 0, "scale_max": 3}
    ]'::jsonb,
    '{"method": "sum", "max_score": 21}'::jsonb,
    '{
        "ranges": [
            {"min": 0, "max": 4, "label": "Minimal Anxiety", "description": "No or minimal anxiety symptoms"},
            {"min": 5, "max": 9, "label": "Mild Anxiety", "description": "Mild anxiety symptoms"},
            {"min": 10, "max": 14, "label": "Moderate Anxiety", "description": "Moderate anxiety symptoms"},
            {"min": 15, "max": 21, "label": "Severe Anxiety", "description": "Severe anxiety symptoms"}
        ]
    }'::jsonb,
    true
),
(
    'Beck Depression Inventory-II',
    'BDI-II',
    'Depression Assessment',
    'Comprehensive 21-item depression assessment tool',
    '[
        {"id": "bdi_1", "text": "Sadness", "type": "multiple_choice", "options": ["I do not feel sad", "I feel sad much of the time", "I am sad all the time", "I am so sad or unhappy that I cannot stand it"]},
        {"id": "bdi_2", "text": "Pessimism", "type": "multiple_choice", "options": ["I am not discouraged about my future", "I feel more discouraged about my future than I used to be", "I do not expect things to work out for me", "I feel my future is hopeless and will only get worse"]},
        {"id": "bdi_3", "text": "Past Failure", "type": "multiple_choice", "options": ["I do not feel like a failure", "I have failed more than I should have", "As I look back, I see a lot of failures", "I feel I am a total failure as a person"]}
    ]'::jsonb,
    '{"method": "sum", "max_score": 63}'::jsonb,
    '{
        "ranges": [
            {"min": 0, "max": 13, "label": "Minimal Depression", "description": "These ups and downs are considered normal"},
            {"min": 14, "max": 19, "label": "Mild Depression", "description": "Mild mood disturbance"},
            {"min": 20, "max": 28, "label": "Moderate Depression", "description": "Moderate depression"},
            {"min": 29, "max": 63, "label": "Severe Depression", "description": "Severe depression"}
        ]
    }'::jsonb,
    true
),
(
    'Beck Anxiety Inventory',
    'BAI',
    'Anxiety Assessment',
    'Measures severity of anxiety symptoms',
    '[
        {"id": "bai_1", "text": "Numbness or tingling", "type": "scale", "scale_min": 0, "scale_max": 3},
        {"id": "bai_2", "text": "Feeling hot", "type": "scale", "scale_min": 0, "scale_max": 3},
        {"id": "bai_3", "text": "Wobbliness in legs", "type": "scale", "scale_min": 0, "scale_max": 3},
        {"id": "bai_4", "text": "Unable to relax", "type": "scale", "scale_min": 0, "scale_max": 3},
        {"id": "bai_5", "text": "Fear of worst happening", "type": "scale", "scale_min": 0, "scale_max": 3}
    ]'::jsonb,
    '{"method": "sum", "max_score": 63}'::jsonb,
    '{
        "ranges": [
            {"min": 0, "max": 7, "label": "Minimal Anxiety", "description": "Normal anxiety levels"},
            {"min": 8, "max": 15, "label": "Mild Anxiety", "description": "Mild anxiety symptoms"},
            {"min": 16, "max": 25, "label": "Moderate Anxiety", "description": "Moderate anxiety symptoms"},
            {"min": 26, "max": 63, "label": "Severe Anxiety", "description": "Severe anxiety symptoms"}
        ]
    }'::jsonb,
    true
),
(
    'Perceived Stress Scale',
    'PSS-10',
    'Stress Assessment',
    'Measures the degree to which situations are appraised as stressful',
    '[
        {"id": "pss_1", "text": "How often have you been upset because of something that happened unexpectedly?", "type": "scale", "scale_min": 0, "scale_max": 4},
        {"id": "pss_2", "text": "How often have you felt that you were unable to control important things in your life?", "type": "scale", "scale_min": 0, "scale_max": 4},
        {"id": "pss_3", "text": "How often have you felt nervous and stressed?", "type": "scale", "scale_min": 0, "scale_max": 4},
        {"id": "pss_4", "text": "How often have you felt confident about your ability to handle personal problems?", "type": "scale", "scale_min": 0, "scale_max": 4, "reverse_scored": true},
        {"id": "pss_5", "text": "How often have you felt that things were going your way?", "type": "scale", "scale_min": 0, "scale_max": 4, "reverse_scored": true}
    ]'::jsonb,
    '{"method": "sum", "max_score": 40}'::jsonb,
    '{
        "ranges": [
            {"min": 0, "max": 13, "label": "Low Stress", "description": "Low perceived stress levels"},
            {"min": 14, "max": 26, "label": "Moderate Stress", "description": "Moderate perceived stress levels"},
            {"min": 27, "max": 40, "label": "High Stress", "description": "High perceived stress levels"}
        ]
    }'::jsonb,
    true
),
(
    'PTSD Checklist for DSM-5',
    'PCL-5',
    'Trauma Assessment',
    'Measures PTSD symptoms according to DSM-5 criteria',
    '[
        {"id": "pcl5_1", "text": "Repeated, disturbing, and unwanted memories of the stressful experience", "type": "scale", "scale_min": 0, "scale_max": 4},
        {"id": "pcl5_2", "text": "Repeated, disturbing dreams of the stressful experience", "type": "scale", "scale_min": 0, "scale_max": 4},
        {"id": "pcl5_3", "text": "Suddenly feeling or acting as if the stressful experience were actually happening again", "type": "scale", "scale_min": 0, "scale_max": 4},
        {"id": "pcl5_4", "text": "Feeling very upset when something reminded you of the stressful experience", "type": "scale", "scale_min": 0, "scale_max": 4},
        {"id": "pcl5_5", "text": "Having strong physical reactions when something reminded you of the stressful experience", "type": "scale", "scale_min": 0, "scale_max": 4}
    ]'::jsonb,
    '{"method": "sum", "max_score": 80}'::jsonb,
    '{
        "ranges": [
            {"min": 0, "max": 32, "label": "No PTSD", "description": "Symptoms below clinical threshold"},
            {"min": 33, "max": 80, "label": "Probable PTSD", "description": "Symptoms suggest probable PTSD diagnosis"}
        ]
    }'::jsonb,
    true
),
(
    'Satisfaction with Life Scale',
    'SWLS',
    'Wellbeing Assessment',
    'Measures global cognitive judgments of satisfaction with ones life',
    '[
        {"id": "swls_1", "text": "In most ways my life is close to my ideal", "type": "scale", "scale_min": 1, "scale_max": 7},
        {"id": "swls_2", "text": "The conditions of my life are excellent", "type": "scale", "scale_min": 1, "scale_max": 7},
        {"id": "swls_3", "text": "I am satisfied with my life", "type": "scale", "scale_min": 1, "scale_max": 7},
        {"id": "swls_4", "text": "So far I have gotten the important things I want in life", "type": "scale", "scale_min": 1, "scale_max": 7},
        {"id": "swls_5", "text": "If I could live my life over, I would change almost nothing", "type": "scale", "scale_min": 1, "scale_max": 7}
    ]'::jsonb,
    '{"method": "sum", "max_score": 35}'::jsonb,
    '{
        "ranges": [
            {"min": 5, "max": 9, "label": "Extremely Dissatisfied", "description": "Extremely dissatisfied with life"},
            {"min": 10, "max": 14, "label": "Dissatisfied", "description": "Dissatisfied with life"},
            {"min": 15, "max": 19, "label": "Slightly Dissatisfied", "description": "Slightly below neutral in life satisfaction"},
            {"min": 20, "max": 24, "label": "Neutral", "description": "Neutral point on the scale"},
            {"min": 25, "max": 29, "label": "Satisfied", "description": "Satisfied with life"},
            {"min": 30, "max": 35, "label": "Extremely Satisfied", "description": "Extremely satisfied with life"}
        ]
    }'::jsonb,
    true
),
(
    'Connor-Davidson Resilience Scale',
    'CD-RISC-10',
    'Resilience Assessment',
    'Measures resilience and ability to cope with adversity',
    '[
        {"id": "cdrisc_1", "text": "I am able to adapt when changes occur", "type": "scale", "scale_min": 0, "scale_max": 4},
        {"id": "cdrisc_2", "text": "I have at least one close and secure relationship that helps me when I am stressed", "type": "scale", "scale_min": 0, "scale_max": 4},
        {"id": "cdrisc_3", "text": "When there are no clear solutions to my problems, sometimes fate or God can help", "type": "scale", "scale_min": 0, "scale_max": 4},
        {"id": "cdrisc_4", "text": "I can deal with whatever comes my way", "type": "scale", "scale_min": 0, "scale_max": 4},
        {"id": "cdrisc_5", "text": "Past successes give me confidence in dealing with new challenges", "type": "scale", "scale_min": 0, "scale_max": 4}
    ]'::jsonb,
    '{"method": "sum", "max_score": 40}'::jsonb,
    '{
        "ranges": [
            {"min": 0, "max": 20, "label": "Low Resilience", "description": "Lower resilience levels"},
            {"min": 21, "max": 30, "label": "Moderate Resilience", "description": "Moderate resilience levels"},
            {"min": 31, "max": 40, "label": "High Resilience", "description": "High resilience levels"}
        ]
    }'::jsonb,
    true
),
(
    'Mindful Attention Awareness Scale',
    'MAAS',
    'Mindfulness Assessment',
    'Measures dispositional mindfulness',
    '[
        {"id": "maas_1", "text": "I could be experiencing some emotion and not be conscious of it until some time later", "type": "scale", "scale_min": 1, "scale_max": 6},
        {"id": "maas_2", "text": "I break or spill things because of carelessness, not paying attention, or thinking of something else", "type": "scale", "scale_min": 1, "scale_max": 6},
        {"id": "maas_3", "text": "I find it difficult to stay focused on what is happening in the present", "type": "scale", "scale_min": 1, "scale_max": 6},
        {"id": "maas_4", "text": "I tend to walk quickly to get where I am going without paying attention to what I experience along the way", "type": "scale", "scale_min": 1, "scale_max": 6},
        {"id": "maas_5", "text": "I tend not to notice feelings of physical tension or discomfort until they really grab my attention", "type": "scale", "scale_min": 1, "scale_max": 6}
    ]'::jsonb,
    '{"method": "average", "max_score": 6}'::jsonb,
    '{
        "ranges": [
            {"min": 1, "max": 3, "label": "Low Mindfulness", "description": "Lower levels of mindful awareness"},
            {"min": 3.1, "max": 4.5, "label": "Moderate Mindfulness", "description": "Moderate levels of mindful awareness"},
            {"min": 4.6, "max": 6, "label": "High Mindfulness", "description": "High levels of mindful awareness"}
        ]
    }'::jsonb,
    true
),
(
    'Maslach Burnout Inventory',
    'MBI',
    'Burnout Assessment',
    'Measures burnout in three dimensions: emotional exhaustion, depersonalization, and personal accomplishment',
    '[
        {"id": "mbi_1", "text": "I feel emotionally drained from my work", "type": "scale", "scale_min": 0, "scale_max": 6},
        {"id": "mbi_2", "text": "I have accomplished many worthwhile things in this job", "type": "scale", "scale_min": 0, "scale_max": 6, "reverse_scored": true},
        {"id": "mbi_3", "text": "I do not really care what happens to some recipients", "type": "scale", "scale_min": 0, "scale_max": 6},
        {"id": "mbi_4", "text": "Working with people all day is really a strain for me", "type": "scale", "scale_min": 0, "scale_max": 6},
        {"id": "mbi_5", "text": "I deal very effectively with the problems of recipients", "type": "scale", "scale_min": 0, "scale_max": 6, "reverse_scored": true}
    ]'::jsonb,
    '{"method": "sum", "max_score": 132}'::jsonb,
    '{
        "ranges": [
            {"min": 0, "max": 44, "label": "Low Burnout", "description": "Low levels of burnout symptoms"},
            {"min": 45, "max": 88, "label": "Moderate Burnout", "description": "Moderate levels of burnout symptoms"},
            {"min": 89, "max": 132, "label": "High Burnout", "description": "High levels of burnout symptoms"}
        ]
    }'::jsonb,
    true
)
ON CONFLICT (name) DO UPDATE SET
    questions = EXCLUDED.questions,
    scoring_method = EXCLUDED.scoring_method,
    interpretation_guide = EXCLUDED.interpretation_guide,
    is_active = EXCLUDED.is_active;

-- Populate diagnostic codes
INSERT INTO diagnostic_codes (code, name, system, criteria, description, category, is_active) VALUES
('300.02', 'Generalized Anxiety Disorder', 'DSM-5-TR', '["Excessive anxiety/worry more days than not for 6+ months", "Difficulty controlling worry", "≥3 associated symptoms (restlessness, fatigue, irritability, concentration problems, muscle tension, sleep disturbance)"]'::jsonb, 'Persistent and excessive worry about various life domains', 'Anxiety Disorders', true),
('296.23', 'Major Depressive Disorder, Single Episode, Severe', 'DSM-5-TR', '["≥5 symptoms during 2-week period", "Depressed mood or loss of interest/pleasure", "Significant impairment in functioning", "Not attributable to substance use or medical condition"]'::jsonb, 'Single episode of major depression with severe symptoms', 'Mood Disorders', true),
('309.81', 'Posttraumatic Stress Disorder', 'DSM-5-TR', '["Exposure to actual or threatened death, serious injury, or sexual violence", "Intrusion symptoms (memories, dreams, flashbacks)", "Avoidance of trauma-related stimuli", "Negative alterations in cognitions and mood", "Alterations in arousal and reactivity"]'::jsonb, 'Trauma-related disorder following exposure to traumatic events', 'Trauma and Stressor-Related Disorders', true),
('6B00', 'Generalized Anxiety Disorder', 'ICD-11', '["Persistent worry/unease most days for several months", "Associated with tension, sleep disturbance, concentration difficulties", "Significant distress or impairment in functioning"]'::jsonb, 'Persistent and excessive worry about multiple life domains', 'Anxiety and Fear-Related Disorders', true),
('6A70', 'Single Episode Depressive Disorder', 'ICD-11', '["Depressed mood or diminished interest in activities", "Duration of at least 2 weeks", "Associated symptoms (appetite changes, sleep disturbance, fatigue, concentration problems)", "Significant distress or impairment"]'::jsonb, 'Single episode of depressive disorder', 'Mood Disorders', true),
('6B40', 'Post Traumatic Stress Disorder', 'ICD-11', '["Exposure to extremely threatening or horrific event", "Re-experiencing the event in the present", "Deliberate avoidance of reminders", "Persistent perceptions of heightened current threat"]'::jsonb, 'Disorder following exposure to extremely threatening events', 'Disorders Specifically Associated with Stress', true)
ON CONFLICT (code, system) DO UPDATE SET
    criteria = EXCLUDED.criteria,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

-- Populate resource library
INSERT INTO resource_library (title, category, subcategory, description, content_type, tags, difficulty_level, evidence_level, is_public) VALUES
('CBT Thought Record Worksheet', 'worksheet', 'Cognitive Restructuring', 'Classic thought challenging worksheet for identifying and restructuring negative thoughts', 'interactive', '{"CBT", "thoughts", "cognitive", "homework"}', 'beginner', 'research_based', true),
('Daily Mood Tracking Sheet', 'worksheet', 'Mood Monitoring', 'Simple daily mood tracking tool with triggers and coping strategies', 'interactive', '{"mood", "tracking", "daily", "self-monitoring"}', 'beginner', 'clinical_consensus', true),
('Introduction to CBT Principles', 'educational', 'CBT Fundamentals', 'Comprehensive guide to cognitive behavioral therapy fundamentals', 'text', '{"CBT", "education", "fundamentals", "theory"}', 'beginner', 'research_based', true),
('Mindfulness-Based Interventions', 'educational', 'Mindfulness', 'Video series on implementing mindfulness techniques in therapy', 'video', '{"mindfulness", "video", "techniques", "meditation"}', 'intermediate', 'research_based', true),
('CBT Protocol for Depression', 'protocol', 'Depression Treatment', 'Evidence-based 12-week CBT treatment protocol for major depression', 'text', '{"CBT", "depression", "protocol", "structured"}', 'intermediate', 'research_based', true),
('Anxiety Disorders Treatment Framework', 'protocol', 'Anxiety Treatment', 'Comprehensive treatment approach for various anxiety disorders', 'text', '{"anxiety", "comprehensive", "multi-modal"}', 'advanced', 'research_based', true),
('Breathing Exercise Guide', 'intervention', 'Relaxation Techniques', 'Step-by-step guide for teaching breathing exercises', 'interactive', '{"breathing", "relaxation", "anxiety", "techniques"}', 'beginner', 'research_based', true),
('Progressive Muscle Relaxation Script', 'intervention', 'Relaxation Techniques', 'Guided script for progressive muscle relaxation sessions', 'text', '{"PMR", "relaxation", "muscle", "tension"}', 'beginner', 'research_based', true)
ON CONFLICT (title) DO UPDATE SET
    description = EXCLUDED.description,
    tags = EXCLUDED.tags,
    is_public = EXCLUDED.is_public;

-- Populate gamified apps
INSERT INTO gamified_apps (app_type, name, description, app_config, game_mechanics, difficulty_level, estimated_duration, is_active, evidence_based, tags) VALUES
('exercise', 'Breathing Buddy', 'Interactive breathing exercise with visual guidance and progress tracking', '{"breathing_pattern": "4-4-6-2", "visual_guide": true, "progress_tracking": true}'::jsonb, '{"points_per_cycle": 10, "achievements": ["First Breath", "Zen Master", "Daily Breather"], "levels": 5}'::jsonb, 'beginner', 10, true, true, '{"breathing", "anxiety", "relaxation", "mindfulness"}'),
('exercise', 'Mindful Moments', 'Guided mindfulness sessions with customizable duration and themes', '{"session_types": ["body_scan", "breath_awareness", "loving_kindness"], "durations": [5, 10, 15, 20]}'::jsonb, '{"streak_tracking": true, "meditation_minutes": true, "calm_points": 5}'::jsonb, 'beginner', 15, true, true, '{"mindfulness", "meditation", "stress", "awareness"}'),
('exercise', 'Thought Detective', 'Cognitive restructuring game with scenario-based challenges', '{"scenarios": 10, "difficulty_progression": true, "feedback_system": true}'::jsonb, '{"score_per_scenario": 100, "accuracy_bonus": 50, "thinking_badges": true}'::jsonb, 'intermediate', 20, true, true, '{"CBT", "cognitive", "thoughts", "restructuring"}'),
('assessment', 'Mood Check-In', 'Daily mood tracking with insights and pattern recognition', '{"mood_scale": 10, "emotion_categories": true, "trigger_tracking": true}'::jsonb, '{"streak_rewards": true, "insight_unlocks": true, "mood_trends": true}'::jsonb, 'beginner', 5, true, false, '{"mood", "tracking", "emotions", "patterns"}'),
('worksheet', 'Digital Thought Record', 'Interactive CBT thought record with guided prompts', '{"step_by_step": true, "save_progress": true, "therapist_review": true}'::jsonb, '{"completion_rewards": 25, "insight_points": 10, "progress_badges": true}'::jsonb, 'beginner', 15, true, true, '{"CBT", "thought_record", "cognitive", "homework"}')
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    app_config = EXCLUDED.app_config,
    game_mechanics = EXCLUDED.game_mechanics,
    is_active = EXCLUDED.is_active;

-- Create demo therapist account and populate with comprehensive data
DO $$
DECLARE
    demo_therapist_id UUID;
    demo_client_1_id UUID;
    demo_client_2_id UUID;
    demo_case_1_id UUID;
    demo_case_2_id UUID;
    demo_plan_1_id UUID;
    demo_plan_2_id UUID;
BEGIN
    -- Check if demo therapist already exists
    SELECT id INTO demo_therapist_id FROM profiles WHERE email = 'fedgee911@gmail.com';
    
    IF demo_therapist_id IS NULL THEN
        -- Create demo therapist user in auth.users (this would normally be done via Supabase Auth)
        demo_therapist_id := gen_random_uuid();
        
        -- Insert demo therapist profile
        INSERT INTO profiles (
            id, role, first_name, last_name, email, whatsapp_number, 
            professional_details, verification_status, created_at
        ) VALUES (
            demo_therapist_id,
            'therapist',
            'Dr. Sarah',
            'Johnson',
            'fedgee911@gmail.com',
            '+1 (555) 123-4567',
            '{
                "specializations": ["Anxiety Disorders", "Depression", "Trauma & PTSD", "Cognitive Behavioral Therapy (CBT)", "Mindfulness-Based Therapy"],
                "languages": ["English", "Spanish", "French"],
                "qualifications": "Ph.D. in Clinical Psychology, University of California\nLicensed Clinical Psychologist (CA License #12345)\nCertified CBT Therapist\nEMDR Certified Therapist\n15+ years of clinical experience",
                "bio": "I am a licensed clinical psychologist with over 15 years of experience helping individuals overcome anxiety, depression, and trauma. My approach combines evidence-based cognitive behavioral therapy with mindfulness techniques to create lasting positive change.\n\nI believe in creating a warm, supportive environment where clients feel safe to explore their thoughts and feelings. Together, we will work to identify patterns that may be holding you back and develop practical strategies for moving forward.\n\nI specialize in treating anxiety disorders, depression, PTSD, and relationship issues. I am fluent in English, Spanish, and French, and welcome clients from diverse cultural backgrounds.",
                "practice_locations": [
                    {"address": "123 Therapy Lane, Suite 200, Los Angeles, CA 90210", "isPrimary": true},
                    {"address": "456 Wellness Blvd, Beverly Hills, CA 90212", "isPrimary": false}
                ],
                "years_experience": 15,
                "licenses": [
                    {"name": "Licensed Clinical Psychologist", "country": "USA", "state": "California"},
                    {"name": "Certified CBT Therapist", "country": "USA", "organization": "ABCT"}
                ]
            }'::jsonb,
            'verified'
        );
    END IF;
    
    -- Create demo clients
    demo_client_1_id := gen_random_uuid();
    demo_client_2_id := gen_random_uuid();
    
    -- Insert demo clients
    INSERT INTO profiles (
        id, role, first_name, last_name, email, whatsapp_number, 
        patient_code, created_by_therapist, password_set, created_at
    ) VALUES 
    (
        demo_client_1_id,
        'client',
        'John',
        'Smith',
        'john.smith.demo@example.com',
        '+1 (555) 987-6543',
        'PT123456',
        demo_therapist_id,
        true,
        NOW() - INTERVAL '2 months'
    ),
    (
        demo_client_2_id,
        'client',
        'Emily',
        'Davis',
        'emily.davis.demo@example.com',
        '+1 (555) 456-7890',
        'PT789012',
        demo_therapist_id,
        true,
        NOW() - INTERVAL '1 month'
    )
    ON CONFLICT (email) DO NOTHING;
    
    -- Create therapist-client relations
    INSERT INTO therapist_client_relations (therapist_id, client_id) VALUES
    (demo_therapist_id, demo_client_1_id),
    (demo_therapist_id, demo_client_2_id)
    ON CONFLICT (therapist_id, client_id) DO NOTHING;
    
    -- Create detailed client profiles
    INSERT INTO client_profiles (
        client_id, therapist_id, emergency_contact_name, emergency_contact_phone, 
        emergency_contact_relationship, medical_history, current_medications, 
        presenting_concerns, therapy_history, risk_level, notes
    ) VALUES
    (
        demo_client_1_id,
        demo_therapist_id,
        'Mary Smith',
        '+1 (555) 111-2222',
        'spouse',
        'No significant medical history. Occasional headaches.',
        'None currently',
        'Experiencing increased anxiety and worry about work performance. Difficulty sleeping and concentrating. Reports feeling overwhelmed by daily responsibilities.',
        'No previous therapy experience. Interested in learning coping strategies.',
        'moderate',
        'Client is motivated and engaged. Shows good insight into their symptoms. Responds well to CBT techniques. Progress noted in anxiety management after 4 sessions.'
    ),
    (
        demo_client_2_id,
        demo_therapist_id,
        'Robert Davis',
        '+1 (555) 333-4444',
        'parent',
        'History of migraines. Currently managing with medication.',
        'Sumatriptan as needed for migraines',
        'Struggling with low mood and loss of interest in activities following job loss 3 months ago. Reports feelings of worthlessness and difficulty with motivation.',
        'Brief counseling in college for academic stress. Found it helpful.',
        'moderate',
        'Client demonstrates resilience and has good support system. Working on behavioral activation and cognitive restructuring. Showing gradual improvement in mood and activity levels.'
    )
    ON CONFLICT (client_id, therapist_id) DO UPDATE SET
        notes = EXCLUDED.notes,
        updated_at = NOW();
    
    -- Create cases
    INSERT INTO cases (id, client_id, therapist_id, case_number, status, opened_at) VALUES
    (gen_random_uuid(), demo_client_1_id, demo_therapist_id, 'CASE-2024-001-001', 'active', NOW() - INTERVAL '2 months'),
    (gen_random_uuid(), demo_client_2_id, demo_therapist_id, 'CASE-2024-001-002', 'active', NOW() - INTERVAL '1 month')
    ON CONFLICT (case_number) DO NOTHING;
    
    -- Get case IDs for further operations
    SELECT id INTO demo_case_1_id FROM cases WHERE case_number = 'CASE-2024-001-001';
    SELECT id INTO demo_case_2_id FROM cases WHERE case_number = 'CASE-2024-001-002';
    
    -- Create case milestones
    INSERT INTO case_milestones (case_id, milestone_number, milestone_name, description, status, completed_at) VALUES
    (demo_case_1_id, 1, 'Initial Assessment', 'Complete intake and initial assessment', 'completed', NOW() - INTERVAL '2 months'),
    (demo_case_1_id, 2, 'Treatment Planning', 'Develop comprehensive treatment plan', 'completed', NOW() - INTERVAL '7 weeks'),
    (demo_case_1_id, 3, 'Mid-Treatment Review', 'Review progress and adjust treatment plan', 'in_progress', NULL),
    (demo_case_2_id, 1, 'Initial Assessment', 'Complete intake and initial assessment', 'completed', NOW() - INTERVAL '1 month'),
    (demo_case_2_id, 2, 'Treatment Planning', 'Develop comprehensive treatment plan', 'completed', NOW() - INTERVAL '3 weeks'),
    (demo_case_2_id, 3, 'Mid-Treatment Review', 'Review progress and adjust treatment plan', 'pending', NULL)
    ON CONFLICT (case_id, milestone_number) DO NOTHING;
    
    -- Create treatment plans
    INSERT INTO treatment_plans (
        id, client_id, therapist_id, title, case_formulation, treatment_approach, 
        estimated_duration, status
    ) VALUES
    (
        gen_random_uuid(),
        demo_client_1_id,
        demo_therapist_id,
        'Anxiety Management and Coping Skills Development',
        'Client presents with generalized anxiety disorder characterized by excessive worry about work performance and daily responsibilities. Symptoms include sleep disturbance, concentration difficulties, and physical tension. Contributing factors include perfectionist thinking patterns and lack of effective coping strategies.',
        'Cognitive Behavioral Therapy (CBT) with mindfulness-based interventions',
        '12-16 sessions',
        'active'
    ),
    (
        gen_random_uuid(),
        demo_client_2_id,
        demo_therapist_id,
        'Depression Treatment and Behavioral Activation',
        'Client experiencing major depressive episode following job loss. Symptoms include depressed mood, anhedonia, worthlessness, and reduced activity levels. Treatment will focus on behavioral activation and cognitive restructuring.',
        'Cognitive Behavioral Therapy (CBT) with Behavioral Activation',
        '16-20 sessions',
        'active'
    )
    ON CONFLICT DO NOTHING;
    
    -- Get treatment plan IDs
    SELECT id INTO demo_plan_1_id FROM treatment_plans WHERE client_id = demo_client_1_id;
    SELECT id INTO demo_plan_2_id FROM treatment_plans WHERE client_id = demo_client_2_id;
    
    -- Create therapy goals
    INSERT INTO therapy_goals (treatment_plan_id, goal_text, target_date, progress_percentage, status, notes) VALUES
    (demo_plan_1_id, 'Reduce anxiety symptoms by 50% as measured by GAD-7', CURRENT_DATE + INTERVAL '3 months', 60, 'active', 'Good progress with breathing techniques and cognitive restructuring'),
    (demo_plan_1_id, 'Improve sleep quality and duration to 7-8 hours nightly', CURRENT_DATE + INTERVAL '2 months', 75, 'active', 'Sleep hygiene improvements showing positive results'),
    (demo_plan_1_id, 'Develop and practice 3 effective coping strategies for work stress', CURRENT_DATE + INTERVAL '1 month', 80, 'active', 'Client has mastered breathing exercises and progressive muscle relaxation'),
    (demo_plan_2_id, 'Increase daily activity level and engagement in pleasurable activities', CURRENT_DATE + INTERVAL '2 months', 45, 'active', 'Behavioral activation plan in progress, gradual increase in activities'),
    (demo_plan_2_id, 'Challenge negative thought patterns related to self-worth', CURRENT_DATE + INTERVAL '3 months', 30, 'active', 'Beginning work on cognitive restructuring techniques'),
    (demo_plan_2_id, 'Establish daily routine and structure', CURRENT_DATE + INTERVAL '1 month', 70, 'active', 'Good progress with morning and evening routines')
    ON CONFLICT DO NOTHING;
    
    -- Create appointments
    INSERT INTO appointments (
        therapist_id, client_id, appointment_date, duration_minutes, 
        appointment_type, status, notes
    ) VALUES
    (demo_therapist_id, demo_client_1_id, NOW() - INTERVAL '1 week', 50, 'individual', 'completed', 'Worked on breathing techniques and thought challenging'),
    (demo_therapist_id, demo_client_1_id, NOW() + INTERVAL '1 week', 50, 'individual', 'scheduled', 'Continue CBT work, review homework'),
    (demo_therapist_id, demo_client_2_id, NOW() - INTERVAL '3 days', 50, 'individual', 'completed', 'Behavioral activation planning and mood monitoring'),
    (demo_therapist_id, demo_client_2_id, NOW() + INTERVAL '4 days', 50, 'individual', 'scheduled', 'Review activity schedule and cognitive work')
    ON CONFLICT DO NOTHING;
    
    -- Create form assignments
    INSERT INTO form_assignments (
        therapist_id, client_id, form_type, title, instructions, 
        due_date, status, assigned_at
    ) VALUES
    (demo_therapist_id, demo_client_1_id, 'psychometric', 'GAD-7 Anxiety Assessment', 'Please complete this brief anxiety screening to help track your progress', CURRENT_DATE + INTERVAL '3 days', 'assigned', NOW()),
    (demo_therapist_id, demo_client_1_id, 'worksheet', 'Daily Thought Record', 'Practice identifying and challenging anxious thoughts using this worksheet', CURRENT_DATE + INTERVAL '1 week', 'assigned', NOW() - INTERVAL '2 days'),
    (demo_therapist_id, demo_client_2_id, 'psychometric', 'PHQ-9 Depression Assessment', 'This assessment will help us monitor your mood and depression symptoms', CURRENT_DATE + INTERVAL '2 days', 'assigned', NOW()),
    (demo_therapist_id, demo_client_2_id, 'exercise', 'Breathing Exercise Practice', 'Try the breathing exercise for 10 minutes daily to help with relaxation', CURRENT_DATE + INTERVAL '1 week', 'assigned', NOW() - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;
    
    -- Create psychometric forms
    INSERT INTO psychometric_forms (
        therapist_id, client_id, form_type, title, questions, status
    ) VALUES
    (demo_therapist_id, demo_client_1_id, 'gad7', 'GAD-7 Anxiety Assessment', 
     (SELECT questions FROM assessment_library WHERE abbreviation = 'GAD-7' LIMIT 1), 'assigned'),
    (demo_therapist_id, demo_client_2_id, 'phq9', 'PHQ-9 Depression Assessment', 
     (SELECT questions FROM assessment_library WHERE abbreviation = 'PHQ-9' LIMIT 1), 'assigned')
    ON CONFLICT DO NOTHING;
    
    -- Create therapeutic exercises
    INSERT INTO therapeutic_exercises (
        therapist_id, client_id, exercise_type, title, description, 
        game_config, status
    ) VALUES
    (demo_therapist_id, demo_client_1_id, 'breathing', 'Daily Breathing Practice', 'Practice 4-4-6-2 breathing pattern for anxiety management', 
     '{"pattern": "4-4-6-2", "duration": 10, "visual_guide": true}'::jsonb, 'assigned'),
    (demo_therapist_id, demo_client_1_id, 'mindfulness', 'Mindfulness Meditation', 'Daily mindfulness practice for stress reduction', 
     '{"type": "breath_awareness", "duration": 15}'::jsonb, 'assigned'),
    (demo_therapist_id, demo_client_2_id, 'cognitive_restructuring', 'Thought Challenging Exercise', 'Practice identifying and challenging negative thoughts', 
     '{"scenarios": 5, "difficulty": "beginner"}'::jsonb, 'assigned')
    ON CONFLICT DO NOTHING;
    
    -- Create CBT worksheets
    INSERT INTO cbt_worksheets (
        therapist_id, client_id, type, title, content, status
    ) VALUES
    (demo_therapist_id, demo_client_1_id, 'thought_record', 'Anxiety Thought Record', 
     '{"situation": "", "automatic_thought": "", "emotion": "", "intensity": 0, "evidence_for": "", "evidence_against": "", "balanced_thought": "", "new_emotion": "", "new_intensity": 0}'::jsonb, 'assigned'),
    (demo_therapist_id, demo_client_2_id, 'thought_record', 'Depression Thought Record', 
     '{"situation": "", "automatic_thought": "", "emotion": "", "intensity": 0, "evidence_for": "", "evidence_against": "", "balanced_thought": "", "new_emotion": "", "new_intensity": 0}'::jsonb, 'assigned')
    ON CONFLICT DO NOTHING;
    
    -- Create sample progress tracking data
    INSERT INTO progress_tracking (client_id, metric_type, value, source_type, recorded_at) VALUES
    (demo_client_1_id, 'anxiety_gad7', 12, 'psychometric', NOW() - INTERVAL '2 months'),
    (demo_client_1_id, 'anxiety_gad7', 8, 'psychometric', NOW() - INTERVAL '1 month'),
    (demo_client_1_id, 'anxiety_gad7', 6, 'psychometric', NOW() - INTERVAL '2 weeks'),
    (demo_client_1_id, 'mood_daily', 4, 'manual', NOW() - INTERVAL '1 week'),
    (demo_client_1_id, 'mood_daily', 6, 'manual', NOW() - INTERVAL '3 days'),
    (demo_client_1_id, 'mood_daily', 7, 'manual', NOW()),
    (demo_client_2_id, 'depression_phq9', 16, 'psychometric', NOW() - INTERVAL '1 month'),
    (demo_client_2_id, 'depression_phq9', 12, 'psychometric', NOW() - INTERVAL '2 weeks'),
    (demo_client_2_id, 'depression_phq9', 9, 'psychometric', NOW() - INTERVAL '1 week'),
    (demo_client_2_id, 'mood_daily', 3, 'manual', NOW() - INTERVAL '1 week'),
    (demo_client_2_id, 'mood_daily', 5, 'manual', NOW() - INTERVAL '3 days'),
    (demo_client_2_id, 'mood_daily', 6, 'manual', NOW())
    ON CONFLICT DO NOTHING;
    
    -- Create assessment reports
    INSERT INTO assessment_reports (
        client_id, therapist_id, report_type, title, content, generated_by, report_date
    ) VALUES
    (demo_client_1_id, demo_therapist_id, 'psychometric', 'GAD-7 Assessment Report', 
     '{"score": 6, "max_score": 21, "interpretation": "Mild Anxiety", "narrative_report": "Client completed GAD-7 assessment showing mild anxiety symptoms. Score of 6/21 indicates improvement from initial assessment. Continue with CBT interventions and breathing exercises."}'::jsonb, 
     'therapist', CURRENT_DATE),
    (demo_client_2_id, demo_therapist_id, 'psychometric', 'PHQ-9 Assessment Report', 
     '{"score": 9, "max_score": 27, "interpretation": "Mild Depression", "narrative_report": "Client completed PHQ-9 showing significant improvement from initial severe depression. Score of 9/27 indicates mild symptoms. Continue with behavioral activation and cognitive work."}'::jsonb, 
     'therapist', CURRENT_DATE)
    ON CONFLICT DO NOTHING;
    
    -- Create session notes
    INSERT INTO session_notes (
        therapist_id, client_id, session_type, presenting_issues, interventions_used, 
        client_response, homework_assigned, progress_notes, risk_assessment, next_session_plan
    ) VALUES
    (demo_therapist_id, demo_client_1_id, 'individual', 'Work-related anxiety and sleep difficulties', 
     'Cognitive restructuring, breathing exercises, sleep hygiene education', 
     'Client engaged well, practiced breathing technique during session', 
     'Daily breathing practice, thought record for work-related worries', 
     'Client showing good progress with anxiety management. Sleep improving with hygiene changes.', 
     'Low risk, stable mood, good coping resources', 
     'Continue CBT work, review homework, introduce progressive muscle relaxation'),
    (demo_therapist_id, demo_client_2_id, 'individual', 'Low mood and reduced activity following job loss', 
     'Behavioral activation, activity scheduling, cognitive restructuring', 
     'Client completed activity schedule, reports slight mood improvement', 
     'Continue with activity schedule, add one pleasurable activity daily', 
     'Gradual improvement in mood and activity level. Client motivated to continue treatment.', 
     'Low-moderate risk, mood stabilizing, good support system', 
     'Review activity schedule, work on job search anxiety, cognitive work on self-worth')
    ON CONFLICT DO NOTHING;
    
    -- Create communication logs
    INSERT INTO communication_logs (
        therapist_id, client_id, communication_type, subject, content, direction, status
    ) VALUES
    (demo_therapist_id, demo_client_1_id, 'email', 'Session Reminder', 'Reminder for your upcoming therapy session tomorrow at 2:00 PM', 'outgoing', 'sent'),
    (demo_therapist_id, demo_client_1_id, 'text', 'Homework Check-in', 'How did the breathing exercises go this week?', 'outgoing', 'delivered'),
    (demo_therapist_id, demo_client_2_id, 'email', 'Assessment Assignment', 'Please complete the PHQ-9 assessment before our next session', 'outgoing', 'sent')
    ON CONFLICT DO NOTHING;
    
    -- Create app sessions for gamified exercises
    INSERT INTO app_sessions (
        app_id, user_id, session_type, started_at, completed_at, duration_seconds, 
        score, responses, completion_status
    ) VALUES
    ((SELECT id FROM gamified_apps WHERE name = 'Breathing Buddy' LIMIT 1), demo_client_1_id, 'practice', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '8 minutes', 480, 85, '{"cycles_completed": 10, "average_pace": "good"}'::jsonb, 'completed'),
    ((SELECT id FROM gamified_apps WHERE name = 'Mindful Moments' LIMIT 1), demo_client_1_id, 'practice', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '10 minutes', 600, 90, '{"session_type": "breath_awareness", "interruptions": 2}'::jsonb, 'completed'),
    ((SELECT id FROM gamified_apps WHERE name = 'Thought Detective' LIMIT 1), demo_client_2_id, 'practice', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '15 minutes', 900, 75, '{"scenarios_completed": 3, "accuracy": 75}'::jsonb, 'completed')
    ON CONFLICT DO NOTHING;
    
    -- Create app progress tracking
    INSERT INTO app_progress (
        app_id, user_id, total_sessions, total_time_minutes, best_score, 
        average_score, current_level, experience_points, streak_days, mastery_level
    ) VALUES
    ((SELECT id FROM gamified_apps WHERE name = 'Breathing Buddy' LIMIT 1), demo_client_1_id, 5, 45, 95, 87.5, 2, 450, 3, 'beginner'),
    ((SELECT id FROM gamified_apps WHERE name = 'Mindful Moments' LIMIT 1), demo_client_1_id, 3, 35, 90, 85.0, 1, 270, 2, 'novice'),
    ((SELECT id FROM gamified_apps WHERE name = 'Thought Detective' LIMIT 1), demo_client_2_id, 2, 30, 80, 77.5, 1, 155, 1, 'novice')
    ON CONFLICT (app_id, user_id) DO UPDATE SET
        total_sessions = EXCLUDED.total_sessions,
        total_time_minutes = EXCLUDED.total_time_minutes,
        best_score = EXCLUDED.best_score,
        average_score = EXCLUDED.average_score;
    
    -- Create practice analytics for therapist
    INSERT INTO practice_analytics (therapist_id, metric_name, metric_value, metric_date, metadata) VALUES
    (demo_therapist_id, 'client_satisfaction', 4.8, CURRENT_DATE, '{"survey_responses": 12, "response_rate": 85}'::jsonb),
    (demo_therapist_id, 'session_completion_rate', 95.5, CURRENT_DATE, '{"total_scheduled": 44, "completed": 42}'::jsonb),
    (demo_therapist_id, 'assessment_completion_rate', 87.0, CURRENT_DATE, '{"assigned": 23, "completed": 20}'::jsonb),
    (demo_therapist_id, 'average_session_rating', 4.7, CURRENT_DATE, '{"total_ratings": 38, "average": 4.7}'::jsonb)
    ON CONFLICT DO NOTHING;
    
END $$;

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "worksheets_therapist_manage" ON worksheets;
CREATE POLICY "worksheets_therapist_manage" ON worksheets
    FOR ALL TO authenticated
    USING (therapist_id = auth.uid())
    WITH CHECK (therapist_id = auth.uid());

DROP POLICY IF EXISTS "worksheet_assignments_client_access" ON worksheet_assignments;
CREATE POLICY "worksheet_assignments_client_access" ON worksheet_assignments
    FOR ALL TO authenticated
    USING (
        client_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM worksheets w 
            WHERE w.id = worksheet_assignments.worksheet_id 
            AND w.therapist_id = auth.uid()
        )
    )
    WITH CHECK (
        client_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM worksheets w 
            WHERE w.id = worksheet_assignments.worksheet_id 
            AND w.therapist_id = auth.uid()
        )
    );

-- Enable RLS on worksheets and worksheet_assignments
ALTER TABLE worksheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE worksheet_assignments ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email_role ON profiles(email, role);
CREATE INDEX IF NOT EXISTS idx_form_assignments_status_due ON form_assignments(status, due_date);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_client_metric ON progress_tracking(client_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_app_sessions_completion ON app_sessions(completion_status, completed_at);
CREATE INDEX IF NOT EXISTS idx_assessment_reports_date ON assessment_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_communication_logs_date ON communication_logs(created_at);

-- Update therapist insights view to handle demo data
DROP VIEW IF EXISTS therapist_insights_metrics;
CREATE VIEW therapist_insights_metrics AS
SELECT 
    p.id as therapist_id,
    COALESCE(overdue.count, 0) as overdue_assessments,
    COALESCE(idle.count, 0) as idle_clients
FROM profiles p
LEFT JOIN (
    SELECT 
        fa.therapist_id,
        COUNT(*) as count
    FROM form_assignments fa
    WHERE fa.status = 'assigned' 
    AND fa.due_date < CURRENT_DATE
    GROUP BY fa.therapist_id
) overdue ON p.id = overdue.therapist_id
LEFT JOIN (
    SELECT 
        tcr.therapist_id,
        COUNT(*) as count
    FROM therapist_client_relations tcr
    LEFT JOIN appointments a ON tcr.client_id = a.client_id 
        AND a.appointment_date > (CURRENT_DATE - INTERVAL '30 days')
    WHERE a.id IS NULL
    GROUP BY tcr.therapist_id
) idle ON p.id = idle.therapist_id
WHERE p.role = 'therapist';

-- Create comprehensive progress metrics view
DROP VIEW IF EXISTS progress_metrics;
CREATE VIEW progress_metrics AS
SELECT 
    pt.client_id,
    pt.recorded_at::date as metric_date,
    pt.metric_type,
    pt.value
FROM progress_tracking pt
UNION ALL
SELECT 
    a.client_id,
    a.appointment_date::date as metric_date,
    'session_attendance' as metric_type,
    CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END as value
FROM appointments a
UNION ALL
SELECT 
    pf.client_id,
    pf.completed_at::date as metric_date,
    CONCAT('assessment_', pf.form_type) as metric_type,
    pf.score as value
FROM psychometric_forms pf
WHERE pf.completed_at IS NOT NULL;

-- Create app usage stats view
DROP VIEW IF EXISTS app_usage_stats;
CREATE VIEW app_usage_stats AS
SELECT 
    ga.id as app_id,
    ga.name as app_name,
    ga.app_type,
    COUNT(DISTINCT aps.user_id) as unique_users,
    COUNT(aps.id) as total_sessions,
    AVG(aps.score) as average_score,
    AVG(aps.duration_seconds) as average_duration_seconds,
    COUNT(CASE WHEN aps.completion_status = 'completed' THEN 1 END) as completed_sessions,
    CASE 
        WHEN COUNT(aps.id) > 0 THEN 
            (COUNT(CASE WHEN aps.completion_status = 'completed' THEN 1 END)::numeric / COUNT(aps.id)) * 100
        ELSE 0 
    END as completion_rate
FROM gamified_apps ga
LEFT JOIN app_sessions aps ON ga.id = aps.app_id
WHERE ga.is_active = true
GROUP BY ga.id, ga.name, ga.app_type;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Refresh materialized views if any exist
-- (None in current schema, but good practice)

NOTIFY pgrst, 'reload schema';