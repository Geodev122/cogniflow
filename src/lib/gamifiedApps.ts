import { supabase } from './supabase'

export interface GamifiedApp {
  id: string
  name: string
  description: string | null
  category: string
  difficulty_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null
  estimated_duration: number | null
  is_active: boolean | null
  avg_completion_rate: number | null
  total_plays: number | null
  difficulty_weight: number | null
  created_at: string | null
  updated_at: string | null
}

export interface AppProgress {
  user_id: string
  app_id: string
  best_score: number | null
  total_sessions: number | null
  total_time_spent: number | null
  last_played_at: string | null
  experience_points: number | null
  completed_count: number | null
  current_level: number | null
  progress_percentage: number | null
}

export interface AppInteraction {
  id: string
  user_id: string
  app_id: string
  interaction_type: 'START' | 'COMPLETE' | 'QUIT' | 'REVIEW'
  interaction_timestamp: string | null
  session_duration: number | null
  performance_score: number | null
  additional_metadata: any | null
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
  return Math.floor(Math.sqrt(experiencePoints / 100)) + 1
}

export const getXPForNextLevel = (currentLevel: number): number => {
  return (currentLevel * currentLevel) * 100
}