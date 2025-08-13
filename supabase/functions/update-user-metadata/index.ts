const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface MetadataRequest {
  userId: string
  metadata: {
    first_name?: string
    last_name?: string
    whatsapp_number?: string
    professional_details?: any
    verification_status?: string
  }
}

interface MetadataResponse {
  success: boolean
  data?: any
  error?: string
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

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header required' }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 401
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 401
        }
      )
    }

    const metadataRequest: MetadataRequest = await req.json()

    // Verify user can update this profile (must be their own or they must be a therapist updating a client)
    if (metadataRequest.userId !== user.id) {
      // Check if user is a therapist and has permission to update this client
      const { data: therapistProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (therapistProfile?.role !== 'therapist') {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized to update this profile' }),
          {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 403
          }
        )
      }

      // Verify therapist-client relationship
      const { data: relationship } = await supabase
        .from('therapist_client_relations')
        .select('id')
        .eq('therapist_id', user.id)
        .eq('client_id', metadataRequest.userId)
        .single()

      if (!relationship) {
        return new Response(
          JSON.stringify({ success: false, error: 'No relationship found with this client' }),
          {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 403
          }
        )
      }
    }

    // Update the profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        ...metadataRequest.metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', metadataRequest.userId)
      .select()
      .single()

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 400
        }
      )
    }

    // Log the update
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'profile_updated',
        resource_type: 'profile',
        resource_id: metadataRequest.userId,
        details: {
          updated_fields: Object.keys(metadataRequest.metadata),
          updated_by: user.id === metadataRequest.userId ? 'self' : 'therapist'
        }
      })

    const response: MetadataResponse = {
      success: true,
      data: updatedProfile
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        status: 200
      }
    )

  } catch (error) {
    console.error('Update metadata function error:', error)
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