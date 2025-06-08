CREATE TYPE queue_status_type AS ENUM ('queued', 'processing', 'completed', 'failed');

CREATE TABLE ai_processing_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    status queue_status_type DEFAULT 'queued',
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_queue_status ON ai_processing_queue(status);
CREATE INDEX idx_ai_queue_company_id ON ai_processing_queue(company_id);
CREATE INDEX idx_ai_queue_created_at ON ai_processing_queue(created_at);

-- RLS
ALTER TABLE ai_processing_queue ENABLE ROW LEVEL SECURITY;