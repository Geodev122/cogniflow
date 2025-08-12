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
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.error('Profile fetch error:', profileError)
        throw profileError
      }
      
      setProfile(profileData)
      setError(null)
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
        
        const { data: { session } } = await supabase.auth.getSession()
        
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
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
      }
    )

    return () => {
      mounted = false
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