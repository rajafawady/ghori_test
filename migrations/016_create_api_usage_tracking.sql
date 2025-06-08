-- API Usage Tracking for SaaS Limits

CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    api_endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    candidates_processed INTEGER DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Composite index for faster lookups by company and date
CREATE INDEX idx_api_usage_company_date ON api_usage(company_id, date);
CREATE INDEX idx_api_usage_endpoint ON api_usage(api_endpoint);

ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- RLS policy for company isolation
CREATE POLICY api_usage_company_isolation ON api_usage
FOR ALL USING (company_id = public.user_company_id());

-- Create table for monthly usage limits and billing
CREATE TABLE usage_limits (
    company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
    monthly_api_calls INTEGER NOT NULL,
    monthly_candidate_limit INTEGER NOT NULL,
    api_call_overage_rate DECIMAL(10,2) NOT NULL DEFAULT 0.01,
    candidate_overage_rate DECIMAL(10,2) NOT NULL DEFAULT 0.05,
    last_billing_date DATE,
    next_billing_date DATE,
    current_month_api_calls INTEGER DEFAULT 0,
    current_month_candidates INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_usage_limits_updated_at
    BEFORE UPDATE ON usage_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY usage_limits_company_isolation ON usage_limits
FOR ALL USING (company_id = public.user_company_id());

-- Function to update company usage stats
CREATE OR REPLACE FUNCTION update_company_usage()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO usage_limits (company_id, monthly_api_calls, monthly_candidate_limit)
    VALUES (NEW.id, 
        CASE 
            WHEN NEW.subscription_plan = 'enterprise' THEN 10000
            WHEN NEW.subscription_plan = 'professional' THEN 5000
            ELSE 1000
        END,
        CASE 
            WHEN NEW.subscription_plan = 'enterprise' THEN 1000
            WHEN NEW.subscription_plan = 'professional' THEN 500
            ELSE 100
        END
    )
    ON CONFLICT (company_id) 
    DO UPDATE SET
        monthly_api_calls = 
            CASE 
                WHEN NEW.subscription_plan = 'enterprise' THEN 10000
                WHEN NEW.subscription_plan = 'professional' THEN 5000
                ELSE 1000
            END,
        monthly_candidate_limit = 
            CASE 
                WHEN NEW.subscription_plan = 'enterprise' THEN 1000
                WHEN NEW.subscription_plan = 'professional' THEN 500
                ELSE 100
            END;
            
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_after_insert_or_update
AFTER INSERT OR UPDATE OF subscription_plan ON companies
FOR EACH ROW EXECUTE FUNCTION update_company_usage();
