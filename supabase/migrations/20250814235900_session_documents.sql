-- Create session_notes and document_uploads tables (document_uploads new, session_notes ensured)
-- Add storage bucket and policies for document uploads
-- Add RPC functions for creating notes and retrieving documents with audit logging

-- Ensure session_notes table exists (if not already)
CREATE TABLE IF NOT EXISTS session_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid,
  therapist_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  progress_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

-- Document uploads table
CREATE TABLE IF NOT EXISTS document_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid,
  therapist_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  file_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE document_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_uploads_manage_own"
  ON document_uploads
  FOR ALL
  USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-uploads', 'document-uploads', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "document_uploads_storage_policy"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'document-uploads' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'document-uploads' AND auth.uid() = owner);

-- RPC to create a session note with audit logging
CREATE OR REPLACE FUNCTION create_session_note(session_id uuid, content text)
RETURNS session_notes AS $$
DECLARE
  new_note session_notes;
BEGIN
  INSERT INTO session_notes (appointment_id, therapist_id, progress_notes)
  VALUES (session_id, auth.uid(), content)
  RETURNING * INTO new_note;

  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (auth.uid(), 'create_session_note', 'session_notes', new_note.id, jsonb_build_object('session_id', session_id));

  RETURN new_note;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_session_note(uuid, text) TO authenticated;

-- RPC to get documents for a session with audit logging
CREATE OR REPLACE FUNCTION get_session_documents(session_id uuid)
RETURNS SETOF document_uploads AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (auth.uid(), 'get_session_documents', 'document_uploads', session_id, jsonb_build_object('session_id', session_id));

  RETURN QUERY
  SELECT * FROM document_uploads
  WHERE document_uploads.session_id = get_session_documents.session_id
    AND document_uploads.therapist_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_session_documents(uuid) TO authenticated;
