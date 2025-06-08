-- Candidate Tags for Organization

CREATE TABLE candidate_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#3498db',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_candidate_tags_company_id ON candidate_tags(company_id);

ALTER TABLE candidate_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY candidate_tags_company_isolation ON candidate_tags
FOR ALL USING (company_id = public.user_company_id());

CREATE POLICY candidate_tags_create_own_company ON candidate_tags
FOR INSERT WITH CHECK (company_id = public.user_company_id());

-- Junction table for candidates and their tags
CREATE TABLE candidate_tag_assignments (
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES candidate_tags(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (candidate_id, tag_id)
);

CREATE INDEX idx_candidate_tag_assignments_company_id ON candidate_tag_assignments(company_id);
CREATE INDEX idx_candidate_tag_assignments_candidate_id ON candidate_tag_assignments(candidate_id);

ALTER TABLE candidate_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY candidate_tag_assignments_company_isolation ON candidate_tag_assignments
FOR ALL USING (company_id = public.user_company_id());

CREATE POLICY candidate_tag_assignments_create_own_company ON candidate_tag_assignments
FOR INSERT WITH CHECK (company_id = public.user_company_id());
