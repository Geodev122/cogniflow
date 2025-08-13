import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
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
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async (user: User) => {
    try {
      console.log('Fetching profile for user:', user.id)
      
      // Try database first, handle missing profile gracefully
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle() // Use maybeSingle() instead of single() to handle 0 rows gracefully
        
        if (profileData && !profileError) {
          console.log('Using profile from database:', profileData)
          setProfile(profileData)
          setError(null) // Clear any previous errors
          return
        } else if (profileError && profileError.code !== 'PGRST116') {
          // Only log non-"no rows" errors as warnings
          console.warn('Database profile fetch failed:', profileError)
        }
      } catch (dbError) {
        console.warn('Database profile fetch error, using auth metadata:', dbError)
      }
      
      // Fallback to auth metadata
      if (user) {
        const fallbackProfile = {
          id: user.id,
          role: (user.user_metadata?.role || 'client') as 'therapist' | 'client',
          first_name: user.user_metadata?.first_name || 'User',
          last_name: user.user_metadata?.last_name || '',
          email: user.email || '',
          whatsapp_number: null,
          professional_details: null,
          verification_status: null
        }
        console.log('Using fallback profile from auth metadata (profile missing in database):', fallbackProfile)
        setProfile(fallbackProfile)
        setError(null) // Clear any previous errors
        return
      }
      
      throw new Error('No user found')
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Failed to load profile')
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    
    const initializeAuth = async () => {
      try {
        setError(null)
        
        // Get initial session with timeout
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 10000)
        )
        
        const { data: { session } } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any
        
        if (!mounted) return
        
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user)
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setError('Failed to initialize authentication')
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

    // Listen for auth changes with debouncing
    let authTimeout: NodeJS.Timeout
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        clearTimeout(authTimeout)
        authTimeout = setTimeout(async () => {
          console.log('Auth state change:', event)
          setError(null)
          
          try {
            if (event === 'SIGNED_IN' && session?.user) {
              setUser(session.user)
              await fetchProfile(session.user)
            } else if (event === 'SIGNED_OUT') {
              setUser(null)
              setProfile(null)
            }
          } catch (error) {
            console.error('Auth state change error:', error)
            setError('Authentication error occurred')
          }
        }, 100)
      }
    )

    return () => {
      mounted = false
      clearTimeout(authTimeout)
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signIn = async (email: string, password: string) => {
    setError(null)
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signUp = async (email: string, password: string, firstName: string, lastName: string, role: 'therapist' | 'client') => {
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
            role,
          })
        
        if (profileError) throw profileError
      }
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    setError(null)
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return {
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  }
}