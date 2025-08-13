import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface Assignment {
  id: string
  title: string
  form_type: string
  status: string
  assigned_at: string
  completed_at: string | null
  instructions: string | null
  due_date: string | null
  created_at: string
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

  const fetchAllData = async () => {
    if (!profile?.id || profile.role !== 'client') {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Fetch assignments directly from Supabase
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('form_assignments')
        .select('*')
        .eq('client_id', profile.id)
        .order('assigned_at', { ascending: false })

      if (assignmentsError) {
        console.error('Assignments error:', assignmentsError)
        setAssignments([])
      } else {
        setAssignments(assignmentsData || [])
      }

      // Fetch progress data directly from Supabase
      const { data: progressDataResult, error: progressError } = await supabase
        .from('progress_tracking')
        .select('*')
        .eq('client_id', profile.id)
        .order('recorded_at', { ascending: true })

      if (progressError) {
        console.error('Progress error:', progressError)
        setProgressData([])
      } else {
        setProgressData(progressDataResult || [])
      }

      // Calculate stats
      const safeAssignments = assignmentsData || []
      const worksheets = safeAssignments.filter(a => a.form_type === 'worksheet')
      const assessments = safeAssignments.filter(a => a.form_type === 'psychometric')
      const exercises = safeAssignments.filter(a => a.form_type === 'exercise')
      const completed = safeAssignments.filter(a => a.status === 'completed')
      
      setStats({
        worksheets: worksheets.length,
        assessments: assessments.length,
        exercises: exercises.length,
        completed: completed.length
      })

    } catch (error) {
      console.error('Error fetching client data:', error)
      setError('Failed to load client data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile?.id && profile.role === 'client') {
      fetchAllData()
    }
  }, [profile?.id, profile?.role])

  const updateAssignment = async (assignmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('form_assignments')
        .update({ 
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', assignmentId)
        .eq('client_id', profile!.id)

      if (error) throw error
      await fetchAllData()
    } catch (error) {
      console.error('Error updating assignment:', error)
      throw error
    }
  }

  const completeAssignment = async (assignmentId: string, responses: any, score?: number) => {
    try {
      const { error } = await supabase
        .from('form_assignments')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', assignmentId)
        .eq('client_id', profile!.id)

      if (error) throw error

      // Add progress tracking if score provided
      if (score !== undefined) {
        await supabase
          .from('progress_tracking')
          .insert({
            client_id: profile!.id,
            metric_type: 'assessment_score',
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
    stats,
    loading,
    error,
    updateAssignment,
    completeAssignment,
    refetch: fetchAllData
  }
}