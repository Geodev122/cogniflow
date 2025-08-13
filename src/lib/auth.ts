import { supabase } from './supabase'

const EDGE_FUNCTION_BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL

if (!EDGE_FUNCTION_BASE_URL) {
  console.error('Supabase Functions URL is missing. Please set VITE_SUPABASE_FUNCTIONS_URL in your environment configuration')
  throw new Error('Missing Supabase Functions URL')
}

interface AuthResponse {
  success: boolean
  data?: unknown
  error?: string
  user?: unknown
  session?: unknown
  profile?: unknown
  message?: string
}

interface UserData {
  first_name: string
  last_name: string
  role: 'therapist' | 'client'
}

export class AuthService {
  private static async callAuthFunction(endpoint: string, payload: Record<string, unknown> = {}, method: string = 'POST'): Promise<AuthResponse> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Add authorization header if we have a session
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/${endpoint}`, {
        method,
        headers,
        body: method !== 'GET' ? JSON.stringify(payload) : undefined
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      
      // Check if the response indicates an error
      if (result.error) {
        throw new Error(result.error)
      }

      return {
        success: true,
        ...result
      }
    } catch (error) {
      console.error(`Auth function error (${endpoint}):`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  static async signIn(email: string, password: string): Promise<AuthResponse> {
    const response = await this.callAuthFunction('auth/login', { email, password })
    
    // If successful, update the local Supabase client session
    if (response.success && response.session) {
      try {
        await supabase.auth.setSession({
          access_token: response.session.access_token,
          refresh_token: response.session.refresh_token || ''
        })
      } catch (error) {
        console.error('Error setting local session:', error)
      }
    }
    
    return response
  }

  static async signUp(email: string, password: string, userData: UserData): Promise<AuthResponse> {
    return this.callAuthFunction('auth/signup', { 
      email, 
      password, 
      role: userData.role,
      first_name: userData.first_name,
      last_name: userData.last_name
    })
  }

  static async signOut(): Promise<AuthResponse> {
    // Sign out from edge function first
    const response = await this.callAuthFunction('auth/logout', {})
    
    // Also sign out locally
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Local signout error:', error)
    }
    
    return response
  }

  static async getSession(): Promise<AuthResponse> {
    // First check local session
    const { data: { session: localSession } } = await supabase.auth.getSession()
    
    if (!localSession?.access_token) {
      return { 
        success: true, 
        user: null, 
        session: null, 
        profile: null 
      }
    }

    // Verify session with edge function
    return this.callAuthFunction('auth/session', {}, 'GET')
  }

  static async refreshSession(): Promise<AuthResponse> {
    return this.callAuthFunction('auth/refresh', {}, 'POST')
  }

  static async updateUserMetadata(userId: string, metadata: Record<string, unknown>): Promise<AuthResponse> {
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
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Update metadata error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  // New method for robust profile fetching
  static async fetchUserProfile(userId: string): Promise<AuthResponse> {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id, 
          role, 
          first_name, 
          last_name, 
          email,
          whatsapp_number,
          password_set,
          created_by_therapist,
          professional_details,
          verification_status,
          created_at,
          updated_at
        `)
        .eq('id', userId)
        .single()

      if (profileError) {
        return {
          success: false,
          error: `Profile fetch failed: ${profileError.message}`
        }
      }

      return {
        success: true,
        profile: profileData
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile fetch error'
      }
    }
  }

  // Method to validate and refresh profile data
  static async validateAndRefreshProfile(): Promise<AuthResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { 
          success: true, 
          user: null, 
          profile: null 
        }
      }

      const profileResponse = await this.fetchUserProfile(user.id)
      
      return {
        success: true,
        user,
        profile: profileResponse.profile || null
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile validation failed'
      }
    }
  }
}