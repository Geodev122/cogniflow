import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, supabaseUrl } from '../lib/supabase'

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
  const initializeAuthRef = useRef<(() => Promise<void>) | null>(null)

  useEffect(() => {
    let mounted = true

    const withTimeout = <T,>(
      promise: Promise<T>,
      ms: number,
      timeoutMessage: string
    ) =>
      Promise.race<T>([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(timeoutMessage)), ms)
        )
      ])

    const checkSupabaseConnection = async () =>
      withTimeout(
        fetch(`${supabaseUrl}/rest/v1/`),
        30000,
        'Supabase unreachable'
      )

    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('Profile fetch error:', error)
          setProfile(null)
          setError('Profile not found')
          return
        }

        if (mounted) {
          setProfile(data)
          setError(null)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        if (mounted) {
          setProfile(null)
          setError('Failed to load profile')
        }
      }
    }

    const initializeAuth = async () => {
      try {
        setError(null)

        try {
          await checkSupabaseConnection()
        } catch (err) {
          console.error('Supabase connection error:', err)
          setError(
            'Cannot reach authentication service. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
          )
          setUser(null)
          setProfile(null)
          return
        }

        const {
          data: { session },
          error: sessionError
        } = await withTimeout(
          supabase.auth.getSession(),
          10000,
          'Authentication request timed out'
        )

        if (sessionError) {
          console.error('Session error:', sessionError)
          setError('Failed to get session')
          return
        }

        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          await withTimeout(
            fetchProfile(session.user.id),
            10000,
            'Profile request timed out'
          )
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (error: any) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setError(error?.message || 'Failed to initialize authentication')
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuthRef.current = initializeAuth
    initializeAuth()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      setError(null)

      try {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        if (mounted) {
          setError('Authentication error occurred')
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const retryAuth = () => {
    setError(null)
    setLoading(true)
    initializeAuthRef.current?.()
  }

  const signIn = async (email: string, password: string) => {
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
    } catch (error) {
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role
          }
        }
      })

      if (error) throw error

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            role
          })

        if (profileError) throw profileError
      }
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setError(null)
    const { error } = await supabase.auth.signOut()
    if (error) throw error
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

