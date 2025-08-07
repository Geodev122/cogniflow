import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface Worksheet {
  id: string
  type: string
  title: string
  content: any
  status: 'assigned' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
}

interface PsychometricForm {
  id: string
  form_type: string
  title: string
  questions: any[]
  responses: any
  score: number
  status: 'assigned' | 'completed'
  created_at: string
  completed_at: string | null
}

interface Exercise {
  id: string
  exercise_type: string
  title: string
  description: string
  game_config: any
  progress: any
  status: 'assigned' | 'in_progress' | 'completed'
  created_at: string
  last_played_at: string | null
}

interface ProgressData {
  date: string
  value: number
  metric_type: string
}

export const useClientData = () => {
  const [worksheets, setWorksheets] = useState<Worksheet[]>([])
  const [psychometricForms, setPsychometricForms] = useState<PsychometricForm[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  // Helper function to detect infinite recursion errors
  const isRecursionError = (error: any): boolean => {
    if (!error) return false
    
    // Check error message directly
    if (error.message && error.message.includes('infinite recursion')) {
      return true
    }
    
    // Check stringified error for network errors
    const errorString = String(error)
    if (errorString.includes('infinite recursion')) {
      return true
    }
    
    // Check body property for Supabase network errors
    if (error.body && typeof error.body === 'string') {
      try {
        const bodyObj = JSON.parse(error.body)
        if (bodyObj.message && bodyObj.message.includes('infinite recursion')) {
          return true
        }
      } catch {
        // If body is not valid JSON, check as string
        if (error.body.includes('infinite recursion')) {
          return true
        }
      }
    }
    
    return false
  }

  const fetchWorksheets = useCallback(async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from('cbt_worksheets')
        .select(`
          id, type, title, content, status, created_at, updated_at
        `)
        .eq('client_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        if (isRecursionError(error)) {
          console.warn('RLS policy recursion detected for worksheets, using empty data')
          setWorksheets([])
          return
        }
        throw error
      }

      setWorksheets(data || [])
    } catch (error) {
      console.error('Error fetching worksheets:', error)
      if (isRecursionError(error)) {
        console.warn('RLS policy recursion detected for worksheets in catch block, using empty data')
      }
      setWorksheets([])
    }
  }, [profile])

  const fetchPsychometricForms = useCallback(async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from('psychometric_forms')
        .select(`
          id, form_type, title, questions, responses, score, status, created_at, completed_at
        `)
        .eq('client_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        if (isRecursionError(error)) {
          console.warn('RLS policy recursion detected for psychometric forms, using empty data')
          setPsychometricForms([])
          return
        }
        throw error
      }

      setPsychometricForms(data || [])
    } catch (error) {
      console.error('Error fetching psychometric forms:', error)
      if (isRecursionError(error)) {
        console.warn('RLS policy recursion detected for psychometric forms in catch block, using empty data')
      }
      setPsychometricForms([])
    }
  }, [profile])

  const fetchExercises = useCallback(async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from('therapeutic_exercises')
        .select(`
          id, exercise_type, title, description, game_config, progress, status, created_at, last_played_at
        `)
        .eq('client_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        if (isRecursionError(error)) {
          console.warn('RLS policy recursion detected for exercises, using empty data')
          setExercises([])
          return
        }
        throw error
      }

      setExercises(data || [])
    } catch (error) {
      console.error('Error fetching exercises:', error)
      if (isRecursionError(error)) {
        console.warn('RLS policy recursion detected for exercises in catch block, using empty data')
      }
      setExercises([])
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
        .limit(100)

      if (error) {
        if (isRecursionError(error)) {
        if (String(error).includes('infinite recursion')) {
          console.warn('RLS policy recursion detected for progress tracking, using empty data')
          setProgressData([])
          return
        }
        // Handle infinite recursion error by setting empty data
        if (String(error).includes('infinite recursion')) {
          console.warn('RLS policy recursion detected for progress tracking, using empty data')
          setProgressData([])
          return
        }
        throw error
      }

      const formattedData = data?.map(item => ({
        date: item.recorded_at,
        value: item.value,
        metric_type: item.metric_type
      })) || []
      setProgressData(formattedData)
    } catch (error) {
      console.error('Error fetching progress data:', error)
      if (isRecursionError(error)) {
      if (String(error).includes('infinite recursion')) {
        console.warn('RLS policy recursion detected for progress tracking, using empty data')
      }
      setProgressData([])
    }
  }, [profile])

  const fetchAllData = useCallback(async () => {
    if (!profile) return

    setLoading(true)
    try {
      await Promise.all([
        fetchWorksheets(),
        fetchPsychometricForms(),
        fetchExercises(),
        fetchProgressData()
      ])
    } catch (error) {
      console.error('Error fetching client data:', error)
      if (isRecursionError(error)) {
        console.warn('RLS policy recursion detected in fetchAllData, continuing with available data')
      }
    } finally {
      setLoading(false)
    }
  }, [profile, fetchWorksheets, fetchPsychometricForms, fetchExercises, fetchProgressData])

  const updateWorksheet = useCallback(async (worksheetId: string, content: any, status: string) => {
    try {
      const { error } = await supabase
        .from('cbt_worksheets')
        .update({ 
          content, 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', worksheetId)

      if (error) throw error

      // Update local state
      setWorksheets(prev => prev.map(w => 
        w.id === worksheetId ? { ...w, content, status: status as any } : w
      ))
    } catch (error) {
      console.error('Error updating worksheet:', error)
      throw error
    }
  }, [])

  const completePsychometricForm = useCallback(async (formId: string, responses: any, score: number) => {
    try {
      const { error } = await supabase
        .from('psychometric_forms')
        .update({ 
          responses, 
          score,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', formId)

      if (error) throw error

      // Add to progress tracking
      const form = psychometricForms.find(f => f.id === formId)
      if (form) {
        await supabase
          .from('progress_tracking')
          .insert({
            client_id: profile!.id,
            metric_type: form.form_type,
            value: score,
            source_type: 'psychometric',
            source_id: formId
          })
      }

      // Update local state
      setPsychometricForms(prev => prev.map(f => 
        f.id === formId ? { ...f, responses, score, status: 'completed', completed_at: new Date().toISOString() } : f
      ))

      // Refresh progress data
      await fetchProgressData()
    } catch (error) {
      console.error('Error completing form:', error)
      throw error
    }
  }, [profile, psychometricForms, fetchProgressData])

  const updateExerciseProgress = useCallback(async (exerciseId: string, progress: any, status: string) => {
    try {
      const { error } = await supabase
        .from('therapeutic_exercises')
        .update({ 
          progress, 
          status,
          last_played_at: new Date().toISOString()
        })
        .eq('id', exerciseId)

      if (error) throw error

      // Update local state
      setExercises(prev => prev.map(e => 
        e.id === exerciseId ? { ...e, progress, status: status as any, last_played_at: new Date().toISOString() } : e
      ))
    } catch (error) {
      console.error('Error updating exercise:', error)
      throw error
    }
  }, [])

  useEffect(() => {
    if (profile) {
      fetchAllData()
    }
  }, [profile, fetchAllData])

  return {
    worksheets,
    psychometricForms,
    exercises,
    progressData,
    loading,
    updateWorksheet,
    completePsychometricForm,
    updateExerciseProgress,
    refetch: fetchAllData
  }
}