CREATE TYPE processing_status_type AS ENUM ('pending', 'completed', 'failed');

CREATE TABLE job_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    match_score DECIMAL(5,2) CHECK (match_score >= 0 AND match_score <= 100),
    ai_summary TEXT,
    strengths JSONB DEFAULT '[]'::jsonb,
    weaknesses JSONB DEFAULT '[]'::jsonb,
    recommendation TEXT,
    processing_status processing_status_type DEFAULT 'pending',
    skill_match_score DECIMAL(5,2),
    experience_match_score DECIMAL(5,2),
    education_match_score DECIMAL(5,2),
    keyword_match_score DECIMAL(5,2),
    matched_skills TEXT[],
    missing_skills TEXT[],
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one match per job-candidate pair
    UNIQUE(job_id, candidate_id)
);

-- Indexes
CREATE INDEX idx_job_matches_company_id ON job_matches(company_id);
CREATE INDEX idx_job_matches_job_id ON job_matches(job_id);
CREATE INDEX idx_job_matches_candidate_id ON job_matches(candidate_id);
CREATE INDEX idx_job_matches_score ON job_matches(match_score DESC);
CREATE INDEX idx_job_matches_job_score ON job_matches(job_id, match_score DESC);
CREATE INDEX idx_job_matches_status ON job_matches(processing_status);

-- RLS
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;

-- Trigger
CREATE TRIGGER update_job_matches_updated_at 
    BEFORE UPDATE ON job_matches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();