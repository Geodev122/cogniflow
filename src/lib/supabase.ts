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
  global: {
    headers: {
      'x-client-info': 'cogniflow-web'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
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
      therapist_locations: {
        Row: {
          id: string
          therapist_id: string
          address: string
          is_primary: boolean
          created_at: string
        }
        Insert: {
          therapist_id: string
          address: string
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          therapist_id?: string
          address?: string
          is_primary?: boolean
          created_at?: string
        }
      },
      therapist_stats: {
        Row: {
          therapist_id: string
          total_clients: number
          years_experience: number
          rating: number
          review_count: number
          response_time: string
          created_at: string
        }
        Insert: {
          therapist_id: string
          total_clients?: number
          years_experience?: number
          rating?: number
          review_count?: number
          response_time?: string
          created_at?: string
        }
        Update: {
          therapist_id?: string
          total_clients?: number
          years_experience?: number
          rating?: number
          review_count?: number
          response_time?: string
          created_at?: string
        }
      }
    },
    Functions: {
      get_therapist_profile: {
        Args: { id: string }
        Returns: any
      }
    }
  }
}