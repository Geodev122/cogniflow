ALTER TABLE assessment_library ADD COLUMN is_active boolean DEFAULT true;
-- Seed standardized assessments
INSERT INTO assessment_library (name, abbreviation, category, description, questions, scoring_method, interpretation_guide, is_active)
SELECT
  'Patient Health Questionnaire-9',
  'PHQ-9',
  'depression',
  'A 9-item depression screening tool that scores each of the 9 DSM-IV criteria for depression.',
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
      "text": "Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual",
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
  '{
    "max_score": 27,
    "scoring_method": "sum",
    "interpretation": {
      "0-4": "Minimal depression",
      "5-9": "Mild depression",
      "10-14": "Moderate depression",
      "15-19": "Moderately severe depression",
      "20-27": "Severe depression"
    }
  }'::jsonb,
  '{
    "clinical_cutoff": 10,
    "reliability": "High internal consistency (α = 0.89)",
    "validity": "Validated against clinical interviews",
    "administration_time": "2-3 minutes"
  }'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM assessment_library WHERE abbreviation = 'PHQ-9'
);

INSERT INTO assessment_library (name, abbreviation, category, description, questions, scoring_method, interpretation_guide, is_active)
SELECT
  'Generalized Anxiety Disorder 7-item',
  'GAD-7',
  'anxiety',
  'A 7-item anxiety screening tool for generalized anxiety disorder.',
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
  '{
    "max_score": 21,
    "scoring_method": "sum",
    "interpretation": {
      "0-4": "Minimal anxiety",
      "5-9": "Mild anxiety",
      "10-14": "Moderate anxiety",
      "15-21": "Severe anxiety"
    }
  }'::jsonb,
  '{
    "clinical_cutoff": 10,
    "reliability": "High internal consistency (α = 0.92)",
    "validity": "Validated for GAD screening",
    "administration_time": "2-3 minutes"
  }'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM assessment_library WHERE abbreviation = 'GAD-7'
);

INSERT INTO assessment_library (name, abbreviation, category, description, questions, scoring_method, interpretation_guide, is_active)
SELECT
  'Beck Depression Inventory-II',
  'BDI-II',
  'depression',
  'A 21-item self-report measure of depression severity.',
  '[
    {
      "id": "bdi_1",
      "text": "Sadness",
      "type": "multiple_choice",
      "options": [
        "I do not feel sad",
        "I feel sad much of the time",
        "I am sad all the time",
        "I am so sad or unhappy that I cannot stand it"
      ]
    },
    {
      "id": "bdi_2",
      "text": "Pessimism",
      "type": "multiple_choice",
      "options": [
        "I am not discouraged about my future",
        "I feel more discouraged about my future than I used to be",
        "I do not expect things to work out for me",
        "I feel my future is hopeless and will only get worse"
      ]
    },
    {
      "id": "bdi_3",
      "text": "Past Failure",
      "type": "multiple_choice",
      "options": [
        "I do not feel like a failure",
        "I have failed more than I should have",
        "As I look back, I see a lot of failures",
        "I feel I am a total failure as a person"
      ]
    },
    {
      "id": "bdi_4",
      "text": "Loss of Pleasure",
      "type": "multiple_choice",
      "options": [
        "I get as much pleasure as I ever did from the things I enjoy",
        "I do not enjoy things as much as I used to",
        "I get very little pleasure from the things I used to enjoy",
        "I cannot get any pleasure from the things I used to enjoy"
      ]
    },
    {
      "id": "bdi_5",
      "text": "Guilty Feelings",
      "type": "multiple_choice",
      "options": [
        "I do not feel particularly guilty",
        "I feel guilty over many things I have done or should have done",
        "I feel quite guilty most of the time",
        "I feel guilty all of the time"
      ]
    }
  ]'::jsonb,
  '{
    "max_score": 63,
    "scoring_method": "sum",
    "interpretation": {
      "0-13": "Minimal depression",
      "14-19": "Mild depression",
      "20-28": "Moderate depression",
      "29-63": "Severe depression"
    }
  }'::jsonb,
  '{
    "clinical_cutoff": 14,
    "reliability": "High internal consistency (α = 0.91)",
    "validity": "Gold standard for depression assessment",
    "administration_time": "5-10 minutes"
  }'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM assessment_library WHERE abbreviation = 'BDI-II'
);
