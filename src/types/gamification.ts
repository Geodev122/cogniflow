// Gamification Type Definitions for CogniFlow

export interface GameMechanics {
  points_per_question?: number
  completion_bonus?: number
  streak_multiplier?: number
  level_system?: boolean
  achievements?: boolean
  leaderboard?: boolean
  badges?: boolean
  progress_visualization?: string // 'bar' | 'circle' | 'path' | 'garden' | 'space'
  theme?: string // 'default' | 'space' | 'garden' | 'detective' | 'gym' | 'adventure'
}

export interface AppConfig {
  // Assessment specific
  questions?: number
  scoring_method?: 'sum' | 'average' | 'weighted'
  max_score?: number
  time_limit?: number // in seconds
  
  // Worksheet specific
  sections?: string[]
  guided_mode?: boolean
  auto_save?: boolean
  
  // Exercise specific
  exercise_types?: string[]
  session_length?: number // in seconds
  difficulty_progression?: boolean
  
  // Intake specific
  steps?: number
  progress_visualization?: boolean
  milestone_rewards?: boolean
  
  // Psychoeducation specific
  modules?: string[]
  quiz_mode?: boolean
  certificate_generation?: boolean
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  unlock_criteria: {
    type: 'sessions' | 'score' | 'streak' | 'time' | 'completion'
    value: number
    comparison: 'gte' | 'lte' | 'eq'
  }
  reward_xp: number
  unlocked_at?: string
}

export interface GameSession {
  sessionId: string
  appId: string
  userId: string
  startTime: Date
  currentScore: number
  currentLevel: number
  gameState: any
  events: GameEvent[]
}

export interface GameEvent {
  type: string
  timestamp: Date
  data: any
}

// App Development Guidelines
export interface AppDevelopmentSpec {
  // Required for all apps
  appType: 'assessment' | 'worksheet' | 'exercise' | 'intake' | 'psychoeducation'
  name: string
  description: string
  
  // Technical requirements
  framework: 'react' | 'python-streamlit' | 'python-flask' | 'vanilla-js'
  responsive: boolean
  offline_capable: boolean
  
  // Data requirements
  data_collection: {
    responses: boolean
    timing: boolean
    interactions: boolean
    progress: boolean
  }
  
  // Integration requirements
  supabase_integration: {
    auth: boolean
    realtime: boolean
    storage: boolean
  }
  
  // Gamification features
  gamification: {
    scoring: boolean
    levels: boolean
    achievements: boolean
    progress_tracking: boolean
    social_features: boolean
  }
  
  // Accessibility
  accessibility: {
    screen_reader: boolean
    keyboard_navigation: boolean
    high_contrast: boolean
    font_scaling: boolean
  }
}

// Development Templates
export const APP_TEMPLATES = {
  assessment: {
    required_functions: [
      'initializeAssessment()',
      'submitResponse(questionId, response)',
      'calculateScore()',
      'generateReport()',
      'saveToDatabase()'
    ],
    required_components: [
      'QuestionDisplay',
      'ProgressIndicator', 
      'ScoreVisualization',
      'CompletionCelebration'
    ],
    data_structure: {
      responses: 'Record<string, any>',
      score: 'number',
      interpretation: 'string',
      completion_time: 'number'
    }
  },
  
  worksheet: {
    required_functions: [
      'initializeWorksheet()',
      'saveProgress()',
      'validateCompletion()',
      'exportData()',
      'shareWithTherapist()'
    ],
    required_components: [
      'WorksheetSections',
      'AutoSave',
      'ProgressTracker',
      'CompletionStatus'
    ],
    data_structure: {
      sections: 'Record<string, any>',
      completion_percentage: 'number',
      time_spent: 'number',
      insights: 'string[]'
    }
  },
  
  exercise: {
    required_functions: [
      'startExercise()',
      'trackProgress()',
      'updateGameState()',
      'earnAchievements()',
      'syncProgress()'
    ],
    required_components: [
      'GameInterface',
      'ProgressVisualization',
      'AchievementSystem',
      'LeaderboardDisplay'
    ],
    data_structure: {
      game_state: 'any',
      performance_metrics: 'Record<string, number>',
      achievements: 'string[]',
      level_progress: 'number'
    }
  }
}

// Integration Helpers
export const INTEGRATION_ENDPOINTS = {
  // Authentication
  getCurrentUser: () => supabase.auth.getUser(),
  
  // Session Management
  startSession: (appId: string, userId: string) => 
    supabase.rpc('start_app_session', { p_app_id: appId, p_user_id: userId }),
  
  completeSession: (sessionId: string, score: number, responses: any, gameData: any) =>
    supabase.rpc('complete_app_session', { 
      p_session_id: sessionId, 
      p_score: score, 
      p_responses: responses, 
      p_game_data: gameData 
    }),
  
  // Progress Tracking
  getProgress: (userId: string, appId: string) =>
    supabase.from('app_progress').select('*').eq('user_id', userId).eq('app_id', appId).single(),
  
  // Analytics
  logEvent: (sessionId: string, eventType: string, eventData: any, userId: string, appId: string) =>
    supabase.from('app_analytics').insert({
      session_id: sessionId,
      event_type: eventType,
      event_data: eventData,
      user_id: userId,
      app_id: appId
    })
}

// Development Best Practices
export const DEVELOPMENT_GUIDELINES = {
  // Performance
  performance: {
    max_load_time: '3 seconds',
    smooth_animations: '60fps',
    memory_usage: 'under 100MB',
    battery_efficient: true
  },
  
  // User Experience
  ux: {
    intuitive_navigation: true,
    clear_instructions: true,
    immediate_feedback: true,
    error_recovery: true,
    progress_indication: true
  },
  
  // Data Privacy
  privacy: {
    minimal_data_collection: true,
    encrypted_storage: true,
    user_consent: true,
    data_retention_policy: true
  },
  
  // Clinical Validity
  clinical: {
    evidence_based_design: true,
    validated_instruments: true,
    clinical_review: true,
    outcome_measurement: true
  }
}

// App Deployment Checklist
export const DEPLOYMENT_CHECKLIST = [
  'App functionality tested across devices',
  'Data integration with Supabase verified',
  'Gamification elements working correctly',
  'Progress tracking and analytics implemented',
  'Accessibility features tested',
  'Performance benchmarks met',
  'Security review completed',
  'Clinical validation (if applicable)',
  'User acceptance testing passed',
  'Documentation completed'
]