import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

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

  // Direct profile fetching function
  const fetchProfileDirect = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('Fetching profile directly for user:', userId)
      
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
        console.error('Profile fetch error:', profileError)
        return null
      }

      console.log('Profile fetched successfully:', profileData)
      return profileData
    } catch (error) {
      console.error('Direct profile fetch error:', error)
      return null
    }
  }

  const initializeAuth = async () => {
    if (initializingRef.current) return
    initializingRef.current = true
    
    try {
      setLoading(true)
      console.log('Initializing auth...')

      // First, check local session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        throw new Error(`Session error: ${sessionError.message}`)
      }

      if (!session?.user) {
        console.log('No active session found')
        setUser(null)
        setProfile(null)
        setError(null)
        return
      }

      console.log('Active session found for user:', session.user.id)
      setUser(session.user)

      // Fetch profile directly from database
      const profileData = await fetchProfileDirect(session.user.id)
      
      if (profileData) {
        console.log('Profile loaded successfully')
        setProfile(profileData)
        setError(null)
      } else {
        console.warn('No profile found for user')
        setProfile(null)
        setError('Profile not found. Please complete your registration.')
      }

      // Reset retry count on success
      retryCountRef.current = 0

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
      console.log('Refreshing profile for user:', user.id)
      const profileData = await fetchProfileDirect(user.id)
      if (profileData) {
        setProfile(profileData)
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
        const profileData = await fetchProfileDirect(session.user.id)
        if (profileData) {
          setProfile(profileData)
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
      console.log('Signing in user:', email)
      
      // Use Supabase client directly for more reliable authentication
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!data.user || !data.session) {
        throw new Error('Authentication failed - no user or session returned')
      }

      console.log('Sign in successful, fetching profile...')
      
      // Update local state immediately
      setUser(data.user)
      
      // Fetch profile directly
      const profileData = await fetchProfileDirect(data.user.id)
      if (profileData) {
        setProfile(profileData)
      } else {
        throw new Error('Profile not found after sign in')
      }
      
    } catch (error: any) {
      console.error('Sign in error:', error)
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
      console.log('Signing up user:', email, 'as', role)
      
      // Use Supabase client directly
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            first_name: firstName,
            last_name: lastName
          }
        }
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!data.user) {
        throw new Error('User creation failed')
      }

      console.log('Sign up successful for user:', data.user.id)
      
      // Update local state if user was created
      setUser(data.user)
      
    } catch (error: any) {
      console.error('Sign up error:', error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setError(null)
    
    try {
      console.log('Signing out user')
      
      // Use Supabase client directly
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
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