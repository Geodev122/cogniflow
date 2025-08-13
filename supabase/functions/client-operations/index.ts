import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ClientData {
  assignments: any[]
  progressData: any[]
  profile: any
  stats: any
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

    const url = new URL(req.url);
    const path = url.pathname.replace('/client-operations', '');

    switch (path) {
      case '/dashboard-data':
        try {
          // Get client profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profile?.role !== 'client') {
            return new Response(JSON.stringify({ error: 'Access denied' }), {
              status: 403,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          // Get assignments
          const { data: assignments } = await supabase
            .from('form_assignments')
            .select('id, title, form_type, status, assigned_at, completed_at, instructions, due_date')
            .eq('client_id', user.id)
            .order('assigned_at', { ascending: false });

          // Get progress data
          const { data: progressData } = await supabase
            .from('progress_tracking')
            .select('recorded_at, value, metric_type')
            .eq('client_id', user.id)
            .order('recorded_at', { ascending: true });

          // Calculate stats
          const worksheets = assignments?.filter(a => a.form_type === 'worksheet') || [];
          const assessments = assignments?.filter(a => a.form_type === 'psychometric') || [];
          const exercises = assignments?.filter(a => a.form_type === 'exercise') || [];
          const completed = assignments?.filter(a => a.status === 'completed') || [];

          const stats = {
            worksheets: worksheets.length,
            assessments: assessments.length,
            exercises: exercises.length,
            completed: completed.length
          };

          const clientData: ClientData = {
            assignments: assignments || [],
            progressData: progressData || [],
            profile,
            stats
          };

          return new Response(JSON.stringify(clientData), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

      case '/update-assignment':
        if (req.method !== 'PUT') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        try {
          const { assignmentId, status, responses, score } = await req.json();

          // Update assignment
          const { error: updateError } = await supabase
            .from('form_assignments')
            .update({
              status,
              completed_at: status === 'completed' ? new Date().toISOString() : null
            })
            .eq('id', assignmentId)
            .eq('client_id', user.id);

          if (updateError) throw updateError;

          // Add progress tracking if score provided
          if (score !== undefined) {
            const { data: assignment } = await supabase
              .from('form_assignments')
              .select('form_type')
              .eq('id', assignmentId)
              .single();

            await supabase
              .from('progress_tracking')
              .insert({
                client_id: user.id,
                metric_type: assignment?.form_type || 'assessment',
                value: score,
                source_type: 'psychometric',
                source_id: assignmentId
              });
          }

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