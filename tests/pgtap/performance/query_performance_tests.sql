\set ON_ERROR_ROLLBACK 1
\set ON_ERROR_STOP true

BEGIN;

-- Load pgTAP
SELECT plan(8);

-- Load test utilities
\i 'tests/helpers/test_utilities.sql'

-- Create a larger dataset for performance testing
DO $$
DECLARE
    v_company_id UUID;
    v_admin_id UUID;
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
    v_duration INTERVAL;
    v_job_id UUID;
    v_random_candidate_id UUID;
BEGIN
    -- Create company
    INSERT INTO companies (name, slug, subscription_plan)
    VALUES ('Performance Test Company', 'performance-test', 'enterprise')
    RETURNING id INTO v_company_id;
    
    -- Create admin user
    INSERT INTO users (company_id, email, full_name, role, password_hash)
    VALUES (v_company_id, 'performance-admin@example.com', 'Performance Admin', 'admin', 'hash123')
    RETURNING id INTO v_admin_id;
    
    -- Create a job
    INSERT INTO jobs (company_id, title, description, skills_required)
    VALUES (
        v_company_id, 
        'Performance Test Job', 
        'Testing query performance with a large dataset',
        ARRAY['skill1', 'skill2', 'skill3', 'skill4', 'skill5']
    )
    RETURNING id INTO v_job_id;
    
    -- Store the company and admin IDs
    PERFORM set_config('test.company_id', v_company_id::text, false);
    PERFORM set_config('test.admin_id', v_admin_id::text, false);
    PERFORM set_config('test.job_id', v_job_id::text, false);
    
    -- Create a large set of candidates (100)
    v_start_time := clock_timestamp();
    
    FOR i IN 1..100 LOOP
        INSERT INTO candidates (
            company_id,
            full_name,
            email,
            phone,
            resume_text,
            skills,
            experience_years
        ) VALUES (
            v_company_id,
            'Performance Candidate ' || i,
            'perf-candidate-' || i || '@example.com',
            '555-123-' || LPAD(i::text, 4, '0'),
            'This is a test candidate for performance testing with skills in ' ||
            CASE WHEN i % 5 = 0 THEN 'skill1, skill3, skill5' 
                 WHEN i % 3 = 0 THEN 'skill2, skill4' 
                 WHEN i % 2 = 0 THEN 'skill1, skill2, skill3'
                 ELSE 'skill1, skill5' END,
            CASE WHEN i % 5 = 0 THEN ARRAY['skill1', 'skill3', 'skill5']
                 WHEN i % 3 = 0 THEN ARRAY['skill2', 'skill4'] 
                 WHEN i % 2 = 0 THEN ARRAY['skill1', 'skill2', 'skill3']
                 ELSE ARRAY['skill1', 'skill5'] END,
            (i % 10) + 1  -- 1-10 years experience
        );
    END LOOP;
    
    v_end_time := clock_timestamp();
    v_duration := v_end_time - v_start_time;
    
    -- Store batch insert time
    PERFORM set_config('test.batch_insert_ms', (EXTRACT(EPOCH FROM v_duration) * 1000)::text, false);
    
    -- Get a random candidate for later tests
    SELECT id INTO v_random_candidate_id FROM candidates 
    WHERE company_id = v_company_id 
    ORDER BY random() LIMIT 1;
    
    PERFORM set_config('test.random_candidate_id', v_random_candidate_id::text, false);
    
    -- Create job matches for all candidates
    v_start_time := clock_timestamp();
    
    INSERT INTO job_matches (
        company_id,
        job_id,
        candidate_id,
        match_score,
        match_details
    )
    SELECT 
        v_company_id,
        v_job_id,
        id,
        -- Generate somewhat realistic scores based on candidate data
        50 + (experience_years * 3) + (array_length(skills, 1) * 5),
        ('{"skills_score": ' || (40 + array_length(skills, 1) * 10) || 
         ', "experience_score": ' || (30 + experience_years * 5) || 
         ', "education_score": ' || (50 + (id::text)::integer % 40) || 
         ', "keywords_score": ' || (60 + (id::text)::integer % 30) || '}')::jsonb
    FROM candidates
    WHERE company_id = v_company_id;
    
    v_end_time := clock_timestamp();
    v_duration := v_end_time - v_start_time;
    
    -- Store batch job match insert time
    PERFORM set_config('test.match_insert_ms', (EXTRACT(EPOCH FROM v_duration) * 1000)::text, false);
    
    -- Add candidate statuses (mostly new, some in progress)
    INSERT INTO candidate_statuses (
        company_id,
        candidate_id,
        status,
        updated_by_user_id
    )
    SELECT 
        v_company_id,
        id,
        CASE 
            WHEN id::text < v_random_candidate_id::text THEN 'new'
            WHEN id::text = v_random_candidate_id::text THEN 'reviewed'
            ELSE 
                CASE (id::text)::integer % 5
                    WHEN 0 THEN 'shortlisted'
                    WHEN 1 THEN 'interviewed'
                    WHEN 2 THEN 'offered'
                    WHEN 3 THEN 'hired'
                    ELSE 'rejected'
                END
        END,
        v_admin_id
    FROM candidates
    WHERE company_id = v_company_id;
    
    -- Create some tags
    INSERT INTO candidate_tags (company_id, name, color)
    VALUES
        (v_company_id, 'Senior', '#FF5733'),
        (v_company_id, 'Junior', '#33FF57'),
        (v_company_id, 'Mid-level', '#3357FF'),
        (v_company_id, 'Contract', '#F3FF33'),
        (v_company_id, 'Remote', '#33FFF3');
    
    -- Apply tags to candidates
    INSERT INTO candidate_tag_assignments (
        company_id,
        candidate_id,
        tag_id
    )
    SELECT 
        v_company_id,
        c.id,
        t.id
    FROM candidates c
    CROSS JOIN (
        SELECT id FROM candidate_tags 
        WHERE company_id = v_company_id 
        ORDER BY name
        LIMIT 1 OFFSET (c.id::text)::integer % 5
    ) t
    WHERE c.company_id = v_company_id;
END $$;

-- Set variables from stored values
\set company_id `SELECT current_setting('test.company_id')`
\set admin_id `SELECT current_setting('test.admin_id')`
\set job_id `SELECT current_setting('test.job_id')`
\set random_candidate_id `SELECT current_setting('test.random_candidate_id')`

-- Set current user for RLS
SELECT set_current_user_id(:'admin_id'::uuid);

-- Test 1: Test simple candidate count query performance
DO $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
    v_duration INTERVAL;
BEGIN
    v_start_time := clock_timestamp();
    
    PERFORM COUNT(*) FROM candidates 
    WHERE company_id = :'company_id'::uuid;
    
    v_end_time := clock_timestamp();
    v_duration := v_end_time - v_start_time;
    
    PERFORM set_config('test.simple_count_ms', (EXTRACT(EPOCH FROM v_duration) * 1000)::text, false);
END $$;

SELECT ok(
    current_setting('test.simple_count_ms')::numeric < 100,
    'Simple candidate count should complete in under 100ms (actual: ' || current_setting('test.simple_count_ms') || 'ms)'
);

-- Test 2: Test job matches query with filtering and sorting
DO $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
    v_duration INTERVAL;
BEGIN
    v_start_time := clock_timestamp();
    
    PERFORM * FROM job_matches jm
    JOIN candidates c ON jm.candidate_id = c.id
    WHERE jm.company_id = :'company_id'::uuid
    AND jm.job_id = :'job_id'::uuid
    AND jm.match_score > 60
    ORDER BY jm.match_score DESC
    LIMIT 20;
    
    v_end_time := clock_timestamp();
    v_duration := v_end_time - v_start_time;
    
    PERFORM set_config('test.complex_query_ms', (EXTRACT(EPOCH FROM v_duration) * 1000)::text, false);
END $$;

SELECT ok(
    current_setting('test.complex_query_ms')::numeric < 200,
    'Complex job matches query should complete in under 200ms (actual: ' || current_setting('test.complex_query_ms') || 'ms)'
);

-- Test 3: Test full-text search
DO $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
    v_duration INTERVAL;
BEGIN
    v_start_time := clock_timestamp();
    
    PERFORM * FROM candidates
    WHERE company_id = :'company_id'::uuid
    AND (
        resume_text ILIKE '%skill1%' OR
        resume_text ILIKE '%skill3%' OR
        'skill1' = ANY(skills) OR
        'skill3' = ANY(skills)
    )
    ORDER BY experience_years DESC
    LIMIT 20;
    
    v_end_time := clock_timestamp();
    v_duration := v_end_time - v_start_time;
    
    PERFORM set_config('test.text_search_ms', (EXTRACT(EPOCH FROM v_duration) * 1000)::text, false);
END $$;

SELECT ok(
    current_setting('test.text_search_ms')::numeric < 300,
    'Text search query should complete in under 300ms (actual: ' || current_setting('test.text_search_ms') || 'ms)'
);

-- Test 4: Test candidate pipeline status aggregation
DO $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
    v_duration INTERVAL;
BEGIN
    v_start_time := clock_timestamp();
    
    PERFORM status, COUNT(*) 
    FROM (
        SELECT DISTINCT ON (cs.candidate_id) 
            cs.candidate_id,
            cs.status
        FROM candidate_statuses cs
        WHERE cs.company_id = :'company_id'::uuid
        ORDER BY cs.candidate_id, cs.created_at DESC
    ) latest_statuses
    GROUP BY status
    ORDER BY COUNT(*) DESC;
    
    v_end_time := clock_timestamp();
    v_duration := v_end_time - v_start_time;
    
    PERFORM set_config('test.status_agg_ms', (EXTRACT(EPOCH FROM v_duration) * 1000)::text, false);
END $$;

SELECT ok(
    current_setting('test.status_agg_ms')::numeric < 200,
    'Status aggregation query should complete in under 200ms (actual: ' || current_setting('test.status_agg_ms') || 'ms)'
);

-- Test 5: Test complex join query with multiple tables
DO $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
    v_duration INTERVAL;
BEGIN
    v_start_time := clock_timestamp();
    
    -- Complex query joining multiple tables
    PERFORM 
        c.id, 
        c.full_name, 
        c.email,
        c.experience_years,
        jm.match_score,
        cs.status,
        array_agg(DISTINCT ct.name) as tags
    FROM candidates c
    JOIN job_matches jm ON c.id = jm.candidate_id
    JOIN (
        SELECT DISTINCT ON (candidate_id) 
            candidate_id, 
            status, 
            created_at
        FROM candidate_statuses
        WHERE company_id = :'company_id'::uuid
        ORDER BY candidate_id, created_at DESC
    ) cs ON c.id = cs.candidate_id
    LEFT JOIN candidate_tag_assignments cta ON c.id = cta.candidate_id
    LEFT JOIN candidate_tags ct ON cta.tag_id = ct.id
    WHERE c.company_id = :'company_id'::uuid
    AND jm.job_id = :'job_id'::uuid
    GROUP BY c.id, c.full_name, c.email, c.experience_years, jm.match_score, cs.status
    ORDER BY jm.match_score DESC
    LIMIT 20;
    
    v_end_time := clock_timestamp();
    v_duration := v_end_time - v_start_time;
    
    PERFORM set_config('test.complex_join_ms', (EXTRACT(EPOCH FROM v_duration) * 1000)::text, false);
END $$;

SELECT ok(
    current_setting('test.complex_join_ms')::numeric < 500,
    'Complex join query should complete in under 500ms (actual: ' || current_setting('test.complex_join_ms') || 'ms)'
);

-- Test 6: Verify that batch inserts were reasonably fast
SELECT ok(
    current_setting('test.batch_insert_ms')::numeric < 1000,
    'Batch insertion of 100 candidates should complete in under 1000ms (actual: ' || current_setting('test.batch_insert_ms') || 'ms)'
);

-- Test 7: Verify that job match generation was reasonably fast
SELECT ok(
    current_setting('test.match_insert_ms')::numeric < 1000,
    'Generation of 100 job matches should complete in under 1000ms (actual: ' || current_setting('test.match_insert_ms') || 'ms)'
);

-- Test 8: Performance of individual candidate detail query
DO $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
    v_duration INTERVAL;
BEGIN
    v_start_time := clock_timestamp();
    
    -- Get detailed candidate information including latest status and tags
    PERFORM 
        c.*,
        cs.status AS current_status,
        array_agg(ct.name) AS tags,
        array_agg(ct.color) AS tag_colors,
        jm.match_score,
        jm.match_details
    FROM candidates c
    LEFT JOIN (
        SELECT DISTINCT ON (candidate_id) 
            candidate_id, 
            status 
        FROM candidate_statuses
        WHERE company_id = :'company_id'::uuid
        ORDER BY candidate_id, created_at DESC
    ) cs ON c.id = cs.candidate_id
    LEFT JOIN candidate_tag_assignments cta ON c.id = cta.candidate_id
    LEFT JOIN candidate_tags ct ON cta.tag_id = ct.id
    LEFT JOIN job_matches jm ON c.id = jm.candidate_id AND jm.job_id = :'job_id'::uuid
    WHERE c.id = :'random_candidate_id'::uuid
    GROUP BY c.id, cs.status, jm.match_score, jm.match_details;
    
    v_end_time := clock_timestamp();
    v_duration := v_end_time - v_start_time;
    
    PERFORM set_config('test.candidate_detail_ms', (EXTRACT(EPOCH FROM v_duration) * 1000)::text, false);
END $$;

SELECT ok(
    current_setting('test.candidate_detail_ms')::numeric < 100,
    'Individual candidate detail query should complete in under 100ms (actual: ' || current_setting('test.candidate_detail_ms') || 'ms)'
);

-- Clean up test data
SELECT cleanup_test_data();

-- Finish the tests
SELECT * FROM finish();

ROLLBACK;
