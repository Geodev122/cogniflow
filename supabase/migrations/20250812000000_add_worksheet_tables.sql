-- Create worksheets table
create table if not exists worksheets (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  content jsonb,
  created_at timestamptz default now()
);

-- Create worksheet assignments table
create table if not exists worksheet_assignments (
  id uuid primary key default gen_random_uuid(),
  worksheet_id uuid references worksheets(id) on delete cascade not null,
  client_id uuid references profiles(id) on delete cascade not null,
  status text check (status in ('assigned','in_progress','completed')) default 'assigned',
  responses jsonb,
  assigned_at timestamptz default now(),
  completed_at timestamptz
);

create index if not exists worksheet_assignments_client_idx on worksheet_assignments(client_id);
create index if not exists worksheet_assignments_worksheet_idx on worksheet_assignments(worksheet_id);

-- Enable Row Level Security
alter table worksheets enable row level security;
alter table worksheet_assignments enable row level security;

-- Allow therapists to manage their own worksheets
create policy "Therapists manage own worksheets"
  on worksheets
  for all
  to authenticated
  using (therapist_id = auth.uid())
  with check (therapist_id = auth.uid());

-- Allow clients to view their own assignments
create policy "Clients view own worksheet assignments"
  on worksheet_assignments
  for select
  to authenticated
  using (client_id = auth.uid());

-- Allow clients to update their own assignments
create policy "Clients update own worksheet assignments"
  on worksheet_assignments
  for update
  to authenticated
  using (client_id = auth.uid())
  with check (client_id = auth.uid());