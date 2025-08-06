import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

// Enhanced demo therapists with specializations
const therapists = [
  {
    email: 'dr.sarah.johnson@cogniflow.com',
    password: 'therapist123',
    first_name: 'Sarah',
    last_name: 'Johnson',
    role: 'therapist',
    specialization: 'Anxiety Disorders & CBT',
    years_experience: 12,
    bio: 'Dr. Johnson specializes in cognitive behavioral therapy for anxiety disorders and has extensive experience working with young adults and professionals dealing with work-related stress.'
  },
  {
    email: 'dr.michael.chen@cogniflow.com',
    password: 'therapist123',
    first_name: 'Michael',
    last_name: 'Chen',
    role: 'therapist',
    specialization: 'Depression & Mood Disorders',
    years_experience: 8,
    bio: 'Dr. Chen focuses on evidence-based treatments for depression and mood disorders, with particular expertise in helping clients develop coping strategies and resilience.'
  },
  {
    email: 'dr.emily.rodriguez@cogniflow.com',
    password: 'therapist123',
    first_name: 'Emily',
    last_name: 'Rodriguez',
    role: 'therapist',
    specialization: 'Trauma & PTSD',
    years_experience: 15,
    bio: 'Dr. Rodriguez is a trauma specialist with extensive training in EMDR and trauma-focused CBT, helping clients process and heal from traumatic experiences.'
  },
  {
    email: 'dr.james.williams@cogniflow.com',
    password: 'therapist123',
    first_name: 'James',
    last_name: 'Williams',
    role: 'therapist',
    specialization: 'Addiction & Recovery',
    years_experience: 10,
    bio: 'Dr. Williams specializes in addiction recovery and dual diagnosis treatment, combining CBT with motivational interviewing techniques.'
  },
  {
    email: 'dr.lisa.martinez@cogniflow.com',
    password: 'therapist123',
    first_name: 'Lisa',
    last_name: 'Martinez',
    role: 'therapist',
    specialization: 'Family & Couples Therapy',
    years_experience: 14,
    bio: 'Dr. Martinez focuses on family systems therapy and couples counseling, helping families improve communication and resolve conflicts.'
  }
]

// Enhanced demo clients with diverse backgrounds
const clients = [
  {
    email: 'alex.thompson@email.com',
    password: 'client123',
    first_name: 'Alex',
    last_name: 'Thompson',
    role: 'client',
    age: 28,
    occupation: 'Software Engineer',
    presenting_issue: 'Work-related anxiety and imposter syndrome'
  },
  {
    email: 'maria.garcia@email.com',
    password: 'client123',
    first_name: 'Maria',
    last_name: 'Garcia',
    role: 'client',
    age: 34,
    occupation: 'Marketing Manager',
    presenting_issue: 'Depression following job loss and career transition'
  },
  {
    email: 'james.wilson@email.com',
    password: 'client123',
    first_name: 'James',
    last_name: 'Wilson',
    role: 'client',
    age: 42,
    occupation: 'Teacher',
    presenting_issue: 'Generalized anxiety disorder and panic attacks'
  },
  {
    email: 'lisa.brown@email.com',
    password: 'client123',
    first_name: 'Lisa',
    last_name: 'Brown',
    role: 'client',
    age: 29,
    occupation: 'Nurse',
    presenting_issue: 'Social anxiety and relationship difficulties'
  },
  {
    email: 'david.lee@email.com',
    password: 'client123',
    first_name: 'David',
    last_name: 'Lee',
    role: 'client',
    age: 36,
    occupation: 'Financial Analyst',
    presenting_issue: 'Panic disorder and agoraphobia'
  },
  {
    email: 'jennifer.davis@email.com',
    password: 'client123',
    first_name: 'Jennifer',
    last_name: 'Davis',
    role: 'client',
    age: 31,
    occupation: 'Graphic Designer',
    presenting_issue: 'Work-life balance and perfectionism'
  },
  {
    email: 'robert.miller@email.com',
    password: 'client123',
    first_name: 'Robert',
    last_name: 'Miller',
    role: 'client',
    age: 45,
    occupation: 'Construction Manager',
    presenting_issue: 'PTSD from workplace accident'
  },
  {
    email: 'sarah.anderson@email.com',
    password: 'client123',
    first_name: 'Sarah',
    last_name: 'Anderson',
    role: 'client',
    age: 26,
    occupation: 'Graduate Student',
    presenting_issue: 'Academic stress and social anxiety'
  },
  {
    email: 'michael.taylor@email.com',
    password: 'client123',
    first_name: 'Michael',
    last_name: 'Taylor',
    role: 'client',
    age: 38,
    occupation: 'Sales Representative',
    presenting_issue: 'Substance abuse recovery and depression'
  },
  {
    email: 'amanda.white@email.com',
    password: 'client123',
    first_name: 'Amanda',
    last_name: 'White',
    role: 'client',
    age: 33,
    occupation: 'HR Manager',
    presenting_issue: 'Burnout and relationship stress'
  }
]

// Comprehensive CBT worksheet scenarios
const sampleWorksheetContents = [
  {
    title: 'Morning Presentation Anxiety',
    content: {
      situation: 'I have to give a quarterly presentation to the executive team tomorrow morning. There will be 15 senior leaders in the room, including the CEO.',
      automatic_thought: 'I\'m going to completely mess this up. Everyone will see that I don\'t know what I\'m doing and I\'ll be fired.',
      emotion: 'terrified',
      intensity: 9,
      evidence_for: 'I stumbled over words in my last presentation. The stakes are really high with the CEO there. I\'ve been working here for only 6 months.',
      evidence_against: 'I\'ve given successful presentations before at my previous job. My manager specifically chose me for this because she trusts my work. I know the material inside and out - I\'ve been working on this project for months. My colleagues have been supportive and helpful.',
      balanced_thought: 'While this is an important presentation, I have the knowledge and skills to do well. Even if I make small mistakes, it doesn\'t mean I\'m incompetent. My manager believes in me, and I can prepare thoroughly to feel more confident.',
      new_emotion: 'nervous but prepared',
      new_intensity: 4
    },
    status: 'completed'
  },
  {
    title: 'Friend\'s Wedding Social Anxiety',
    content: {
      situation: 'My best friend is getting married next weekend and I\'m invited to the wedding. I won\'t know most of the 200+ guests there.',
      automatic_thought: 'I\'ll have no one to talk to and will spend the whole evening standing alone looking awkward. People will think I\'m weird.',
      emotion: 'anxious',
      intensity: 7,
      evidence_for: 'I sometimes feel uncomfortable in large social gatherings. I don\'t know most of the other guests.',
      evidence_against: 'My best friend will be there and she always makes sure I feel included. I\'ve met some of her other friends before and they were friendly. Weddings are happy occasions where people are generally in good moods. I can always step outside if I need a break.',
      balanced_thought: 'While meeting new people can feel uncomfortable, this is a celebration for my best friend. People at weddings are usually friendly and happy. I can focus on celebrating with my friend and take breaks if needed.',
      new_emotion: 'slightly nervous but excited',
      new_intensity: 3
    },
    status: 'completed'
  },
  {
    title: 'Job Interview Catastrophizing',
    content: {
      situation: 'I have a final interview tomorrow for my dream job at a tech startup. It\'s with the founder and two senior engineers.',
      automatic_thought: 'They\'ll ask me technical questions I can\'t answer and realize I\'m not qualified. I\'ll never get another opportunity like this.',
      emotion: 'panicked',
      intensity: 8,
      evidence_for: 'The technical requirements are extensive. There might be areas I haven\'t worked with recently. Competition is fierce in tech.',
      evidence_against: 'They invited me to the final round, which means they already see potential in me. I\'ve successfully completed two previous interview rounds. My portfolio demonstrates my skills. I\'ve been preparing thoroughly and practicing coding problems.',
      balanced_thought: 'While I may not know everything, I have valuable skills and experience. They wouldn\'t have brought me to the final round if they didn\'t think I was qualified. I can be honest about what I don\'t know and show my willingness to learn.',
      new_emotion: 'nervous but confident',
      new_intensity: 4
    },
    status: 'in_progress'
  },
  {
    title: 'Relationship Conflict Misinterpretation',
    content: {
      situation: 'My partner came home from work yesterday and seemed distant. They went straight to their computer and barely talked to me all evening.',
      automatic_thought: 'They\'re losing interest in our relationship. They probably want to break up but don\'t know how to tell me.',
      emotion: 'devastated',
      intensity: 8,
      evidence_for: 'They were quieter than usual and didn\'t want to watch our usual show together.',
      evidence_against: 'They mentioned having a really stressful day at work with a difficult client. They\'ve been working on a big project with a tight deadline. When I asked if they were okay, they said they were just tired. They still kissed me goodnight.',
      balanced_thought: 'My partner was probably just having a tough day at work and needed some space to decompress. One quiet evening doesn\'t mean they want to end our relationship. I can check in with them tomorrow when they\'re less stressed.',
      new_emotion: 'concerned but understanding',
      new_intensity: 3
    },
    status: 'completed'
  },
  {
    title: 'Health Anxiety Spiral',
    content: {
      situation: 'I found a small lump on my neck this morning and have to wait until next Friday for a doctor\'s appointment.',
      automatic_thought: 'This is definitely cancer. I\'m going to die and leave my family behind. The doctor will confirm my worst fears.',
      emotion: 'terrified',
      intensity: 10,
      evidence_for: 'Lumps can sometimes be serious. Cancer can affect anyone at any age.',
      evidence_against: 'Most lumps are benign, especially in young people. I have no other symptoms. My family has no history of this type of cancer. I\'m generally healthy and take good care of myself. Early detection leads to better outcomes if there is an issue.',
      balanced_thought: 'While it\'s natural to be concerned about health changes, most lumps are harmless. Getting it checked by a doctor is the right thing to do. Worrying excessively won\'t change the outcome, but it will make this week miserable.',
      new_emotion: 'concerned but rational',
      new_intensity: 5
    },
    status: 'in_progress'
  },
  {
    title: 'Academic Perfectionism',
    content: {
      situation: 'I got a B+ on my midterm exam in my most important class. I studied for weeks and was hoping for an A.',
      automatic_thought: 'I\'m not smart enough for this program. I\'ll never get into graduate school with grades like this. I\'m a failure.',
      emotion: 'devastated',
      intensity: 8,
      evidence_for: 'I studied really hard and still didn\'t get the grade I wanted. Graduate school is very competitive.',
      evidence_against: 'B+ is still a good grade that most students would be happy with. I have A\'s in my other classes. One exam doesn\'t determine my entire future. I can learn from my mistakes and improve on the final.',
      balanced_thought: 'While I\'m disappointed, a B+ shows I understand the material well. I can use this as motivation to adjust my study strategies. My worth isn\'t determined by one grade.',
      new_emotion: 'disappointed but motivated',
      new_intensity: 4
    },
    status: 'assigned'
  },
  {
    title: 'Social Media Comparison',
    content: {
      situation: 'I was scrolling through Instagram and saw that several of my college friends just got promoted, bought houses, or got engaged.',
      automatic_thought: 'Everyone else is more successful than me. I\'m behind in life and will never catch up. I\'m a loser.',
      emotion: 'inadequate',
      intensity: 7,
      evidence_for: 'Some of my friends do seem to be achieving major milestones. I\'m still renting and single.',
      evidence_against: 'Social media only shows people\'s highlights, not their struggles. I\'m doing well in my career and have grown a lot personally. Everyone has their own timeline. I have close friendships and hobbies I enjoy.',
      balanced_thought: 'Comparing my behind-the-scenes to others\' highlight reels isn\'t fair to myself. I\'m on my own path and making progress in ways that matter to me. Success looks different for everyone.',
      new_emotion: 'reflective',
      new_intensity: 3
    },
    status: 'completed'
  },
  {
    title: 'Work Performance Review Anxiety',
    content: {
      situation: 'My annual performance review is next week and my manager scheduled a 90-minute meeting instead of the usual 30 minutes.',
      automatic_thought: 'They\'re going to fire me. The longer meeting means they have a lot of negative feedback. I must have done something terribly wrong.',
      emotion: 'panicked',
      intensity: 9,
      evidence_for: 'The meeting is longer than usual. My manager seemed serious when scheduling it.',
      evidence_against: 'I\'ve received positive feedback throughout the year. I completed all my major projects successfully. My manager has been giving me more responsibilities lately. Longer reviews might just mean more comprehensive feedback.',
      balanced_thought: 'A longer meeting could mean many things, including more detailed feedback or discussion of future opportunities. I should prepare for the review and focus on my accomplishments rather than assuming the worst.',
      new_emotion: 'nervous but prepared',
      new_intensity: 4
    },
    status: 'in_progress'
  }
]

// Comprehensive psychometric assessments
const samplePsychometricForms = [
  {
    form_type: 'phq9',
    title: 'Patient Health Questionnaire-9 (PHQ-9)',
    description: 'A 9-item depression screening tool that measures the severity of depression symptoms over the past two weeks.',
    questions: [
      {
        id: 'phq9_1',
        text: 'Little interest or pleasure in doing things',
        type: 'scale',
        scale_min: 0,
        scale_max: 3,
        scale_labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
      },
      {
        id: 'phq9_2',
        text: 'Feeling down, depressed, or hopeless',
        type: 'scale',
        scale_min: 0,
        scale_max: 3,
        scale_labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
      },
      {
        id: 'phq9_3',
        text: 'Trouble falling or staying asleep, or sleeping too much',
        type: 'scale',
        scale_min: 0,
        scale_max: 3,
        scale_labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
      },
      {
        id: 'phq9_4',
        text: 'Feeling tired or having little energy',
        type: 'scale',
        scale_min: 0,
        scale_max: 3,
        scale_labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
      },
      {
        id: 'phq9_5',
        text: 'Poor appetite or overeating',
        type: 'scale',
        scale_min: 0,
        scale_max: 3,
        scale_labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
      },
      {
        id: 'phq9_6',
        text: 'Feeling bad about yourself - or that you are a failure or have let yourself or your family down',
        type: 'scale',
        scale_min: 0,
        scale_max: 3,
        scale_labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
      },
      {
        id: 'phq9_7',
        text: 'Trouble concentrating on things, such as reading the newspaper or watching television',
        type: 'scale',
        scale_min: 0,
        scale_max: 3,
        scale_labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
      },
      {
        id: 'phq9_8',
        text: 'Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual',
        type: 'scale',
        scale_min: 0,
        scale_max: 3,
        scale_labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
      },
      {
        id: 'phq9_9',
        text: 'Thoughts that you would be better off dead, or of hurting yourself',
        type: 'scale',
        scale_min: 0,
        scale_max: 3,
        scale_labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
      }
    ],
    scoring_method: {
      max_score: 27,
      interpretation: {
        '0-4': 'Minimal depression',
        '5-9': 'Mild depression',
        '10-14': 'Moderate depression',
        '15-19': 'Moderately severe depression',
        '20-27': 'Severe depression'
      }
    }
  },
  {
    form_type: 'gad7',
    title: 'Generalized Anxiety Disorder 7-item (GAD-7)',
    description: 'A 7-item anxiety screening tool that measures the severity of generalized anxiety disorder symptoms.',
    questions: [
      {
        id: 'gad7_1',
        text: 'Feeling nervous, anxious, or on edge',
        type: 'scale',
        scale_min: 0,
        scale_max: 3,
        scale_labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
      },
      {
        id: 'gad7_2',
        text: 'Not being able to stop or control worrying',
        type: 'scale',
        scale_min: 0,
        scale_max: 3,
        scale_labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
      },
      {
        id: 'gad7_3',
        text: 'Worrying too much about different things',
        type: 'scale',
        scale_min: 0,
        scale_max: 3,
        scale_labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
      },
      {
        id: 'gad7_4',
        text: 'Trouble relaxing',
        type: 'scale',
        scale_min: 0,
        scale_max: 3,
        scale_labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
      },
      {
        id: 'gad7_5',
        text: 'Being so restless that it is hard to sit still',
        type: 'scale',
        scale_min: 0,
        scale_max: 3,
        scale_labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
      },
      {
        id: 'gad7_6',
        text: 'Becoming easily annoyed or irritable',
        type: 'scale',
        scale_min: 0,
        scale_max: 3,
        scale_labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
      },
      {
        id: 'gad7_7',
        text: 'Feeling afraid, as if something awful might happen',
        type: 'scale',
        scale_min: 0,
        scale_max: 3,
        scale_labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
      }
    ],
    scoring_method: {
      max_score: 21,
      interpretation: {
        '0-4': 'Minimal anxiety',
        '5-9': 'Mild anxiety',
        '10-14': 'Moderate anxiety',
        '15-21': 'Severe anxiety'
      }
    }
  },
  {
    form_type: 'pcl5',
    title: 'PTSD Checklist for DSM-5 (PCL-5)',
    description: 'A 20-item self-report measure that assesses PTSD symptoms according to DSM-5 criteria.',
    questions: [
      {
        id: 'pcl5_1',
        text: 'Repeated, disturbing, and unwanted memories of the stressful experience',
        type: 'scale',
        scale_min: 0,
        scale_max: 4,
        scale_labels: ['Not at all', 'A little bit', 'Moderately', 'Quite a bit', 'Extremely']
      },
      {
        id: 'pcl5_2',
        text: 'Repeated, disturbing dreams of the stressful experience',
        type: 'scale',
        scale_min: 0,
        scale_max: 4,
        scale_labels: ['Not at all', 'A little bit', 'Moderately', 'Quite a bit', 'Extremely']
      },
      {
        id: 'pcl5_3',
        text: 'Suddenly feeling or acting as if the stressful experience were actually happening again',
        type: 'scale',
        scale_min: 0,
        scale_max: 4,
        scale_labels: ['Not at all', 'A little bit', 'Moderately', 'Quite a bit', 'Extremely']
      }
    ],
    scoring_method: {
      max_score: 80,
      interpretation: {
        '0-32': 'Minimal PTSD symptoms',
        '33-49': 'Mild PTSD symptoms',
        '50-64': 'Moderate PTSD symptoms',
        '65-80': 'Severe PTSD symptoms'
      }
    }
  },
  {
    form_type: 'dass21',
    title: 'Depression, Anxiety and Stress Scale-21 (DASS-21)',
    description: 'A 21-item measure designed to assess the emotional states of depression, anxiety and stress.',
    questions: [
      {
        id: 'dass21_1',
        text: 'I found it hard to wind down',
        type: 'scale',
        scale_min: 0,
        scale_max: 3,
        scale_labels: ['Did not apply to me at all', 'Applied to me to some degree', 'Applied to me to a considerable degree', 'Applied to me very much']
      },
      {
        id: 'dass21_2',
        text: 'I was aware of dryness of my mouth',
        type: 'scale',
        scale_min: 0,
        scale_max: 3,
        scale_labels: ['Did not apply to me at all', 'Applied to me to some degree', 'Applied to me to a considerable degree', 'Applied to me very much']
      }
    ],
    scoring_method: {
      max_score: 63,
      interpretation: {
        depression: { '0-9': 'Normal', '10-13': 'Mild', '14-20': 'Moderate', '21-27': 'Severe', '28+': 'Extremely severe' },
        anxiety: { '0-7': 'Normal', '8-9': 'Mild', '10-14': 'Moderate', '15-19': 'Severe', '20+': 'Extremely severe' },
        stress: { '0-14': 'Normal', '15-18': 'Mild', '19-25': 'Moderate', '26-33': 'Severe', '34+': 'Extremely severe' }
      }
    }
  }
]

// Enhanced therapeutic exercises
const sampleExercises = [
  {
    exercise_type: 'breathing',
    title: '4-7-8 Breathing Technique',
    description: 'A powerful breathing exercise to reduce anxiety and promote relaxation. Inhale for 4, hold for 7, exhale for 8.',
    game_config: {
      inhale_duration: 4,
      hold_duration: 7,
      exhale_duration: 8,
      pause_duration: 2,
      target_cycles: 8,
      background_sounds: ['ocean', 'forest', 'rain'],
      guided_voice: true
    }
  },
  {
    exercise_type: 'breathing',
    title: 'Box Breathing for Focus',
    description: 'Equal-count breathing technique used by Navy SEALs to maintain calm and focus under pressure.',
    game_config: {
      inhale_duration: 4,
      hold_duration: 4,
      exhale_duration: 4,
      pause_duration: 4,
      target_cycles: 10,
      background_sounds: ['silence', 'white_noise'],
      guided_voice: false
    }
  },
  {
    exercise_type: 'mindfulness',
    title: 'Body Scan Meditation',
    description: 'A guided mindfulness practice that helps you develop awareness of physical sensations and release tension.',
    game_config: {
      session_duration: 900, // 15 minutes
      guided_steps: 12,
      background_sounds: ['nature', 'ambient'],
      body_parts: ['feet', 'legs', 'torso', 'arms', 'head'],
      voice_guidance: true
    }
  },
  {
    exercise_type: 'mindfulness',
    title: '5-4-3-2-1 Grounding Technique',
    description: 'A sensory-based mindfulness exercise to help manage anxiety and stay present in the moment.',
    game_config: {
      session_duration: 300, // 5 minutes
      guided_steps: 5,
      sensory_prompts: {
        sight: 'Name 5 things you can see',
        touch: 'Name 4 things you can touch',
        hearing: 'Name 3 things you can hear',
        smell: 'Name 2 things you can smell',
        taste: 'Name 1 thing you can taste'
      }
    }
  },
  {
    exercise_type: 'cognitive_restructuring',
    title: 'Thought Detective Challenge',
    description: 'Interactive scenarios to practice identifying cognitive distortions and developing balanced thinking patterns.',
    game_config: {
      scenarios: 8,
      difficulty: 'progressive',
      cognitive_distortions: [
        'all_or_nothing',
        'catastrophizing',
        'mind_reading',
        'fortune_telling',
        'emotional_reasoning',
        'should_statements'
      ],
      feedback_enabled: true,
      progress_tracking: true
    }
  },
  {
    exercise_type: 'cognitive_restructuring',
    title: 'Evidence Examination Workshop',
    description: 'Learn to evaluate evidence for and against negative thoughts in realistic scenarios.',
    game_config: {
      scenarios: 6,
      difficulty: 'intermediate',
      focus_areas: ['work_stress', 'relationships', 'health_anxiety', 'social_situations'],
      feedback_enabled: true,
      reflection_prompts: true
    }
  },
  {
    exercise_type: 'progressive_relaxation',
    title: 'Progressive Muscle Relaxation',
    description: 'Systematic tensing and relaxing of muscle groups to reduce physical tension and stress.',
    game_config: {
      session_duration: 1200, // 20 minutes
      muscle_groups: [
        'feet_and_calves',
        'thighs_and_glutes',
        'abdomen',
        'hands_and_arms',
        'shoulders_and_neck',
        'face_and_scalp'
      ],
      tension_duration: 5,
      relaxation_duration: 15,
      background_music: true
    }
  },
  {
    exercise_type: 'visualization',
    title: 'Safe Place Visualization',
    description: 'Create and visit a mental safe space for relaxation and emotional regulation.',
    game_config: {
      session_duration: 600, // 10 minutes
      guided_imagery: true,
      customizable_elements: ['location', 'weather', 'sounds', 'companions'],
      save_visualization: true,
      background_sounds: ['nature', 'ambient', 'silence']
    }
  }
]

// Comprehensive client profiles with detailed information
function generateDetailedClientProfile(client) {
  const profiles = [
    {
      emergency_contact_name: 'Sarah Thompson',
      emergency_contact_phone: '(555) 123-4567',
      emergency_contact_relationship: 'Sister',
      medical_history: 'No significant medical history. Occasional tension headaches related to stress. No psychiatric hospitalizations.',
      current_medications: 'Multivitamin daily. Occasional ibuprofen for headaches.',
      presenting_concerns: 'Work-related anxiety and stress management. Difficulty with public speaking and presentations. Imposter syndrome in new role. Sleep disturbances due to work worry.',
      therapy_history: 'First time seeking therapy. Has read self-help books on anxiety management.',
      risk_level: 'low',
      notes: 'Highly motivated client with good insight. Responds well to CBT techniques. Strong support system. Excellent homework compliance. Shows consistent progress in anxiety management.'
    },
    {
      emergency_contact_name: 'Carlos Garcia',
      emergency_contact_phone: '(555) 234-5678',
      emergency_contact_relationship: 'Husband',
      medical_history: 'History of migraines, well-controlled with medication. No other significant medical issues.',
      current_medications: 'Sumatriptan as needed for migraines (2-3 times per month)',
      presenting_concerns: 'Major depressive episode following job loss 3 months ago. Sleep disturbances (early morning awakening). Decreased appetite and energy. Feelings of worthlessness and guilt.',
      therapy_history: 'Previous therapy 5 years ago for grief counseling after father\'s death. Found it helpful.',
      risk_level: 'moderate',
      notes: 'Experiencing significant life stressors but has good therapeutic alliance. Supportive spouse. Responding well to behavioral activation techniques. Monitor mood closely.'
    },
    {
      emergency_contact_name: 'Emily Wilson',
      emergency_contact_phone: '(555) 345-6789',
      emergency_contact_relationship: 'Wife',
      medical_history: 'Type 2 diabetes, well-managed with medication and diet. No psychiatric hospitalizations. Family history of anxiety disorders.',
      current_medications: 'Metformin 500mg twice daily for diabetes',
      presenting_concerns: 'Generalized anxiety disorder with excessive worry about health, family safety, and work performance. Physical symptoms include muscle tension and fatigue.',
      therapy_history: 'Brief counseling in college for adjustment issues. No formal therapy for anxiety.',
      risk_level: 'low',
      notes: 'Highly motivated and practices homework assignments consistently. Good insight into anxiety patterns. Benefits from psychoeducation about anxiety physiology.'
    },
    {
      emergency_contact_name: 'Michael Brown',
      emergency_contact_phone: '(555) 456-7890',
      emergency_contact_relationship: 'Brother',
      medical_history: 'No significant medical history. Occasional social drinking (2-3 drinks per week).',
      current_medications: 'Daily multivitamin',
      presenting_concerns: 'Social anxiety disorder with fear of negative evaluation. Avoidance of social situations and dating. Difficulty making friends and maintaining relationships.',
      therapy_history: 'No previous therapy experience. Some hesitation about therapy initially.',
      risk_level: 'low',
      notes: 'Initially hesitant but warming up to therapy process. Benefits from gradual exposure exercises. Strong family support system. Making steady progress with social skills.'
    },
    {
      emergency_contact_name: 'Susan Lee',
      emergency_contact_phone: '(555) 567-8901',
      emergency_contact_relationship: 'Mother',
      medical_history: 'History of panic attacks beginning 2 years ago. No other medical issues. No substance use.',
      current_medications: 'None currently (previously tried sertraline but discontinued due to side effects)',
      presenting_concerns: 'Panic disorder with agoraphobia. Avoidance of driving, crowded places, and being far from home. Significant impact on work and social functioning.',
      therapy_history: 'Previous therapy with limited success (therapist moved). Some exposure work attempted.',
      risk_level: 'moderate',
      notes: 'Complex case requiring gradual exposure work. High motivation but significant avoidance patterns. Needs careful pacing of interventions. Strong family support.'
    },
    {
      emergency_contact_name: 'Robert Davis',
      emergency_contact_phone: '(555) 678-9012',
      emergency_contact_relationship: 'Father',
      medical_history: 'Hypothyroidism, treated with levothyroxine. Regular medical monitoring. No psychiatric history.',
      current_medications: 'Levothyroxine 75mcg daily',
      presenting_concerns: 'Work-life balance issues and burnout. Perfectionism leading to overwork and stress. Difficulty setting boundaries with colleagues and clients.',
      therapy_history: 'No previous therapy. High-achieving professional learning to manage stress.',
      risk_level: 'low',
      notes: 'High-achieving professional learning to set boundaries. Responds well to cognitive restructuring for perfectionism. Good insight and motivation for change.'
    },
    {
      emergency_contact_name: 'James Miller',
      emergency_contact_phone: '(555) 789-0123',
      emergency_contact_relationship: 'Son',
      medical_history: 'PTSD following workplace accident 8 months ago. Some chronic pain from injuries. Sleep disturbances.',
      current_medications: 'Ibuprofen as needed for pain. Sleep aid occasionally.',
      presenting_concerns: 'PTSD symptoms including intrusive memories, nightmares, hypervigilance, and avoidance of work-related triggers. Depression and irritability.',
      therapy_history: 'No previous therapy. Some resistance to treatment initially.',
      risk_level: 'moderate',
      notes: 'Trauma-focused treatment needed. Building trust and safety first. Gradual introduction of trauma processing techniques. Monitor for depression and substance use.'
    },
    {
      emergency_contact_name: 'Patricia Anderson',
      emergency_contact_phone: '(555) 890-1234',
      emergency_contact_relationship: 'Mother',
      medical_history: 'No significant medical history. Generally healthy lifestyle.',
      current_medications: 'Birth control pill',
      presenting_concerns: 'Academic stress and social anxiety in graduate program. Perfectionism and fear of failure. Difficulty with peer relationships and networking.',
      therapy_history: 'Brief counseling in undergraduate for test anxiety.',
      risk_level: 'low',
      notes: 'Bright and motivated student. Benefits from stress management techniques and social skills training. Good response to CBT interventions for perfectionism.'
    },
    {
      emergency_contact_name: 'Linda Taylor',
      emergency_contact_phone: '(555) 901-2345',
      emergency_contact_relationship: 'Wife',
      medical_history: 'History of alcohol use disorder, 18 months sober. Attends AA meetings regularly. Depression history.',
      current_medications: 'None (prefers non-medication approaches)',
      presenting_concerns: 'Maintaining sobriety while managing depression and work stress. Relationship issues related to past substance use. Building healthy coping strategies.',
      therapy_history: 'Previous addiction counseling and group therapy. Some individual therapy during early recovery.',
      risk_level: 'moderate',
      notes: 'Strong commitment to recovery. Active in AA. Needs ongoing support for depression management. Monitor for relapse triggers. Good insight and motivation.'
    },
    {
      emergency_contact_name: 'David White',
      emergency_contact_phone: '(555) 012-3456',
      emergency_contact_relationship: 'Husband',
      medical_history: 'No significant medical history. Regular exercise routine.',
      current_medications: 'Prenatal vitamins (trying to conceive)',
      presenting_concerns: 'Work burnout and relationship stress. Difficulty balancing career demands with personal life. Communication issues with spouse about family planning.',
      therapy_history: 'No previous individual therapy. Some couples counseling 2 years ago.',
      risk_level: 'low',
      notes: 'Motivated to make changes. Benefits from stress management and communication skills training. Considering couples therapy referral for family planning discussions.'
    }
  ]
  
  return profiles[Math.floor(Math.random() * profiles.length)]
}

// Treatment plans with comprehensive goals
const sampleTreatmentPlans = [
  {
    title: 'Anxiety Management and Coping Skills Development',
    case_formulation: 'Client presents with work-related anxiety stemming from perfectionist beliefs and fear of negative evaluation. Symptoms include physical tension, sleep disturbances, and avoidance of challenging work situations. CBT approach focusing on cognitive restructuring and exposure exercises.',
    treatment_approach: 'Cognitive Behavioral Therapy (CBT) with mindfulness-based interventions',
    estimated_duration: '12-16 sessions over 4-6 months',
    goals: [
      {
        goal_text: 'Reduce anxiety symptoms by 50% as measured by GAD-7 scores',
        target_date: '2024-06-01',
        progress_percentage: 65
      },
      {
        goal_text: 'Complete at least 2 work presentations without significant distress',
        target_date: '2024-05-15',
        progress_percentage: 40
      },
      {
        goal_text: 'Implement daily mindfulness practice for stress management',
        target_date: '2024-04-01',
        progress_percentage: 80
      }
    ]
  },
  {
    title: 'Depression Recovery and Behavioral Activation',
    case_formulation: 'Client experiencing major depressive episode following job loss. Symptoms include low mood, decreased energy, sleep disturbances, and social withdrawal. Treatment focuses on behavioral activation and cognitive restructuring.',
    treatment_approach: 'Behavioral Activation with Cognitive Behavioral Therapy elements',
    estimated_duration: '16-20 sessions over 6-8 months',
    goals: [
      {
        goal_text: 'Achieve remission of depressive symptoms (PHQ-9 score < 5)',
        target_date: '2024-08-01',
        progress_percentage: 30
      },
      {
        goal_text: 'Engage in 3-4 meaningful activities per week',
        target_date: '2024-05-01',
        progress_percentage: 55
      },
      {
        goal_text: 'Develop job search strategy and complete 5 applications per week',
        target_date: '2024-06-01',
        progress_percentage: 25
      }
    ]
  }
]

// Session notes templates
const sampleSessionNotes = [
  {
    session_type: 'Individual Therapy',
    presenting_issues: 'Client reported increased anxiety about upcoming work presentation. Discussed catastrophic thinking patterns and practiced cognitive restructuring techniques.',
    interventions_used: 'Cognitive restructuring, thought record completion, relaxation breathing exercises, homework assignment for exposure practice.',
    client_response: 'Client engaged well in session and demonstrated good understanding of cognitive distortions. Completed thought record with minimal prompting. Expressed willingness to practice presentation.',
    homework_assigned: 'Complete daily thought records for work-related anxiety. Practice presentation in front of mirror 3 times this week. Use 4-7-8 breathing technique before meetings.',
    progress_notes: 'Client showing steady progress in identifying and challenging anxious thoughts. Increased confidence in using coping strategies. Ready for graduated exposure exercises.',
    risk_assessment: 'No current safety concerns. Client has good support system and coping resources.',
    next_session_plan: 'Review homework completion, continue exposure exercises with presentation practice, introduce mindfulness techniques for performance anxiety.'
  }
]

async function createUser(userData) {
  console.log(`Creating user: ${userData.email}`)
  
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true
    })

    if (authError) {
      console.error(`Error creating auth user ${userData.email}:`, authError)
      return null
    }

    // Create profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role
      })
      .select()
      .single()

    if (profileError) {
      console.error(`Error creating profile for ${userData.email}:`, profileError)
      return null
    }

    console.log(`✅ Created ${userData.role}: ${userData.first_name} ${userData.last_name}`)
    return profileData
  } catch (error) {
    console.error(`Error creating user ${userData.email}:`, error)
    return null
  }
}

async function createTherapistClientRelation(therapistId, clientId) {
  try {
    const { error } = await supabase
      .from('therapist_client_relations')
      .insert({
        therapist_id: therapistId,
        client_id: clientId
      })

    if (error) {
      console.error('Error creating therapist-client relation:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error creating therapist-client relation:', error)
    return false
  }
}

async function createClientProfile(therapistId, clientId, profileData) {
  try {
    const { error } = await supabase
      .from('client_profiles')
      .insert({
        client_id: clientId,
        therapist_id: therapistId,
        emergency_contact_name: profileData.emergency_contact_name,
        emergency_contact_phone: profileData.emergency_contact_phone,
        emergency_contact_relationship: profileData.emergency_contact_relationship,
        medical_history: profileData.medical_history,
        current_medications: profileData.current_medications,
        presenting_concerns: profileData.presenting_concerns,
        therapy_history: profileData.therapy_history,
        risk_level: profileData.risk_level,
        notes: profileData.notes
      })

    if (error) {
      console.error('Error creating client profile:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error creating client profile:', error)
    return false
  }
}

async function createTreatmentPlan(therapistId, clientId, planData) {
  try {
    const { data: treatmentPlan, error } = await supabase
      .from('treatment_plans')
      .insert({
        therapist_id: therapistId,
        client_id: clientId,
        title: planData.title,
        case_formulation: planData.case_formulation,
        treatment_approach: planData.treatment_approach,
        estimated_duration: planData.estimated_duration,
        status: 'active'
      })
      .select()
      .single()

    if (error) throw error

    // Create goals for the treatment plan
    if (planData.goals && planData.goals.length > 0) {
      const goals = planData.goals.map(goal => ({
        treatment_plan_id: treatmentPlan.id,
        goal_text: goal.goal_text,
        target_date: goal.target_date,
        progress_percentage: goal.progress_percentage,
        status: goal.progress_percentage >= 100 ? 'achieved' : 'active'
      }))

      await supabase
        .from('therapy_goals')
        .insert(goals)
    }

    return true
  } catch (error) {
    console.error('Error creating treatment plan:', error)
    return false
  }
}

async function createAppointment(therapistId, clientId, appointmentData) {
  try {
    const { error } = await supabase
      .from('appointments')
      .insert({
        therapist_id: therapistId,
        client_id: clientId,
        appointment_date: appointmentData.appointment_date,
        duration_minutes: appointmentData.duration_minutes || 50,
        appointment_type: appointmentData.appointment_type || 'individual',
        status: appointmentData.status || 'scheduled',
        notes: appointmentData.notes
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error creating appointment:', error)
    return false
  }
}

async function createSessionNote(therapistId, clientId, appointmentId, noteData) {
  try {
    const { error } = await supabase
      .from('session_notes')
      .insert({
        appointment_id: appointmentId,
        therapist_id: therapistId,
        client_id: clientId,
        session_type: noteData.session_type,
        presenting_issues: noteData.presenting_issues,
        interventions_used: noteData.interventions_used,
        client_response: noteData.client_response,
        homework_assigned: noteData.homework_assigned,
        progress_notes: noteData.progress_notes,
        risk_assessment: noteData.risk_assessment,
        next_session_plan: noteData.next_session_plan
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error creating session note:', error)
    return false
  }
}

async function createWorksheet(therapistId, clientId, worksheetData) {
  try {
    const { error } = await supabase
      .from('cbt_worksheets')
      .insert({
        therapist_id: therapistId,
        client_id: clientId,
        type: 'thought_record',
        title: worksheetData.title,
        content: worksheetData.content,
        status: worksheetData.status
      })

    if (error) {
      console.error('Error creating worksheet:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error creating worksheet:', error)
    return false
  }
}

async function createPsychometricForm(therapistId, clientId, formData) {
  try {
    const responses = {}
    let score = 0

    // Generate realistic responses for completed forms
    if (Math.random() > 0.2) { // 80% chance of completion
      formData.questions.forEach(question => {
        if (question.type === 'scale') {
          // Generate more realistic response patterns
          let response
          if (formData.form_type === 'phq9') {
            // Depression scores tend to be lower on average
            response = Math.random() < 0.6 ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * (question.scale_max + 1))
          } else if (formData.form_type === 'gad7') {
            // Anxiety scores with some variation
            response = Math.random() < 0.5 ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * (question.scale_max + 1))
          } else {
            response = Math.floor(Math.random() * (question.scale_max + 1))
          }
          responses[question.id] = response
          score += response
        }
      })
    }

    const status = Object.keys(responses).length > 0 ? 'completed' : 'assigned'

    const { error } = await supabase
      .from('psychometric_forms')
      .insert({
        therapist_id: therapistId,
        client_id: clientId,
        form_type: formData.form_type,
        title: formData.title,
        questions: formData.questions,
        responses: responses,
        score: score,
        status: status,
        completed_at: status === 'completed' ? new Date().toISOString() : null
      })

    if (error) {
      console.error('Error creating psychometric form:', error)
      return false
    }

    // Add to progress tracking if completed
    if (status === 'completed') {
      await supabase
        .from('progress_tracking')
        .insert({
          client_id: clientId,
          metric_type: formData.form_type,
          value: score,
          source_type: 'psychometric',
          recorded_at: new Date().toISOString()
        })
    }

    return true
  } catch (error) {
    console.error('Error creating psychometric form:', error)
    return false
  }
}

async function createTherapeuticExercise(therapistId, clientId, exerciseData) {
  try {
    const progress = {}
    let status = 'assigned'

    // Generate realistic progress for some exercises
    if (Math.random() > 0.3) { // 70% chance of some progress
      switch (exerciseData.exercise_type) {
        case 'breathing':
          progress.cycles = Math.floor(Math.random() * 20) + 5
          progress.totalTime = Math.floor(Math.random() * 900) + 300
          progress.sessionsCompleted = Math.floor(Math.random() * 10) + 1
          status = progress.cycles >= 15 ? 'completed' : 'in_progress'
          break
        case 'mindfulness':
          progress.sessionsCompleted = Math.floor(Math.random() * 8) + 1
          progress.totalMindfulTime = Math.floor(Math.random() * 3600) + 600
          progress.averageSessionLength = Math.floor(progress.totalMindfulTime / progress.sessionsCompleted)
          status = progress.sessionsCompleted >= 5 ? 'completed' : 'in_progress'
          break
        case 'cognitive_restructuring':
          progress.score = Math.floor(Math.random() * 60) + 40
          progress.scenariosCompleted = Math.floor(Math.random() * 8) + 3
          progress.accuracy = Math.floor(Math.random() * 30) + 70
          progress.improvementRate = Math.floor(Math.random() * 20) + 10
          status = progress.scenariosCompleted >= 6 ? 'completed' : 'in_progress'
          break
        case 'progressive_relaxation':
          progress.sessionsCompleted = Math.floor(Math.random() * 6) + 1
          progress.averageRelaxationLevel = Math.floor(Math.random() * 3) + 7 // 7-10 scale
          progress.totalPracticeTime = Math.floor(Math.random() * 1800) + 600
          status = progress.sessionsCompleted >= 4 ? 'completed' : 'in_progress'
          break
        case 'visualization':
          progress.sessionsCompleted = Math.floor(Math.random() * 5) + 1
          progress.visualizationsSaved = Math.floor(Math.random() * 3) + 1
          progress.averageVividness = Math.floor(Math.random() * 3) + 7 // 7-10 scale
          status = progress.sessionsCompleted >= 3 ? 'completed' : 'in_progress'
          break
      }
    }

    const { error } = await supabase
      .from('therapeutic_exercises')
      .insert({
        therapist_id: therapistId,
        client_id: clientId,
        exercise_type: exerciseData.exercise_type,
        title: exerciseData.title,
        description: exerciseData.description,
        game_config: exerciseData.game_config,
        progress: progress,
        status: status,
        last_played_at: status !== 'assigned' ? new Date().toISOString() : null
      })

    if (error) {
      console.error('Error creating therapeutic exercise:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error creating therapeutic exercise:', error)
    return false
  }
}

async function populateAssessmentLibrary() {
  try {
    console.log('Populating assessment library...')
    
    for (const assessment of samplePsychometricForms) {
      const { error } = await supabase
        .from('assessment_library')
        .insert({
          name: assessment.title,
          abbreviation: assessment.form_type.toUpperCase(),
          category: assessment.form_type.includes('phq') ? 'depression' : 
                   assessment.form_type.includes('gad') ? 'anxiety' :
                   assessment.form_type.includes('pcl') ? 'trauma' : 'general',
          description: assessment.description,
          questions: assessment.questions,
          scoring_method: assessment.scoring_method,
          interpretation_guide: assessment.scoring_method.interpretation || {},
          is_active: true
        })

      if (error) {
        console.error('Error inserting assessment:', error)
      } else {
        console.log(`✅ Added assessment: ${assessment.title}`)
      }
    }
  } catch (error) {
    console.error('Error populating assessment library:', error)
  }
}

function getRandomWorksheet() {
  return sampleWorksheetContents[Math.floor(Math.random() * sampleWorksheetContents.length)]
}

function getRandomPsychometricForm() {
  return samplePsychometricForms[Math.floor(Math.random() * samplePsychometricForms.length)]
}

function getRandomExercise() {
  return sampleExercises[Math.floor(Math.random() * sampleExercises.length)]
}

function getRandomTreatmentPlan() {
  return sampleTreatmentPlans[Math.floor(Math.random() * sampleTreatmentPlans.length)]
}

function generateAppointments(therapistId, clientId, startDate, numAppointments) {
  const appointments = []
  const currentDate = new Date(startDate)
  
  for (let i = 0; i < numAppointments; i++) {
    // Schedule appointments weekly
    const appointmentDate = new Date(currentDate)
    appointmentDate.setDate(appointmentDate.getDate() + (i * 7))
    
    const status = appointmentDate < new Date() ? 'completed' : 'scheduled'
    
    appointments.push({
      appointment_date: appointmentDate.toISOString(),
      duration_minutes: 50,
      appointment_type: 'individual',
      status: status,
      notes: status === 'completed' ? 'Session completed successfully' : null
    })
  }
  
  return appointments
}

async function generateDemoData() {
  console.log('🚀 Starting comprehensive demo data generation for CogniFlow...\n')
  console.log('📊 This will create a realistic therapy practice with:')
  console.log('   • Multiple therapists with specializations')
  console.log('   • Diverse client roster with detailed profiles')
  console.log('   • Comprehensive assessment library')
  console.log('   • Treatment plans with measurable goals')
  console.log('   • Session notes and appointment history')
  console.log('   • Progress tracking data')
  console.log('   • Interactive therapeutic exercises\n')

  try {
    // Populate assessment library first
    await populateAssessmentLibrary()

    // Create therapists
    console.log('👨‍⚕️ Creating therapist accounts...')
    const createdTherapists = []
    for (const therapist of therapists) {
      const profile = await createUser(therapist)
      if (profile) {
        createdTherapists.push({ ...profile, ...therapist })
      }
    }

    // Create clients
    console.log('\n👤 Creating client accounts...')
    const createdClients = []
    for (const client of clients) {
      const profile = await createUser(client)
      if (profile) {
        createdClients.push({ ...profile, ...client })
      }
    }

    // Create comprehensive therapist-client relationships
    console.log('\n🔗 Creating therapist-client relationships...')
    const relationships = [
      // Dr. Sarah Johnson (Anxiety specialist) - 3 clients
      { therapistIndex: 0, clientIndices: [0, 1, 7] }, // Alex, Maria, Sarah
      
      // Dr. Michael Chen (Depression specialist) - 3 clients  
      { therapistIndex: 1, clientIndices: [1, 2, 8] }, // Maria, James, Michael
      
      // Dr. Emily Rodriguez (Trauma specialist) - 2 clients
      { therapistIndex: 2, clientIndices: [6, 9] }, // Robert, Amanda
      
      // Dr. James Williams (Addiction specialist) - 2 clients
      { therapistIndex: 3, clientIndices: [8, 4] }, // Michael, David
      
      // Dr. Lisa Martinez (Family therapy) - 3 clients
      { therapistIndex: 4, clientIndices: [3, 5, 9] }, // Lisa, Jennifer, Amanda
    ]

    let totalRelationships = 0
    for (const rel of relationships) {
      if (createdTherapists[rel.therapistIndex]) {
        const therapist = createdTherapists[rel.therapistIndex]
        
        for (const clientIndex of rel.clientIndices) {
          if (createdClients[clientIndex]) {
            const client = createdClients[clientIndex]
            
            // Create relationship
            const relationSuccess = await createTherapistClientRelation(therapist.id, client.id)
            
            if (relationSuccess) {
              console.log(`✅ Connected ${therapist.first_name} ${therapist.last_name} (${therapist.specialization}) with ${client.first_name} ${client.last_name}`)
              
              // Create detailed client profile
              const clientProfile = generateDetailedClientProfile(client)
              await createClientProfile(therapist.id, client.id, clientProfile)
              
              // Create treatment plan
              const treatmentPlan = getRandomTreatmentPlan()
              await createTreatmentPlan(therapist.id, client.id, treatmentPlan)
              
              // Create appointment history (past 3 months)
              const startDate = new Date()
              startDate.setMonth(startDate.getMonth() - 3)
              const appointments = generateAppointments(therapist.id, client.id, startDate, 12)
              
              for (const appointment of appointments) {
                const appointmentCreated = await createAppointment(therapist.id, client.id, appointment)
                
                // Create session notes for completed appointments
                if (appointmentCreated && appointment.status === 'completed') {
                  const sessionNote = sampleSessionNotes[0] // Use template
                  await createSessionNote(therapist.id, client.id, null, sessionNote)
                }
              }
              
              totalRelationships++
            }
          }
        }
      }
    }

    // Create CBT worksheets with realistic distribution
    console.log('\n📝 Creating CBT worksheets...')
    let worksheetCount = 0
    
    for (const rel of relationships) {
      if (createdTherapists[rel.therapistIndex]) {
        const therapist = createdTherapists[rel.therapistIndex]
        
        for (const clientIndex of rel.clientIndices) {
          if (createdClients[clientIndex]) {
            const client = createdClients[clientIndex]
            
            // Create 3-6 worksheets per client-therapist relationship
            const numWorksheets = Math.floor(Math.random() * 4) + 3
            
            for (let i = 0; i < numWorksheets; i++) {
              const worksheet = getRandomWorksheet()
              const success = await createWorksheet(therapist.id, client.id, worksheet)
              
              if (success) {
                worksheetCount++
                console.log(`✅ Created worksheet "${worksheet.title}" for ${client.first_name} ${client.last_name}`)
              }
            }
          }
        }
      }
    }

    // Create psychometric assessments with realistic timing
    console.log('\n📊 Creating psychometric assessments...')
    let formCount = 0
    
    for (const rel of relationships) {
      if (createdTherapists[rel.therapistIndex]) {
        const therapist = createdTherapists[rel.therapistIndex]
        
        for (const clientIndex of rel.clientIndices) {
          if (createdClients[clientIndex]) {
            const client = createdClients[clientIndex]
            
            // Create 2-4 assessments per client (initial + follow-ups)
            const numForms = Math.floor(Math.random() * 3) + 2
            
            for (let i = 0; i < numForms; i++) {
              const form = getRandomPsychometricForm()
              const success = await createPsychometricForm(therapist.id, client.id, form)
              
              if (success) {
                formCount++
                console.log(`✅ Created assessment "${form.title}" for ${client.first_name} ${client.last_name}`)
              }
            }
          }
        }
      }
    }

    // Create therapeutic exercises
    console.log('\n🎮 Creating therapeutic exercises...')
    let exerciseCount = 0
    
    for (const rel of relationships) {
      if (createdTherapists[rel.therapistIndex]) {
        const therapist = createdTherapists[rel.therapistIndex]
        
        for (const clientIndex of rel.clientIndices) {
          if (createdClients[clientIndex]) {
            const client = createdClients[clientIndex]
            
            // Create 2-4 exercises per client
            const numExercises = Math.floor(Math.random() * 3) + 2
            
            for (let i = 0; i < numExercises; i++) {
              const exercise = getRandomExercise()
              const success = await createTherapeuticExercise(therapist.id, client.id, exercise)
              
              if (success) {
                exerciseCount++
                console.log(`✅ Created exercise "${exercise.title}" for ${client.first_name} ${client.last_name}`)
              }
            }
          }
        }
      }
    }

    console.log('\n🎉 Comprehensive demo data generation completed successfully!')
    console.log('\n📊 DETAILED SUMMARY:')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`👨‍⚕️ THERAPISTS: ${createdTherapists.length} created`)
    createdTherapists.forEach(t => {
      console.log(`   • Dr. ${t.first_name} ${t.last_name} - ${t.specialization}`)
    })
    
    console.log(`\n👤 CLIENTS: ${createdClients.length} created`)
    createdClients.forEach(c => {
      console.log(`   • ${c.first_name} ${c.last_name} (${c.age}) - ${c.occupation}`)
    })
    
    console.log(`\n🔗 RELATIONSHIPS: ${totalRelationships} therapist-client relationships`)
    console.log(`📝 WORKSHEETS: ${worksheetCount} CBT thought record worksheets`)
    console.log(`📊 ASSESSMENTS: ${formCount} psychometric assessments`)
    console.log(`🎮 EXERCISES: ${exerciseCount} therapeutic exercises`)
    console.log(`📚 ASSESSMENT LIBRARY: ${samplePsychometricForms.length} standardized assessments`)

    console.log('\n🔑 LOGIN CREDENTIALS:')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('\n👨‍⚕️ THERAPIST ACCOUNTS:')
    therapists.forEach(t => {
      console.log(`   📧 ${t.email}`)
      console.log(`   🔒 ${t.password}`)
      console.log(`   🎯 Specialization: ${t.specialization}`)
      console.log(`   📅 Experience: ${t.years_experience} years`)
      console.log('')
    })
    
    console.log('👤 CLIENT ACCOUNTS:')
    clients.forEach(c => {
      console.log(`   📧 ${c.email}`)
      console.log(`   🔒 ${c.password}`)
      console.log(`   👔 ${c.occupation} (Age ${c.age})`)
      console.log(`   🎯 ${c.presenting_issue}`)
      console.log('')
    })

    console.log('🌟 FEATURES TO EXPLORE:')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('📊 Therapist Dashboard:')
    console.log('   • Client management with detailed profiles')
    console.log('   • Assessment tools and assignment tracking')
    console.log('   • Treatment planning with measurable goals')
    console.log('   • Progress monitoring and analytics')
    console.log('   • Session management and documentation')
    console.log('')
    console.log('👤 Client Dashboard:')
    console.log('   • Interactive CBT worksheets (thought records)')
    console.log('   • Psychometric assessments (PHQ-9, GAD-7, etc.)')
    console.log('   • Therapeutic exercises (breathing, mindfulness)')
    console.log('   • Progress tracking with visual charts')
    console.log('   • Assignment completion tracking')

    console.log('\n🚀 Ready to explore CogniFlow with comprehensive demo data!')
    console.log('   Visit the application and log in with any of the accounts above.')

  } catch (error) {
    console.error('❌ Error generating comprehensive demo data:', error)
  }
}

// Run the script
generateDemoData()