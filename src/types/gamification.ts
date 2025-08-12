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
  category: string
  difficulty_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  estimated_duration: number
  avg_completion_rate: number
  total_plays: number
  difficulty_weight: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  unlock_criteria: {
    type: 'sessions' | 'score' | 'time' | 'completion'
    value: number
    comparison: 'gte' | 'lte' | 'eq'
  }
  reward_xp: number
  unlocked_at?: string
}

export interface AppSession {
  id: string
  appId: string
  userId: string
  interactionType: 'START' | 'COMPLETE' | 'QUIT' | 'REVIEW'
  sessionDuration?: number
  performanceScore?: number
  metadata?: any
  timestamp: string
}

// App Development Guidelines
export interface AppDevelopmentSpec {
  // Required for all apps
  category: string
  name: string
  description: string
  
  // Technical requirements
  framework: 'react' | 'streamlit' | 'flask' | 'vanilla-js'
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
    leaderboard: boolean
  }
  
  // Accessibility
  accessibility: {
    screen_reader: boolean
    keyboard_navigation: boolean
    high_contrast: boolean
    font_scaling: boolean
  }
}

// Integration Helpers
export const INTEGRATION_ENDPOINTS = {
  // Authentication
  getCurrentUser: () => supabase.auth.getUser(),
  
  // Session Management
  startSession: (appId: string, userId: string) => startAppSession(appId, userId),
  
  completeSession: (appId: string, userId: string, duration: number, score: number, metadata: any) =>
    completeAppSession(appId, userId, duration, score, metadata),
  
  // Progress Tracking
  getProgress: (userId: string, appId: string) =>
    getUserAppProgress(userId, appId),
  
  // Interactions
  logInteraction: (userId: string, appId: string, type: 'START' | 'COMPLETE' | 'QUIT' | 'REVIEW', duration?: number, score?: number, metadata?: any) =>
    logAppInteraction(userId, appId, type, duration, score, metadata)
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