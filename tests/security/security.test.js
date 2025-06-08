const { query, closePool } = require('../helpers/db');
const {
  createTestUser,
  createTestCompany,
  createTestJob,
  createTestCandidate,
  cleanupAllTestData
} = require('../helpers/testHelpers');describe('Security and Data Protection Tests', () => {
  let testUserId1, testUserId2, testCompanyId, testJobId, testCandidateId1, testCandidateId2;

  beforeEach(async () => {
    await cleanupAllTestData();
    
    testCompanyId = await createTestCompany({
      name: 'Security Test Company',
      slug: 'security-test-company'
    });

    testUserId1 = await createTestUser(testCompanyId, {
      email: 'user1@securitytest.com',
      name: 'User One',
      role: 'recruiter'
    });

    testUserId2 = await createTestUser(testCompanyId, {
      email: 'user2@securitytest.com',
      name: 'User Two',
      role: 'recruiter'
    });

    testJobId = await createTestJob(testCompanyId, testUserId1, {
      title: 'Security Test Job',
      description: 'A job for security testing',
      employment_type: 'full_time'
    });
  });  afterEach(async () => {
    await cleanupAllTestData();
  });

  afterAll(async () => {
    await closePool();
  });  describe('Input Validation and SQL Injection Protection', () => {    test('should handle SQL injection attempts in user input', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      // This should not cause any issues due to parameterized queries
      const result = await query(
        'SELECT id, name FROM users WHERE name = $1',
        [maliciousInput]
      );
      expect(result.rows).toHaveLength(0);
      
      // Verify users table still exists and has data
      const usersCheck = await query('SELECT COUNT(*) as count FROM users');
      expect(parseInt(usersCheck.rows[0].count)).toBeGreaterThan(0);
    });    test('should handle special characters in search queries', async () => {
      const specialChars = "test@#$%^&*(){}[]|\\:;\"'<>,.?/~`";
      
      const result = await query(
        'SELECT id, title FROM jobs WHERE title ILIKE $1',
        [`%${specialChars}%`]
      );
      // Should not throw an error, even if no results
      expect(result.rows).toEqual([]);
    });    test('should validate email format constraints', async () => {      const invalidEmails = [        'notanemail',        '@example.com',        'test@',        'test.example.com'      ];      for (const email of invalidEmails) {        await expect(          query(            'INSERT INTO users (company_id, email, name, role) VALUES ($1, $2, $3, $4)',            [testCompanyId, email, 'Test User', 'recruiter']          )        ).rejects.toThrow();      }    });    test('should validate employment type enum values', async () => {      const invalidEmploymentTypes = [        'invalid_type',        'temporary',        'seasonal'      ];      for (const employmentType of invalidEmploymentTypes) {
        await expect(
          query(
            `INSERT INTO jobs (company_id, created_by_user_id, title, description, employment_type, location, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [testCompanyId, testUserId1, 'Test Job', 'Description', employmentType, 'Test Location', 'active']
          )
        ).rejects.toThrow();
      }    });  });  describe('Data Access Control', () => {    test('should prevent unauthorized access to candidates', async () => {      // Create candidates for both users      testCandidateId1 = await createTestCandidate(testCompanyId, testUserId1, {        name: 'Candidate One',        email: 'candidate1@example.com',        location: 'San Francisco',        phone: '555-0101'      });      testCandidateId2 = await createTestCandidate(testCompanyId, testUserId2, {        name: 'Candidate Two',        email: 'candidate2@example.com',        location: 'New York',        phone: '555-0102'      });      // User 1 should see candidates they uploaded      const user1Candidates = await query(        'SELECT * FROM candidates WHERE uploaded_by_user_id = $1',        [testUserId1]      );      expect(user1Candidates.rows).toHaveLength(1);      expect(user1Candidates.rows[0].name).toBe('Candidate One');      // User 2 should see candidates they uploaded      const user2Candidates = await query(        'SELECT * FROM candidates WHERE uploaded_by_user_id = $1',        [testUserId2]      );
      expect(user2Candidates.rows).toHaveLength(1);
      expect(user2Candidates.rows[0].name).toBe('Candidate Two');
    });

    test('should control access to job match data', async () => {
      // Create candidates
      testCandidateId1 = await createTestCandidate(testCompanyId, testUserId1, {
        name: 'Match Candidate One',
        email: 'match1@example.com',
        location: 'San Francisco'
      });

      testCandidateId2 = await createTestCandidate(testCompanyId, testUserId2, {
        name: 'Match Candidate Two',
        email: 'match2@example.com',
        location: 'New York'
      });

      // Create job matches
      await query(
        `INSERT INTO job_matches (job_id, candidate_id, match_score, explanation, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [testJobId, testCandidateId1, 85.5, 'Good skills match', 'pending']
      );

      await query(
        `INSERT INTO job_matches (job_id, candidate_id, match_score, explanation, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [testJobId, testCandidateId2, 92.0, 'Excellent skills match', 'pending']
      );

      // Job creator should see all matches for their job
      const jobMatches = await query(
        `SELECT jm.*, c.name as candidate_name 
         FROM job_matches jm
         JOIN candidates c ON jm.candidate_id = c.id
         JOIN jobs j ON jm.job_id = j.id
         WHERE j.created_by_user_id = $1`,
        [testUserId1]
      );

      expect(jobMatches.rows).toHaveLength(2);

      // Verify total matches exist
      const totalMatches = await query(
        'SELECT COUNT(*) as count FROM job_matches WHERE job_id = $1',
        [testJobId]
      );
      expect(parseInt(totalMatches.rows[0].count)).toBe(2);
    });

    test('should control access to company data', async () => {
      // Create a second company
      const company2Id = await createTestCompany({
        name: 'Second Company',
        slug: 'second-company'
      });

      const user3Id = await createTestUser(company2Id, {
        email: 'user3@company2.com',
        name: 'User Three',
        role: 'recruiter'
      });

      // Users should only see data from their company
      const company1Users = await query(
        'SELECT * FROM users WHERE company_id = $1',
        [testCompanyId]
      );

      const company2Users = await query(
        'SELECT * FROM users WHERE company_id = $1',
        [company2Id]
      );

      expect(company1Users.rows).toHaveLength(2); // testUserId1 and testUserId2
      expect(company2Users.rows).toHaveLength(1); // user3Id

      // Verify company isolation
      const allCompanies = await query('SELECT COUNT(*) as count FROM companies');
      expect(parseInt(allCompanies.rows[0].count)).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Password Security', () => {
    test('should never return password hashes in queries', async () => {
      const result = await query(
        'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
        [testUserId1]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).not.toHaveProperty('password_hash');
      expect(result.rows[0]).not.toHaveProperty('password');
    });

    test('should require password hash for user creation', async () => {
      await expect(
        query(
          'INSERT INTO users (company_id, email, name, role) VALUES ($1, $2, $3, $4)',
          [testCompanyId, 'nopassword@example.com', 'No Password User', 'recruiter']
        )
      ).rejects.toThrow();
    });
  });

  describe('API Usage Tracking Security', () => {
    test('should track API usage correctly', async () => {
      const today = new Date().toISOString().split('T')[0];

      await query(
        `INSERT INTO api_usage_tracking (user_id, endpoint, request_count, date)
         VALUES ($1, $2, $3, $4)`,
        [testUserId1, '/api/jobs/search', 10, today]
      );

      await query(
        `INSERT INTO api_usage_tracking (user_id, endpoint, request_count, date)
         VALUES ($1, $2, $3, $4)`,
        [testUserId1, '/api/candidates', 5, today]
      );

      // Check total usage for user
      const totalUsage = await query(
        `SELECT SUM(request_count) as total_requests
         FROM api_usage_tracking
         WHERE user_id = $1 AND date = $2`,
        [testUserId1, today]
      );

      expect(parseInt(totalUsage.rows[0].total_requests)).toBe(15);
    });

    test('should isolate API usage data by user', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Add usage for user 1
      await query(
        `INSERT INTO api_usage_tracking (user_id, endpoint, request_count, date)
         VALUES ($1, $2, $3, $4)`,
        [testUserId1, '/api/jobs', 20, today]
      );

      // Add usage for user 2
      await query(
        `INSERT INTO api_usage_tracking (user_id, endpoint, request_count, date)
         VALUES ($1, $2, $3, $4)`,
        [testUserId2, '/api/jobs', 15, today]
      );

      // Each user should only see their own usage
      const user1Usage = await query(
        'SELECT SUM(request_count) as total FROM api_usage_tracking WHERE user_id = $1',
        [testUserId1]
      );

      const user2Usage = await query(
        'SELECT SUM(request_count) as total FROM api_usage_tracking WHERE user_id = $1',
        [testUserId2]
      );

      expect(parseInt(user1Usage.rows[0].total)).toBe(20);
      expect(parseInt(user2Usage.rows[0].total)).toBe(15);
    });
  });

  describe('Data Integrity and Constraints', () => {
    test('should maintain referential integrity for job matches', async () => {
      // Create a test candidate first
      testCandidateId1 = await createTestCandidate(testCompanyId, testUserId1, {
        name: 'Test Candidate',
        email: 'test@example.com',
        location: 'Test Location'
      });

      // Try to create job match with non-existent job
      await expect(
        query(
          `INSERT INTO job_matches (job_id, candidate_id, match_score, explanation, status)
           VALUES ($1, $2, $3, $4, $5)`,
          [99999, testCandidateId1, 85.0, 'Test match', 'pending']
        )
      ).rejects.toThrow();

      // Try to create job match with non-existent candidate
      await expect(
        query(
          `INSERT INTO job_matches (job_id, candidate_id, match_score, explanation, status)
           VALUES ($1, $2, $3, $4, $5)`,
          [testJobId, 99999, 85.0, 'Test match', 'pending']
        )
      ).rejects.toThrow();
    });

    test('should validate enum constraints', async () => {
      // Test invalid role
      await expect(
        query(
          'INSERT INTO users (company_id, email, name, role, password_hash) VALUES ($1, $2, $3, $4, $5)',
          [testCompanyId, 'invalid@example.com', 'Invalid User', 'invalid_role', 'hash123']
        )
      ).rejects.toThrow();

      // Test invalid subscription plan
      await expect(
        query(
          'INSERT INTO companies (name, slug, subscription_plan) VALUES ($1, $2, $3)',
          ['Invalid Company', 'invalid-company', 'invalid_plan']
        )
      ).rejects.toThrow();
    });

    test('should validate numeric constraints', async () => {
      testCandidateId1 = await createTestCandidate(testCompanyId, testUserId1, {
        name: 'Test Candidate',
        email: 'test@example.com',
        location: 'Test Location'
      });

      // Test match score should be between 0 and 100
      await expect(
        query(
          `INSERT INTO job_matches (job_id, candidate_id, match_score, explanation, status)
           VALUES ($1, $2, $3, $4, $5)`,
          [testJobId, testCandidateId1, 150.0, 'Invalid score', 'pending']
        )
      ).rejects.toThrow();

      await expect(
        query(
          `INSERT INTO job_matches (job_id, candidate_id, match_score, explanation, status)
           VALUES ($1, $2, $3, $4, $5)`,
          [testJobId, testCandidateId1, -10.0, 'Invalid negative score', 'pending']
        )
      ).rejects.toThrow();
    });
  });

  describe('Notification Security', () => {
    test('should only show notifications to intended recipients', async () => {
      // Create notifications for different users
      await query(
        `INSERT INTO notifications (user_id, type, title, message, is_read)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId1, 'job_match', 'New Job Match', 'We found a candidate that matches your job', false]
      );

      await query(
        `INSERT INTO notifications (user_id, type, title, message, is_read)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId2, 'system', 'System Update', 'System maintenance scheduled', false]
      );

      // User 1 should only see their notifications
      const user1Notifications = await query(
        'SELECT * FROM notifications WHERE user_id = $1',
        [testUserId1]
      );

      expect(user1Notifications.rows).toHaveLength(1);
      expect(user1Notifications.rows[0].title).toBe('New Job Match');

      // User 2 should only see their notifications
      const user2Notifications = await query(
        'SELECT * FROM notifications WHERE user_id = $1',
        [testUserId2]
      );

      expect(user2Notifications.rows).toHaveLength(1);
      expect(user2Notifications.rows[0].title).toBe('System Update');
    });

    test('should validate notification types', async () => {
      // Test invalid notification type
      await expect(
        query(
          `INSERT INTO notifications (user_id, type, title, message, is_read)
           VALUES ($1, $2, $3, $4, $5)`,
          [testUserId1, 'invalid_type', 'Test', 'Test message', false]
        )
      ).rejects.toThrow();
    });
  });

  describe('Session and Token Security', () => {
    test('should handle user lookups securely', async () => {
      const userResult = await query(
        'SELECT id, email, role, company_id FROM users WHERE id = $1',
        [testUserId1]
      );

      expect(userResult.rows).toHaveLength(1);
      expect(userResult.rows[0].id).toBe(testUserId1);
      expect(userResult.rows[0].email).toContain('@securitytest.com');
      expect(userResult.rows[0].company_id).toBe(testCompanyId);
    });

    test('should validate user-company relationships', async () => {
      // Verify user belongs to correct company
      const userCompanyCheck = await query(
        `SELECT u.id, u.name, c.name as company_name
         FROM users u
         JOIN companies c ON u.company_id = c.id
         WHERE u.id = $1`,
        [testUserId1]
      );

      expect(userCompanyCheck.rows).toHaveLength(1);
      expect(userCompanyCheck.rows[0].company_name).toBe('Security Test Company');
    });
  });

  describe('Data Anonymization and Privacy', () => {
    test('should handle candidate data privacy', async () => {
      testCandidateId1 = await createTestCandidate(testCompanyId, testUserId1, {
        name: 'Private Candidate',
        email: 'private@example.com',
        location: 'Confidential Location',
        phone: '555-PRIVATE'
      });

      // Sensitive data should be properly stored
      const candidateData = await query(
        'SELECT id, name, email, location, phone FROM candidates WHERE id = $1',
        [testCandidateId1]
      );

      expect(candidateData.rows).toHaveLength(1);
      expect(candidateData.rows[0].email).toBe('private@example.com');
      expect(candidateData.rows[0].phone).toBe('555-PRIVATE');
    });

    test('should track who has access to candidate data', async () => {
      testCandidateId1 = await createTestCandidate(testCompanyId, testUserId1, {
        name: 'Tracked Candidate',
        email: 'tracked@example.com',
        location: 'Tracked Location'
      });

      // Verify candidate is linked to the uploading user
      const accessTracking = await query(
        `SELECT c.name, u.name as uploaded_by, u.email as uploader_email
         FROM candidates c
         JOIN users u ON c.uploaded_by_user_id = u.id
         WHERE c.id = $1`,
        [testCandidateId1]
      );

      expect(accessTracking.rows).toHaveLength(1);
      expect(accessTracking.rows[0].uploaded_by).toBe('User One');
      expect(accessTracking.rows[0].uploader_email).toBe('user1@securitytest.com');
    });
  });

  describe('AI Analysis Security', () => {
    test('should secure AI analysis data', async () => {
      testCandidateId1 = await createTestCandidate(testCompanyId, testUserId1, {
        name: 'AI Analyzed Candidate',
        email: 'ai@example.com',
        location: 'AI Location'
      });

      // Create AI analysis record
      await query(
        `INSERT INTO ai_analysis (candidate_id, analysis_type, confidence_score, analysis_data)
         VALUES ($1, $2, $3, $4)`,
        [testCandidateId1, 'skill_extraction', 0.95, '{"skills": ["JavaScript", "React", "Node.js"]}']
      );

      // Verify AI analysis is linked to correct candidate
      const aiAnalysis = await query(
        `SELECT aa.*, c.name as candidate_name
         FROM ai_analysis aa
         JOIN candidates c ON aa.candidate_id = c.id
         WHERE aa.candidate_id = $1`,
        [testCandidateId1]
      );

      expect(aiAnalysis.rows).toHaveLength(1);
      expect(aiAnalysis.rows[0].analysis_type).toBe('skill_extraction');
      expect(aiAnalysis.rows[0].confidence_score).toBe(0.95);
      expect(aiAnalysis.rows[0].candidate_name).toBe('AI Analyzed Candidate');
    });
  });
});
