import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { APIService } from '../lib/api'

interface Assignment {
  id: string
  title: string
  form_type: string
  status: string
  assigned_at: string
  completed_at: string | null
  instructions: string | null
  due_date: string | null
}

interface ProgressEntry {
  recorded_at: string
  value: number
  metric_type: string
}

interface ClientStats {
  worksheets: number
  assessments: number
  exercises: number
  completed: number
}

export const useClientData = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [progressData, setProgressData] = useState<ProgressEntry[]>([])
  const [stats, setStats] = useState<ClientStats>({ worksheets: 0, assessments: 0, exercises: 0, completed: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.id && profile.role === 'client') {
      fetchAllData()
    }
  }, [profile?.id, profile?.role])

  const fetchAllData = async () => {
    if (!profile?.id || profile.role !== 'client') return

    setLoading(true)
    setError(null)
    
    try {
      const data = await APIService.getClientDashboardData()
      
      setAssignments(data.assignments || [])
      setProgressData(data.progressData || [])
      setStats(data.stats || { worksheets: 0, assessments: 0, exercises: 0, completed: 0 })
    } catch (error) {
      console.error('Error fetching client data:', error)
      setError('Failed to load client data')
      setAssignments([])
      setProgressData([])
      setStats({ worksheets: 0, assessments: 0, exercises: 0, completed: 0 })
    } finally {
      setLoading(false)
    }
  }

  const updateAssignment = async (assignmentId: string, status: string) => {
    try {
      await APIService.updateAssignment(assignmentId, status)
      await fetchAllData()
    } catch (error) {
      console.error('Error updating assignment:', error)
      throw error
    }
  }

  const completeAssignment = async (assignmentId: string, responses: any, score?: number) => {
    try {
      await APIService.updateAssignment(assignmentId, 'completed', responses, score)
      await fetchAllData()
    } catch (error) {
      console.error('Error completing assignment:', error)
      throw error
    }
  }

  return {
    assignments,
    progressData,
    stats,
    loading,
    error,
    updateAssignment,
    completeAssignment,
    refetch: fetchAllData
  }
}