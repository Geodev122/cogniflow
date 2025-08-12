/*
  # Enhanced Gamified Apps Framework

  1. New Tables
    - `gamified_apps` - App metadata and configuration
    - `app_sessions` - Individual session tracking
    - `app_progress` - User progress and achievements
    - `app_analytics` - Detailed interaction analytics
    - `app_library` - Curated app library with categories
    - `app_assignments` - Therapist-to-client app assignments

  2. Functions
    - Session management functions
    - Progress calculation functions
    - Achievement system functions
    - Analytics aggregation functions

  3. Security
    - RLS policies for all tables
    - Proper access control for therapists and clients
*/

-- Create gamified apps table (enhanced)
CREATE TABLE IF NOT EXISTS gamified_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_type text NOT NULL CHECK (app_type IN ('assessment', 'worksheet', 'exercise', 'intake', 'psychoeducation')),
  name text NOT NULL,
  description text,
  version text DEFAULT '1.0.0',
  app_config jsonb DEFAULT '{}',
  game_mechanics jsonb DEFAULT '{}',
  difficulty_level text DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration integer, -- in minutes
  is_active boolean DEFAULT true,
  evidence_based boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create app sessions table
CREATE TABLE IF NOT EXISTS app_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid REFERENCES gamified_apps(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_type text DEFAULT 'play' CHECK (session_type IN ('play', 'assessment', 'practice', 'review')),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_seconds integer,
  score integer DEFAULT 0,
  max_score integer DEFAULT 100,
  responses jsonb DEFAULT '{}',
  game_data jsonb DEFAULT '{}',
  completion_status text DEFAULT 'in_progress' CHECK (completion_status IN ('in_progress', 'completed', 'abandoned')),
  created_at timestamptz DEFAULT now()
);

-- Create app progress table
CREATE TABLE IF NOT EXISTS app_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid REFERENCES gamified_apps(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  total_sessions integer DEFAULT 0,
  total_time_minutes integer DEFAULT 0,
  best_score integer DEFAULT 0,
  average_score numeric DEFAULT 0,
  current_level integer DEFAULT 1,
  experience_points integer DEFAULT 0,
  achievements jsonb DEFAULT '[]',
  streak_days integer DEFAULT 0,
  last_played_at timestamptz,
  mastery_level text DEFAULT 'novice' CHECK (mastery_level IN ('novice', 'beginner', 'intermediate', 'advanced', 'expert')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(app_id, user_id)
);

-- Create app analytics table
CREATE TABLE IF NOT EXISTS app_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES app_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  app_id uuid REFERENCES gamified_apps(id) ON DELETE CASCADE
);

-- Create app library table for curated content
CREATE TABLE IF NOT EXISTS app_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid REFERENCES gamified_apps(id) ON DELETE CASCADE,
  category text NOT NULL,
  subcategory text,
  featured boolean DEFAULT false,
  popularity_score integer DEFAULT 0,
  clinical_rating numeric DEFAULT 0,
  usage_count integer DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  curator_notes text,
  created_at timestamptz DEFAULT now()
);

-- Create app assignments table
CREATE TABLE IF NOT EXISTS app_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  app_id uuid REFERENCES gamified_apps(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  due_date date,
  instructions text,
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'overdue')),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_gamified_apps_type ON gamified_apps(app_type);
CREATE INDEX IF NOT EXISTS idx_gamified_apps_active ON gamified_apps(is_active);
CREATE INDEX IF NOT EXISTS idx_app_sessions_user_id ON app_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_app_sessions_app_id ON app_sessions(app_id);
CREATE INDEX IF NOT EXISTS idx_app_sessions_started_at ON app_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_app_progress_user_id ON app_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_app_progress_app_id ON app_progress(app_id);
CREATE INDEX IF NOT EXISTS idx_app_analytics_session_id ON app_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_app_analytics_event_type ON app_analytics(event_type);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gamified_apps_updated_at BEFORE UPDATE ON gamified_apps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_progress_updated_at BEFORE UPDATE ON app_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE gamified_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gamified_apps
CREATE POLICY "gamified_apps_read_active" ON gamified_apps
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "gamified_apps_therapist_manage" ON gamified_apps
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = uid() AND profiles.role = 'therapist'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = uid() AND profiles.role = 'therapist'
  ));

-- RLS Policies for app_sessions
CREATE POLICY "app_sessions_user_access" ON app_sessions
  FOR ALL TO authenticated
  USING (user_id = uid())
  WITH CHECK (user_id = uid());

CREATE POLICY "app_sessions_therapist_view" ON app_sessions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM therapist_client_relations tcr
    JOIN profiles p ON p.id = uid()
    WHERE tcr.therapist_id = p.id 
    AND tcr.client_id = app_sessions.user_id 
    AND p.role = 'therapist'
  ));

-- RLS Policies for app_progress
CREATE POLICY "app_progress_user_access" ON app_progress
  FOR ALL TO authenticated
  USING (user_id = uid())
  WITH CHECK (user_id = uid());

CREATE POLICY "app_progress_therapist_view" ON app_progress
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM therapist_client_relations tcr
    JOIN profiles p ON p.id = uid()
    WHERE tcr.therapist_id = p.id 
    AND tcr.client_id = app_progress.user_id 
    AND p.role = 'therapist'
  ));

-- RLS Policies for app_analytics
CREATE POLICY "app_analytics_user_access" ON app_analytics
  FOR ALL TO authenticated
  USING (user_id = uid())
  WITH CHECK (user_id = uid());

CREATE POLICY "app_analytics_therapist_view" ON app_analytics
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM therapist_client_relations tcr
    JOIN profiles p ON p.id = uid()
    WHERE tcr.therapist_id = p.id 
    AND tcr.client_id = app_analytics.user_id 
    AND p.role = 'therapist'
  ));

-- RLS Policies for app_library
CREATE POLICY "app_library_read_all" ON app_library
  FOR SELECT TO authenticated
  USING (true);

-- RLS Policies for app_assignments
CREATE POLICY "app_assignments_therapist_manage" ON app_assignments
  FOR ALL TO authenticated
  USING (therapist_id = uid())
  WITH CHECK (therapist_id = uid());

CREATE POLICY "app_assignments_client_view" ON app_assignments
  FOR SELECT TO authenticated
  USING (client_id = uid());

-- Create session management functions
CREATE OR REPLACE FUNCTION start_app_session(
  p_app_id uuid,
  p_user_id uuid,
  p_session_type text DEFAULT 'play'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id uuid;
BEGIN
  -- Create new session
  INSERT INTO app_sessions (app_id, user_id, session_type)
  VALUES (p_app_id, p_user_id, p_session_type)
  RETURNING id INTO session_id;
  
  -- Initialize progress if doesn't exist
  INSERT INTO app_progress (app_id, user_id)
  VALUES (p_app_id, p_user_id)
  ON CONFLICT (app_id, user_id) DO NOTHING;
  
  RETURN session_id;
END;
$$;

CREATE OR REPLACE FUNCTION complete_app_session(
  p_session_id uuid,
  p_score integer DEFAULT 0,
  p_responses jsonb DEFAULT '{}',
  p_game_data jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record app_sessions%ROWTYPE;
  duration_seconds integer;
  new_achievements text[];
BEGIN
  -- Get session details
  SELECT * INTO session_record FROM app_sessions WHERE id = p_session_id;
  
  -- Calculate duration
  duration_seconds := EXTRACT(EPOCH FROM (now() - session_record.started_at));
  
  -- Update session
  UPDATE app_sessions 
  SET 
    completed_at = now(),
    duration_seconds = duration_seconds,
    score = p_score,
    responses = p_responses,
    game_data = p_game_data,
    completion_status = 'completed'
  WHERE id = p_session_id;
  
  -- Update progress
  UPDATE app_progress 
  SET 
    total_sessions = total_sessions + 1,
    total_time_minutes = total_time_minutes + (duration_seconds / 60),
    best_score = GREATEST(best_score, p_score),
    average_score = (average_score * total_sessions + p_score) / (total_sessions + 1),
    experience_points = experience_points + (p_score * 2), -- 2 XP per point
    last_played_at = now(),
    updated_at = now()
  WHERE app_id = session_record.app_id AND user_id = session_record.user_id;
  
  -- Check for achievements (simplified)
  SELECT ARRAY[]::text[] INTO new_achievements;
  
  -- First completion achievement
  IF (SELECT total_sessions FROM app_progress WHERE app_id = session_record.app_id AND user_id = session_record.user_id) = 1 THEN
    new_achievements := array_append(new_achievements, 'first_completion');
  END IF;
  
  -- Perfect score achievement
  IF p_score = session_record.max_score THEN
    new_achievements := array_append(new_achievements, 'perfect_score');
  END IF;
  
  -- Update achievements if any new ones
  IF array_length(new_achievements, 1) > 0 THEN
    UPDATE app_progress 
    SET achievements = achievements || to_jsonb(new_achievements)
    WHERE app_id = session_record.app_id AND user_id = session_record.user_id;
  END IF;
END;
$$;

-- Create app usage stats view
CREATE OR REPLACE VIEW app_usage_stats AS
SELECT 
  ga.id as app_id,
  ga.name as app_name,
  ga.app_type,
  COUNT(DISTINCT aps.user_id) as unique_users,
  COUNT(aps.id) as total_sessions,
  AVG(aps.score) as average_score,
  AVG(aps.duration_seconds) as average_duration_seconds,
  COUNT(CASE WHEN aps.completion_status = 'completed' THEN 1 END) as completed_sessions,
  ROUND(
    COUNT(CASE WHEN aps.completion_status = 'completed' THEN 1 END)::numeric / 
    NULLIF(COUNT(aps.id), 0) * 100, 2
  ) as completion_rate
FROM gamified_apps ga
LEFT JOIN app_sessions aps ON ga.id = aps.app_id
WHERE ga.is_active = true
GROUP BY ga.id, ga.name, ga.app_type;

-- Populate sample gamified apps
INSERT INTO gamified_apps (app_type, name, description, game_mechanics, difficulty_level, estimated_duration, evidence_based, tags) VALUES
-- Assessments
('assessment', 'PHQ-9 Space Explorer', 'Navigate through space while completing the Patient Health Questionnaire', 
 '{"theme": "space", "points_per_question": 10, "completion_bonus": 50, "progress_visualization": "planet_progression"}', 
 'beginner', 5, true, ARRAY['depression', 'screening', 'validated']),

('assessment', 'GAD-7 Garden Growth', 'Grow a mindfulness garden while assessing anxiety levels', 
 '{"theme": "garden", "points_per_question": 10, "completion_bonus": 40, "progress_visualization": "plant_growth"}', 
 'beginner', 3, true, ARRAY['anxiety', 'screening', 'validated']),

('assessment', 'BDI-II Detective Case', 'Solve a mystery while completing the Beck Depression Inventory', 
 '{"theme": "detective", "points_per_question": 15, "completion_bonus": 75, "progress_visualization": "case_solving"}', 
 'intermediate', 10, true, ARRAY['depression', 'comprehensive', 'validated']),

-- Worksheets
('worksheet', 'Thought Detective Challenge', 'Become a thought detective and challenge negative thinking patterns', 
 '{"theme": "detective", "points_per_section": 20, "completion_bonus": 100, "progress_visualization": "evidence_collection"}', 
 'beginner', 15, true, ARRAY['CBT', 'thoughts', 'cognitive']),

('worksheet', 'Mood Tracker Adventure', 'Embark on a daily adventure while tracking your emotional journey', 
 '{"theme": "adventure", "points_per_entry": 5, "streak_bonus": 25, "progress_visualization": "map_progression"}', 
 'beginner', 5, false, ARRAY['mood', 'tracking', 'daily']),

('worksheet', 'Mindful Garden Journal', 'Cultivate mindfulness while tending to your personal growth garden', 
 '{"theme": "garden", "points_per_reflection": 15, "completion_bonus": 60, "progress_visualization": "garden_growth"}', 
 'intermediate', 20, true, ARRAY['mindfulness', 'reflection', 'growth']),

-- Exercises
('exercise', 'Cosmic Breathing Journey', 'Travel through the cosmos with guided breathing exercises', 
 '{"theme": "space", "points_per_cycle": 5, "level_progression": true, "progress_visualization": "cosmic_travel"}', 
 'beginner', 10, true, ARRAY['breathing', 'relaxation', 'mindfulness']),

('exercise', 'Zen Garden Builder', 'Build and maintain a zen garden through mindfulness practice', 
 '{"theme": "garden", "points_per_session": 25, "customization": true, "progress_visualization": "garden_building"}', 
 'intermediate', 15, true, ARRAY['mindfulness', 'meditation', 'zen']),

('exercise', 'Cognitive Gym Trainer', 'Train your cognitive muscles with thought-challenging exercises', 
 '{"theme": "gym", "points_per_rep": 10, "strength_levels": true, "progress_visualization": "muscle_building"}', 
 'advanced', 20, true, ARRAY['cognitive', 'restructuring', 'CBT']),

-- Intake Forms
('intake', 'Welcome Aboard Spaceship', 'Begin your therapeutic journey aboard the CogniFlow spaceship', 
 '{"theme": "space", "points_per_section": 30, "completion_bonus": 200, "progress_visualization": "spaceship_boarding"}', 
 'beginner', 25, false, ARRAY['intake', 'onboarding', 'assessment']),

('intake', 'Therapy Quest Begins', 'Start your heroic quest toward mental wellness', 
 '{"theme": "adventure", "points_per_milestone": 50, "completion_bonus": 250, "progress_visualization": "quest_map"}', 
 'beginner', 30, false, ARRAY['intake', 'journey', 'goals']),

-- Psychoeducation
('psychoeducation', 'CBT Academy', 'Learn CBT principles through interactive lessons and mini-games', 
 '{"theme": "academy", "points_per_lesson": 40, "quiz_bonus": 20, "progress_visualization": "academic_progress"}', 
 'beginner', 45, true, ARRAY['CBT', 'education', 'interactive']),

('psychoeducation', 'Mindfulness Monastery', 'Discover mindfulness techniques in a peaceful virtual monastery', 
 '{"theme": "monastery", "points_per_practice": 30, "meditation_bonus": 50, "progress_visualization": "spiritual_journey"}', 
 'intermediate', 35, true, ARRAY['mindfulness', 'meditation', 'education']);

-- Populate app library with categories
INSERT INTO app_library (app_id, category, subcategory, featured, popularity_score, clinical_rating) 
SELECT 
  id,
  CASE 
    WHEN app_type = 'assessment' THEN 'Assessments'
    WHEN app_type = 'worksheet' THEN 'Worksheets'
    WHEN app_type = 'exercise' THEN 'Exercises'
    WHEN app_type = 'intake' THEN 'Intake Forms'
    WHEN app_type = 'psychoeducation' THEN 'Psychoeducation'
  END,
  CASE 
    WHEN tags @> ARRAY['depression'] THEN 'Depression'
    WHEN tags @> ARRAY['anxiety'] THEN 'Anxiety'
    WHEN tags @> ARRAY['mindfulness'] THEN 'Mindfulness'
    WHEN tags @> ARRAY['CBT'] THEN 'Cognitive Behavioral Therapy'
    ELSE 'General'
  END,
  CASE WHEN evidence_based THEN true ELSE false END,
  FLOOR(random() * 100) + 50, -- Random popularity score
  CASE WHEN evidence_based THEN 4.5 + (random() * 0.5) ELSE 3.5 + (random() * 1.0) END
FROM gamified_apps;

-- Create function to get app recommendations
CREATE OR REPLACE FUNCTION get_app_recommendations(p_user_id uuid)
RETURNS TABLE(
  app_id uuid,
  app_name text,
  app_type text,
  description text,
  difficulty_level text,
  estimated_duration integer,
  recommendation_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ga.id,
    ga.name,
    ga.app_type,
    ga.description,
    ga.difficulty_level,
    ga.estimated_duration,
    (al.popularity_score * 0.3 + al.clinical_rating * 20 + 
     CASE WHEN ga.evidence_based THEN 25 ELSE 0 END)::numeric as recommendation_score
  FROM gamified_apps ga
  JOIN app_library al ON ga.id = al.app_id
  WHERE ga.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM app_sessions aps 
    WHERE aps.app_id = ga.id 
    AND aps.user_id = p_user_id 
    AND aps.completion_status = 'completed'
  )
  ORDER BY recommendation_score DESC
  LIMIT 10;
END;
$$;

-- Create function to get app leaderboard
CREATE OR REPLACE FUNCTION get_app_leaderboard(p_app_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(
  user_id uuid,
  user_name text,
  best_score integer,
  total_sessions integer,
  experience_points integer,
  mastery_level text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.user_id,
    CONCAT(p.first_name, ' ', LEFT(p.last_name, 1), '.') as user_name,
    ap.best_score,
    ap.total_sessions,
    ap.experience_points,
    ap.mastery_level
  FROM app_progress ap
  JOIN profiles p ON ap.user_id = p.id
  WHERE ap.app_id = p_app_id
  ORDER BY ap.best_score DESC, ap.experience_points DESC
  LIMIT p_limit;
END;
$$;