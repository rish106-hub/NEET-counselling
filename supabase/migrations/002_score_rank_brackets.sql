-- Score-to-rank brackets derived from NTA published rank lists.
-- Updated annually via POST /api/admin/ingest after NTA declares results.
-- Source: NTA score distribution CSV (published on neet.ntaonline.in and data.gov.in).

CREATE TABLE score_rank_brackets (
  id         BIGSERIAL    PRIMARY KEY,
  category   TEXT         NOT NULL,          -- 'General', 'OBC', 'OBC-NCL', 'SC', 'ST', 'EWS'
  score_min  INTEGER      NOT NULL,
  score_max  INTEGER      NOT NULL,
  air_min    INTEGER      NOT NULL,
  air_max    INTEGER      NOT NULL,
  cat_rank_min INTEGER,                      -- NULL for General
  cat_rank_max INTEGER,
  data_year  INTEGER      NOT NULL DEFAULT 2025,
  source_url TEXT,                           -- CDN URL of the source file used
  source_description TEXT,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_srb_lookup   ON score_rank_brackets (category, data_year, score_min, score_max);
CREATE INDEX idx_srb_year_cat ON score_rank_brackets (data_year, category);

COMMENT ON TABLE score_rank_brackets IS
  'Score-to-AIR conversion brackets derived from NTA published marks data. '
  'Refresh annually via POST /api/admin/ingest with the NTA score distribution CSV. '
  'Source: https://neet.ntaonline.in or https://dataful.in/datasets/20201';

COMMENT ON COLUMN score_rank_brackets.source_url IS
  'URL of the official NTA CSV used to compute these brackets, e.g. '
  'https://cdnbbsr.s3waas.gov.in/.../neet_2025_marks.csv';
