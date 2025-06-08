-- Team Collaboration Features with Comments

CREATE TABLE candidate_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_candidate_comments_company_id ON candidate_comments(company_id);
CREATE INDEX idx_candidate_comments_candidate_id ON candidate_comments(candidate_id);
CREATE INDEX idx_candidate_comments_job_id ON candidate_comments(job_id);

ALTER TABLE candidate_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY candidate_comments_company_isolation ON candidate_comments
FOR ALL USING (company_id = public.user_company_id());

CREATE POLICY candidate_comments_create_own_company ON candidate_comments
FOR INSERT WITH CHECK (company_id = public.user_company_id());

CREATE TRIGGER update_candidate_comments_updated_at
    BEFORE UPDATE ON candidate_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
