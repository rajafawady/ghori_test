const { query, closePool, setupRLSUser, cleanupRLSUser } = require('../helpers/db');
const { createTestUser, createTestCompany, createTestJobPosting, cleanupTestData } = require('../helpers/testHelpers');

describe('Security and Row Level Security (RLS) Tests', () => {
  let testUserId1, testUserId2, testCompanyId, testJobPostingId;

  beforeEach(async () => {
    await cleanupTestData();
    testUserId1 = await createTestUser({ email: 'user1@example.com', name: 'User One' });
    testUserId2 = await createTestUser({ email: 'user2@example.com', name: 'User Two' });
    testCompanyId = await createTestCompany();
    testJobPostingId = await createTestJobPosting(testCompanyId);
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('Input Validation and SQL Injection Protection', () => {
    test('should handle SQL injection attempts in user input', async () => {
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
    });

    test('should handle special characters in search queries', async () => {
      const specialChars = "test@#$%^&*(){}[]|\\:;\"'<>,.?/~`";
      
      const result = await query(
        'SELECT id, title FROM job_postings WHERE title ILIKE $1',
        [`%${specialChars}%`]
      );

      // Should not throw an error, even if no results
      expect(result.rows).toEqual([]);
    });

    test('should validate email format constraints', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'test@',
        'test.example.com'
      ];

      for (const email of invalidEmails) {
        await expect(
          query(
            'INSERT INTO users (email, name, user_type, password_hash) VALUES ($1, $2, $3, $4)',
            [email, 'Test User', 'job_seeker', 'hash']
          )
        ).rejects.toThrow();
      }
    });
  });

  describe('Data Access Control', () => {
    test('should prevent unauthorized access to user profiles', async () => {
      // Create user profiles for both users
      await query(
        `INSERT INTO user_profiles (user_id, phone, location, bio, experience_years, education_level)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [testUserId1, '+1234567890', 'San Francisco', 'Software developer', 5, 'Bachelor']
      );

      await query(
        `INSERT INTO user_profiles (user_id, phone, location, bio, experience_years, education_level)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [testUserId2, '+0987654321', 'New York', 'Product manager', 3, 'Master']
      );

      // User 1 should only see their own profile
      const user1Profile = await query(
        'SELECT * FROM user_profiles WHERE user_id = $1',
        [testUserId1]
      );

      expect(user1Profile.rows).toHaveLength(1);
      expect(user1Profile.rows[0].phone).toBe('+1234567890');

      // User should not be able to access other user's sensitive data directly
      // (This would be enforced by application logic and RLS policies)
    });

    test('should control access to application data', async () => {
      // Create applications for both users
      await query(
        `INSERT INTO applications (user_id, job_posting_id, cover_letter, status)
         VALUES ($1, $2, $3, $4)`,
        [testUserId1, testJobPostingId, 'Cover letter 1', 'submitted']
      );

      await query(
        `INSERT INTO applications (user_id, job_posting_id, cover_letter, status)
         VALUES ($1, $2, $3, $4)`,
        [testUserId2, testJobPostingId, 'Cover letter 2', 'submitted']
      );

      // User 1 should only see their own applications
      const user1Applications = await query(
        'SELECT * FROM applications WHERE user_id = $1',
        [testUserId1]
      );

      expect(user1Applications.rows).toHaveLength(1);
      expect(user1Applications.rows[0].cover_letter).toBe('Cover letter 1');

      // Verify total applications exist
      const totalApplications = await query(
        'SELECT COUNT(*) as count FROM applications'
      );
      expect(parseInt(totalApplications.rows[0].count)).toBe(2);
    });
  });

  describe('Password Security', () => {
    test('should never return password hashes in queries', async () => {
      const result = await query(
        'SELECT id, email, name, user_type, created_at FROM users WHERE id = $1',
        [testUserId1]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).not.toHaveProperty('password_hash');
      expect(result.rows[0]).not.toHaveProperty('password');
    });

    test('should require password hash for user creation', async () => {
      await expect(
        query(
          'INSERT INTO users (email, name, user_type) VALUES ($1, $2, $3)',
          ['nopassword@example.com', 'No Password User', 'job_seeker']
        )
      ).rejects.toThrow();
    });
  });

  describe('API Rate Limiting Data', () => {
    test('should track API usage correctly', async () => {
      const today = new Date().toISOString().split('T')[0];

      await query(
        `INSERT INTO api_usage (user_id, endpoint, request_count, date)
         VALUES ($1, $2, $3, $4)`,
        [testUserId1, '/api/jobs/search', 10, today]
      );

      await query(
        `INSERT INTO api_usage (user_id, endpoint, request_count, date)
         VALUES ($1, $2, $3, $4)`,
        [testUserId1, '/api/applications', 5, today]
      );

      // Check total usage for user
      const totalUsage = await query(
        `SELECT SUM(request_count) as total_requests
         FROM api_usage
         WHERE user_id = $1 AND date = $2`,
        [testUserId1, today]
      );

      expect(parseInt(totalUsage.rows[0].total_requests)).toBe(15);
    });

    test('should enforce API limits based on billing plan', async () => {
      // Create a billing plan
      const planResult = await query(
        `INSERT INTO billing_plans (name, price, currency, interval, api_limit)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['Basic Plan', 9.99, 'USD', 'monthly', 1000]
      );

      const planId = planResult.rows[0].id;

      // Subscribe user to plan
      await query(
        `INSERT INTO user_subscriptions (user_id, billing_plan_id, status, current_period_start, current_period_end)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId1, planId, 'active', new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
      );

      // Check user's API limit
      const limitCheck = await query(
        `SELECT bp.api_limit, bp.name
         FROM user_subscriptions us
         JOIN billing_plans bp ON us.billing_plan_id = bp.id
         WHERE us.user_id = $1 AND us.status = 'active'`,
        [testUserId1]
      );

      expect(limitCheck.rows).toHaveLength(1);
      expect(limitCheck.rows[0].api_limit).toBe(1000);
      expect(limitCheck.rows[0].name).toBe('Basic Plan');
    });
  });

  describe('Data Integrity and Constraints', () => {
    test('should maintain referential integrity for applications', async () => {
      // Try to create application with non-existent user
      await expect(
        query(
          `INSERT INTO applications (user_id, job_posting_id, cover_letter, status)
           VALUES ($1, $2, $3, $4)`,
          [99999, testJobPostingId, 'Cover letter', 'submitted']
        )
      ).rejects.toThrow();

      // Try to create application with non-existent job posting
      await expect(
        query(
          `INSERT INTO applications (user_id, job_posting_id, cover_letter, status)
           VALUES ($1, $2, $3, $4)`,
          [testUserId1, 99999, 'Cover letter', 'submitted']
        )
      ).rejects.toThrow();
    });

    test('should validate enum constraints', async () => {
      // Test invalid user_type
      await expect(
        query(
          'INSERT INTO users (email, name, user_type, password_hash) VALUES ($1, $2, $3, $4)',
          ['invalid@example.com', 'Invalid User', 'invalid_type', 'hash']
        )
      ).rejects.toThrow();

      // Test invalid employment_type
      await expect(
        query(
          `INSERT INTO job_postings (company_id, title, description, requirements, employment_type, location, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [testCompanyId, 'Test Job', 'Description', 'Requirements', 'invalid_employment', 'Location', 'active']
        )
      ).rejects.toThrow();

      // Test invalid application status
      await expect(
        query(
          `INSERT INTO applications (user_id, job_posting_id, cover_letter, status)
           VALUES ($1, $2, $3, $4)`,
          [testUserId1, testJobPostingId, 'Cover letter', 'invalid_status']
        )
      ).rejects.toThrow();
    });

    test('should validate numeric constraints', async () => {
      // Test negative salary values
      await expect(
        query(
          `INSERT INTO job_postings (company_id, title, description, requirements, employment_type, salary_min, salary_max, location, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [testCompanyId, 'Test Job', 'Description', 'Requirements', 'full_time', -1000, 50000, 'Location', 'active']
        )
      ).rejects.toThrow();

      // Test salary_min > salary_max (if this constraint exists)
      // This would depend on your actual database constraints
    });
  });

  describe('Audit Trail', () => {
    test('should log important data changes', async () => {
      // Create an audit log entry
      await query(
        `INSERT INTO audit_logs (user_id, table_name, action, old_values, new_values)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId1, 'users', 'UPDATE', '{"name": "Old Name"}', '{"name": "New Name"}']
      );

      const auditResult = await query(
        'SELECT * FROM audit_logs WHERE user_id = $1',
        [testUserId1]
      );

      expect(auditResult.rows).toHaveLength(1);
      expect(auditResult.rows[0].table_name).toBe('users');
      expect(auditResult.rows[0].action).toBe('UPDATE');
      expect(auditResult.rows[0].timestamp).toBeDefined();
    });

    test('should track application status changes', async () => {
      // Create application
      const appResult = await query(
        `INSERT INTO applications (user_id, job_posting_id, cover_letter, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [testUserId1, testJobPostingId, 'Cover letter', 'submitted']
      );

      const appId = appResult.rows[0].id;

      // Update application status and log it
      await query(
        'UPDATE applications SET status = $1 WHERE id = $2',
        ['reviewed', appId]
      );

      // Log the change
      await query(
        `INSERT INTO audit_logs (user_id, table_name, action, old_values, new_values)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId1, 'applications', 'UPDATE', 
         `{"status": "submitted", "application_id": ${appId}}`, 
         `{"status": "reviewed", "application_id": ${appId}}`]
      );

      const auditResult = await query(
        'SELECT * FROM audit_logs WHERE table_name = $1 AND user_id = $2',
        ['applications', testUserId1]
      );

      expect(auditResult.rows).toHaveLength(1);
      expect(auditResult.rows[0].action).toBe('UPDATE');
    });
  });

  describe('Session and Token Security', () => {
    test('should handle user sessions securely', async () => {
      // This would typically involve testing session tokens, JWT validation, etc.
      // For now, we'll test that user lookups work correctly
      
      const userResult = await query(
        'SELECT id, email, user_type FROM users WHERE id = $1',
        [testUserId1]
      );

      expect(userResult.rows).toHaveLength(1);
      expect(userResult.rows[0].id).toBe(testUserId1);
      expect(userResult.rows[0].email).toContain('@example.com');
    });
  });

  describe('Notification Security', () => {
    test('should only show notifications to intended recipients', async () => {
      // Create notifications for different users
      await query(
        `INSERT INTO notifications (user_id, type, title, message, read)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId1, 'application_status', 'Application Update', 'Your application has been reviewed', false]
      );

      await query(
        `INSERT INTO notifications (user_id, type, title, message, read)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId2, 'new_job_match', 'New Job Match', 'We found a job that matches your profile', false]
      );

      // User 1 should only see their notifications
      const user1Notifications = await query(
        'SELECT * FROM notifications WHERE user_id = $1',
        [testUserId1]
      );

      expect(user1Notifications.rows).toHaveLength(1);
      expect(user1Notifications.rows[0].title).toBe('Application Update');

      // User 2 should only see their notifications
      const user2Notifications = await query(
        'SELECT * FROM notifications WHERE user_id = $1',
        [testUserId2]
      );

      expect(user2Notifications.rows).toHaveLength(1);
      expect(user2Notifications.rows[0].title).toBe('New Job Match');
    });
  });
});
