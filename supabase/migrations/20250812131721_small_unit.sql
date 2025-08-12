/*
  # Gamified Assessment Apps Framework

  1. New Tables
    - `gamified_apps` - Store app metadata and configuration
    - `app_sessions` - Track individual app play sessions
    - `app_progress` - Store user progress and achievements
    - `app_analytics` - Detailed analytics for each interaction

  2. Security
    - Enable RLS on all tables
    - Add policies for therapist and client access

  3. Features
    - Support for multiple app types (assessment, worksheet, exercise, intake)
    - Progress tracking and gamification elements
    - Analytics and performance metrics
    - Integration with existing assessment system
*/

-- Gamified Apps Table
CREATE TABLE IF NOT EXISTS gamified_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_type text NOT NULL CHECK (app_type IN ('assessment', 'worksheet', 'exercise', 'intake', 'psychoeducation')),
  name text NOT NULL,
  description text,
  version text DEFAULT '1.0.0',
  app_config jsonb DEFAULT '{}',
  game_mechanics jsonb DEFAULT '{}', -- Points, levels, achievements, etc.
  difficulty_level text DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration integer, -- in minutes
  is_active boolean DEFAULT true,
  evidence_based boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- App Sessions Table (tracks individual play sessions)
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
  game_data jsonb DEFAULT '{}', -- Game-specific data (levels, achievements, etc.)
  completion_status text DEFAULT 'in_progress' CHECK (completion_status IN ('in_progress', 'completed', 'abandoned')),
  created_at timestamptz DEFAULT now()
);

-- App Progress Table (tracks overall user progress)
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
  achievements jsonb DEFAULT '[]', -- Array of earned achievements
  streak_days integer DEFAULT 0,
  last_played_at timestamptz,
  mastery_level text DEFAULT 'novice' CHECK (mastery_level IN ('novice', 'beginner', 'intermediate', 'advanced', 'expert')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(app_id, user_id)
);

-- App Analytics Table (detailed interaction analytics)
CREATE TABLE IF NOT EXISTS app_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES app_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'start', 'question_answered', 'level_completed', 'achievement_earned', etc.
  event_data jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  app_id uuid REFERENCES gamified_apps(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE gamified_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gamified_apps
CREATE POLICY "gamified_apps_read_active"
  ON gamified_apps
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "gamified_apps_therapist_manage"
  ON gamified_apps
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'therapist'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'therapist'
    )
  );

-- RLS Policies for app_sessions
CREATE POLICY "app_sessions_user_access"
  ON app_sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "app_sessions_therapist_view"
  ON app_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapist_client_relations tcr
      JOIN profiles p ON p.id = auth.uid()
      WHERE tcr.therapist_id = p.id 
      AND tcr.client_id = app_sessions.user_id
      AND p.role = 'therapist'
    )
  );

-- RLS Policies for app_progress
CREATE POLICY "app_progress_user_access"
  ON app_progress
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "app_progress_therapist_view"
  ON app_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapist_client_relations tcr
      JOIN profiles p ON p.id = auth.uid()
      WHERE tcr.therapist_id = p.id 
      AND tcr.client_id = app_progress.user_id
      AND p.role = 'therapist'
    )
  );

-- RLS Policies for app_analytics
CREATE POLICY "app_analytics_user_access"
  ON app_analytics
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "app_analytics_therapist_view"
  ON app_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapist_client_relations tcr
      JOIN profiles p ON p.id = auth.uid()
      WHERE tcr.therapist_id = p.id 
      AND tcr.client_id = app_analytics.user_id
      AND p.role = 'therapist'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gamified_apps_type ON gamified_apps(app_type);
CREATE INDEX IF NOT EXISTS idx_gamified_apps_active ON gamified_apps(is_active);
CREATE INDEX IF NOT EXISTS idx_app_sessions_user_id ON app_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_app_sessions_app_id ON app_sessions(app_id);
CREATE INDEX IF NOT EXISTS idx_app_sessions_started_at ON app_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_app_progress_user_id ON app_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_app_progress_app_id ON app_progress(app_id);
CREATE INDEX IF NOT EXISTS idx_app_analytics_session_id ON app_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_app_analytics_event_type ON app_analytics(event_type);

-- Functions for gamified apps

-- Function to start a new app session
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
  v_session_id uuid;
BEGIN
  -- Create new session
  INSERT INTO app_sessions (app_id, user_id, session_type)
  VALUES (p_app_id, p_user_id, p_session_type)
  RETURNING id INTO v_session_id;
  
  -- Log start event
  INSERT INTO app_analytics (session_id, event_type, user_id, app_id)
  VALUES (v_session_id, 'session_started', p_user_id, p_app_id);
  
  -- Update progress last_played_at
  INSERT INTO app_progress (app_id, user_id, last_played_at)
  VALUES (p_app_id, p_user_id, now())
  ON CONFLICT (app_id, user_id) 
  DO UPDATE SET last_played_at = now();
  
  RETURN v_session_id;
END;
$$;

-- Function to complete an app session
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
  v_session record;
  v_duration integer;
  v_new_best boolean := false;
  v_level_up boolean := false;
BEGIN
  -- Get session details
  SELECT * INTO v_session FROM app_sessions WHERE id = p_session_id;
  
  -- Calculate duration
  v_duration := EXTRACT(EPOCH FROM (now() - v_session.started_at));
  
  -- Update session
  UPDATE app_sessions 
  SET 
    completed_at = now(),
    duration_seconds = v_duration,
    score = p_score,
    responses = p_responses,
    game_data = p_game_data,
    completion_status = 'completed'
  WHERE id = p_session_id;
  
  -- Update progress
  INSERT INTO app_progress (
    app_id, 
    user_id, 
    total_sessions, 
    total_time_minutes, 
    best_score, 
    average_score,
    last_played_at
  )
  VALUES (
    v_session.app_id,
    v_session.user_id,
    1,
    CEIL(v_duration / 60.0),
    p_score,
    p_score,
    now()
  )
  ON CONFLICT (app_id, user_id) 
  DO UPDATE SET
    total_sessions = app_progress.total_sessions + 1,
    total_time_minutes = app_progress.total_time_minutes + CEIL(v_duration / 60.0),
    best_score = GREATEST(app_progress.best_score, p_score),
    average_score = (app_progress.average_score * app_progress.total_sessions + p_score) / (app_progress.total_sessions + 1),
    last_played_at = now(),
    updated_at = now();
  
  -- Check for new best score
  SELECT (best_score = p_score AND total_sessions > 1) INTO v_new_best 
  FROM app_progress 
  WHERE app_id = v_session.app_id AND user_id = v_session.user_id;
  
  -- Log completion event
  INSERT INTO app_analytics (session_id, event_type, event_data, user_id, app_id)
  VALUES (
    p_session_id, 
    'session_completed', 
    jsonb_build_object(
      'score', p_score,
      'duration_seconds', v_duration,
      'new_best', v_new_best
    ),
    v_session.user_id,
    v_session.app_id
  );
  
  -- Award achievements if applicable
  IF v_new_best THEN
    INSERT INTO app_analytics (session_id, event_type, event_data, user_id, app_id)
    VALUES (
      p_session_id, 
      'achievement_earned', 
      jsonb_build_object('achievement', 'new_best_score', 'score', p_score),
      v_session.user_id,
      v_session.app_id
    );
  END IF;
END;
$$;

-- Function to get app leaderboard
CREATE OR REPLACE FUNCTION get_app_leaderboard(p_app_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(
  user_id uuid,
  user_name text,
  best_score integer,
  total_sessions integer,
  mastery_level text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.user_id,
    CONCAT(p.first_name, ' ', p.last_name) as user_name,
    ap.best_score,
    ap.total_sessions,
    ap.mastery_level
  FROM app_progress ap
  JOIN profiles p ON p.id = ap.user_id
  WHERE ap.app_id = p_app_id
  ORDER BY ap.best_score DESC, ap.total_sessions DESC
  LIMIT p_limit;
END;
$$;

-- Populate initial gamified apps
INSERT INTO gamified_apps (app_type, name, description, app_config, game_mechanics, difficulty_level, estimated_duration, evidence_based, tags) VALUES
-- Assessments
('assessment', 'PHQ-9 Interactive Assessment', 'Gamified depression screening with visual feedback and progress tracking', 
 '{"questions": 9, "scoring_method": "sum", "max_score": 27}',
 '{"points_per_question": 10, "completion_bonus": 50, "streak_multiplier": 1.5}',
 'beginner', 5, true, 
 ARRAY['depression', 'screening', 'PHQ-9', 'validated']),

('assessment', 'GAD-7 Anxiety Game', 'Interactive anxiety assessment with calming visuals and breathing exercises',
 '{"questions": 7, "scoring_method": "sum", "max_score": 21}',
 '{"points_per_question": 15, "completion_bonus": 75, "breathing_mini_game": true}',
 'beginner', 4, true,
 ARRAY['anxiety', 'screening', 'GAD-7', 'validated']),

('assessment', 'BDI-II Depression Explorer', 'Comprehensive depression assessment with mood tracking integration',
 '{"questions": 21, "scoring_method": "sum", "max_score": 63}',
 '{"points_per_question": 5, "completion_bonus": 100, "mood_visualization": true}',
 'intermediate', 10, true,
 ARRAY['depression', 'comprehensive', 'BDI-II', 'validated']),

-- Worksheets
('worksheet', 'Thought Detective Game', 'Interactive thought record with detective theme and evidence collection',
 '{"sections": ["situation", "thoughts", "emotions", "evidence"], "guided_mode": true}',
 '{"detective_points": true, "evidence_collection": true, "thought_challenges": true}',
 'beginner', 15, true,
 ARRAY['CBT', 'thought-record', 'cognitive-restructuring']),

('worksheet', 'Mood Tracker Adventure', 'Daily mood tracking with adventure game elements and rewards',
 '{"tracking_frequency": "daily", "mood_scale": 10, "trigger_tracking": true}',
 '{"daily_streaks": true, "mood_badges": true, "progress_islands": true}',
 'beginner', 5, false,
 ARRAY['mood', 'tracking', 'daily', 'self-monitoring']),

-- Exercises
('exercise', 'Breathing Space Station', 'Space-themed breathing exercise with visual guidance and achievements',
 '{"breathing_pattern": "4-4-6-2", "session_length": 300, "visual_theme": "space"}',
 '{"cosmic_points": true, "planet_unlocking": true, "breathing_streaks": true}',
 'beginner', 5, true,
 ARRAY['breathing', 'relaxation', 'mindfulness']),

('exercise', 'Mindfulness Garden', 'Virtual garden that grows with mindfulness practice',
 '{"session_types": ["body_scan", "breathing", "loving_kindness"], "garden_theme": true}',
 '{"plant_growth": true, "garden_expansion": true, "seasonal_changes": true}',
 'intermediate', 10, true,
 ARRAY['mindfulness', 'meditation', 'garden', 'growth']),

('exercise', 'Cognitive Gym', 'Workout-themed cognitive restructuring with strength building metaphors',
 '{"exercise_types": ["thought_lifting", "belief_cardio", "flexibility_training"]}',
 '{"strength_points": true, "workout_streaks": true, "personal_records": true}',
 'intermediate', 20, true,
 ARRAY['cognitive-restructuring', 'CBT', 'strength', 'workout']),

-- Intake Forms
('intake', 'Welcome Journey', 'Gamified intake process with progress visualization and milestone rewards',
 '{"steps": 5, "progress_visualization": true, "milestone_rewards": true}',
 '{"journey_points": true, "milestone_badges": true, "completion_celebration": true}',
 'beginner', 20, false,
 ARRAY['intake', 'onboarding', 'assessment', 'journey']),

-- Psychoeducation
('psychoeducation', 'CBT Academy', 'Interactive learning modules about CBT principles with quizzes and certificates',
 '{"modules": ["thoughts", "emotions", "behaviors", "coping"], "quiz_mode": true}',
 '{"knowledge_points": true, "certificates": true, "module_unlocking": true}',
 'beginner', 30, true,
 ARRAY['education', 'CBT', 'learning', 'interactive']),

('psychoeducation', 'Anxiety Understanding Quest', 'Adventure-style learning about anxiety with interactive scenarios',
 '{"quest_stages": 6, "interactive_scenarios": true, "coping_toolkit": true}',
 '{"quest_points": true, "toolkit_unlocking": true, "scenario_mastery": true}',
 'intermediate', 25, true,
 ARRAY['anxiety', 'education', 'quest', 'scenarios']);

-- Triggers for updated_at
CREATE TRIGGER update_gamified_apps_updated_at
  BEFORE UPDATE ON gamified_apps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_progress_updated_at
  BEFORE UPDATE ON app_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Views for analytics
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
LEFT JOIN app_sessions aps ON aps.app_id = ga.id
WHERE ga.is_active = true
GROUP BY ga.id, ga.name, ga.app_type;

-- Function to get user app recommendations
CREATE OR REPLACE FUNCTION get_app_recommendations(p_user_id uuid)
RETURNS TABLE(
  app_id uuid,
  app_name text,
  app_type text,
  recommendation_reason text,
  priority_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_progress AS (
    SELECT app_id, mastery_level, total_sessions
    FROM app_progress 
    WHERE user_id = p_user_id
  ),
  user_assessments AS (
    SELECT form_type, AVG(score) as avg_score
    FROM psychometric_forms 
    WHERE client_id = p_user_id AND status = 'completed'
    GROUP BY form_type
  )
  SELECT 
    ga.id,
    ga.name,
    ga.app_type,
    CASE 
      WHEN up.app_id IS NULL THEN 'New to you - great starting point'
      WHEN up.mastery_level = 'novice' THEN 'Continue building your skills'
      WHEN up.total_sessions < 3 THEN 'Practice makes perfect'
      ELSE 'Maintain your progress'
    END as recommendation_reason,
    CASE 
      WHEN up.app_id IS NULL THEN 100
      WHEN up.mastery_level = 'novice' THEN 80
      WHEN up.total_sessions < 3 THEN 60
      ELSE 40
    END as priority_score
  FROM gamified_apps ga
  LEFT JOIN user_progress up ON up.app_id = ga.id
  WHERE ga.is_active = true
  ORDER BY priority_score DESC, ga.created_at DESC
  LIMIT 5;
END;
$$;