import { supabase } from './supabase'

const EDGE_FUNCTION_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

interface AuthResponse {
  success: boolean
  data?: any
  error?: string
  user?: any
  session?: any
  profile?: any
}

interface UserData {
  first_name: string
  last_name: string
  role: 'therapist' | 'client'
}

export class AuthService {
  private static async callAuthFunction(action: string, payload: any = {}): Promise<AuthResponse> {
    try {
      const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/user-authentication`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action,
          ...payload
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Auth function error (${action}):`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  static async signIn(email: string, password: string): Promise<AuthResponse> {
    return this.callAuthFunction('signIn', { email, password })
  }

  static async signUp(email: string, password: string, userData: UserData): Promise<AuthResponse> {
    return this.callAuthFunction('signUp', { email, password, userData })
  }

  static async signOut(): Promise<AuthResponse> {
    // Also sign out locally
    await supabase.auth.signOut()
    return this.callAuthFunction('signOut')
  }

  static async getSession(): Promise<AuthResponse> {
    return this.callAuthFunction('getSession')
  }

  static async refreshSession(): Promise<AuthResponse> {
    return this.callAuthFunction('refreshSession')
  }

  static async updateUserMetadata(userId: string, metadata: any): Promise<AuthResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        return { success: false, error: 'No active session' }
      }

      const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/update-user-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          metadata
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Update metadata error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }
}