-- NEET Counselling Navigator - Initial Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Master college data
CREATE TABLE colleges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(100),
  state VARCHAR(100) NOT NULL,
  district VARCHAR(100),
  city VARCHAR(100),
  type VARCHAR(50) NOT NULL CHECK (type IN ('government', 'private', 'deemed', 'central', 'ayush')),
  annual_fee_govt INTEGER,       -- INR per year for merit/government seats
  annual_fee_mgmt INTEGER,       -- INR per year for management quota seats
  total_mbbs_seats INTEGER,
  nri_quota BOOLEAN DEFAULT false,
  bond_required BOOLEAN DEFAULT false,
  bond_duration_years INTEGER,
  nmc_recognized BOOLEAN DEFAULT true,
  nirf_rank INTEGER,
  mcc_college_code VARCHAR(20),
  state_counselling_code VARCHAR(30),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Previous-year cutoff data per college per round
CREATE TABLE cutoffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,          -- e.g. 2025
  quota_type VARCHAR(20) NOT NULL CHECK (quota_type IN ('AIQ', 'STATE')),
  state VARCHAR(100),             -- NULL for AIQ, state name for STATE
  round INTEGER NOT NULL,         -- 1, 2, 3 (mop-up), 4 (stray vacancy)
  category VARCHAR(30) NOT NULL,  -- 'General', 'OBC', 'OBC-NCL', 'SC', 'ST', 'EWS', 'PwD-General', etc.
  opening_rank INTEGER,
  closing_rank INTEGER,
  source_url VARCHAR(500),
  confidence VARCHAR(20) DEFAULT 'high' CHECK (confidence IN ('high', 'medium', 'low')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cutoffs_year_quota_category ON cutoffs (year, quota_type, category);
CREATE INDEX idx_cutoffs_college_id ON cutoffs (college_id);
CREATE INDEX idx_cutoffs_state ON cutoffs (state);

-- Counselling deadline calendar (MCC + state DMEs)
CREATE TABLE deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name VARCHAR(255) NOT NULL,
  track VARCHAR(20) NOT NULL CHECK (track IN ('AIQ', 'STATE', 'BOTH')),
  state VARCHAR(100),             -- NULL for AIQ/BOTH
  round INTEGER,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'registration_open', 'registration_close',
    'choice_fill_open', 'choice_fill_close',
    'seat_allotment', 'reporting_open', 'reporting_close',
    'fee_payment_deadline', 'result_declaration'
  )),
  event_date DATE,
  is_confirmed BOOLEAN DEFAULT false,
  source_url VARCHAR(500),
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_deadlines_event_date ON deadlines (event_date);
CREATE INDEX idx_deadlines_track ON deadlines (track);

-- Document checklist master
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  required_for VARCHAR(20) NOT NULL CHECK (required_for IN ('AIQ', 'STATE', 'BOTH')),
  categories TEXT[] NOT NULL,     -- ['ALL'] or ['OBC', 'SC'] etc.
  format_required VARCHAR(100),   -- 'Original + 3 attested copies' etc.
  issuing_authority VARCHAR(255),
  procurement_days_estimate INTEGER DEFAULT 0,
  state_specific_notes JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- UUID-keyed output blobs (fallback if Redis unavailable)
CREATE TABLE output_cache (
  id VARCHAR(36) PRIMARY KEY,     -- UUID string
  payload JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_output_cache_expires ON output_cache (expires_at);

-- Auto-cleanup old output cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_outputs()
RETURNS void AS $$
  DELETE FROM output_cache WHERE expires_at < NOW();
$$ LANGUAGE SQL;
