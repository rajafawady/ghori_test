CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    uploaded_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    cv_file_path VARCHAR(500) NOT NULL,
    cv_file_name VARCHAR(255) NOT NULL,
    cv_text_content TEXT,
    parsed_skills JSONB DEFAULT '[]'::jsonb,
    parsed_experience JSONB DEFAULT '[]'::jsonb,
    parsed_education JSONB DEFAULT '[]'::jsonb,    candidate_location VARCHAR(255),
    years_experience INTEGER,
    current_job_role VARCHAR(255),
    availability_date DATE,
    salary_expectation VARCHAR(100),
    top_skills TEXT[],
    match_keywords TEXT[],
    ai_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_candidates_company_id ON candidates(company_id);
CREATE INDEX idx_candidates_uploaded_by ON candidates(uploaded_by_user_id);
CREATE INDEX idx_candidates_content_search ON candidates USING gin(to_tsvector('english', cv_text_content));
CREATE INDEX idx_candidates_skills ON candidates USING gin(parsed_skills);
CREATE INDEX idx_candidates_top_skills ON candidates USING gin(top_skills);

-- RLS
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Trigger
CREATE TRIGGER update_candidates_updated_at 
    BEFORE UPDATE ON candidates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();