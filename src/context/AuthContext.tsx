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
  const initializingRef = useRef(false)
  const mountedRef = useRef(true)

  // Direct profile fetching with timeout
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log(`🔍 Fetching profile for user: ${userId}`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
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
        .abortSignal(controller.signal)
        .single()

      clearTimeout(timeoutId)

      if (profileError) {
        console.error(`❌ Profile fetch error:`, profileError)
        return null
      }

      console.log('✅ Profile fetched successfully:', profileData)
      return profileData
    } catch (error: any) {
      console.error(`❌ Profile fetch failed:`, error)
      return null
    }
  }

  const initializeAuth = async () => {
    if (initializingRef.current || !mountedRef.current) {
      return
    }
    
    initializingRef.current = true
    
    try {
      setLoading(true)
      setError(null)
      console.log('🚀 Initializing auth...')

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('❌ Session error:', sessionError)
        setUser(null)
        setProfile(null)
        setError(null)
        return
      }

      if (!session?.user) {
        console.log('ℹ️ No active session found')
        setUser(null)
        setProfile(null)
        setError(null)
        return
      }

      console.log('✅ Active session found for user:', session.user.id)
      setUser(session.user)

      // Fetch profile
      const profileData = await fetchProfile(session.user.id)
      
      if (profileData) {
        console.log('✅ Profile loaded successfully')
        setProfile(profileData)
        setError(null)
      } else {
        console.warn('⚠️ No profile found for user')
        setProfile(null)
        setError('Profile not found. Please complete your registration.')
      }

    } catch (error: any) {
      console.error('❌ Error initializing auth:', error)
      setUser(null)
      setProfile(null)
      setError(null) // Don't show errors to avoid refresh loops
    } finally {
      setLoading(false)
      initializingRef.current = false
    }
  }

  const refreshProfile = async () => {
    if (!user?.id) {
      console.log('⚠️ No user ID available for profile refresh')
      return
    }

    try {
      console.log('🔄 Refreshing profile for user:', user.id)
      const profileData = await fetchProfile(user.id)
      if (profileData) {
        setProfile(profileData)
        console.log('✅ Profile refreshed successfully')
      }
    } catch (error) {
      console.error('❌ Error refreshing profile:', error)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    
    // Initialize auth once
    initializeAuth()

    // Listen for auth state changes - SIMPLIFIED
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return

      console.log('🔄 Auth state change:', event)

      // Only handle specific events to prevent loops
      if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out')
        setUser(null)
        setProfile(null)
        setError(null)
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log('👋 User signed in:', session.user.id)
        setUser(session.user)
        
        // Fetch profile only on sign in
        const profileData = await fetchProfile(session.user.id)
        if (profileData) {
          setProfile(profileData)
        }
      }
      // Removed TOKEN_REFRESHED handling to prevent loops
    })

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, []) // Empty dependency array - only run once

  const retryAuth = () => {
    console.log('🔄 Manual auth retry triggered')
    setError(null)
    setLoading(true)
    initializingRef.current = false
    initializeAuth()
  }

  const signIn = async (email: string, password: string) => {
    setError(null)
    setLoading(true)

    try {
      console.log('🔐 Signing in user:', email)
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        console.error('❌ Sign in error:', authError)
        throw new Error(authError.message)
      }

      if (!data.user || !data.session) {
        throw new Error('Authentication failed - no user or session returned')
      }

      console.log('✅ Sign in successful')
      // Don't set user/profile here - let auth state change handle it
      
    } catch (error: any) {
      console.error('❌ Sign in error:', error)
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
      console.log('📝 Signing up user:', email, 'as', role)
      
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
        console.error('❌ Sign up error:', authError)
        throw new Error(authError.message)
      }

      if (!data.user) {
        throw new Error('User creation failed')
      }

      console.log('✅ Sign up successful for user:', data.user.id)
      
    } catch (error: any) {
      console.error('❌ Sign up error:', error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setError(null)
    
    try {
      console.log('👋 Signing out user')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Sign out error:', error)
      }
      
      // Clear local state immediately
      setUser(null)
      setProfile(null)
      console.log('✅ Local state cleared')
    } catch (error: any) {
      console.error('❌ Sign out error:', error)
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