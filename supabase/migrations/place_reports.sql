-- Create place_reports table
create table if not exists place_reports (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references places(id) on delete cascade not null,
  reason text not null check (reason in ('no_longer_exists', 'other')),
  comment text,
  reporter_user_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed'))
);

-- Enable RLS
alter table place_reports enable row level security;

-- Anyone (including guests) can submit a report
create policy "Anyone can submit a report"
  on place_reports for insert
  with check (true);

-- Admins can read all reports
create policy "Admins can view reports"
  on place_reports for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.user_role = 'admin'
    )
  );

-- Admins can update report status
create policy "Admins can update reports"
  on place_reports for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.user_role = 'admin'
    )
  );

-- Index for fast lookup by place
create index if not exists place_reports_place_id_idx on place_reports(place_id);
create index if not exists place_reports_status_idx on place_reports(status);
