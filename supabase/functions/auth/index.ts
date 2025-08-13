import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.39.7'

interface LoginPayload {
  email: string
  password: string
}

interface SignupPayload {
  email: string
  password: string
  first_name: string
  last_name: string
  role: 'client' | 'therapist'
}

interface ResetPasswordPayload {
  email: string
}

const createSupabaseClient = (req: Request) => {
  const authHeader = req.headers.get('Authorization')

  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: {
          Authorization: authHeader ?? '',
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

const createProfile = async (
  supabase: SupabaseClient,
  userId: string,
  first_name: string,
  last_name: string,
  email: string,
  role: string
) => {
  const { error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      first_name,
      last_name,
      email,
      role,
    })

  if (error) {
    throw new Error(`Failed to create profile: ${error.message}`)
  }
}

const handleLogin = async (req: Request) => {
  try {
    const supabase = createSupabaseClient(req)
    const { email, password }: LoginPayload = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        message: 'Login successful',
        user: data.user,
        session: data.session,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

const handleSignup = async (req: Request) => {
  try {
    const supabase = createSupabaseClient(req)
    const {
      email,
      password,
      first_name,
      last_name,
      role,
    }: SignupPayload = await req.json()

    if (!email || !password || !first_name || !last_name || !role) {
      return new Response(
        JSON.stringify({ error: 'All fields are required for signup' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (role !== 'client' && role !== 'therapist') {
      return new Response(
        JSON.stringify({ error: 'Role must be either "client" or "therapist"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
          role,
        },
      },
    })

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (data?.user) {
      try {
        await createProfile(
          supabase,
          data.user.id,
          first_name,
          last_name,
          email,
          role
        )
      } catch (profileError) {
        return new Response(
          JSON.stringify({ error: profileError instanceof Error ? profileError.message : String(profileError) }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Signup successful',
        user: data.user,
        session: data.session,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

const handlePasswordReset = async (req: Request) => {
  try {
    const supabase = createSupabaseClient(req)
    const { email }: ResetPasswordPayload = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${Deno.env.get('FRONTEND_URL')}/reset-password`,
    })

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Password reset email sent' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

const handleLogout = async (req: Request) => {
  try {
    const supabase = createSupabaseClient(req)
    const { error } = await supabase.auth.signOut()

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Successfully logged out' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

Deno.serve(async (req: Request) => {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  })

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers })
  }

  const url = new URL(req.url)
  const path = url.pathname.replace('/auth', '')

  try {
    if (req.method === 'POST') {
      switch (path) {
        case '/login': {
          const res = await handleLogin(req)
          headers.forEach((value, key) => res.headers.set(key, value))
          return res
        }
        case '/signup': {
          const res = await handleSignup(req)
          headers.forEach((value, key) => res.headers.set(key, value))
          return res
        }
        case '/reset-password': {
          const res = await handlePasswordReset(req)
          headers.forEach((value, key) => res.headers.set(key, value))
          return res
        }
        case '/logout': {
          const res = await handleLogout(req)
          headers.forEach((value, key) => res.headers.set(key, value))
          return res
        }
        default:
          return new Response(
            JSON.stringify({ error: 'Route not found' }),
            { status: 404, headers }
          )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers }
    )
  }
})

