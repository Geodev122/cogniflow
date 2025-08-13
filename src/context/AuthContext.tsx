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
  password_set?: boolean | null
  created_by_therapist?: string | null
  updated_at?: string | null
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
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3
  const initializingRef = useRef(false)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [currentPath, setCurrentPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  )

  // Track navigation changes without requiring router context
  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname)

    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function (...args: any[]) {
      originalPushState.apply(this, args)
      handleLocationChange()
    }

    history.replaceState = function (...args: any[]) {
      originalReplaceState.apply(this, args)
      handleLocationChange()
    }

    window.addEventListener('popstate', handleLocationChange)

    return () => {
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
      window.removeEventListener('popstate', handleLocationChange)
    }
  }, [])

  const initializeAuth = async () => {
    if (initializingRef.current) return
    initializingRef.current = true
    
    try {
      setLoading(true)

      // Use edge function for session management with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Authentication request timed out')), 10000)
      })

      const authPromise = AuthService.getSession()
      const authResponse = await Promise.race([authPromise, timeoutPromise])

      if (!authResponse.success) {
        if (authResponse.error) {
          setError(authResponse.error)
        }
        setUser(null)
        setProfile(null)
        return
      }

      setUser(authResponse.user || null)
      setProfile(authResponse.profile || null)

      // Reset retry count on success
      retryCountRef.current = 0
      setError(null)

    } catch (error: any) {
      console.error('Error initializing auth:', error)
      
      setError(error?.message || 'Authentication service unavailable')
      setUser(null)
      setProfile(null)

      if (
        retryCountRef.current < maxRetries &&
        !['/login', '/register'].includes(currentPath)
      ) {
        retryCountRef.current++
        const delay = Math.min(2000 * Math.pow(2, retryCountRef.current - 1), 10000)
        console.log(`Retrying auth initialization (${retryCountRef.current}/${maxRetries}) in ${delay}ms`)

        retryTimeoutRef.current = setTimeout(() => {
          initializingRef.current = false
          initializeAuth()
        }, delay)
      }
    } finally {
      setLoading(false)
      initializingRef.current = false
    }
  }

  const refreshProfile = async () => {
    if (!user?.id) return

    try {
      const profileResponse = await AuthService.fetchUserProfile(user.id)
      if (profileResponse.success && profileResponse.profile) {
        setProfile(profileResponse.profile)
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }

  useEffect(() => {
    let mounted = true

    // Initialize auth on mount
    if (mounted) {
      initializeAuth()
    }

    // Listen for auth state changes from Supabase client
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('Auth state change:', event, session?.user?.id)

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setError(null)
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Update user state immediately
        setUser(session.user)
        
        // Fetch fresh profile data
        try {
          const profileResponse = await AuthService.fetchUserProfile(session.user.id)
          if (profileResponse.success && profileResponse.profile) {
            setProfile(profileResponse.profile)
          }
        } catch (error) {
          console.error('Error fetching profile after sign in:', error)
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Update user but keep existing profile unless it's null
        setUser(session.user)
        if (!profile) {
          await refreshProfile()
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

   useEffect(() => {
    if (['/login', '/register'].includes(currentPath) && retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
  }, [currentPath])

  const retryAuth = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    retryCountRef.current = 0
    setError(null)
    setLoading(true)
    initializingRef.current = false
    initializeAuth()
  }

  const signIn = async (email: string, password: string) => {
    setError(null)
    setLoading(true)

    try {
      const authResponse = await AuthService.signIn(email, password)
      
      if (!authResponse.success) {
        throw new Error(authResponse.error || 'Sign in failed')
      }

      // Update local state immediately
      setUser(authResponse.user)
      setProfile(authResponse.profile)
      
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
        console.error('Sign out error:', authResponse.error)
        // Don't throw error for sign out, just log it
      }
      
      // Clear local state immediately
      setUser(null)
      setProfile(null)
    } catch (error: any) {
      console.error('Sign out error:', error)
      // Don't throw error for sign out, just log it
    }
  }

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        profile, 
        loading, 
        error, 
        signIn, 
        signUp, 
        signOut, 
        retryAuth,
        refreshProfile
      }}
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