import { supabase } from './supabase'

export const createWorksheet = async (
  therapistId: string,
  title: string,
  content: any
) => {
  const { data, error } = await supabase
    .from('worksheets')
    .insert({ therapist_id: therapistId, title, content })
    .select()
    .single()
  if (error) throw error
  return data
}

export const listWorksheets = async (therapistId: string) => {
  const { data, error } = await supabase
    .from('worksheets')
    .select('*')
    .eq('therapist_id', therapistId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const assignWorksheet = async (
  worksheetId: string,
  clientId: string
) => {
  const { error } = await supabase
    .from('worksheet_assignments')
    .insert({ worksheet_id: worksheetId, client_id: clientId })
  if (error) throw error
}

export const updateAssignment = async (
  assignmentId: string,
  responses: any,
  status: 'assigned' | 'in_progress' | 'completed'
) => {
  const { error } = await supabase
    .from('worksheet_assignments')
    .update({
      responses,
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null
    })
    .eq('id', assignmentId)
  if (error) throw error
}
