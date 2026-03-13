-- Add place_type column to places table
-- Values: 'öffentlich' (public), 'verein' (club/association), 'schule' (school)

alter table public.places
  add column if not exists place_type text not null default 'öffentlich';

-- Optional: add a check constraint to restrict to known values
alter table public.places
  add constraint places_place_type_check
  check (place_type in ('öffentlich', 'verein', 'schule'));
