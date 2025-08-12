import { supabase } from './supabase'

export interface GamifiedApp {
  id: string
  name: string
  description: string
  category: string
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  estimated_duration: number
  is_active: boolean
  avg_completion_rate: number
  total_plays: number
  difficulty_weight: number
  created_at: string
  updated_at: string
}

export interface AppProgress {
  user_id: string
  app_id: string
  best_score: number
  total_sessions: number
  total_time_spent: number
  last_played_at?: string
  experience_points: number
  completed_count: number
  current_level: number
  progress_percentage: number
}

export interface AppInteraction {
  id: string
  user_id: string
  app_id: string
  interaction_type: 'START' | 'COMPLETE' | 'QUIT' | 'REVIEW'
  interaction_timestamp: string
  session_duration?: number
  performance_score?: number
  additional_metadata?: any
}

// App Management Functions
export const getGamifiedApps = async (category?: string) => {
  let query = supabase
    .from('gamification.gamified_apps')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) throw error
  return data as GamifiedApp[]
}

export const startAppSession = async (appId: string, userId: string) => {
  const { data, error } = await supabase
    .from('gamification.user_app_interactions')
    .insert({
      user_id: userId,
      app_id: appId,
      interaction_type: 'START'
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

export const completeAppSession = async (
  appId: string,
  userId: string,
  sessionDuration: number,
  performanceScore: number,
  metadata: any = {}
) => {
  // Record completion interaction
  const { error: interactionError } = await supabase
    .from('gamification.user_app_interactions')
    .insert({
      user_id: userId,
      app_id: appId,
      interaction_type: 'COMPLETE',
      session_duration: sessionDuration,
      performance_score: performanceScore,
      additional_metadata: metadata
    })

  if (interactionError) throw interactionError

  // Update or create progress record
  const { error: progressError } = await supabase
    .from('gamification.user_app_progress')
    .upsert({
      user_id: userId,
      app_id: appId,
      best_score: performanceScore,
      total_sessions: 1,
      total_time_spent: sessionDuration,
      last_played_at: new Date().toISOString(),
      experience_points: Math.round(performanceScore * 10),
      completed_count: 1,
      current_level: 1,
      progress_percentage: 100
    }, {
      onConflict: 'user_id,app_id',
      ignoreDuplicates: false
    })

  if (progressError) throw progressError
}

export const getUserAppProgress = async (userId: string, appId?: string) => {
  let query = supabase
    .from('gamification.user_app_progress')
    .select('*')
    .eq('user_id', userId)

  if (appId) {
    query = query.eq('app_id', appId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as AppProgress[]
}

export const getAppRecommendations = async (userId: string, limit: number = 10) => {
  const { data, error } = await supabase.rpc('gamification.get_app_recommendations', {
    p_user_id: userId,
    p_limit: limit
  })
  
  if (error) throw error
  return data
}

export const getAppLeaderboard = async (appId: string, limit: number = 10, offset: number = 0) => {
  const { data, error } = await supabase.rpc('gamification.get_app_leaderboard', {
    p_app_id: appId,
    p_limit: limit,
    p_offset: offset
  })
  
  if (error) throw error
  return data
}

export const logAppInteraction = async (
  userId: string,
  appId: string,
  interactionType: 'START' | 'COMPLETE' | 'QUIT' | 'REVIEW',
  sessionDuration?: number,
  performanceScore?: number,
  metadata: any = {}
) => {
  const { error } = await supabase
    .from('gamification.user_app_interactions')
    .insert({
      user_id: userId,
      app_id: appId,
      interaction_type: interactionType,
      session_duration: sessionDuration,
      performance_score: performanceScore,
      additional_metadata: metadata
    })
  
  if (error) throw error
}

export const getUserInteractions = async (userId: string, appId?: string) => {
  let query = supabase
    .from('gamification.user_app_interactions')
    .select('*')
    .eq('user_id', userId)

  if (appId) {
    query = query.eq('app_id', appId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as AppInteraction[]
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