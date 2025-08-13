import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase client with robust session management
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true
        }
      }
    );

    const url = new URL(req.url);
    const path = url.pathname.replace('/auth', '');
    
    switch (path) {
      case '/login':
        try {
          const { email, password } = await req.json();
          
          if (!email || !password) {
            throw new Error('Email and password are required');
          }
          
          // Authenticate user
          const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (authError) throw authError;

          if (!data.user || !data.session) {
            throw new Error('Authentication failed - no user or session returned');
          }

          // Fetch comprehensive profile
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
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
            // Don't throw error, just log it and return user without profile
          }

          return new Response(JSON.stringify({ 
            success: true,
            user: data.user, 
            profile: profileData || null,
            session: data.session
          }), {
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        } catch (error) {
          console.error('Login error:', error);
          return new Response(JSON.stringify({ 
            success: false,
            error: error.message || 'Login failed'
          }), { 
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

      case '/signup':
        try {
          const { email, password, role, first_name, last_name } = await req.json();
          
          if (!email || !password || !role || !first_name || !last_name) {
            throw new Error('All fields are required: email, password, role, first_name, last_name');
          }
          
          // Validate role
          if (!['therapist', 'client'].includes(role)) {
            throw new Error('Invalid role. Must be therapist or client.');
          }

          // Create user with detailed profile
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                role,
                first_name,
                last_name
              }
            }
          });

          if (error) throw error;

          if (!data.user) {
            throw new Error('User creation failed');
          }

          // Insert comprehensive profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              role,
              first_name,
              last_name,
              email,
              password_set: true,
              verification_status: role === 'therapist' ? 'pending' : null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Try to clean up the user if profile creation failed
            await supabase.auth.admin.deleteUser(data.user.id);
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }

          return new Response(JSON.stringify({ 
            success: true,
            user: data.user,
            session: data.session,
            message: 'Account created successfully'
          }), {
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        } catch (error) {
          console.error('Signup error:', error);
          return new Response(JSON.stringify({ 
            success: false,
            error: error.message || 'Signup failed'
          }), { 
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

      case '/logout':
        try {
          // Get the authorization header to identify the user
          const authHeader = req.headers.get('Authorization');
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            
            // Verify and get user from token
            const { data: { user }, error: userError } = await supabase.auth.getUser(token);
            
            if (!userError && user) {
              // Sign out the specific user
              const { error: signOutError } = await supabase.auth.admin.signOut(user.id);
              if (signOutError) {
                console.error('Admin signout error:', signOutError);
              }
            }
          }
          
          // Also perform general signout
          const { error } = await supabase.auth.signOut();
          
          if (error) {
            console.error('General signout error:', error);
          }

          return new Response(JSON.stringify({ 
            success: true,
            message: 'Logged out successfully'
          }), {
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        } catch (error) {
          console.error('Logout error:', error);
          return new Response(JSON.stringify({ 
            success: false,
            error: error.message || 'Logout failed'
          }), { 
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

      case '/session':
        try {
          // Get the authorization header
          const authHeader = req.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ 
              success: true,
              user: null, 
              profile: null, 
              session: null
            }), {
              status: 200,
              headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          const token = authHeader.replace('Bearer ', '');
          
          // Verify token and get user
          const { data: { user }, error: userError } = await supabase.auth.getUser(token);
          
          if (userError || !user) {
            return new Response(JSON.stringify({ 
              success: true,
              user: null, 
              profile: null, 
              session: null
            }), {
              status: 200,
              headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          // Fetch comprehensive profile
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
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
          }

          // Create session object
          const sessionData = {
            access_token: token,
            refresh_token: '',
            expires_in: 3600,
            token_type: 'bearer',
            user: user
          };

          return new Response(JSON.stringify({ 
            success: true,
            user: user,
            profile: profileData || null,
            session: sessionData
          }), {
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        } catch (error) {
          console.error('Session check error:', error);
          return new Response(JSON.stringify({ 
            success: false,
            error: error.message || 'Session check failed'
          }), { 
            status: 500,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

      case '/refresh':
        try {
          const authHeader = req.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('No session to refresh');
          }

          const token = authHeader.replace('Bearer ', '');
          
          // Verify the current token is still valid
          const { data: { user }, error: userError } = await supabase.auth.getUser(token);
          
          if (userError || !user) {
            throw new Error('Invalid session');
          }

          // Return the same session (tokens don't expire quickly in development)
          const refreshedSession = {
            access_token: token,
            refresh_token: '',
            expires_in: 3600,
            token_type: 'bearer',
            user: user
          };

          return new Response(JSON.stringify({ 
            success: true,
            user: user,
            session: refreshedSession
          }), {
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        } catch (error) {
          console.error('Refresh error:', error);
          return new Response(JSON.stringify({ 
            success: false,
            error: error.message || 'Session refresh failed'
          }), { 
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

      default:
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Endpoint not found'
        }), { 
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
    }
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Internal server error'
    }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});