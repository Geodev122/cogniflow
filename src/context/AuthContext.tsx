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

  // Direct profile fetching function with enhanced error handling
  const fetchProfileDirect = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('🔍 Fetching profile for user:', userId)
      
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
        console.error('❌ Profile fetch error:', profileError)
        
        // If profile doesn't exist, try to create one from auth metadata
        if (profileError.code === 'PGRST116') {
          console.log('📝 Profile not found, attempting to create from auth metadata...')
          
          const { data: { user: authUser } } = await supabase.auth.getUser()
          if (authUser?.user_metadata) {
            const metadata = authUser.user_metadata
            
            const newProfile = {
              id: userId,
              role: metadata.role || 'client',
              first_name: metadata.first_name || 'Unknown',
              last_name: metadata.last_name || 'User',
              email: authUser.email || '',
              password_set: true
            }

            const { data: createdProfile, error: createError } = await supabase
              .from('profiles')
              .insert(newProfile)
              .select()
              .single()

            if (createError) {
              console.error('❌ Failed to create profile:', createError)
              return null
            }

            console.log('✅ Profile created successfully:', createdProfile)
            return createdProfile
          }
        }
        return null
      }

      console.log('✅ Profile fetched successfully:', profileData)
      return profileData
    } catch (error) {
      console.error('❌ Direct profile fetch error:', error)
      return null
    }
  }

  const initializeAuth = async () => {
    if (initializingRef.current) {
      console.log('⏳ Auth initialization already in progress...')
      return
    }
    
    initializingRef.current = true
    
    try {
      setLoading(true)
      setError(null)
      console.log('🚀 Initializing auth...')

      // Get current session with timeout
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session fetch timeout')), 10000)
      )

      const { data: { session }, error: sessionError } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any

      if (sessionError) {
        console.error('❌ Session error:', sessionError)
        throw new Error(`Session error: ${sessionError.message}`)
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

      // Fetch profile with timeout
      const profilePromise = fetchProfileDirect(session.user.id)
      const profileTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 15000)
      )

      const profileData = await Promise.race([
        profilePromise,
        profileTimeoutPromise
      ]) as Profile | null
      
      if (profileData) {
        console.log('✅ Profile loaded successfully')
        setProfile(profileData)
        setError(null)
      } else {
        console.warn('⚠️ No profile found for user')
        setProfile(null)
        setError('Profile not found. Please complete your registration.')
      }

      // Reset retry count on success
      retryCountRef.current = 0

    } catch (error: any) {
      console.error('❌ Error initializing auth:', error)
      
      const errorMessage = error?.message || 'Authentication service unavailable'
      setError(errorMessage)
      setUser(null)
      setProfile(null)

      // Retry logic with exponential backoff
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++
        const delay = Math.min(2000 * Math.pow(2, retryCountRef.current - 1), 10000)
        console.log(`🔄 Retrying auth initialization (${retryCountRef.current}/${maxRetries}) in ${delay}ms`)

        setTimeout(() => {
          initializingRef.current = false
          initializeAuth()
        }, delay)
      } else {
        console.error('❌ Max retries reached, giving up')
      }
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
      const profileData = await fetchProfileDirect(user.id)
      if (profileData) {
        setProfile(profileData)
        console.log('✅ Profile refreshed successfully')
      } else {
        console.warn('⚠️ Profile refresh failed')
      }
    } catch (error) {
      console.error('❌ Error refreshing profile:', error)
    }
  }

  useEffect(() => {
    let mounted = true

    // Initialize auth on mount
    if (mounted) {
      initializeAuth()
    }

    // Listen for auth state changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('🔄 Auth state change:', event, session?.user?.id)

      if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out')
        setUser(null)
        setProfile(null)
        setError(null)
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log('👋 User signed in:', session.user.id)
        setUser(session.user)
        
        // Fetch fresh profile data
        const profileData = await fetchProfileDirect(session.user.id)
        if (profileData) {
          setProfile(profileData)
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 Token refreshed for user:', session.user.id)
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

  const retryAuth = () => {
    console.log('🔄 Manual auth retry triggered')
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

      console.log('✅ Sign in successful, fetching profile...')
      setUser(data.user)
      
      // Fetch profile directly
      const profileData = await fetchProfileDirect(data.user.id)
      if (profileData) {
        setProfile(profileData)
        console.log('✅ Profile loaded after sign in')
      } else {
        throw new Error('Profile not found after sign in')
      }
      
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
      setUser(data.user)
      
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