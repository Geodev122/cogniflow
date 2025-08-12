import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface DocumentUpload {
  id: string
  file_url: string
}

export const DocumentationCompliance: React.FC = () => {
  const [sessionId, setSessionId] = useState('')
  const [note, setNote] = useState('')
  const [documents, setDocuments] = useState<DocumentUpload[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  const saveNote = async () => {
    if (!sessionId || !note) return
    const { error } = await supabase.rpc('create_session_note', {
      session_id: sessionId,
      content: note
    })
    if (error) {
      console.error('Error saving note:', error)
    } else {
      setNote('')
    }
  }

  const loadDocuments = async () => {
    if (!sessionId) return
    setLoadingDocs(true)
    const { data, error } = await supabase.rpc('get_session_documents', {
      session_id: sessionId
    })
    if (error) {
      console.error('Error loading documents:', error)
      setDocuments([])
    } else {
      setDocuments(data || [])
    }
    setLoadingDocs(false)
  }

  useEffect(() => {
    if (sessionId) {
      loadDocuments()
    }
  }, [sessionId])

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Notes</h3>
        <input
          type="text"
          placeholder="Session ID"
          value={sessionId}
          onChange={e => setSessionId(e.target.value)}
          className="mb-2 w-full border rounded p-2"
        />
        <textarea
          className="w-full border rounded p-2 mb-2 h-32"
          placeholder="Write your session notes..."
          value={note}
          onChange={e => setNote(e.target.value)}
        />
        <button
          onClick={saveNote}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          disabled={!sessionId || !note}
        >
          Save Note
        </button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
        {loadingDocs ? (
          <p className="text-gray-600">Loading...</p>
        ) : (
          <ul className="space-y-2">
            {documents.map(doc => (
              <li key={doc.id}>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {doc.file_url}
                </a>
              </li>
            ))}
            {documents.length === 0 && <p className="text-gray-600">No documents found.</p>}
          </ul>
        )}
      </div>
    </div>
  )
}