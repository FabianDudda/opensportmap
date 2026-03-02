-- Change unique constraint on courts table from (place_id, sport) to (place_id, sport, surface)
-- This allows multiple rows per sport if they have different surface types.
-- Courts with the same sport AND surface are still deduplicated via quantity.

-- Drop the existing unique constraint (adjust name if different in your DB)
ALTER TABLE public.courts DROP CONSTRAINT IF EXISTS courts_place_id_sport_key;

-- Add new unique constraint on (place_id, sport, surface)
ALTER TABLE public.courts ADD CONSTRAINT courts_place_id_sport_surface_key UNIQUE (place_id, sport, surface);
