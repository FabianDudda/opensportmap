-- Create user_favorites table
create table public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, place_id)
);

-- RLS
alter table public.user_favorites enable row level security;

create policy "Users can view their own favorites"
  on public.user_favorites for select
  using (auth.uid() = user_id);

create policy "Users can add their own favorites"
  on public.user_favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own favorites"
  on public.user_favorites for delete
  using (auth.uid() = user_id);
