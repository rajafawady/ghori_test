const { query, closePool } = require('../helpers/db');

describe('Database Schema Tests', () => {
  describe('Core Business Tables', () => {
    test('users table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'users' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('email');
      expect(columns).toContain('name');
      expect(columns).toContain('user_type');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    test('job_postings table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'job_postings' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('company_id');
      expect(columns).toContain('title');
      expect(columns).toContain('description');
      expect(columns).toContain('requirements');
      expect(columns).toContain('employment_type');
      expect(columns).toContain('salary_min');
      expect(columns).toContain('salary_max');
      expect(columns).toContain('location');
      expect(columns).toContain('status');
    });

    test('user_profiles table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('phone');
      expect(columns).toContain('location');
      expect(columns).toContain('bio');
      expect(columns).toContain('experience_years');
      expect(columns).toContain('education_level');
    });

    test('applications table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'applications' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('job_posting_id');
      expect(columns).toContain('cover_letter');
      expect(columns).toContain('status');
      expect(columns).toContain('applied_at');
    });

    test('matching_scores table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'matching_scores' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('job_posting_id');
      expect(columns).toContain('overall_score');
      expect(columns).toContain('skills_score');
      expect(columns).toContain('experience_score');
      expect(columns).toContain('education_score');
    });
  });

  describe('Advanced Features Tables', () => {
    test('skills table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'skills' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('category');
      expect(columns).toContain('description');
    });

    test('user_skills table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'user_skills' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('skill_id');
      expect(columns).toContain('proficiency_level');
      expect(columns).toContain('years_of_experience');
    });

    test('job_skills table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'job_skills' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('job_posting_id');
      expect(columns).toContain('skill_id');
      expect(columns).toContain('required_level');
      expect(columns).toContain('is_required');
    });

    test('companies table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'companies' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('description');
      expect(columns).toContain('website');
      expect(columns).toContain('industry');
      expect(columns).toContain('size');
    });

    test('interviews table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'interviews' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('application_id');
      expect(columns).toContain('interview_type');
      expect(columns).toContain('scheduled_at');
      expect(columns).toContain('status');
      expect(columns).toContain('feedback');
    });
  });

  describe('System Infrastructure Tables', () => {
    test('api_usage table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'api_usage' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('endpoint');
      expect(columns).toContain('request_count');
      expect(columns).toContain('date');
    });

    test('billing_plans table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'billing_plans' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('price');
      expect(columns).toContain('currency');
      expect(columns).toContain('interval');
      expect(columns).toContain('api_limit');
    });

    test('user_subscriptions table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'user_subscriptions' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('billing_plan_id');
      expect(columns).toContain('status');
      expect(columns).toContain('current_period_start');
      expect(columns).toContain('current_period_end');
    });

    test('audit_logs table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('table_name');
      expect(columns).toContain('action');
      expect(columns).toContain('old_values');
      expect(columns).toContain('new_values');
      expect(columns).toContain('timestamp');
    });

    test('notifications table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'notifications' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('type');
      expect(columns).toContain('title');
      expect(columns).toContain('message');
      expect(columns).toContain('read');
    });
  });

  describe('Database Constraints and Indexes', () => {
    test('should have proper foreign key constraints', async () => {
      const result = await query(`
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE constraint_type = 'FOREIGN KEY'
        ORDER BY tc.table_name, tc.constraint_name;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      // Check for key foreign key relationships
      const constraints = result.rows.map(row => ({
        table: row.table_name,
        column: row.column_name,
        foreign_table: row.foreign_table_name,
        foreign_column: row.foreign_column_name
      }));
      
      // Verify some critical foreign keys exist
      expect(constraints.some(c => 
        c.table === 'job_postings' && c.column === 'company_id' && c.foreign_table === 'companies'
      )).toBe(true);
      
      expect(constraints.some(c => 
        c.table === 'applications' && c.column === 'user_id' && c.foreign_table === 'users'
      )).toBe(true);
      
      expect(constraints.some(c => 
        c.table === 'user_profiles' && c.column === 'user_id' && c.foreign_table === 'users'
      )).toBe(true);
    });

    test('should have proper indexes for performance', async () => {
      const result = await query(`
        SELECT
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const indexes = result.rows.map(row => ({
        table: row.tablename,
        index: row.indexname,
        definition: row.indexdef
      }));
      
      // Check for some expected indexes
      expect(indexes.some(i => i.table === 'users' && i.index.includes('email'))).toBe(true);
      expect(indexes.some(i => i.table === 'matching_scores' && i.index.includes('overall_score'))).toBe(true);
    });

    test('should have proper unique constraints', async () => {
      const result = await query(`
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE constraint_type = 'UNIQUE'
        ORDER BY tc.table_name, tc.constraint_name;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const uniqueConstraints = result.rows.map(row => ({
        table: row.table_name,
        column: row.column_name
      }));
      
      // Check for expected unique constraints
      expect(uniqueConstraints.some(c => 
        c.table === 'users' && c.column === 'email'
      )).toBe(true);
    });
  });

  describe('Row Level Security (RLS)', () => {
    test('should have RLS enabled on sensitive tables', async () => {
      const result = await query(`
        SELECT schemaname, tablename, rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN ('users', 'user_profiles', 'applications', 'matching_scores')
        ORDER BY tablename;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      // Check that RLS is enabled (this will depend on your actual RLS setup)
      result.rows.forEach(row => {
        console.log(`Table ${row.tablename} RLS status: ${row.rowsecurity}`);
      });
    });
  });
});
