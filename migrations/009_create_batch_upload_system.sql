-- Batch Processing for 500+ CVs

CREATE TYPE batch_status_type AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE batch_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    uploaded_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    file_path VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    total_cvs INTEGER DEFAULT 0,
    processed_cvs INTEGER DEFAULT 0,
    status batch_status_type DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_batch_uploads_company_id ON batch_uploads(company_id);
CREATE INDEX idx_batch_uploads_status ON batch_uploads(status);
CREATE INDEX idx_batch_uploads_job_id ON batch_uploads(job_id);

ALTER TABLE batch_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY batch_uploads_company_isolation ON batch_uploads
FOR ALL USING (company_id = public.user_company_id());

CREATE POLICY batch_uploads_create_own_company ON batch_uploads
FOR INSERT WITH CHECK (company_id = public.user_company_id());

CREATE POLICY batch_uploads_recruiter_create ON batch_uploads
FOR INSERT WITH CHECK (
    company_id = public.user_company_id()
    AND EXISTS (
        SELECT 1 FROM users 
        WHERE id = public.current_user_id() 
        AND role IN ('admin', 'recruiter')
    )
);

CREATE TRIGGER update_batch_uploads_updated_at
    BEFORE UPDATE ON batch_uploads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
