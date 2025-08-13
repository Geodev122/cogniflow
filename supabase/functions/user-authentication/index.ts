const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface AuthRequest {
  action: 'signIn' | 'signUp' | 'signOut' | 'getSession' | 'refreshSession'
  email?: string
  password?: string
  userData?: {
    first_name: string
    last_name: string
    role: 'therapist' | 'client'
  }
}

interface AuthResponse {
  success: boolean
  data?: any
  error?: string
  user?: any
  session?: any
  profile?: any
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const authRequest: AuthRequest = await req.json()

    let response: AuthResponse = { success: false }

    switch (authRequest.action) {
      case 'signIn':
        if (!authRequest.email || !authRequest.password) {
          response = { success: false, error: 'Email and password are required' }
          break
        }

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: authRequest.email,
          password: authRequest.password
        })

        if (signInError) {
          response = { success: false, error: signInError.message }
          break
        }

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .single()

        if (profileError) {
          response = { 
            success: true, 
            user: signInData.user, 
            session: signInData.session,
            profile: null,
            error: 'Profile not found'
          }
        } else {
          response = { 
            success: true, 
            user: signInData.user, 
            session: signInData.session,
            profile: profileData
          }
        }
        break

      case 'signUp':
        if (!authRequest.email || !authRequest.password || !authRequest.userData) {
          response = { success: false, error: 'Email, password, and user data are required' }
          break
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: authRequest.email,
          password: authRequest.password,
          options: {
            data: authRequest.userData
          }
        })

        if (signUpError) {
          response = { success: false, error: signUpError.message }
          break
        }

        if (signUpData.user) {
          // Create profile
          const { error: profileInsertError } = await supabase
            .from('profiles')
            .insert({
              id: signUpData.user.id,
              email: authRequest.email,
              first_name: authRequest.userData.first_name,
              last_name: authRequest.userData.last_name,
              role: authRequest.userData.role
            })

          if (profileInsertError) {
            response = { 
              success: false, 
              error: `User created but profile failed: ${profileInsertError.message}` 
            }
          } else {
            response = { 
              success: true, 
              user: signUpData.user, 
              session: signUpData.session 
            }
          }
        } else {
          response = { success: false, error: 'User creation failed' }
        }
        break

      case 'signOut':
        const { error: signOutError } = await supabase.auth.signOut()
        response = { 
          success: !signOutError, 
          error: signOutError?.message 
        }
        break

      case 'getSession':
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          response = { success: false, error: sessionError.message }
          break
        }

        if (sessionData.session?.user) {
          // Fetch profile
          const { data: userProfile, error: userProfileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sessionData.session.user.id)
            .single()

          response = { 
            success: true, 
            user: sessionData.session.user,
            session: sessionData.session,
            profile: userProfileError ? null : userProfile
          }
        } else {
          response = { success: true, user: null, session: null, profile: null }
        }
        break

      case 'refreshSession':
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        response = { 
          success: !refreshError, 
          user: refreshData.user,
          session: refreshData.session,
          error: refreshError?.message 
        }
        break

      default:
        response = { success: false, error: 'Invalid action' }
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        status: response.success ? 200 : 400
      }
    )

  } catch (error) {
    console.error('Authentication function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        status: 500
      }
    )
  }
})