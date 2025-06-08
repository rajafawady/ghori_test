CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE subscription_plan_type AS ENUM ('starter', 'professional', 'enterprise');

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    subscription_plan subscription_plan_type DEFAULT 'starter',
    max_users INTEGER DEFAULT 5,
    max_jobs_per_month INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Updated trigger for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();