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
    flowType: 'implicit'
  },
  global: {
    headers: {
      'x-client-info': 'cogniflow-web'
    }
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
      },
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
      },
      document_uploads: {
        Row: {
          id: string
          session_id: string | null
          therapist_id: string | null
          file_url: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          therapist_id?: string | null
          file_url: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          therapist_id?: string | null
          file_url?: string
          created_at?: string
        }
      }
    }
  }
}