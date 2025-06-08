-- Helper functions for pgTAP testing
-- This file contains utilities that help with testing

-- Function to create test company
CREATE OR REPLACE FUNCTION create_test_company(
    name TEXT DEFAULT 'Test Company',
    subscription TEXT DEFAULT 'professional'
)
RETURNS UUID AS $$
DECLARE
    new_company_id UUID;
BEGIN
    INSERT INTO companies (name, slug, subscription_plan)
    VALUES (
        name, 
        LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '-', 'g')), 
        subscription::subscription_plan_type
    )
    RETURNING id INTO new_company_id;
    
    RETURN new_company_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create test user
CREATE OR REPLACE FUNCTION create_test_user(
    company_id UUID,
    role_type TEXT DEFAULT 'admin',
    name TEXT DEFAULT 'Test User',
    email_prefix TEXT DEFAULT 'test'
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
    email_address TEXT;
BEGIN
    email_address := email_prefix || '@' || (SELECT slug FROM companies WHERE id = company_id) || '.test';
    
    INSERT INTO users (company_id, email, full_name, role, password_hash)
    VALUES (
        company_id,
        email_address,
        name,
        role_type::user_role_type,
        crypt('password123', gen_salt('bf'))
    )
    RETURNING id INTO new_user_id;
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create test job
CREATE OR REPLACE FUNCTION create_test_job(
    company_id UUID,
    title TEXT DEFAULT 'Test Job',
    description TEXT DEFAULT 'This is a test job description'
)
RETURNS UUID AS $$
DECLARE
    new_job_id UUID;
BEGIN
    INSERT INTO jobs (company_id, title, description, skills_required, experience_required)
    VALUES (
        company_id,
        title,
        description,
        ARRAY['skill1', 'skill2', 'skill3'],
        '2+ years'
    )
    RETURNING id INTO new_job_id;
    
    RETURN new_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create test candidate
CREATE OR REPLACE FUNCTION create_test_candidate(
    company_id UUID,
    name TEXT DEFAULT 'Test Candidate',
    email_prefix TEXT DEFAULT 'candidate'
)
RETURNS UUID AS $$
DECLARE
    new_candidate_id UUID;
    email_address TEXT;
BEGIN
    email_address := email_prefix || '@example.test';
    
    INSERT INTO candidates (
        company_id, 
        full_name, 
        email, 
        phone, 
        resume_text, 
        skills, 
        experience_years
    )
    VALUES (
        company_id,
        name,
        email_address,
        '555-123-4567',
        'Example resume text with skills in programming languages and frameworks.',
        ARRAY['skill1', 'skill2', 'skill3'],
        3
    )
    RETURNING id INTO new_candidate_id;
    
    RETURN new_candidate_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a complete test dataset with companies, users, jobs, candidates, and matches
CREATE OR REPLACE FUNCTION setup_test_dataset(
    num_companies INTEGER DEFAULT 2,
    num_users_per_company INTEGER DEFAULT 3,
    num_jobs_per_company INTEGER DEFAULT 2,
    num_candidates_per_company INTEGER DEFAULT 5
)
RETURNS SETOF TEXT AS $$
DECLARE
    company_id UUID;
    user_id UUID;
    job_id UUID;
    candidate_id UUID;
    roles TEXT[] := ARRAY['admin', 'recruiter', 'viewer'];
    i INTEGER;
    j INTEGER;
    k INTEGER;
    l INTEGER;
BEGIN
    -- Create test companies
    FOR i IN 1..num_companies LOOP
        company_id := create_test_company('Test Company ' || i);
        
        -- Create users for this company
        FOR j IN 1..num_users_per_company LOOP
            user_id := create_test_user(
                company_id, 
                roles[(j % 3) + 1], 
                'Test User ' || j, 
                'user' || j
            );
        END LOOP;
        
        -- Create jobs for this company
        FOR k IN 1..num_jobs_per_company LOOP
            job_id := create_test_job(
                company_id,
                'Test Job ' || k || ' at Company ' || i,
                'This is test job ' || k || ' at company ' || i
            );
            
            -- Create a job match config
            INSERT INTO job_match_configs (
                company_id,
                job_id,
                skills_weight,
                experience_weight,
                education_weight,
                keywords_weight,
                minimum_score
            ) VALUES (
                company_id,
                job_id,
                0.4,
                0.3,
                0.1,
                0.2,
                60.0
            );
        END LOOP;
        
        -- Create candidates for this company
        FOR l IN 1..num_candidates_per_company LOOP
            candidate_id := create_test_candidate(
                company_id,
                'Test Candidate ' || l || ' at Company ' || i,
                'candidate' || l || 'company' || i
            );
            
            -- Create a candidate status
            INSERT INTO candidate_statuses (
                company_id,
                candidate_id,
                status
            ) VALUES (
                company_id,
                candidate_id,
                'new'
            );
            
            -- Create a candidate tag
            IF NOT EXISTS (SELECT 1 FROM candidate_tags WHERE company_id = company_id AND name = 'TestTag') THEN
                INSERT INTO candidate_tags (company_id, name, color) 
                VALUES (company_id, 'TestTag', '#FF5733');
            END IF;
            
            -- Assign tag to candidate
            INSERT INTO candidate_tag_assignments (
                company_id,
                candidate_id,
                tag_id
            ) VALUES (
                company_id,
                candidate_id,
                (SELECT id FROM candidate_tags WHERE company_id = company_id AND name = 'TestTag' LIMIT 1)
            );
        END LOOP;
    END LOOP;
    
    RETURN NEXT 'Test dataset created successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up test data
CREATE OR REPLACE FUNCTION cleanup_test_data() 
RETURNS VOID AS $$
BEGIN
    -- Delete in proper order to respect foreign keys
    DELETE FROM candidate_comments;
    DELETE FROM candidate_tag_assignments;
    DELETE FROM candidate_tags;
    DELETE FROM candidate_statuses;
    DELETE FROM job_matches;
    DELETE FROM candidates;
    DELETE FROM job_match_configs;
    DELETE FROM jobs;
    DELETE FROM users;
    DELETE FROM companies;
END;
$$ LANGUAGE plpgsql;
