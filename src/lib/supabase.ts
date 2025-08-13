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

// Simplified Database Types
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
        }
        Update: {
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
          status?: string | null
        }
        Update: {
          status?: string | null
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
          recorded_at: string | null
        }
        Insert: {
          client_id: string
          metric_type: string
          value: number
          source_type: 'psychometric' | 'exercise' | 'manual'
          source_id?: string | null
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
        }
        Update: {
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          medical_history?: string | null
          current_medications?: string | null
          presenting_concerns?: string | null
          therapy_history?: string | null
          risk_level?: string | null
          notes?: string | null
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
        }
      }
    }
  }
}