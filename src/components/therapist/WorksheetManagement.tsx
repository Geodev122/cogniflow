import React, { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { createWorksheet, listWorksheets, assignWorksheet } from '../../lib/worksheets'

export const WorksheetManagement: React.FC = () => {
  const { profile } = useAuth()
  const [worksheets, setWorksheets] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (profile) {
      refreshWorksheets()
      loadClients()
    }
  }, [profile])

  const refreshWorksheets = async () => {
    if (!profile) return
    const data = await listWorksheets(profile.id)
    setWorksheets(data || [])
  }

  const loadClients = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('therapist_client_relations')
      .select('client:profiles(id, first_name, last_name)')
      .eq('therapist_id', profile.id)
    setClients(data?.map((r: any) => r.client) || [])
  }

  const handleCreate = async () => {
    if (!profile || !title) return
    await createWorksheet(profile.id, title, content)
    setTitle('')
    setContent('')
    refreshWorksheets()
  }

  const handleAssign = async (worksheetId: string, clientId: string) => {
    if (!clientId) return
    await assignWorksheet(worksheetId, clientId)
    alert('Worksheet assigned')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Worksheet</h3>
        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Content"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={4}
          />
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Save Worksheet
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">My Worksheets</h3>
        {worksheets.length === 0 ? (
          <p className="text-gray-600">No worksheets created yet.</p>
        ) : (
          <ul className="space-y-3">
            {worksheets.map((w) => (
              <li key={w.id} className="flex items-center justify-between">
                <span>{w.title}</span>
                <select
                  className="border border-gray-300 rounded-md px-2 py-1"
                  defaultValue=""
                  onChange={(e) => {
                    handleAssign(w.id, e.target.value)
                    e.currentTarget.value = ''
                  }}
                >
                  <option value="" disabled>
                    Assign to...
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}