-- Partial index on approved places ordered by created_at
-- Covers the getAllPlacesLightweight query exactly (moderation_status = 'approved', ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_places_approved_created
  ON places (created_at DESC)
  WHERE moderation_status = 'approved';

-- GIN index for sports array overlap queries (used by server-side sport filtering if added later)
CREATE INDEX IF NOT EXISTS idx_places_sports_gin
  ON places USING GIN (sports);
