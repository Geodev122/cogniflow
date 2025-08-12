-- Ensure therapists can manage their own session notes and clients can read their notes
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "session_notes_therapist_manage" ON session_notes;
CREATE POLICY "session_notes_therapist_manage" ON session_notes
  FOR ALL TO authenticated
  USING (
    auth.uid() = session_notes.therapist_id
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'therapist'
    )
  )
  WITH CHECK (
    auth.uid() = session_notes.therapist_id
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'therapist'
    )
  );

DROP POLICY IF EXISTS "session_notes_client_read" ON session_notes;
CREATE POLICY "session_notes_client_read" ON session_notes
  FOR SELECT TO authenticated
  USING (
    auth.uid() = session_notes.client_id
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'client'
    )
  );
