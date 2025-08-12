import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

// Simplified interfaces matching actual database schema
interface Assignment {
  id: string
  title: string
  form_type: string
  status: string
  assigned_at: string
  completed_at: string | null
  instructions: string | null
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

  const fetchAssignments = useCallback(async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from('form_assignments')
        .select('id, title, form_type, status, assigned_at, completed_at, instructions')
        .eq('client_id', profile.id)
        .order('assigned_at', { ascending: false })

      if (error) throw error
      setAssignments(data || [])
    } catch (error) {
      console.error('Error fetching assignments:', error)
      setAssignments([])
    }
  }, [profile])

  const fetchProgressData = useCallback(async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from('progress_tracking')
        .select('recorded_at, value, metric_type')
        .eq('client_id', profile.id)
        .order('recorded_at', { ascending: true })

      if (error) throw error
      setProgressData(data || [])
    } catch (error) {
      console.error('Error fetching progress data:', error)
      setProgressData([])
    }
  }, [profile])

  const fetchAllData = useCallback(async () => {
    if (!profile) return

    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchAssignments(), fetchProgressData()])
    } catch (error) {
      console.error('Error fetching client data:', error)
      setError('Failed to load client data')
    } finally {
      setLoading(false)
    }
  }, [profile, fetchAssignments, fetchProgressData])

  const updateAssignment = useCallback(async (assignmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('form_assignments')
        .update({
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', assignmentId)

      if (error) throw error

      await fetchAssignments()
    } catch (error) {
      console.error('Error updating assignment:', error)
      throw error
    }
  }, [])

  const completeAssignment = useCallback(async (assignmentId: string, responses: any, score?: number) => {
    try {
      // Update assignment status
      await updateAssignment(assignmentId, 'completed')
      
      // Add to progress tracking if score provided
      if (score !== undefined) {
        const assignment = assignments.find(a => a.id === assignmentId)
        await supabase
          .from('progress_tracking')
          .insert({
            client_id: profile!.id,
            metric_type: assignment?.form_type || 'assessment',
            value: score,
            source_type: 'psychometric',
            source_id: assignmentId
          })
      }

      await fetchProgressData()
    } catch (error) {
      console.error('Error completing assignment:', error)
      throw error
    }
  }, [profile, assignments, fetchProgressData, updateAssignment])

  useEffect(() => {
    if (profile) {
      fetchAllData()
    }
  }, [profile, fetchAllData])

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