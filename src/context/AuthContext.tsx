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

  // Direct profile fetching with timeout and retry
  const fetchProfileDirect = async (userId: string, retries = 2): Promise<Profile | null> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`🔍 Fetching profile for user: ${userId} (attempt ${attempt + 1}/${retries + 1})`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
        
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
          console.error(`❌ Profile fetch error (attempt ${attempt + 1}):`, profileError)
          
          // If profile doesn't exist, try to create one
          if (profileError.code === 'PGRST116' && attempt === 0) {
            console.log('📝 Profile not found, attempting to create...')
            
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

              if (!createError && createdProfile) {
                console.log('✅ Profile created successfully:', createdProfile)
                return createdProfile
              }
            }
          }
          
          if (attempt === retries) {
            throw profileError
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
          continue
        }

        console.log('✅ Profile fetched successfully:', profileData)
        return profileData
      } catch (error: any) {
        console.error(`❌ Profile fetch attempt ${attempt + 1} failed:`, error)
        
        if (error.name === 'AbortError') {
          console.log('⏰ Profile fetch timed out')
        }
        
        if (attempt === retries) {
          console.error('❌ All profile fetch attempts failed')
          return null
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
    
    return null
  }

  // Simplified session check with timeout
  const checkSession = async (): Promise<{ user: User | null; error: any }> => {
    try {
      console.log('🔍 Checking session...')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const sessionPromise = supabase.auth.getSession()
      const result = await Promise.race([
        sessionPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        )
      ]) as any

      clearTimeout(timeoutId)
      
      const { data: { session }, error } = result
      
      if (error) {
        console.error('❌ Session check error:', error)
        return { user: null, error }
      }
      
      console.log('✅ Session check completed:', session?.user?.id || 'No session')
      return { user: session?.user || null, error: null }
    } catch (error: any) {
      console.error('❌ Session check failed:', error)
      return { user: null, error }
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

      // Check session with timeout
      const { user: sessionUser, error: sessionError } = await checkSession()

      if (sessionError) {
        console.error('❌ Session error:', sessionError)
        // Don't throw, just set no user
        setUser(null)
        setProfile(null)
        setError(null) // Clear error for offline mode
        return
      }

      if (!sessionUser) {
        console.log('ℹ️ No active session found')
        setUser(null)
        setProfile(null)
        setError(null)
        return
      }

      console.log('✅ Active session found for user:', sessionUser.id)
      setUser(sessionUser)

      // Fetch profile with retries
      const profileData = await fetchProfileDirect(sessionUser.id)
      
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
      
      // Set user to null but don't show error for network issues
      setUser(null)
      setProfile(null)
      
      // Only show error for non-network issues
      if (!error.message?.includes('timeout') && !error.message?.includes('fetch')) {
        setError(error.message || 'Authentication service unavailable')
      } else {
        setError(null) // Allow offline mode
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
      }
    } catch (error) {
      console.error('❌ Error refreshing profile:', error)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    
    // Initialize auth immediately
    initializeAuth()

    // Listen for auth state changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return

      console.log('🔄 Auth state change:', event, session?.user?.id)

      try {
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
        }
      } catch (error) {
        console.error('❌ Auth state change error:', error)
      }
    })

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

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

      console.log('✅ Sign in successful, fetching profile...')
      setUser(data.user)
      
      // Fetch profile directly
      const profileData = await fetchProfileDirect(data.user.id)
      if (profileData) {
        setProfile(profileData)
        console.log('✅ Profile loaded after sign in')
      } else {
        console.warn('⚠️ Profile not found after sign in')
        setProfile(null)
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