import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase credentials are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment configuration.'
  )
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
          password_set: boolean | null
          created_by_therapist: string | null
          professional_details: any | null
          verification_status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          role: 'therapist' | 'client'
          first_name: string
          last_name: string
          email: string
          patient_code?: string | null
          whatsapp_number?: string | null
          password_set?: boolean | null
          created_by_therapist?: string | null
          professional_details?: any | null
          verification_status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          role?: 'therapist' | 'client'
          first_name?: string
          last_name?: string
          email?: string
          patient_code?: string | null
          whatsapp_number?: string | null
          password_set?: boolean | null
          created_by_therapist?: string | null
          professional_details?: any | null
          verification_status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      therapist_client_relations: {
        Row: {
          id: string
          therapist_id: string
          client_id: string
          created_at: string | null
        }
        Insert: {
          therapist_id: string
          client_id: string
          created_at?: string | null
        }
        Update: {
          therapist_id?: string
          client_id?: string
          created_at?: string | null
        }
      }
      form_assignments: {
        Row: {
          id: string
          therapist_id: string | null
          client_id: string | null
          form_type: string
          form_id: string | null
          title: string
          instructions: string | null
          due_date: string | null
          reminder_frequency: string | null
          status: string | null
          assigned_at: string | null
          completed_at: string | null
          created_at: string | null
        }
        Insert: {
          therapist_id?: string | null
          client_id?: string | null
          form_type: string
          form_id?: string | null
          title: string
          instructions?: string | null
          due_date?: string | null
          reminder_frequency?: string | null
          status?: string | null
          assigned_at?: string | null
          completed_at?: string | null
          created_at?: string | null
        }
        Update: {
          therapist_id?: string | null
          client_id?: string | null
          form_type?: string
          form_id?: string | null
          title?: string
          instructions?: string | null
          due_date?: string | null
          reminder_frequency?: string | null
          status?: string | null
          assigned_at?: string | null
          completed_at?: string | null
          created_at?: string | null
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
          created_at: string | null
          updated_at: string | null
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
          created_at?: string | null
          updated_at?: string | null
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
          created_at?: string | null
          updated_at?: string | null
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
          recorded_at: string | null
        }
        Insert: {
          client_id: string
          metric_type: string
          value: number
          source_type: 'psychometric' | 'exercise' | 'manual'
          source_id?: string | null
          recorded_at?: string | null
        }
        Update: {
          client_id?: string
          metric_type?: string
          value?: number
          source_type?: 'psychometric' | 'exercise' | 'manual'
          source_id?: string | null
          recorded_at?: string | null
        }
      }
      client_profiles: {
        Row: {
          id: string
          client_id: string | null
          therapist_id: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          medical_history: string | null
          current_medications: string | null
          presenting_concerns: string | null
          therapy_history: string | null
          risk_level: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          therapist_id?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          medical_history?: string | null
          current_medications?: string | null
          presenting_concerns?: string | null
          therapy_history?: string | null
          risk_level?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          therapist_id?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          medical_history?: string | null
          current_medications?: string | null
          presenting_concerns?: string | null
          therapy_history?: string | null
          risk_level?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      therapist_insights_metrics: {
        Row: {
          id: string
          therapist_id: string | null
          patient_id: string | null
          metric_type: string
          metric_value: number | null
          metric_context: any | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          therapist_id?: string | null
          patient_id?: string | null
          metric_type: string
          metric_value?: number | null
          metric_context?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          therapist_id?: string | null
          patient_id?: string | null
          metric_type?: string
          metric_value?: number | null
          metric_context?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      progress_metrics: {
        Row: {
          client_id: string | null
          metric_date: string | null
          metric_type: string | null
          value: number | null
        }
      }
      app_usage_stats: {
        Row: {
          app_id: string | null
          app_name: string | null
          app_type: string | null
          unique_users: number | null
          total_sessions: number | null
          average_score: number | null
          average_duration_seconds: number | null
          completed_sessions: number | null
          completion_rate: number | null
        }
      }
    }
    Functions: {
      get_client_data: {
        Args: { client_id: string }
        Returns: {
          worksheets: any
          assessments: any
          exercises: any
          progress: any
        }[]
      }
      get_patient_insights_summary: {
        Args: { patient_id: string }
        Returns: any
      }
      get_therapist_insights: {
        Args: { therapist_id: string }
        Returns: any
      }
      insert_therapist_insight: {
        Args: {
          p_therapist_id: string
          p_patient_id: string
          p_metric_type: string
          p_metric_value: number
          p_metric_context?: any
        }
        Returns: string
      }
    }
  }
  gamification: {
    Tables: {
      gamified_apps: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          difficulty_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null
          estimated_duration: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          avg_completion_rate: number | null
          total_plays: number | null
          difficulty_weight: number | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          difficulty_level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null
          estimated_duration?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          avg_completion_rate?: number | null
          total_plays?: number | null
          difficulty_weight?: number | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          difficulty_level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null
          estimated_duration?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          avg_completion_rate?: number | null
          total_plays?: number | null
          difficulty_weight?: number | null
        }
      }
      user_app_progress: {
        Row: {
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
        Insert: {
          user_id: string
          app_id: string
          best_score?: number | null
          total_sessions?: number | null
          total_time_spent?: number | null
          last_played_at?: string | null
          experience_points?: number | null
          completed_count?: number | null
          current_level?: number | null
          progress_percentage?: number | null
        }
        Update: {
          user_id?: string
          app_id?: string
          best_score?: number | null
          total_sessions?: number | null
          total_time_spent?: number | null
          last_played_at?: string | null
          experience_points?: number | null
          completed_count?: number | null
          current_level?: number | null
          progress_percentage?: number | null
        }
      }
      user_app_interactions: {
        Row: {
          id: string
          user_id: string
          app_id: string
          interaction_type: 'START' | 'COMPLETE' | 'QUIT' | 'REVIEW'
          interaction_timestamp: string | null
          session_duration: number | null
          performance_score: number | null
          additional_metadata: any | null
        }
        Insert: {
          id?: string
          user_id: string
          app_id: string
          interaction_type: 'START' | 'COMPLETE' | 'QUIT' | 'REVIEW'
          interaction_timestamp?: string | null
          session_duration?: number | null
          performance_score?: number | null
          additional_metadata?: any | null
        }
        Update: {
          id?: string
          user_id?: string
          app_id?: string
          interaction_type?: 'START' | 'COMPLETE' | 'QUIT' | 'REVIEW'
          interaction_timestamp?: string | null
          session_duration?: number | null
          performance_score?: number | null
          additional_metadata?: any | null
        }
      }
    }
    Functions: {
      get_app_recommendations: {
        Args: { p_user_id: string; p_limit?: number }
        Returns: {
          app_id: string
          name: string
          description: string
          difficulty_level: string
          estimated_duration: number
          recommendation_score: number
        }[]
      }
      get_app_leaderboard: {
        Args: { p_app_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          user_id: string
          username: string
          best_score: number
          experience_points: number
          total_sessions: number
          rank: number
          percentile: number
        }[]
      }
    }
  }
}