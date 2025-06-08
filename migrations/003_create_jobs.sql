CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'freelance');
CREATE TYPE job_status_type AS ENUM ('active', 'paused', 'closed');

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    location VARCHAR(255),
    salary_range VARCHAR(100),
    employment_type employment_type DEFAULT 'full_time',
    status job_status_type DEFAULT 'active',
    required_years_experience INTEGER,
    required_skills TEXT[],
    nice_to_have_skills TEXT[],
    match_keywords TEXT[],
    remote_friendly BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_by ON jobs(created_by_user_id);
CREATE INDEX idx_jobs_required_skills ON jobs USING gin(required_skills);
-- Full-text search index for improved job search performance
CREATE INDEX idx_jobs_description_search ON jobs USING gin(to_tsvector('english', description || ' ' || COALESCE(requirements, '')));

-- RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Trigger
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();