-- Sample API usage data

-- Insert sample usage limits for each company based on their subscription plan
-- Check first if the entry already exists to avoid duplicate key errors
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usage_limits WHERE company_id = '550e8400-e29b-41d4-a716-446655440000') THEN
        INSERT INTO usage_limits (company_id, monthly_api_calls, monthly_candidate_limit, last_billing_date, next_billing_date, current_month_api_calls, current_month_candidates)
        VALUES ('550e8400-e29b-41d4-a716-446655440000', 10000, 1000, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '15 days', 4521, 432);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM usage_limits WHERE company_id = '550e8400-e29b-41d4-a716-446655440001') THEN
        INSERT INTO usage_limits (company_id, monthly_api_calls, monthly_candidate_limit, last_billing_date, next_billing_date, current_month_api_calls, current_month_candidates)
        VALUES ('550e8400-e29b-41d4-a716-446655440001', 5000, 500, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days', 2145, 189);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM usage_limits WHERE company_id = '550e8400-e29b-41d4-a716-446655440002') THEN
        INSERT INTO usage_limits (company_id, monthly_api_calls, monthly_candidate_limit, last_billing_date, next_billing_date, current_month_api_calls, current_month_candidates)
        VALUES ('550e8400-e29b-41d4-a716-446655440002', 1000, 100, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days', 657, 42);
    END IF;
END $$;

-- Insert sample API usage records
INSERT INTO api_usage (id, company_id, user_id, api_endpoint, request_count, candidates_processed, date)
VALUES
-- TechRecruit Pro API usage
('880e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', '/api/candidates/upload', 3, 500, CURRENT_DATE - INTERVAL '10 days'),
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', '/api/job-matches/run', 25, 500, CURRENT_DATE - INTERVAL '9 days'),
('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440002', '/api/candidates/search', 120, 0, CURRENT_DATE - INTERVAL '5 days'),

-- StartupHire API usage
('cc0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', '/api/candidates/upload', 2, 250, CURRENT_DATE - INTERVAL '8 days'),
('cc0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', '/api/job-matches/run', 15, 250, CURRENT_DATE - INTERVAL '7 days'),

-- QuickStaff API usage
('cc0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440005', '/api/candidates/upload', 1, 50, CURRENT_DATE - INTERVAL '3 days'),
('cc0e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440005', '/api/job-matches/run', 8, 50, CURRENT_DATE - INTERVAL '2 days');
