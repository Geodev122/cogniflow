import { supabase } from './supabase'

class APIService {
  // Client Operations - Direct Supabase calls
  static async getClientDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('form_assignments')
        .select('*')
        .eq('client_id', user.id)
        .order('assigned_at', { ascending: false })

      if (assignmentsError) {
        console.error('Assignments error:', assignmentsError)
      }

      // Get progress data
      const { data: progressData, error: progressError } = await supabase
        .from('progress_tracking')
        .select('*')
        .eq('client_id', user.id)
        .order('recorded_at', { ascending: true })

      if (progressError) {
        console.error('Progress error:', progressError)
      }

      // Calculate stats
      const safeAssignments = assignments || []
      const stats = {
        worksheets: safeAssignments.filter(a => a.form_type === 'worksheet').length,
        assessments: safeAssignments.filter(a => a.form_type === 'psychometric').length,
        exercises: safeAssignments.filter(a => a.form_type === 'exercise').length,
        completed: safeAssignments.filter(a => a.status === 'completed').length
      }

      return {
        assignments: safeAssignments,
        progressData: progressData || [],
        stats
      }
    } catch (error) {
      console.error('Failed to get client dashboard data:', error)
      return {
        assignments: [],
        progressData: [],
        stats: { worksheets: 0, assessments: 0, exercises: 0, completed: 0 }
      }
    }
  }

  static async updateAssignment(assignmentId: string, status: string, responses?: any, score?: number) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('form_assignments')
        .update({ 
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', assignmentId)
        .eq('client_id', user.id)

      if (error) throw error

      // Add progress tracking if score provided
      if (score !== undefined) {
        await supabase
          .from('progress_tracking')
          .insert({
            client_id: user.id,
            metric_type: 'assessment_score',
            value: score,
            source_type: 'psychometric',
            source_id: assignmentId
          })
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to update assignment:', error)
      throw error
    }
  }

  // Therapist Operations - Direct Supabase calls
  static async getTherapistDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get client relations
      const { data: relations, error: relationsError } = await supabase
        .from('therapist_client_relations')
        .select(`
          client_id,
          profiles!therapist_client_relations_client_id_fkey (
            id, first_name, last_name, email, created_at
          )
        `)
        .eq('therapist_id', user.id)

      if (relationsError) {
        console.error('Relations error:', relationsError)
      }

      const clients = relations?.map(r => r.profiles).filter(Boolean) || []

      // Get assignments count
      const { data: assignments, error: assignmentsError } = await supabase
        .from('form_assignments')
        .select('status')
        .eq('therapist_id', user.id)

      if (assignmentsError) {
        console.error('Assignments error:', assignmentsError)
      }

      const safeAssignments = assignments || []
      const stats = {
        totalClients: clients.length,
        pendingAssessments: safeAssignments.filter(a => a.status === 'assigned').length,
        completedAssessments: safeAssignments.filter(a => a.status === 'completed').length,
        upcomingAppointments: 0
      }

      return {
        stats,
        clients: clients.slice(0, 5),
        recentActivity: []
      }
    } catch (error) {
      console.error('Failed to get therapist dashboard data:', error)
      return {
        stats: { totalClients: 0, pendingAssessments: 0, completedAssessments: 0, upcomingAppointments: 0 },
        clients: [],
        recentActivity: []
      }
    }
  }

  static async getTherapistClients() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: relations, error: relationsError } = await supabase
        .from('therapist_client_relations')
        .select(`
          client_id,
          profiles!therapist_client_relations_client_id_fkey (
            id, first_name, last_name, email, created_at, whatsapp_number, patient_code
          )
        `)
        .eq('therapist_id', user.id)

      if (relationsError) {
        console.error('Relations error:', relationsError)
        return { clients: [], profilesMap: {} }
      }

      const clients = relations?.map(r => r.profiles).filter(Boolean) || []

      // Get client profiles
      const clientIds = clients.map(c => c.id)
      let profilesMap = {}
      
      if (clientIds.length > 0) {
        const { data: clientProfiles, error: profilesError } = await supabase
          .from('client_profiles')
          .select('client_id, risk_level, presenting_concerns, notes')
          .in('client_id', clientIds)
          .eq('therapist_id', user.id)

        if (!profilesError && clientProfiles) {
          profilesMap = clientProfiles.reduce((acc, p) => {
            acc[p.client_id] = p
            return acc
          }, {} as Record<string, any>)
        }
      }

      return { clients, profilesMap }
    } catch (error) {
      console.error('Failed to get therapist clients:', error)
      return { clients: [], profilesMap: {} }
    }
  }

  static async addClientToRoster(email: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('email', email)
        .single()

      if (userError || !existingUser) {
        throw new Error('Client must register first. Please ask them to create an account.')
      }

      if (existingUser.role !== 'client') {
        throw new Error('User is not registered as a client.')
      }

      // Check if relationship already exists
      const { data: existingRelation } = await supabase
        .from('therapist_client_relations')
        .select('id')
        .eq('therapist_id', user.id)
        .eq('client_id', existingUser.id)
        .single()

      if (existingRelation) {
        throw new Error('This client is already in your roster.')
      }

      // Create relationship
      const { error: relationError } = await supabase
        .from('therapist_client_relations')
        .insert({
          therapist_id: user.id,
          client_id: existingUser.id
        })

      if (relationError) throw relationError

      return { success: true }
    } catch (error) {
      console.error('Failed to add client to roster:', error)
      throw error
    }
  }

  static async updateClientProfile(clientId: string, updates: Record<string, any>) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Verify therapist-client relationship
      const { data: relationship } = await supabase
        .from('therapist_client_relations')
        .select('id')
        .eq('therapist_id', user.id)
        .eq('client_id', clientId)
        .single()

      if (!relationship) {
        throw new Error('No relationship found')
      }

      // Update client profile
      const { error } = await supabase
        .from('client_profiles')
        .upsert({
          client_id: clientId,
          therapist_id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Failed to update client profile:', error)
      throw error
    }
  }

  // Case Management - Direct Supabase calls
  static async getCases() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: relations, error: relationsError } = await supabase
        .from('therapist_client_relations')
        .select(`
          client_id,
          profiles!therapist_client_relations_client_id_fkey (
            id, first_name, last_name, email, created_at
          )
        `)
        .eq('therapist_id', user.id)

      if (relationsError) {
        console.error('Relations error:', relationsError)
        return []
      }

      const cases = relations?.map(relation => ({
        client: relation.profiles,
        sessionCount: 0,
        lastSession: undefined,
        nextAppointment: undefined,
        assessments: [],
        treatmentPlanId: undefined,
        treatmentPlanTitle: undefined,
        goals: [],
        assignments: [],
        riskLevel: 'low',
        progressSummary: 'No progress notes available',
        caseNotes: '',
        timeline: [],
        checkpoints: [],
        dischargeNotes: ''
      })) || []

      return cases
    } catch (error) {
      console.error('Failed to get cases:', error)
      return []
    }
  }

  static async createTreatmentPlan(clientId: string, title: string, caseFormulation?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

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
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to create treatment plan:', error)
      throw error
    }
  }

  static async addGoal(treatmentPlanId: string, goalText: string, targetDate?: string) {
    try {
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
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to add goal:', error)
      throw error
    }
  }

  static async assignTask(clientId: string, formType: string, title: string, instructions?: string, dueDate?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

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
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to assign task:', error)
      throw error
    }
  }
}

export { APIService }