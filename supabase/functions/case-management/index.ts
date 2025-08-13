import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

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
    const path = url.pathname.replace('/case-management', '');

    switch (path) {
      case '/cases':
        try {
          const { data: relations } = await supabase
            .from('therapist_client_relations')
            .select(`
              client_id,
              profiles!therapist_client_relations_client_id_fkey (
                id, first_name, last_name, email, created_at
              )
            `)
            .eq('therapist_id', user.id);

          const cases = relations?.map(relation => ({
            client: relation.profiles,
            sessionCount: 0,
            lastSession: undefined,
            nextAppointment: undefined,
            assessments: [],
            riskLevel: 'low',
            progressSummary: 'No progress notes available'
          })) || [];

          return new Response(JSON.stringify(cases), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

      case '/create-treatment-plan':
        if (req.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        try {
          const { clientId, title, caseFormulation } = await req.json();

          const { data, error } = await supabase
            .from('treatment_plans')
            .insert({
              client_id: clientId,
              therapist_id: user.id,
              title,
              case_formulation: caseFormulation,
              status: 'active'
            })
            .select()
            .single();

          if (error) throw error;

          return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

      case '/add-goal':
        if (req.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        try {
          const { treatmentPlanId, goalText, targetDate } = await req.json();

          const { data, error } = await supabase
            .from('therapy_goals')
            .insert({
              treatment_plan_id: treatmentPlanId,
              goal_text: goalText,
              target_date: targetDate,
              progress_percentage: 0,
              status: 'active'
            })
            .select()
            .single();

          if (error) throw error;

          return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

      case '/assign-task':
        if (req.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        try {
          const { clientId, formType, title, instructions, dueDate } = await req.json();

          const { data, error } = await supabase
            .from('form_assignments')
            .insert({
              therapist_id: user.id,
              client_id: clientId,
              form_type: formType,
              title,
              instructions,
              due_date: dueDate,
              status: 'assigned'
            })
            .select()
            .single();

          if (error) throw error;

          return new Response(JSON.stringify(data), {
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