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
    
    // Create admin client for user management
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Create regular client for auth operations
    const supabaseClient = createClient(
      supabaseUrl, 
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false
        }
      }
    )

    const authRequest: AuthRequest = await req.json()
    let response: AuthResponse = { success: false }

    switch (authRequest.action) {
      case 'signIn':
        if (!authRequest.email || !authRequest.password) {
          response = { success: false, error: 'Email and password are required' }
          break
        }

        // Use the regular client for sign in
        const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
          email: authRequest.email,
          password: authRequest.password
        })

        if (signInError) {
          response = { success: false, error: signInError.message }
          break
        }

        if (!signInData.user || !signInData.session) {
          response = { success: false, error: 'Authentication failed' }
          break
        }

        // Fetch user profile using admin client
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .single()

        response = { 
          success: true, 
          user: signInData.user, 
          session: signInData.session,
          profile: profileError ? null : profileData
        }
        break

      case 'signUp':
        if (!authRequest.email || !authRequest.password || !authRequest.userData) {
          response = { success: false, error: 'Email, password, and user data are required' }
          break
        }

        // Use admin client to create user
        const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
          email: authRequest.email,
          password: authRequest.password,
          email_confirm: true,
          user_metadata: authRequest.userData
        })

        if (signUpError) {
          response = { success: false, error: signUpError.message }
          break
        }

        if (signUpData.user) {
          // Create profile using admin client
          const { error: profileInsertError } = await supabaseAdmin
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
              session: null // User needs to sign in after registration
            }
          }
        } else {
          response = { success: false, error: 'User creation failed' }
        }
        break

      case 'signOut':
        // Get auth header for user context
        const authHeader = req.headers.get('Authorization')
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.replace('Bearer ', '')
          
          // Set session for the client
          await supabaseClient.auth.setSession({
            access_token: token,
            refresh_token: '', // We don't have refresh token here
          })
        }
        
        const { error: signOutError } = await supabaseClient.auth.signOut()
        response = { 
          success: !signOutError, 
          error: signOutError?.message 
        }
        break

      case 'getSession':
        // Get auth header
        const sessionAuthHeader = req.headers.get('Authorization')
        if (!sessionAuthHeader || !sessionAuthHeader.startsWith('Bearer ')) {
          response = { success: true, user: null, session: null, profile: null }
          break
        }

        const sessionToken = sessionAuthHeader.replace('Bearer ', '')
        
        // Verify token using admin client
        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(sessionToken)
        
        if (userError || !userData.user) {
          response = { success: true, user: null, session: null, profile: null }
          break
        }

        // Fetch profile
        const { data: sessionProfileData, error: sessionProfileError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single()

        // Create a mock session object since we can't get the full session from token
        const mockSession = {
          access_token: sessionToken,
          refresh_token: '',
          expires_in: 3600,
          token_type: 'bearer',
          user: userData.user
        }

        response = { 
          success: true, 
          user: userData.user,
          session: mockSession,
          profile: sessionProfileError ? null : sessionProfileData
        }
        break

      case 'refreshSession':
        // Get current session token
        const refreshAuthHeader = req.headers.get('Authorization')
        if (!refreshAuthHeader || !refreshAuthHeader.startsWith('Bearer ')) {
          response = { success: false, error: 'No session to refresh' }
          break
        }

        const refreshToken = refreshAuthHeader.replace('Bearer ', '')
        
        // Verify the current token is still valid
        const { data: refreshUserData, error: refreshUserError } = await supabaseAdmin.auth.getUser(refreshToken)
        
        if (refreshUserError || !refreshUserData.user) {
          response = { success: false, error: 'Invalid session' }
          break
        }

        // Return the same session (tokens don't expire quickly in development)
        const refreshMockSession = {
          access_token: refreshToken,
          refresh_token: '',
          expires_in: 3600,
          token_type: 'bearer',
          user: refreshUserData.user
        }

        response = { 
          success: true, 
          user: refreshUserData.user,
          session: refreshMockSession
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