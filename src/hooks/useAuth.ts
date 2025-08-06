import { useState, useEffect } from 'react'
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
  const [debugInfo, setDebugInfo] = useState<string>('Starting auth...')

  useEffect(() => {
    console.log('🔄 Auth hook initializing...', new Date().toISOString())
    setDebugInfo('Auth hook initializing...')
    
    const initAuth = async () => {
      try {
        console.log('📋 Step 1: Getting session...', new Date().toISOString())
        setDebugInfo('Getting session...')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.log('❌ Session error:', error.message)
          setDebugInfo(`Session error: ${error.message}`)
          return
        }
        
        console.log('📋 Session check:', session ? 'Found user' : 'No session')
        
        if (session?.user) {
          setUser(session.user)
          console.log('👤 User found, fetching profile...')
          setDebugInfo('User found, loading profile...')
          
          try {
            console.log('📋 Fetching profile for user:', session.user.id)
            
            // Add timeout to prevent hanging
            const profilePromise = supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle()
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
            )
            
            const { data: profileData, error: profileError } = await Promise.race([
              profilePromise,
              timeoutPromise
            ])
          
            if (profileError) {
              console.log('❌ Profile error:', profileError.message)
              setDebugInfo(`Profile error: ${profileError.message}`)
              setProfile(null)
            } else if (profileData) {
              console.log('✅ Profile loaded:', profileData.role)
              setProfile(profileData)
              setDebugInfo(`Profile loaded: ${profileData.role}`)
            } else {
              console.log('⚠️ No profile found for user:', session.user.id)
              console.log('📧 User email:', session.user.email)
              setDebugInfo(`No profile found for ${session.user.email}`)
              setProfile(null)
            }
          } catch (error) {
            console.log('❌ Profile fetch failed:', error)
            setDebugInfo(`Profile fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
            setProfile(null)
          }
        }
      } catch (error) {
        console.log('⚠️ Auth error (non-blocking):', error)
        setDebugInfo(`Auth error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        console.log('✅ Auth initialization complete')
        setDebugInfo('Auth complete')
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, new Date().toISOString())
        setDebugInfo(`Auth change: ${event}`)
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            console.log('👤 Setting user from auth change')
            setUser(session.user)
            
            try {
              console.log('📋 Fetching profile for user:', session.user.id)
              setDebugInfo('Loading profile...')
              
              // Add timeout to prevent hanging
              const profilePromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle()
              
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
              )
              
              const { data: profileData, error: profileError } = await Promise.race([
                profilePromise,
                timeoutPromise
              ])
              
              if (profileError) {
                console.log('❌ Profile error:', profileError.message)
                setDebugInfo(`Profile error: ${profileError.message}`)
                setProfile(null)
              } else if (profileData) {
                console.log('✅ Profile loaded:', profileData.role)
                setProfile(profileData)
                setDebugInfo(`Profile loaded: ${profileData.role}`)
              } else {
                console.log('⚠️ No profile found for user:', session.user.id)
                console.log('📧 User email:', session.user.email)
                setDebugInfo(`No profile found for ${session.user.email}`)
                setProfile(null)
              }
            } catch (error) {
              console.log('❌ Profile fetch error:', error)
              setDebugInfo(`Profile fetch error: ${error instanceof Error ? error.message : 'Unknown'}`)
              setProfile(null)
            }
            
            // Always set loading to false after profile attempt
            console.log('✅ Setting loading to false after profile attempt')
            setLoading(false)
            
            // Always set loading to false after handling SIGNED_IN
            console.log('✅ Setting loading to false after profile attempt')
            setLoading(false)
          }
          console.log('✅ Setting loading to false after SIGNED_IN')
          setLoading(false)
          console.log('👤 Auth change: User found')
          setUser(session.user)
          
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle()
            
            if (profileError) {
              console.log('❌ Profile error:', profileError.message)
              setDebugInfo(`Profile error: ${profileError.message}`)
            } else if (profileData) {
              console.log('✅ Profile loaded:', profileData.role)
              setProfile(profileData)
              setDebugInfo(`Profile loaded: ${profileData.role}`)
            } else {
              console.log('⚠️ No profile found')
              setDebugInfo('No profile found')
            }
          } catch (error) {
            console.log('❌ Profile fetch error:', error)
            setDebugInfo(`Profile fetch error: ${error instanceof Error ? error.message : 'Unknown'}`)
          }
          
        } else if (event === 'SIGNED_OUT') {
          console.log('👤 Auth change: No user')
          setUser(null)
          setProfile(null)
          setLoading(false)
          setLoading(false)
        }
      }
    )

    console.log('🔄 Setting up auth listener...', new Date().toISOString())

    return () => {
      console.log('🧹 Cleaning up auth subscription', new Date().toISOString())
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, firstName: string, lastName: string, role: 'therapist' | 'client') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
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
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return {
    user,
    profile,
    loading,
    debugInfo,
    signIn,
    signUp,
    signOut,
  }
}