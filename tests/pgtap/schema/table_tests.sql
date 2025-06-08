\set ON_ERROR_ROLLBACK 1
\set ON_ERROR_STOP true

BEGIN;

-- Load pgTAP
SELECT plan(71);  -- Adjust the number based on tests added below

-- Test for companies table
SELECT has_table('companies', 'Table companies should exist');
SELECT has_pk('companies', 'companies table should have a primary key');
SELECT col_is_pk('companies', 'id', 'id should be the primary key of companies table');
SELECT col_type_is('companies', 'id', 'uuid', 'companies.id should be UUID type');
SELECT col_type_is('companies', 'name', 'character varying(255)', 'companies.name should be VARCHAR(255)');
SELECT col_not_null('companies', 'name', 'companies.name should be NOT NULL');
SELECT col_type_is('companies', 'slug', 'character varying(100)', 'companies.slug should be VARCHAR(100)');
SELECT col_not_null('companies', 'slug', 'companies.slug should be NOT NULL');
SELECT col_is_unique('companies', 'slug', 'companies.slug should be unique');
SELECT col_type_is('companies', 'subscription_plan', 'subscription_plan_type', 'companies.subscription_plan should be subscription_plan_type');
SELECT col_has_default('companies', 'subscription_plan', 'companies.subscription_plan should have a default value');
SELECT col_default_is('companies', 'subscription_plan', 'starter', 'Default subscription_plan should be starter');
SELECT col_type_is('companies', 'created_at', 'timestamp with time zone', 'companies.created_at should be timestamp with time zone');
SELECT col_has_default('companies', 'created_at', 'companies.created_at should have a default value');
SELECT col_type_is('companies', 'is_active', 'boolean', 'companies.is_active should be boolean');
SELECT col_has_default('companies', 'is_active', 'companies.is_active should have a default value');
SELECT col_default_is('companies', 'is_active', 'true', 'Default is_active should be true');

-- Test for users table
SELECT has_table('users', 'Table users should exist');
SELECT has_pk('users', 'users table should have a primary key');
SELECT col_is_pk('users', 'id', 'id should be the primary key of users table');
SELECT col_type_is('users', 'id', 'uuid', 'users.id should be UUID type');
SELECT col_type_is('users', 'company_id', 'uuid', 'users.company_id should be UUID type');
SELECT col_not_null('users', 'company_id', 'users.company_id should be NOT NULL');
SELECT col_type_is('users', 'email', 'character varying(255)', 'users.email should be VARCHAR(255)');
SELECT col_not_null('users', 'email', 'users.email should be NOT NULL');
SELECT col_is_unique('users', 'email', 'users.email should be unique');
SELECT col_type_is('users', 'full_name', 'character varying(255)', 'users.full_name should be VARCHAR(255)');
SELECT col_not_null('users', 'full_name', 'users.full_name should be NOT NULL');
SELECT col_type_is('users', 'role', 'user_role_type', 'users.role should be user_role_type');
SELECT col_has_default('users', 'role', 'users.role should have a default value');
SELECT col_default_is('users', 'role', 'recruiter', 'Default role should be recruiter');
SELECT col_type_is('users', 'password_hash', 'character varying(255)', 'users.password_hash should be VARCHAR(255)');
SELECT col_not_null('users', 'password_hash', 'users.password_hash should be NOT NULL');
SELECT col_type_is('users', 'created_at', 'timestamp with time zone', 'users.created_at should be timestamp with time zone');
SELECT col_has_default('users', 'created_at', 'users.created_at should have a default value');
SELECT col_type_is('users', 'is_active', 'boolean', 'users.is_active should be boolean');
SELECT col_has_default('users', 'is_active', 'users.is_active should have a default value');
SELECT col_default_is('users', 'is_active', 'true', 'Default is_active should be true');

-- Test foreign keys
SELECT has_fk('users', 'Foreign key constraint should exist on users');
SELECT fk_ok('users', 'company_id', 'companies', 'id', 'users.company_id should reference companies.id');

-- Test for indexes
SELECT has_index('users', 'idx_users_company_id', 'There should be an index on company_id column');
SELECT has_index('users', 'idx_users_email', 'There should be an index on email column');

-- Test for ENUMs
SELECT has_type('subscription_plan_type', 'subscription_plan_type ENUM should exist');
SELECT enum_has_labels('subscription_plan_type', ARRAY['starter', 'professional', 'enterprise'], 'subscription_plan_type should have correct labels');
SELECT has_type('user_role_type', 'user_role_type ENUM should exist');
SELECT enum_has_labels('user_role_type', ARRAY['admin', 'recruiter', 'viewer'], 'user_role_type should have correct labels');

-- Test for RLS on tables
SELECT table_privs_are('companies', 'public', ARRAY[]::text[], 'companies table should have no public privileges');
SELECT table_privs_are('users', 'public', ARRAY[]::text[], 'users table should have no public privileges');

-- Test for functions
SELECT has_function('current_user_id', 'current_user_id function should exist');
SELECT function_returns('current_user_id', 'uuid', 'current_user_id() should return UUID type');
SELECT has_function('user_company_id', 'user_company_id function should exist');
SELECT function_returns('user_company_id', 'uuid', 'user_company_id() should return UUID type');
SELECT has_function('set_current_user_id', ARRAY['uuid'], 'set_current_user_id function should exist');
SELECT function_returns('set_current_user_id', 'void', 'set_current_user_id() should return void');

-- Test for triggers
SELECT has_trigger('companies', 'update_companies_updated_at', 'companies table should have update_companies_updated_at trigger');
SELECT has_trigger('users', 'update_users_updated_at', 'users table should have update_users_updated_at trigger');
SELECT trigger_is('companies', 'update_companies_updated_at', 'update_updated_at_column', 'update_companies_updated_at trigger should call update_updated_at_column function');
SELECT trigger_is('users', 'update_users_updated_at', 'update_updated_at_column', 'update_users_updated_at trigger should call update_updated_at_column function');

-- Test for RLS policies
SELECT has_table_privilege('companies', 'select', 'RLS should be enabled on companies table');
SELECT has_table_privilege('users', 'select', 'RLS should be enabled on users table');
SELECT policies_are('companies', ARRAY['companies_isolation'], 'companies table should have the correct policies');
SELECT policies_are('users', ARRAY['users_company_isolation', 'users_create_own_company', 'users_admin_only_sensitive_ops'], 'users table should have the correct policies');

-- Finish the tests
SELECT * FROM finish();

ROLLBACK;
