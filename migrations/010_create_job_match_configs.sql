-- Custom Match Configuration per Job

CREATE TABLE job_match_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    skills_weight DECIMAL(3,2) DEFAULT 0.40,
    experience_weight DECIMAL(3,2) DEFAULT 0.30,
    education_weight DECIMAL(3,2) DEFAULT 0.15,
    keywords_weight DECIMAL(3,2) DEFAULT 0.15,
    minimum_score_threshold DECIMAL(5,2) DEFAULT 60.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_job_match_configs_job_id ON job_match_configs(job_id);
CREATE INDEX idx_job_match_configs_company_id ON job_match_configs(company_id);

ALTER TABLE job_match_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_match_configs_company_isolation ON job_match_configs
FOR ALL USING (company_id = public.user_company_id());

CREATE POLICY job_match_configs_create_own_company ON job_match_configs
FOR INSERT WITH CHECK (company_id = public.user_company_id());

-- Auto-create job match config when job is created
CREATE OR REPLACE FUNCTION create_default_job_match_config()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO job_match_configs (job_id, company_id)
    VALUES (NEW.id, NEW.company_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_create_default_match_config
AFTER INSERT ON jobs
FOR EACH ROW EXECUTE FUNCTION create_default_job_match_config();

CREATE TRIGGER update_job_match_configs_updated_at
    BEFORE UPDATE ON job_match_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
