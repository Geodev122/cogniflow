/*
  # Ensure Assessment Library is Populated

  This migration ensures the assessment library has the required psychometric assessments.
*/

-- Insert PHQ-9 (Patient Health Questionnaire-9) if it doesn't exist
INSERT INTO assessment_library (
  name,
  abbreviation,
  category,
  description,
  questions,
  scoring_method,
  interpretation_guide,
  is_active
) 
SELECT 
  'Patient Health Questionnaire-9',
  'PHQ-9',
  'depression',
  'A 9-question instrument for screening, diagnosing, monitoring and measuring the severity of depression.',
  '[
    {
      "id": "phq9_1",
      "text": "Little interest or pleasure in doing things",
      "type": "scale",
      "scale_min": 0,
      "scale_max": 3,
      "scale_labels": ["Not at all", "Several days", "More than half the days", "Nearly every day"]
    },
    {
      "id": "phq9_2", 
      "text": "Feeling down, depressed, or hopeless",
      "type": "scale",
      "scale_min": 0,
      "scale_max": 3,
      "scale_labels": ["Not at all", "Several days", "More than half the days", "Nearly every day"]
    },
    {
      "id": "phq9_3",
      "text": "Trouble falling or staying asleep, or sleeping too much",
      "type": "scale", 
      "scale_min": 0,
      "scale_max": 3,
      "scale_labels": ["Not at all", "Several days", "More than half the days", "Nearly every day"]
    },
    {
      "id": "phq9_4",
      "text": "Feeling tired or having little energy",
      "type": "scale",
      "scale_min": 0,
      "scale_max": 3,
      "scale_labels": ["Not at all", "Several days", "More than half the days", "Nearly every day"]
    },
    {
      "id": "phq9_5",
      "text": "Poor appetite or overeating",
      "type": "scale",
      "scale_min": 0,
      "scale_max": 3,
      "scale_labels": ["Not at all", "Several days", "More than half the days", "Nearly every day"]
    },
    {
      "id": "phq9_6",
      "text": "Feeling bad about yourself or that you are a failure or have let yourself or your family down",
      "type": "scale",
      "scale_min": 0,
      "scale_max": 3,
      "scale_labels": ["Not at all", "Several days", "More than half the days", "Nearly every day"]
    },
    {
      "id": "phq9_7",
      "text": "Trouble concentrating on things, such as reading the newspaper or watching television",
      "type": "scale",
      "scale_min": 0,
      "scale_max": 3,
      "scale_labels": ["Not at all", "Several days", "More than half the days", "Nearly every day"]
    },
    {
      "id": "phq9_8",
      "text": "Moving or speaking so slowly that other people could have noticed. Or the opposite being so fidgety or restless that you have been moving around a lot more than usual",
      "type": "scale",
      "scale_min": 0,
      "scale_max": 3,
      "scale_labels": ["Not at all", "Several days", "More than half the days", "Nearly every day"]
    },
    {
      "id": "phq9_9",
      "text": "Thoughts that you would be better off dead, or of hurting yourself in some way",
      "type": "scale",
      "scale_min": 0,
      "scale_max": 3,
      "scale_labels": ["Not at all", "Several days", "More than half the days", "Nearly every day"]
    }
  ]'::jsonb,
  '{"max_score": 27, "scoring": "Sum of all items", "ranges": [{"min": 0, "max": 4, "severity": "Minimal"}, {"min": 5, "max": 9, "severity": "Mild"}, {"min": 10, "max": 14, "severity": "Moderate"}, {"min": 15, "max": 19, "severity": "Moderately Severe"}, {"min": 20, "max": 27, "severity": "Severe"}]}'::jsonb,
  '{"interpretation": "PHQ-9 scores of 5, 10, 15, and 20 represent mild, moderate, moderately severe, and severe depression, respectively.", "clinical_notes": "Scores ≥10 have a sensitivity of 88% and specificity of 88% for major depression."}'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM assessment_library WHERE abbreviation = 'PHQ-9'
);

-- Insert GAD-7 (Generalized Anxiety Disorder 7-item) if it doesn't exist
INSERT INTO assessment_library (
  name,
  abbreviation,
  category,
  description,
  questions,
  scoring_method,
  interpretation_guide,
  is_active
)
SELECT
  'Generalized Anxiety Disorder 7-item',
  'GAD-7',
  'anxiety',
  'A 7-question screening tool for generalized anxiety disorder.',
  '[
    {
      "id": "gad7_1",
      "text": "Feeling nervous, anxious, or on edge",
      "type": "scale",
      "scale_min": 0,
      "scale_max": 3,
      "scale_labels": ["Not at all", "Several days", "More than half the days", "Nearly every day"]
    },
    {
      "id": "gad7_2",
      "text": "Not being able to stop or control worrying",
      "type": "scale",
      "scale_min": 0,
      "scale_max": 3,
      "scale_labels": ["Not at all", "Several days", "More than half the days", "Nearly every day"]
    },
    {
      "id": "gad7_3",
      "text": "Worrying too much about different things",
      "type": "scale",
      "scale_min": 0,
      "scale_max": 3,
      "scale_labels": ["Not at all", "Several days", "More than half the days", "Nearly every day"]
    },
    {
      "id": "gad7_4",
      "text": "Trouble relaxing",
      "type": "scale",
      "scale_min": 0,
      "scale_max": 3,
      "scale_labels": ["Not at all", "Several days", "More than half the days", "Nearly every day"]
    },
    {
      "id": "gad7_5",
      "text": "Being so restless that it is hard to sit still",
      "type": "scale",
      "scale_min": 0,
      "scale_max": 3,
      "scale_labels": ["Not at all", "Several days", "More than half the days", "Nearly every day"]
    },
    {
      "id": "gad7_6",
      "text": "Becoming easily annoyed or irritable",
      "type": "scale",
      "scale_min": 0,
      "scale_max": 3,
      "scale_labels": ["Not at all", "Several days", "More than half the days", "Nearly every day"]
    },
    {
      "id": "gad7_7",
      "text": "Feeling afraid, as if something awful might happen",
      "type": "scale",
      "scale_min": 0,
      "scale_max": 3,
      "scale_labels": ["Not at all", "Several days", "More than half the days", "Nearly every day"]
    }
  ]'::jsonb,
  '{"max_score": 21, "scoring": "Sum of all items", "ranges": [{"min": 0, "max": 4, "severity": "Minimal"}, {"min": 5, "max": 9, "severity": "Mild"}, {"min": 10, "max": 14, "severity": "Moderate"}, {"min": 15, "max": 21, "severity": "Severe"}]}'::jsonb,
  '{"interpretation": "GAD-7 scores of 5, 10, and 15 represent mild, moderate, and severe anxiety, respectively.", "clinical_notes": "Scores ≥10 have a sensitivity of 89% and specificity of 82% for GAD."}'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM assessment_library WHERE abbreviation = 'GAD-7'
);

-- Insert PCL-5 (PTSD Checklist for DSM-5) if it doesn't exist
INSERT INTO assessment_library (
  name,
  abbreviation,
  category,
  description,
  questions,
  scoring_method,
  interpretation_guide,
  is_active
)
SELECT
  'PTSD Checklist for DSM-5',
  'PCL-5',
  'trauma',
  'A 20-item self-report measure that assesses the 20 DSM-5 symptoms of PTSD.',
  '[
    {
      "id": "pcl5_1",
      "text": "Repeated, disturbing, and unwanted memories of the stressful experience",
      "type": "scale",
      "scale_min": 0,
      "scale_max": 4,
      "scale_labels": ["Not at all", "A little bit", "Moderately", "Quite a bit", "Extremely"]
    },
    {
      "id": "pcl5_2",
      "text": "Repeated, disturbing dreams of the stressful experience",
      "type": "scale",
      "scale_min": 0,
      "scale_max": 4,
      "scale_labels": ["Not at all", "A little bit", "Moderately", "Quite a bit", "Extremely"]
    },
    {
      "id": "pcl5_3",
      "text": "Suddenly feeling or acting as if the stressful experience were actually happening again",
      "type": "scale",
      "scale_min": 0,
      "scale_max": 4,
      "scale_labels": ["Not at all", "A little bit", "Moderately", "Quite a bit", "Extremely"]
    }
  ]'::jsonb,
  '{"max_score": 80, "scoring": "Sum of all items", "ranges": [{"min": 0, "max": 30, "severity": "No PTSD"}, {"min": 31, "max": 80, "severity": "Probable PTSD"}]}'::jsonb,
  '{"interpretation": "A total symptom severity score (range 0-80) can be obtained by summing the scores for each of the 20 items.", "clinical_notes": "PCL-5 score of 31-33 is optimal cutoff for probable PTSD diagnosis."}'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM assessment_library WHERE abbreviation = 'PCL-5'
);