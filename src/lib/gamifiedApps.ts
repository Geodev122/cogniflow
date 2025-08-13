import { supabase } from './supabase'

export interface GamifiedApp {
  id: string
  app_type: 'assessment' | 'worksheet' | 'exercise' | 'intake' | 'psychoeducation'
  name: string
  description: string
  version: string
  app_config: any
  game_mechanics: any
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  estimated_duration: number
  is_active: boolean
  evidence_based: boolean
  tags: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AppSession {
  id: string
  app_id: string
  user_id: string
  session_type: 'play' | 'assessment' | 'practice' | 'review'
  started_at: string
  completed_at?: string
  duration_seconds?: number
  score: number
  max_score: number
  responses: any
  game_data: any
  completion_status: 'in_progress' | 'completed' | 'abandoned'
  created_at: string
}

export interface AppProgress {
  id: string
  app_id: string
  user_id: string
  total_sessions: number
  total_time_minutes: number
  best_score: number
  average_score: number
  current_level: number
  experience_points: number
  achievements: any[]
  streak_days: number
  last_played_at?: string
  mastery_level: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert'
  created_at: string
  updated_at: string
}

// App Management Functions
export const getGamifiedApps = async (appType?: string) => {
  let query = supabase
    .from('gamified_apps')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (appType) {
    query = query.eq('app_type', appType)
  }

  const { data, error } = await query
  if (error) throw error
  return data as GamifiedApp[]
}

export const startAppSession = async (appId: string, userId: string, sessionType: string = 'play') => {
  const { data, error } = await supabase.rpc('start_app_session', {
    p_app_id: appId,
    p_user_id: userId,
    p_session_type: sessionType
  })
  
  if (error) throw error
  return data as string // session_id
}

export const completeAppSession = async (
  sessionId: string, 
  score: number = 0, 
  responses: any = {}, 
  gameData: any = {}
) => {
  const { error } = await supabase.rpc('complete_app_session', {
    p_session_id: sessionId,
    p_score: score,
    p_responses: responses,
    p_game_data: gameData
  })
  
  if (error) throw error
}

export const getUserAppProgress = async (userId: string, appId?: string) => {
  let query = supabase
    .from('app_progress')
    .select('*')
    .eq('user_id', userId)

  if (appId) {
    query = query.eq('app_id', appId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as AppProgress[]
}

export const getAppRecommendations = async (userId: string) => {
  const { data, error } = await supabase.rpc('get_app_recommendations', {
    p_user_id: userId
  })
  
  if (error) throw error
  return data
}

export const getAppLeaderboard = async (appId: string, limit: number = 10) => {
  const { data, error } = await supabase.rpc('get_app_leaderboard', {
    p_app_id: appId,
    p_limit: limit
  })
  
  if (error) throw error
  return data
}

export const logAppEvent = async (
  sessionId: string,
  eventType: string,
  eventData: any = {},
  userId: string,
  appId: string
) => {
  const { error } = await supabase
    .from('app_analytics')
    .insert({
      session_id: sessionId,
      event_type: eventType,
      event_data: eventData,
      user_id: userId,
      app_id: appId
    })
  
  if (error) throw error
}

// Gamification Helper Functions
export const calculateLevel = (experiencePoints: number): number => {
  // Level formula: level = floor(sqrt(xp / 100)) + 1
  return Math.floor(Math.sqrt(experiencePoints / 100)) + 1
}

export const getXPForNextLevel = (currentLevel: number): number => {
  // XP needed for next level: (level^2) * 100
  return (currentLevel * currentLevel) * 100
}

export const checkAchievements = (progress: AppProgress, session: AppSession): string[] => {
  const newAchievements: string[] = []
  
  // First completion
  if (progress.total_sessions === 1) {
    newAchievements.push('first_completion')
  }
  
  // Perfect score
  if (session.score === session.max_score) {
    newAchievements.push('perfect_score')
  }
  
  // Streak achievements
  if (progress.streak_days >= 7) {
    newAchievements.push('week_streak')
  }
  if (progress.streak_days >= 30) {
    newAchievements.push('month_streak')
  }
  
  // Session milestones
  if (progress.total_sessions >= 10) {
    newAchievements.push('dedicated_user')
  }
  if (progress.total_sessions >= 50) {
    newAchievements.push('power_user')
  }
  
  // Time milestones
  if (progress.total_time_minutes >= 60) {
    newAchievements.push('hour_invested')
  }
  if (progress.total_time_minutes >= 600) {
    newAchievements.push('ten_hours_invested')
  }
  
  return newAchievements
}

export const getAchievementDetails = (achievementId: string) => {
  const achievements: Record<string, { name: string; description: string; icon: string; rarity: string }> = {
    first_completion: {
      name: 'First Steps',
      description: 'Completed your first assessment',
      icon: '🎯',
      rarity: 'common'
    },
    perfect_score: {
      name: 'Perfect Score',
      description: 'Achieved a perfect score',
      icon: '⭐',
      rarity: 'rare'
    },
    week_streak: {
      name: 'Week Warrior',
      description: '7-day activity streak',
      icon: '🔥',
      rarity: 'uncommon'
    },
    month_streak: {
      name: 'Monthly Master',
      description: '30-day activity streak',
      icon: '👑',
      rarity: 'epic'
    },
    dedicated_user: {
      name: 'Dedicated User',
      description: 'Completed 10 sessions',
      icon: '💪',
      rarity: 'uncommon'
    },
    power_user: {
      name: 'Power User',
      description: 'Completed 50 sessions',
      icon: '🚀',
      rarity: 'legendary'
    },
    hour_invested: {
      name: 'Time Investor',
      description: 'Spent 1 hour in activities',
      icon: '⏰',
      rarity: 'common'
    },
    ten_hours_invested: {
      name: 'Commitment Champion',
      description: 'Spent 10 hours in activities',
      icon: '🏆',
      rarity: 'epic'
    }
  }
  
  return achievements[achievementId] || {
    name: 'Unknown Achievement',
    description: 'Achievement details not found',
    icon: '🎖️',
    rarity: 'common'
  }
}