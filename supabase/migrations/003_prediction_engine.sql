-- Prediction engine support tables and indexes.
-- The model normalizes each year's rank list into percentiles so hard/easy paper
-- years can be compared without guessing from raw score alone.

CREATE TABLE neet_year_stats (
  data_year INTEGER PRIMARY KEY,
  total_candidates INTEGER NOT NULL CHECK (total_candidates > 0),
  source_url TEXT,
  source_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cutoffs_prediction_lookup
  ON cutoffs (year, quota_type, round, category, closing_rank);

CREATE UNIQUE INDEX idx_cutoffs_unique_prediction_source
  ON cutoffs (college_id, year, quota_type, round, category);

COMMENT ON TABLE neet_year_stats IS
  'Year-level NTA stats used by the prediction engine. total_candidates turns ranks into comparable percentiles.';

COMMENT ON INDEX idx_cutoffs_prediction_lookup IS
  'Speeds percentile-normalized prediction queries over multi-year MCC cutoff history.';
