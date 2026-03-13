-- Allow guest submissions by making added_by_user nullable
-- (guests have no auth.users entry, so a fake UUID is not possible)
ALTER TABLE public.places
  ALTER COLUMN added_by_user DROP NOT NULL;

ALTER TABLE public.pending_place_changes
  ALTER COLUMN submitted_by DROP NOT NULL;

-- Add guest tracking columns to places
ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS is_guest_submission boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guest_ip text;

-- Add guest tracking columns to pending_place_changes
ALTER TABLE public.pending_place_changes
  ADD COLUMN IF NOT EXISTS is_guest_submission boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guest_ip text;
