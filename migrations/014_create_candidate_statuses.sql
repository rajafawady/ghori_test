-- Candidate Status Tracking System

CREATE TYPE candidate_status_type AS ENUM ('new', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'rejected', 'hired');

CREATE TABLE candidate_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    status candidate_status_type DEFAULT 'new',
    notes TEXT,
    updated_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(candidate_id, job_id)
);

CREATE INDEX idx_candidate_statuses_company_id ON candidate_statuses(company_id);
CREATE INDEX idx_candidate_statuses_job_id ON candidate_statuses(job_id);
CREATE INDEX idx_candidate_statuses_candidate_id ON candidate_statuses(candidate_id);
CREATE INDEX idx_candidate_statuses_status ON candidate_statuses(status);

ALTER TABLE candidate_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY candidate_statuses_company_isolation ON candidate_statuses
FOR ALL USING (company_id = public.user_company_id());

CREATE POLICY candidate_statuses_create_own_company ON candidate_statuses
FOR INSERT WITH CHECK (company_id = public.user_company_id());

CREATE TRIGGER update_candidate_statuses_updated_at
    BEFORE UPDATE ON candidate_statuses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
