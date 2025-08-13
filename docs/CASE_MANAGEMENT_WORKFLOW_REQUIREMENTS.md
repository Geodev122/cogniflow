# Revised Case Management Workflow Requirements

## Timeline Events
- Track chronological session-related events.
- Each event records a date, description, and type (e.g., session, note, assignment).
- Therapists can add new timeline events manually.

## Progress Checkpoints
- Record periodic evaluations of a client's progress.
- Each checkpoint includes a date, note, and status.
- Therapists can log new checkpoints.

## Discharge Notes
- Store concluding notes when ending a case.
- Therapists can update or revise discharge summaries.

## UI Integration
- Add tabs/sections to display timeline events, progress checkpoints, and discharge notes.
- Provide actions to add new events and checkpoints and to save discharge summaries.

## Data Persistence
- Supabase tables store timeline events, progress checkpoints, and discharge notes.
- Frontend queries and mutations must read and write these fields.
