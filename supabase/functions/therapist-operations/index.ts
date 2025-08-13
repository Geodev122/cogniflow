import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface TherapistDashboardData {
  stats: {
    totalClients: number
    pendingAssessments: number
    completedAssessments: number
    upcomingAppointments: number
  }
  clients: any[]
  recentActivity: any[]
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Verify therapist role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'therapist') {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace('/therapist-operations', '');

    switch (path) {
      case '/dashboard-data':
        try {
          // Get client relations
          const { data: relations } = await supabase
            .from('therapist_client_relations')
            .select(`
              client_id,
              profiles!therapist_client_relations_client_id_fkey (
                id, first_name, last_name, email, created_at
              )
            `)
            .eq('therapist_id', user.id);

          const clients = relations?.map(r => r.profiles).filter(Boolean) || [];

          // Get assignments count
          const { data: assignments } = await supabase
            .from('form_assignments')
            .select('status')
            .eq('therapist_id', user.id);

          const pendingAssessments = assignments?.filter(a => a.status === 'assigned').length || 0;
          const completedAssessments = assignments?.filter(a => a.status === 'completed').length || 0;

          // Get upcoming appointments
          const { data: appointments } = await supabase
            .from('appointments')
            .select('id')
            .eq('therapist_id', user.id)
            .eq('status', 'scheduled')
            .gte('appointment_date', new Date().toISOString());

          const stats = {
            totalClients: clients.length,
            pendingAssessments,
            completedAssessments,
            upcomingAppointments: appointments?.length || 0
          };

          const dashboardData: TherapistDashboardData = {
            stats,
            clients: clients.slice(0, 5), // Recent 5 clients
            recentActivity: []
          };

          return new Response(JSON.stringify(dashboardData), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

      case '/clients':
        try {
          const { data: relations } = await supabase
            .from('therapist_client_relations')
            .select(`
              client_id,
              profiles!therapist_client_relations_client_id_fkey (
                id, first_name, last_name, email, created_at, whatsapp_number, patient_code
              )
            `)
            .eq('therapist_id', user.id);

          const clients = relations?.map(r => r.profiles).filter(Boolean) || [];

          // Get client profiles
          const clientIds = clients.map(c => c.id);
          const { data: clientProfiles } = await supabase
            .from('client_profiles')
            .select('client_id, risk_level, presenting_concerns, notes')
            .in('client_id', clientIds)
            .eq('therapist_id', user.id);

          const profilesMap = clientProfiles?.reduce((acc, p) => {
            acc[p.client_id] = p;
            return acc;
          }, {} as Record<string, any>) || {};

          return new Response(JSON.stringify({ clients, profilesMap }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

      case '/add-client':
        if (req.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        try {
          const { email } = await req.json();

          // Check if user exists
          const { data: existingUser } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('email', email)
            .single();

          if (!existingUser) {
            return new Response(JSON.stringify({ 
              error: 'Client must register first. Please ask them to create an account.' 
            }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          if (existingUser.role !== 'client') {
            return new Response(JSON.stringify({ 
              error: 'User is not registered as a client.' 
            }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          // Check if relationship already exists
          const { data: existingRelation } = await supabase
            .from('therapist_client_relations')
            .select('id')
            .eq('therapist_id', user.id)
            .eq('client_id', existingUser.id)
            .single();

          if (existingRelation) {
            return new Response(JSON.stringify({ 
              error: 'This client is already in your roster.' 
            }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          // Create relationship
          const { error: relationError } = await supabase
            .from('therapist_client_relations')
            .insert({
              therapist_id: user.id,
              client_id: existingUser.id
            });

          if (relationError) throw relationError;

          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

      case '/update-client-profile':
        if (req.method !== 'PUT') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        try {
          const { clientId, updates } = await req.json();

          // Verify therapist-client relationship
          const { data: relationship } = await supabase
            .from('therapist_client_relations')
            .select('id')
            .eq('therapist_id', user.id)
            .eq('client_id', clientId)
            .single();

          if (!relationship) {
            return new Response(JSON.stringify({ error: 'No relationship found' }), {
              status: 403,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          // Update client profile
          const { error } = await supabase
            .from('client_profiles')
            .upsert({
              client_id: clientId,
              therapist_id: user.id,
              ...updates,
              updated_at: new Date().toISOString()
            });

          if (error) throw error;

          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

      default:
        return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});