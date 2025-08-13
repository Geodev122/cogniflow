import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthService } from '../lib/auth'

interface Profile {
  id: string
  role: 'therapist' | 'client'
  first_name: string
  last_name: string
  email: string
  whatsapp_number?: string | null
  professional_details?: any | null
  verification_status?: string | null
  created_at?: string | null
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: 'therapist' | 'client'
  ) => Promise<void>
  signOut: () => Promise<void>
  retryAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      if (!mounted) return
      
      try {
        setError(null)
        setLoading(true)

        // Use edge function for session management
        const authResponse = await AuthService.getSession()

        if (!authResponse.success) {
          if (mounted) {
            setError(authResponse.error || 'Failed to get session')
            setUser(null)
            setProfile(null)
          }
          return
        }

        if (mounted) {
          setUser(authResponse.user || null)
          setProfile(authResponse.profile || null)
          if (authResponse.error && !authResponse.user) {
            setError(authResponse.error)
          }
        } else {
          if (mounted) {
            setUser(null)
            setProfile(null)
          }
        }

      } catch (error: any) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          // Implement retry logic
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++
            console.log(`Retrying auth initialization (${retryCountRef.current}/${maxRetries})`)
            setTimeout(() => initializeAuth(), 2000 * retryCountRef.current)
            return
          }
          
          setError(error?.message || 'Authentication service unavailable')
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth state changes from Supabase client
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setError(null)
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Refresh session data through edge function
        initializeAuth()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const retryAuth = () => {
    retryCountRef.current = 0
    setError(null)
    setLoading(true)
    // Re-run initialization
    setTimeout(() => window.location.reload(), 100)
  }

  const signIn = async (email: string, password: string) => {
    setError(null)
    setLoading(true)

    try {
      const authResponse = await AuthService.signIn(email, password)
      
      if (!authResponse.success) {
        throw new Error(authResponse.error || 'Sign in failed')
      }

      // Update local state
      setUser(authResponse.user)
      setProfile(authResponse.profile)
      
      // Also update Supabase client session
      if (authResponse.session) {
        await supabase.auth.setSession({
          access_token: authResponse.session.access_token,
          refresh_token: authResponse.session.refresh_token || ''
        })
      }
      
    } catch (error: any) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: 'therapist' | 'client'
  ) => {
    setError(null)
    setLoading(true)

    try {
      const authResponse = await AuthService.signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        role: role
      })

      if (!authResponse.success) {
        throw new Error(authResponse.error || 'Sign up failed')
      }
      
      // Update local state if user was created
      if (authResponse.user) {
        setUser(authResponse.user)
      }
      
    } catch (error: any) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setError(null)
    
    try {
      const authResponse = await AuthService.signOut()
      if (!authResponse.success && authResponse.error) {
        throw new Error(authResponse.error)
      }
    } catch (error: any) {
      console.error('Sign out error:', error)
      // Don't throw error for sign out, just log it
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, error, signIn, signUp, signOut, retryAuth }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

