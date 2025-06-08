-- Install pgTAP extension for PostgreSQL testing
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Create test user with superuser privileges for testing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pgtap_tester') THEN
        CREATE ROLE pgtap_tester WITH LOGIN PASSWORD 'pgtap_test_password' SUPERUSER;
    END IF;
END
$$;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE job_matcher TO pgtap_tester;
