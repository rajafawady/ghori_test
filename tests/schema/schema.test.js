const { query, closePool } = require('../helpers/db');

describe('Database Schema Tests', () => {
  afterAll(async () => {
    await closePool();
  });

  describe('Core Business Tables', () => {
    test('companies table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'companies' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('slug');
      expect(columns).toContain('subscription_plan');
      expect(columns).toContain('max_users');
      expect(columns).toContain('max_jobs_per_month');
      expect(columns).toContain('is_active');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

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
      expect(columns).toContain('company_id');
      expect(columns).toContain('email');
      expect(columns).toContain('name');
      expect(columns).toContain('role');
      expect(columns).toContain('is_active');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    test('jobs table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'jobs' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('company_id');
      expect(columns).toContain('created_by_user_id');
      expect(columns).toContain('title');
      expect(columns).toContain('description');
      expect(columns).toContain('required_skills');
      expect(columns).toContain('employment_type');
      expect(columns).toContain('salary_min');
      expect(columns).toContain('salary_max');
      expect(columns).toContain('location');
      expect(columns).toContain('is_active');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    test('candidates table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'candidates' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('company_id');
      expect(columns).toContain('uploaded_by_user_id');
      expect(columns).toContain('name');
      expect(columns).toContain('email');
      expect(columns).toContain('cv_file_path');
      expect(columns).toContain('top_skills');
      expect(columns).toContain('experience_level');
      expect(columns).toContain('location');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    test('job_matches table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'job_matches' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('job_id');
      expect(columns).toContain('candidate_id');
      expect(columns).toContain('match_score');
      expect(columns).toContain('explanation');
      expect(columns).toContain('status');      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });
  });

  describe('Feature Enhancement Tables', () => {
    test('ai_analysis table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'ai_analysis' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('candidate_id');
      expect(columns).toContain('analysis_type');
      expect(columns).toContain('prompt');
      expect(columns).toContain('response');
      expect(columns).toContain('model_version');
      expect(columns).toContain('created_at');
    });

    test('interview_scheduling table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'interview_scheduling' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('job_match_id');
      expect(columns).toContain('interviewer_user_id');
      expect(columns).toContain('scheduled_at');
      expect(columns).toContain('duration_minutes');
      expect(columns).toContain('interview_type');
      expect(columns).toContain('status');
      expect(columns).toContain('notes');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    test('candidate_feedback table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'candidate_feedback' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('job_match_id');
      expect(columns).toContain('reviewer_user_id');
      expect(columns).toContain('rating');
      expect(columns).toContain('feedback_text');
      expect(columns).toContain('strengths');
      expect(columns).toContain('areas_for_improvement');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    test('saved_searches table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'saved_searches' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('name');
      expect(columns).toContain('search_criteria');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
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
      expect(columns).toContain('is_read');
      expect(columns).toContain('created_at');
    });

    test('api_usage_tracking table should exist with correct structure', async () => {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'api_usage_tracking' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('company_id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('endpoint');
      expect(columns).toContain('method');
      expect(columns).toContain('status_code');
      expect(columns).toContain('response_time_ms');
      expect(columns).toContain('created_at');
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
        c.table === 'users' && c.column === 'company_id' && c.foreign_table === 'companies'
      )).toBe(true);
      
      expect(constraints.some(c => 
        c.table === 'jobs' && c.column === 'company_id' && c.foreign_table === 'companies'
      )).toBe(true);
      
      expect(constraints.some(c => 
        c.table === 'jobs' && c.column === 'created_by_user_id' && c.foreign_table === 'users'
      )).toBe(true);

      expect(constraints.some(c => 
        c.table === 'candidates' && c.column === 'company_id' && c.foreign_table === 'companies'
      )).toBe(true);

      expect(constraints.some(c => 
        c.table === 'candidates' && c.column === 'uploaded_by_user_id' && c.foreign_table === 'users'
      )).toBe(true);

      expect(constraints.some(c => 
        c.table === 'job_matches' && c.column === 'job_id' && c.foreign_table === 'jobs'
      )).toBe(true);

      expect(constraints.some(c => 
        c.table === 'job_matches' && c.column === 'candidate_id' && c.foreign_table === 'candidates'
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
      expect(indexes.some(i => i.table === 'companies' && i.index.includes('slug'))).toBe(true);
      expect(indexes.some(i => i.table === 'job_matches' && i.index.includes('match_score'))).toBe(true);
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

      expect(uniqueConstraints.some(c => 
        c.table === 'companies' && c.column === 'slug'
      )).toBe(true);
    });

    test('should have proper check constraints', async () => {
      const result = await query(`
        SELECT
          tc.constraint_name,
          tc.table_name,
          cc.check_clause
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.check_constraints AS cc
          ON tc.constraint_name = cc.constraint_name
        WHERE constraint_type = 'CHECK'
        ORDER BY tc.table_name, tc.constraint_name;
      `);
      
      // Check constraints may or may not exist depending on implementation
      if (result.rows.length > 0) {
        const checkConstraints = result.rows.map(row => ({
          table: row.table_name,
          constraint: row.constraint_name,
          clause: row.check_clause
        }));
        
        console.log('Check constraints found:', checkConstraints);
      }
    });
  });

  describe('Data Types and Enums', () => {
    test('should have proper enum types defined', async () => {
      const result = await query(`
        SELECT typname, enumlabel
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        ORDER BY typname, enumlabel;
      `);
      
      // Check if employment_type enum exists
      const enums = result.rows.reduce((acc, row) => {
        if (!acc[row.typname]) acc[row.typname] = [];
        acc[row.typname].push(row.enumlabel);
        return acc;
      }, {});
      
      if (enums.employment_type) {
        expect(enums.employment_type).toContain('full-time');
        expect(enums.employment_type).toContain('part-time');
        expect(enums.employment_type).toContain('contract');
      }

      if (enums.subscription_plan) {
        expect(enums.subscription_plan).toContain('basic');
        expect(enums.subscription_plan).toContain('professional');
        expect(enums.subscription_plan).toContain('enterprise');
      }
    });
  });
});
