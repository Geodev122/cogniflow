import { supabase } from './supabase'

class APIService {
  private static async makeRequest(endpoint: string, options: RequestInit = {}) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const baseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!baseUrl) {
        throw new Error('VITE_SUPABASE_URL environment variable is not set')
      }

      const functionsUrl = `${baseUrl}/functions/v1`
      const fullUrl = `${functionsUrl}/${endpoint}`

      console.log('🌐 Making API request to:', fullUrl)

      const response = await fetch(fullUrl, {
        ...options,
        headers
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API request failed:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ API request successful:', endpoint)
      return result
    } catch (error) {
      console.error(`❌ API request failed (${endpoint}):`, error)
      throw error
    }
  }

  // Client Operations
  static async getClientDashboardData() {
    try {
      return await this.makeRequest('client-operations/dashboard-data')
    } catch (error) {
      console.error('❌ Failed to get client dashboard data:', error)
      // Return fallback data
      return {
        assignments: [],
        progressData: [],
        stats: { worksheets: 0, assessments: 0, exercises: 0, completed: 0 }
      }
    }
  }

  static async updateAssignment(assignmentId: string, status: string, responses?: any, score?: number) {
    return this.makeRequest('client-operations/update-assignment', {
      method: 'PUT',
      body: JSON.stringify({ assignmentId, status, responses, score })
    })
  }

  // Therapist Operations
  static async getTherapistDashboardData() {
    try {
      return await this.makeRequest('therapist-operations/dashboard-data')
    } catch (error) {
      console.error('❌ Failed to get therapist dashboard data:', error)
      // Return fallback data
      return {
        stats: { totalClients: 0, pendingAssessments: 0, completedAssessments: 0, upcomingAppointments: 0 },
        clients: [],
        recentActivity: []
      }
    }
  }

  static async getTherapistClients() {
    try {
      return await this.makeRequest('therapist-operations/clients')
    } catch (error) {
      console.error('❌ Failed to get therapist clients:', error)
      // Return fallback data
      return {
        clients: [],
        profilesMap: {}
      }
    }
  }

  static async addClientToRoster(email: string) {
    return this.makeRequest('therapist-operations/add-client', {
      method: 'POST',
      body: JSON.stringify({ email })
    })
  }

  static async updateClientProfile(clientId: string, updates: Record<string, any>) {
    return this.makeRequest('therapist-operations/update-client-profile', {
      method: 'PUT',
      body: JSON.stringify({ clientId, updates })
    })
  }

  // Case Management
  static async getCases() {
    try {
      return await this.makeRequest('case-management/cases')
    } catch (error) {
      console.error('❌ Failed to get cases:', error)
      // Return fallback data
      return []
    }
  }

  static async createTreatmentPlan(clientId: string, title: string, caseFormulation?: string) {
    return this.makeRequest('case-management/create-treatment-plan', {
      method: 'POST',
      body: JSON.stringify({ clientId, title, caseFormulation })
    })
  }

  static async addGoal(treatmentPlanId: string, goalText: string, targetDate?: string) {
    return this.makeRequest('case-management/add-goal', {
      method: 'POST',
      body: JSON.stringify({ treatmentPlanId, goalText, targetDate })
    })
  }

  static async assignTask(clientId: string, formType: string, title: string, instructions?: string, dueDate?: string) {
    return this.makeRequest('case-management/assign-task', {
      method: 'POST',
      body: JSON.stringify({ clientId, formType, title, instructions, dueDate })
    })
  }
}

export { APIService }