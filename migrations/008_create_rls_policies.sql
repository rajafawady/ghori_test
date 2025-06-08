-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create session management functions
CREATE OR REPLACE FUNCTION public.set_current_user_id(user_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id::text, false);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get current user's company_id
CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT company_id 
        FROM users 
        WHERE id = public.current_user_id()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all existing tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on tables that may not exist yet (will be created in later migrations)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'batch_uploads') THEN
        ALTER TABLE batch_uploads ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'job_match_configs') THEN
        ALTER TABLE job_match_configs ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'saved_searches') THEN
        ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'candidate_tags') THEN
        ALTER TABLE candidate_tags ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'candidate_tag_assignments') THEN
        ALTER TABLE candidate_tag_assignments ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'processing_metrics') THEN
        ALTER TABLE processing_metrics ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'candidate_statuses') THEN
        ALTER TABLE candidate_statuses ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'candidate_comments') THEN
        ALTER TABLE candidate_comments ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Companies RLS Policies
CREATE POLICY companies_isolation ON companies
FOR ALL USING (id = public.user_company_id());

-- Users RLS Policies  
CREATE POLICY users_company_isolation ON users
FOR ALL USING (company_id = public.user_company_id());

CREATE POLICY users_create_own_company ON users
FOR INSERT WITH CHECK (company_id = public.user_company_id());

-- Jobs RLS Policies
CREATE POLICY jobs_company_isolation ON jobs
FOR ALL USING (company_id = public.user_company_id());

CREATE POLICY jobs_create_own_company ON jobs
FOR INSERT WITH CHECK (company_id = public.user_company_id());

-- Candidates RLS Policies
CREATE POLICY candidates_company_isolation ON candidates
FOR ALL USING (company_id = public.user_company_id());

CREATE POLICY candidates_create_own_company ON candidates
FOR INSERT WITH CHECK (company_id = public.user_company_id());

-- Job Matches RLS Policies
CREATE POLICY job_matches_company_isolation ON job_matches
FOR ALL USING (company_id = public.user_company_id());

CREATE POLICY job_matches_create_own_company ON job_matches
FOR INSERT WITH CHECK (company_id = public.user_company_id());

-- AI Processing Queue RLS Policies
CREATE POLICY ai_queue_company_isolation ON ai_processing_queue
FOR ALL USING (company_id = public.user_company_id());

CREATE POLICY ai_queue_create_own_company ON ai_processing_queue
FOR INSERT WITH CHECK (company_id = public.user_company_id());

-- Audit Logs RLS Policies
CREATE POLICY audit_logs_company_isolation ON audit_logs
FOR ALL USING (company_id = public.user_company_id());

CREATE POLICY audit_logs_create_own_company ON audit_logs
FOR INSERT WITH CHECK (company_id = public.user_company_id());

-- Additional security: Role-based policies for sensitive operations

-- Only admins can manage users
CREATE POLICY users_admin_only_sensitive_ops ON users
FOR UPDATE USING (
    public.user_company_id() = company_id 
    AND EXISTS (
        SELECT 1 FROM users 
        WHERE id = public.current_user_id() 
        AND role = 'admin'
    )
);

-- Only admins and recruiters can create jobs
CREATE POLICY jobs_recruiter_create ON jobs
FOR INSERT WITH CHECK (
    company_id = public.user_company_id()
    AND EXISTS (
        SELECT 1 FROM users 
        WHERE id = public.current_user_id() 
        AND role IN ('admin', 'recruiter')
    )
);

-- Only admins and recruiters can upload candidates
CREATE POLICY candidates_recruiter_create ON candidates
FOR INSERT WITH CHECK (
    company_id = public.user_company_id()
    AND EXISTS (
        SELECT 1 FROM users 
        WHERE id = public.current_user_id() 
        AND role IN ('admin', 'recruiter')
    )
);

-- Conditional RLS Policies for tables that may not exist yet
DO $$
BEGIN
    -- Batch Uploads RLS Policies
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'batch_uploads') THEN
        EXECUTE 'CREATE POLICY batch_uploads_company_isolation ON batch_uploads FOR ALL USING (company_id = public.user_company_id())';
        EXECUTE 'CREATE POLICY batch_uploads_create_own_company ON batch_uploads FOR INSERT WITH CHECK (company_id = public.user_company_id())';
        EXECUTE 'CREATE POLICY batch_uploads_recruiter_create ON batch_uploads FOR INSERT WITH CHECK (company_id = public.user_company_id() AND EXISTS (SELECT 1 FROM users WHERE id = public.current_user_id() AND role IN (''admin'', ''recruiter'')))';
    END IF;

    -- Job Match Configs RLS Policies
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'job_match_configs') THEN
        EXECUTE 'CREATE POLICY job_match_configs_company_isolation ON job_match_configs FOR ALL USING (company_id = public.user_company_id())';
        EXECUTE 'CREATE POLICY job_match_configs_create_own_company ON job_match_configs FOR INSERT WITH CHECK (company_id = public.user_company_id())';
    END IF;

    -- Saved Searches RLS Policies
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'saved_searches') THEN
        EXECUTE 'CREATE POLICY saved_searches_company_isolation ON saved_searches FOR ALL USING (company_id = public.user_company_id())';
        EXECUTE 'CREATE POLICY saved_searches_create_own_company ON saved_searches FOR INSERT WITH CHECK (company_id = public.user_company_id())';
    END IF;

    -- Candidate Tags RLS Policies
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'candidate_tags') THEN
        EXECUTE 'CREATE POLICY candidate_tags_company_isolation ON candidate_tags FOR ALL USING (company_id = public.user_company_id())';
        EXECUTE 'CREATE POLICY candidate_tags_create_own_company ON candidate_tags FOR INSERT WITH CHECK (company_id = public.user_company_id())';
    END IF;

    -- Candidate Tag Assignments RLS Policies
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'candidate_tag_assignments') THEN
        EXECUTE 'CREATE POLICY candidate_tag_assignments_company_isolation ON candidate_tag_assignments FOR ALL USING (company_id = public.user_company_id())';
        EXECUTE 'CREATE POLICY candidate_tag_assignments_create_own_company ON candidate_tag_assignments FOR INSERT WITH CHECK (company_id = public.user_company_id())';
    END IF;

    -- Processing Metrics RLS Policies
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'processing_metrics') THEN
        EXECUTE 'CREATE POLICY processing_metrics_company_isolation ON processing_metrics FOR ALL USING (company_id = public.user_company_id())';
    END IF;

    -- Candidate Statuses RLS Policies
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'candidate_statuses') THEN
        EXECUTE 'CREATE POLICY candidate_statuses_company_isolation ON candidate_statuses FOR ALL USING (company_id = public.user_company_id())';
        EXECUTE 'CREATE POLICY candidate_statuses_create_own_company ON candidate_statuses FOR INSERT WITH CHECK (company_id = public.user_company_id())';
    END IF;

    -- Candidate Comments RLS Policies
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'candidate_comments') THEN
        EXECUTE 'CREATE POLICY candidate_comments_company_isolation ON candidate_comments FOR ALL USING (company_id = public.user_company_id())';
        EXECUTE 'CREATE POLICY candidate_comments_create_own_company ON candidate_comments FOR INSERT WITH CHECK (company_id = public.user_company_id())';
    END IF;
END $$;