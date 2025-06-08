-- Saved Searches & Filters for Recruiters

CREATE TABLE saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE, 
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    min_score DECIMAL(5,2),
    skills TEXT[],
    min_experience INTEGER,
    location VARCHAR(255),
    filters JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_saved_searches_company_id ON saved_searches(company_id);
CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY saved_searches_company_isolation ON saved_searches
FOR ALL USING (company_id = public.user_company_id());

CREATE POLICY saved_searches_create_own_company ON saved_searches
FOR INSERT WITH CHECK (company_id = public.user_company_id());
