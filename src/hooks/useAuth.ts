import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface Profile {
  id: string
  role: 'therapist' | 'client'
  first_name: string
  last_name: string
  email: string
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId)
      
      // First try normal query
      let { data, error } = await supabase
        .from('profiles')
        .select('id, role, first_name, last_name, email')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Profile fetch error:', error)
        
        // If infinite recursion error, try RPC function as fallback
        if (error.message?.includes('infinite recursion')) {
          console.log('Infinite recursion detected, trying RPC fallback...')
          
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_user_profile_safe', { user_id: userId })
          
          if (rpcError) {
            console.error('RPC fallback also failed:', rpcError)
            // Create a minimal profile from auth user data
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              const fallbackProfile = {
                id: user.id,
                role: (user.user_metadata?.role || 'client') as 'therapist' | 'client',
                first_name: user.user_metadata?.first_name || 'User',
                last_name: user.user_metadata?.last_name || '',
                email: user.email || ''
              }
              console.log('Using fallback profile from auth metadata:', fallbackProfile)
              setProfile(fallbackProfile)
              return
            }
          } else {
            console.log('RPC fallback successful:', rpcData)
            setProfile(rpcData)
            return
          }
        }
        
        if (error.code === 'PGRST116') {
          console.log('Profile not found, user needs to complete registration')
          setProfile(null)
          return
        }
        
        throw error
      }
      
      console.log('Profile loaded successfully:', data)
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      
      // If it's a recursion error, show specific message
      if (error instanceof Error && error.message?.includes('infinite recursion')) {
        setError('Database configuration issue detected. Please contact support.')
      } else {
        setError('Failed to load profile')
      }
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
          await fetchProfile(session.user.id)
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
              await fetchProfile(session.user.id)
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