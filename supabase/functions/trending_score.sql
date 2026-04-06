-- Calculate trending score: (Total Votes) / (Hours since creation + 2)^1.5
-- This penalizes older polls while boosting high-activity new ones.
CREATE OR REPLACE VIEW trending_polls AS
SELECT 
  p.*,
  (SELECT COUNT(*) FROM votes v WHERE v.poll_id = p.id) as total_votes,
  ((SELECT COUNT(*) FROM votes v WHERE v.poll_id = p.id) / 
   POWER(EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600 + 2, 1.5)) as score
FROM polls p
ORDER BY score DESC;
