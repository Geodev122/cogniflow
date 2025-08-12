import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

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

export const useClientData = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [progressData, setProgressData] = useState<ProgressEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.id) {
      fetchAllData()
    }
  }, [profile?.id])

  const fetchAllData = async () => {
    if (!profile?.id) return

    setLoading(true)
    setError(null)
    
    try {
      // Fetch assignments
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('form_assignments')
        .select('id, title, form_type, status, assigned_at, completed_at, instructions, due_date')
        .eq('client_id', profile.id)
        .order('assigned_at', { ascending: false })

      if (assignmentError) {
        console.error('Assignment fetch error:', assignmentError)
        setAssignments([])
      } else {
        setAssignments(assignmentData || [])
      }

      // Fetch progress data
      const { data: progressDataResult, error: progressError } = await supabase
        .from('progress_tracking')
        .select('recorded_at, value, metric_type')
        .eq('client_id', profile.id)
        .order('recorded_at', { ascending: true })

      if (progressError) {
        console.error('Progress fetch error:', progressError)
        setProgressData([])
      } else {
        setProgressData(progressDataResult || [])
      }

    } catch (error) {
      console.error('Error fetching client data:', error)
      setError('Failed to load client data')
      setAssignments([])
      setProgressData([])
    } finally {
      setLoading(false)
    }
  }

  const updateAssignment = async (assignmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('form_assignments')
        .update({
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', assignmentId)

      if (error) throw error

      // Refresh assignments
      await fetchAllData()
    } catch (error) {
      console.error('Error updating assignment:', error)
      throw error
    }
  }

  const completeAssignment = async (assignmentId: string, responses: any, score?: number) => {
    try {
      // Update assignment status
      await updateAssignment(assignmentId, 'completed')
      
      // Add to progress tracking if score provided
      if (score !== undefined && profile?.id) {
        const assignment = assignments.find(a => a.id === assignmentId)
        await supabase
          .from('progress_tracking')
          .insert({
            client_id: profile.id,
            metric_type: assignment?.form_type || 'assessment',
            value: score,
            source_type: 'psychometric',
            source_id: assignmentId
          })
      }

      await fetchAllData()
    } catch (error) {
      console.error('Error completing assignment:', error)
      throw error
    }
  }

  return {
    assignments,
    progressData,
    loading,
    error,
    updateAssignment,
    completeAssignment,
    refetch: fetchAllData
  }
}