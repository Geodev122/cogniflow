@@ .. @@
   const fetchDashboardStats = useCallback(async () => {
     if (!profile) return
 
     try {
-      // Fetch all stats in parallel for better performance
-      const [
-        { data: clientRelations },
-        { data: assessments },
-        { data: appointments },
-        { data: overdueAssignments }
-      ] = await Promise.all([
-        supabase
-          .from('therapist_client_relations')
-          .select('client_id')
-          .eq('therapist_id', profile.id),
-        supabase
-          .from('form_assignments')
-          .select('status')
-          .eq('therapist_id', profile.id),
-        supabase
-          .from('appointments')
-          .select('id')
-          .eq('therapist_id', profile.id)
-          .eq('status', 'scheduled')
-          .gte('appointment_date', new Date().toISOString())
-          .lte('appointment_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
-        supabase
-          .from('form_assignments')
-          .select('id')
-          .eq('therapist_id', profile.id)
-          .eq('status', 'assigned')
-          .lt('due_date', new Date().toISOString().split('T')[0])
-      ])
-
-      const totalClients = clientRelations?.length || 0
-      const pendingAssessments = assessments?.filter(a => a.status === 'assigned' || a.status === 'in_progress').length || 0
-      const completedAssessments = assessments?.filter(a => a.status === 'completed').length || 0
-      const upcomingAppointments = appointments?.length || 0
+      // Use the insights view for better performance
+      const { data: insights } = await supabase
+        .from('therapist_insights_metrics')
+        .select('*')
+        .eq('therapist_id', profile.id)
+        .single()
+      
+      // Get client count
+      const { data: clientRelations } = await supabase
+        .from('therapist_client_relations')
+        .select('client_id')
+        .eq('therapist_id', profile.id)
+      
+      // Get assessment stats
+      const { data: assessments } = await supabase
+        .from('form_assignments')
+        .select('status')
+        .eq('therapist_id', profile.id)
+      
+      // Get upcoming appointments
+      const { data: appointments } = await supabase
+        .from('appointments')
+        .select('id')
+        .eq('therapist_id', profile.id)
+        .eq('status', 'scheduled')
+        .gte('appointment_date', new Date().toISOString())
+        .lte('appointment_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
+
+      const totalClients = clientRelations?.length || 0
+      const pendingAssessments = assessments?.filter(a => a.status === 'assigned' || a.status === 'in_progress').length || 0
+      const completedAssessments = assessments?.filter(a => a.status === 'completed').length || 0
+      const upcomingAppointments = appointments?.length || 0
 
       setStats({
         totalClients,
         activeClients: totalClients, // For now, assume all clients are active
         pendingAssessments,
         completedAssessments,
         upcomingAppointments,
-        overdueAssignments: overdueAssignments?.length || 0
+        overdueAssignments: insights?.overdue_assessments || 0
       })
     } catch (error) {
       console.error('Error fetching dashboard stats:', error)
     } finally {
       setLoading(false)
     }
   }, [profile])