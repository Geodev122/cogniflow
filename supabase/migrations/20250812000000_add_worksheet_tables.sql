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
