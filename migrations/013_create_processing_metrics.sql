-- Performance Analytics for Huge CV Sets

CREATE TABLE processing_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES batch_uploads(id) ON DELETE SET NULL,
    total_candidates INTEGER NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    processing_duration_seconds INTEGER,
    candidates_per_second DECIMAL(10,2),
    ai_service_used VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_processing_metrics_company_id ON processing_metrics(company_id);
CREATE INDEX idx_processing_metrics_job_id ON processing_metrics(job_id);

ALTER TABLE processing_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY processing_metrics_company_isolation ON processing_metrics
FOR ALL USING (company_id = public.user_company_id());

CREATE POLICY processing_metrics_create_own_company ON processing_metrics
FOR INSERT WITH CHECK (company_id = public.user_company_id());
