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

      const baseUrl = import.meta.env.VITE_SUPABASE_URL?.replace('/rest/v1', '') || ''
      const functionsUrl = `${baseUrl}/functions/v1`

      const response = await fetch(`${functionsUrl}/${endpoint}`, {
        ...options,
        headers
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed (${endpoint}):`, error)
      throw error
    }
  }

  // Client Operations
  static async getClientDashboardData() {
    return this.makeRequest('client-operations/dashboard-data')
  }

  static async updateAssignment(assignmentId: string, status: string, responses?: any, score?: number) {
    return this.makeRequest('client-operations/update-assignment', {
      method: 'PUT',
      body: JSON.stringify({ assignmentId, status, responses, score })
    })
  }

  // Therapist Operations
  static async getTherapistDashboardData() {
    return this.makeRequest('therapist-operations/dashboard-data')
  }

  static async getTherapistClients() {
    return this.makeRequest('therapist-operations/clients')
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
    return this.makeRequest('case-management/cases')
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