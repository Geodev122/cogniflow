import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  }
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'therapist' | 'client'
          first_name: string
          last_name: string
          email: string
          patient_code: string | null
          whatsapp_number: string | null
          password_set: boolean
          created_by_therapist: string | null
          professional_details: any | null
          verification_status: string | null
          created_at: string
        }
        Insert: {
          id: string
          role: 'therapist' | 'client'
          first_name: string
          last_name: string
          email: string
          patient_code?: string | null
          whatsapp_number?: string | null
          password_set?: boolean
          created_by_therapist?: string | null
          professional_details?: any | null
          verification_status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'therapist' | 'client'
          first_name?: string
          last_name?: string
          email?: string
          patient_code?: string | null
          whatsapp_number?: string | null
          password_set?: boolean
          created_by_therapist?: string | null
          professional_details?: any | null
          verification_status?: string | null
          created_at?: string
        }
      }
      therapist_client_relations: {
        Row: {
          id: string
          therapist_id: string
          client_id: string
          created_at: string
        }
        Insert: {
          therapist_id: string
          client_id: string
          created_at?: string
        }
        Update: {
          therapist_id?: string
          client_id?: string
          created_at?: string
        }
      }
      cbt_worksheets: {
        Row: {
          id: string
          therapist_id: string
          client_id: string
          type: string
          title: string
          content: any
          status: 'assigned' | 'in_progress' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          therapist_id: string
          client_id: string
          type: string
          title: string
          content?: any
          status?: 'assigned' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          therapist_id?: string
          client_id?: string
          type?: string
          title?: string
          content?: any
          status?: 'assigned' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      psychometric_forms: {
        Row: {
          id: string
          therapist_id: string
          client_id: string
          form_type: string
          title: string
          questions: any
          responses: any
          score: number
          status: 'assigned' | 'completed'
          created_at: string
          completed_at: string | null
        }
        Insert: {
          therapist_id: string
          client_id: string
          form_type: string
          title: string
          questions?: any
          responses?: any
          score?: number
          status?: 'assigned' | 'completed'
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          therapist_id?: string
          client_id?: string
          form_type?: string
          title?: string
          questions?: any
          responses?: any
          score?: number
          status?: 'assigned' | 'completed'
          created_at?: string
          completed_at?: string | null
        }
      }
      therapeutic_exercises: {
        Row: {
          id: string
          therapist_id: string
          client_id: string
          exercise_type: string
          title: string
          description: string | null
          game_config: any
          progress: any
          status: 'assigned' | 'in_progress' | 'completed'
          created_at: string
          last_played_at: string | null
        }
        Insert: {
          therapist_id: string
          client_id: string
          exercise_type: string
          title: string
          description?: string | null
          game_config?: any
          progress?: any
          status?: 'assigned' | 'in_progress' | 'completed'
          created_at?: string
          last_played_at?: string | null
        }
        Update: {
          therapist_id?: string
          client_id?: string
          exercise_type?: string
          title?: string
          description?: string | null
          game_config?: any
          progress?: any
          status?: 'assigned' | 'in_progress' | 'completed'
          created_at?: string
          last_played_at?: string | null
        }
      }
      worksheets: {
        Row: {
          id: string
          therapist_id: string
          title: string
          content: any
          created_at: string
        }
        Insert: {
          therapist_id: string
          title: string
          content?: any
          created_at?: string
        }
        Update: {
          therapist_id?: string
          title?: string
          content?: any
          created_at?: string
        }
      }
      worksheet_assignments: {
        Row: {
          id: string
          worksheet_id: string
          client_id: string
          status: 'assigned' | 'in_progress' | 'completed'
          responses: any
          assigned_at: string
          completed_at: string | null
        }
        Insert: {
          worksheet_id: string
          client_id: string
          status?: 'assigned' | 'in_progress' | 'completed'
          responses?: any
          assigned_at?: string
          completed_at?: string | null
        }
        Update: {
          worksheet_id?: string
          client_id?: string
          status?: 'assigned' | 'in_progress' | 'completed'
          responses?: any
          assigned_at?: string
          completed_at?: string | null
        }
      }
      progress_tracking: {
        Row: {
          id: string
          client_id: string
          metric_type: string
          value: number
          source_type: 'psychometric' | 'exercise' | 'manual'
          source_id: string | null
          recorded_at: string
        }
        Insert: {
          client_id: string
          metric_type: string
          value: number
          source_type: 'psychometric' | 'exercise' | 'manual'
          source_id?: string | null
          recorded_at?: string
        }
        Update: {
          client_id?: string
          metric_type?: string
          value?: number
          source_type?: 'psychometric' | 'exercise' | 'manual'
          source_id?: string | null
          recorded_at?: string
        }
      }
      assessment_library: {
        Row: {
          id: number
          name: string
          abbreviation: string
          category: string
          description: string | null
          questions: any
          scoring_method: any
          interpretation_guide: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          abbreviation: string
          category: string
          description?: string | null
          questions: any
          scoring_method: any
          interpretation_guide: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          abbreviation?: string
          category?: string
          description?: string | null
          questions?: any
          scoring_method?: any
          interpretation_guide?: any
          created_at?: string
          updated_at?: string
        }
      }
      session_notes: {
        Row: {
          id: string
          appointment_id: string | null
          therapist_id: string | null
          progress_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          appointment_id?: string | null
          therapist_id?: string | null
          progress_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string | null
          therapist_id?: string | null
          progress_notes?: string | null
          created_at?: string
        }
      }
      document_uploads: {
        Row: {
          id: string
          session_id: string | null
          therapist_id: string | null
          file_url: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          therapist_id?: string | null
          file_url: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          therapist_id?: string | null
          file_url?: string
          description?: string | null
          created_at?: string
        }
      }
      gamified_apps: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          difficulty_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null
          estimated_duration: number | null
          is_active: boolean
          created_at: string
          updated_at: string
          avg_completion_rate: number
          total_plays: number
          difficulty_weight: number
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          difficulty_level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null
          estimated_duration?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          avg_completion_rate?: number
          total_plays?: number
          difficulty_weight?: number
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          difficulty_level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null
          estimated_duration?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          avg_completion_rate?: number
          total_plays?: number
          difficulty_weight?: number
        }
      }
      user_app_progress: {
        Row: {
          user_id: string
          app_id: string
          best_score: number
          total_sessions: number
          total_time_spent: number
          last_played_at: string | null
          experience_points: number
          completed_count: number
          current_level: number
          progress_percentage: number
        }
        Insert: {
          user_id: string
          app_id: string
          best_score?: number
          total_sessions?: number
          total_time_spent?: number
          last_played_at?: string | null
          experience_points?: number
          completed_count?: number
          current_level?: number
          progress_percentage?: number
        }
        Update: {
          user_id?: string
          app_id?: string
          best_score?: number
          total_sessions?: number
          total_time_spent?: number
          last_played_at?: string | null
          experience_points?: number
          completed_count?: number
          current_level?: number
          progress_percentage?: number
        }
      }
      user_app_interactions: {
        Row: {
          id: string
          user_id: string
          app_id: string
          interaction_type: 'START' | 'COMPLETE' | 'QUIT' | 'REVIEW'
          interaction_timestamp: string
          session_duration: number | null
          performance_score: number | null
          additional_metadata: any | null
        }
        Insert: {
          id?: string
          user_id: string
          app_id: string
          interaction_type: 'START' | 'COMPLETE' | 'QUIT' | 'REVIEW'
          interaction_timestamp?: string
          session_duration?: number | null
          performance_score?: number | null
          additional_metadata?: any | null
        }
        Update: {
          id?: string
          user_id?: string
          app_id?: string
          interaction_type?: 'START' | 'COMPLETE' | 'QUIT' | 'REVIEW'
          interaction_timestamp?: string
          session_duration?: number | null
          performance_score?: number | null
          additional_metadata?: any | null
        }
      }
    }
  }
}