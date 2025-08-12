-- Treatment plan, goals, and interventions tables with helper RPCs

-- Tables
CREATE TABLE IF NOT EXISTS treatment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  therapist_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_plan_id uuid REFERENCES treatment_plans(id) ON DELETE CASCADE,
  goal_text text NOT NULL,
  target_date date,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status text DEFAULT 'active' CHECK (status IN ('active','completed','archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Triggers to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_treatment_plans_updated_at BEFORE UPDATE ON treatment_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RPC functions
CREATE OR REPLACE FUNCTION create_treatment_plan(p_client uuid, p_therapist uuid, p_title text)
RETURNS uuid AS $$
DECLARE new_plan uuid;
BEGIN
  INSERT INTO treatment_plans (client_id, therapist_id, title)
  VALUES (p_client, p_therapist, p_title)
  RETURNING id INTO new_plan;
  RETURN new_plan;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_goal(p_plan uuid, p_text text, p_target date)
RETURNS uuid AS $$
DECLARE new_goal uuid;
BEGIN
  INSERT INTO goals (treatment_plan_id, goal_text, target_date)
  VALUES (p_plan, p_text, p_target)
  RETURNING id INTO new_goal;
  RETURN new_goal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_goal_progress(p_goal uuid, p_progress integer)
RETURNS void AS $$
BEGIN
  UPDATE goals
  SET progress = p_progress,
      status = CASE WHEN p_progress >= 100 THEN 'completed' ELSE status END,
      updated_at = now()
  WHERE id = p_goal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;

-- Basic access policies
CREATE POLICY treatment_plans_owner ON treatment_plans
  FOR ALL USING (auth.uid() IN (therapist_id, client_id))
  WITH CHECK (auth.uid() IN (therapist_id, client_id));

CREATE POLICY goals_owner ON goals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM treatment_plans tp
      WHERE tp.id = goals.treatment_plan_id
        AND auth.uid() IN (tp.therapist_id, tp.client_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM treatment_plans tp
      WHERE tp.id = goals.treatment_plan_id
        AND auth.uid() IN (tp.therapist_id, tp.client_id)
    )
  );

CREATE POLICY interventions_owner ON interventions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM goals g
      JOIN treatment_plans tp ON tp.id = g.treatment_plan_id
      WHERE g.id = interventions.goal_id
        AND auth.uid() IN (tp.therapist_id, tp.client_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals g
      JOIN treatment_plans tp ON tp.id = g.treatment_plan_id
      WHERE g.id = interventions.goal_id
        AND auth.uid() IN (tp.therapist_id, tp.client_id)
    )
  );
