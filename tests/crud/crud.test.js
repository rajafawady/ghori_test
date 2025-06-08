const { query, closePool } = require('../helpers/db');
const { createTestUser, createTestCompany, createTestJobPosting, createTestSkill, cleanupTestData } = require('../helpers/testHelpers');

describe('CRUD Operations Tests', () => {
  let testUserId, testCompanyId, testJobPostingId, testSkillId;

  beforeEach(async () => {
    // Clean up any existing test data
    await cleanupTestData();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });

  describe('Users CRUD', () => {
    test('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        user_type: 'job_seeker',
        password_hash: 'hashed_password'
      };

      const result = await query(
        `INSERT INTO users (email, name, user_type, password_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, name, user_type, created_at`,
        [userData.email, userData.name, userData.user_type, userData.password_hash]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].email).toBe(userData.email);
      expect(result.rows[0].name).toBe(userData.name);
      expect(result.rows[0].user_type).toBe(userData.user_type);
      expect(result.rows[0].id).toBeDefined();
      expect(result.rows[0].created_at).toBeDefined();

      testUserId = result.rows[0].id;
    });

    test('should read user by id', async () => {
      testUserId = await createTestUser();

      const result = await query(
        'SELECT id, email, name, user_type FROM users WHERE id = $1',
        [testUserId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe(testUserId);
      expect(result.rows[0].email).toContain('@example.com');
    });

    test('should update user information', async () => {
      testUserId = await createTestUser();

      const updatedName = 'Updated Test User';
      const result = await query(
        'UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING name, updated_at',
        [updatedName, testUserId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe(updatedName);
      expect(result.rows[0].updated_at).toBeDefined();
    });

    test('should delete user', async () => {
      testUserId = await createTestUser();

      const deleteResult = await query(
        'DELETE FROM users WHERE id = $1',
        [testUserId]
      );

      expect(deleteResult.rowCount).toBe(1);

      // Verify user is deleted
      const selectResult = await query(
        'SELECT id FROM users WHERE id = $1',
        [testUserId]
      );

      expect(selectResult.rows).toHaveLength(0);
    });

    test('should not allow duplicate emails', async () => {
      const email = 'duplicate@example.com';
      
      // Create first user
      await query(
        `INSERT INTO users (email, name, user_type, password_hash)
         VALUES ($1, $2, $3, $4)`,
        [email, 'User 1', 'job_seeker', 'hash1']
      );

      // Try to create second user with same email
      await expect(
        query(
          `INSERT INTO users (email, name, user_type, password_hash)
           VALUES ($1, $2, $3, $4)`,
          [email, 'User 2', 'employer', 'hash2']
        )
      ).rejects.toThrow();
    });
  });

  describe('Companies CRUD', () => {
    test('should create a new company', async () => {
      const companyData = {
        name: 'Test Company',
        description: 'A test company for unit testing',
        website: 'https://testcompany.com',
        industry: 'Technology',
        size: '51-200'
      };

      const result = await query(
        `INSERT INTO companies (name, description, website, industry, size)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, industry, size`,
        [companyData.name, companyData.description, companyData.website, companyData.industry, companyData.size]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe(companyData.name);
      expect(result.rows[0].industry).toBe(companyData.industry);
      expect(result.rows[0].size).toBe(companyData.size);

      testCompanyId = result.rows[0].id;
    });

    test('should read company by id', async () => {
      testCompanyId = await createTestCompany();

      const result = await query(
        'SELECT id, name, industry FROM companies WHERE id = $1',
        [testCompanyId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe(testCompanyId);
      expect(result.rows[0].name).toContain('Test');
    });

    test('should update company information', async () => {
      testCompanyId = await createTestCompany();

      const updatedIndustry = 'Healthcare';
      const result = await query(
        'UPDATE companies SET industry = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING industry',
        [updatedIndustry, testCompanyId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].industry).toBe(updatedIndustry);
    });
  });

  describe('Job Postings CRUD', () => {
    beforeEach(async () => {
      testCompanyId = await createTestCompany();
    });

    test('should create a new job posting', async () => {
      const jobData = {
        company_id: testCompanyId,
        title: 'Software Engineer',
        description: 'We are looking for a talented software engineer...',
        requirements: 'Bachelor\'s degree in Computer Science, 3+ years experience',
        employment_type: 'full_time',
        salary_min: 70000,
        salary_max: 100000,
        location: 'San Francisco, CA',
        status: 'active'
      };

      const result = await query(
        `INSERT INTO job_postings (company_id, title, description, requirements, employment_type, salary_min, salary_max, location, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, title, salary_min, salary_max, status`,
        [jobData.company_id, jobData.title, jobData.description, jobData.requirements, 
         jobData.employment_type, jobData.salary_min, jobData.salary_max, jobData.location, jobData.status]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].title).toBe(jobData.title);
      expect(result.rows[0].salary_min).toBe(jobData.salary_min);
      expect(result.rows[0].salary_max).toBe(jobData.salary_max);
      expect(result.rows[0].status).toBe(jobData.status);

      testJobPostingId = result.rows[0].id;
    });

    test('should filter job postings by salary range', async () => {
      testJobPostingId = await createTestJobPosting(testCompanyId);

      const result = await query(
        'SELECT id, title, salary_min, salary_max FROM job_postings WHERE salary_min >= $1 AND salary_max <= $2',
        [60000, 120000]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      result.rows.forEach(job => {
        expect(job.salary_min).toBeGreaterThanOrEqual(60000);
        expect(job.salary_max).toBeLessThanOrEqual(120000);
      });
    });

    test('should filter job postings by status', async () => {
      testJobPostingId = await createTestJobPosting(testCompanyId);

      const result = await query(
        'SELECT id, title, status FROM job_postings WHERE status = $1',
        ['active']
      );

      expect(result.rows.length).toBeGreaterThan(0);
      result.rows.forEach(job => {
        expect(job.status).toBe('active');
      });
    });
  });

  describe('Applications CRUD', () => {
    beforeEach(async () => {
      testUserId = await createTestUser();
      testCompanyId = await createTestCompany();
      testJobPostingId = await createTestJobPosting(testCompanyId);
    });

    test('should create a new application', async () => {
      const applicationData = {
        user_id: testUserId,
        job_posting_id: testJobPostingId,
        cover_letter: 'I am very interested in this position...',
        status: 'submitted'
      };

      const result = await query(
        `INSERT INTO applications (user_id, job_posting_id, cover_letter, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id, status, applied_at`,
        [applicationData.user_id, applicationData.job_posting_id, applicationData.cover_letter, applicationData.status]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].status).toBe(applicationData.status);
      expect(result.rows[0].applied_at).toBeDefined();
    });

    test('should get applications by user', async () => {
      // Create application
      await query(
        `INSERT INTO applications (user_id, job_posting_id, cover_letter, status)
         VALUES ($1, $2, $3, $4)`,
        [testUserId, testJobPostingId, 'Cover letter', 'submitted']
      );

      const result = await query(
        `SELECT a.id, a.status, jp.title, c.name as company_name
         FROM applications a
         JOIN job_postings jp ON a.job_posting_id = jp.id
         JOIN companies c ON jp.company_id = c.id
         WHERE a.user_id = $1`,
        [testUserId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].status).toBe('submitted');
      expect(result.rows[0].title).toBeDefined();
      expect(result.rows[0].company_name).toBeDefined();
    });

    test('should update application status', async () => {
      // Create application
      const createResult = await query(
        `INSERT INTO applications (user_id, job_posting_id, cover_letter, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [testUserId, testJobPostingId, 'Cover letter', 'submitted']
      );

      const applicationId = createResult.rows[0].id;

      // Update status
      const updateResult = await query(
        'UPDATE applications SET status = $1 WHERE id = $2 RETURNING status',
        ['reviewed', applicationId]
      );

      expect(updateResult.rows).toHaveLength(1);
      expect(updateResult.rows[0].status).toBe('reviewed');
    });
  });

  describe('Skills and Relationships CRUD', () => {
    beforeEach(async () => {
      testUserId = await createTestUser();
      testSkillId = await createTestSkill();
    });

    test('should create a new skill', async () => {
      const skillData = {
        name: 'Node.js',
        category: 'Backend Development',
        description: 'JavaScript runtime for server-side development'
      };

      const result = await query(
        `INSERT INTO skills (name, category, description)
         VALUES ($1, $2, $3)
         RETURNING id, name, category`,
        [skillData.name, skillData.category, skillData.description]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe(skillData.name);
      expect(result.rows[0].category).toBe(skillData.category);
    });

    test('should associate user with skills', async () => {
      const userSkillData = {
        user_id: testUserId,
        skill_id: testSkillId,
        proficiency_level: 'advanced',
        years_of_experience: 3
      };

      const result = await query(
        `INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience)
         VALUES ($1, $2, $3, $4)
         RETURNING id, proficiency_level, years_of_experience`,
        [userSkillData.user_id, userSkillData.skill_id, userSkillData.proficiency_level, userSkillData.years_of_experience]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].proficiency_level).toBe(userSkillData.proficiency_level);
      expect(result.rows[0].years_of_experience).toBe(userSkillData.years_of_experience);
    });

    test('should get user skills with skill details', async () => {
      // Associate user with skill
      await query(
        `INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience)
         VALUES ($1, $2, $3, $4)`,
        [testUserId, testSkillId, 'intermediate', 2]
      );

      const result = await query(
        `SELECT us.proficiency_level, us.years_of_experience, s.name, s.category
         FROM user_skills us
         JOIN skills s ON us.skill_id = s.id
         WHERE us.user_id = $1`,
        [testUserId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].proficiency_level).toBe('intermediate');
      expect(result.rows[0].years_of_experience).toBe(2);
      expect(result.rows[0].name).toBeDefined();
      expect(result.rows[0].category).toBeDefined();
    });
  });

  describe('Matching Scores CRUD', () => {
    beforeEach(async () => {
      testUserId = await createTestUser();
      testCompanyId = await createTestCompany();
      testJobPostingId = await createTestJobPosting(testCompanyId);
    });

    test('should create matching score', async () => {
      const scoreData = {
        user_id: testUserId,
        job_posting_id: testJobPostingId,
        overall_score: 85.5,
        skills_score: 90.0,
        experience_score: 80.0,
        education_score: 75.0
      };

      const result = await query(
        `INSERT INTO matching_scores (user_id, job_posting_id, overall_score, skills_score, experience_score, education_score)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, overall_score, calculated_at`,
        [scoreData.user_id, scoreData.job_posting_id, scoreData.overall_score, 
         scoreData.skills_score, scoreData.experience_score, scoreData.education_score]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].overall_score).toBe(scoreData.overall_score);
      expect(result.rows[0].calculated_at).toBeDefined();
    });

    test('should get top matches for job posting', async () => {
      // Create multiple matching scores
      await query(
        `INSERT INTO matching_scores (user_id, job_posting_id, overall_score, skills_score, experience_score, education_score)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [testUserId, testJobPostingId, 85.5, 90.0, 80.0, 75.0]
      );

      const result = await query(
        `SELECT ms.overall_score, u.name, u.email
         FROM matching_scores ms
         JOIN users u ON ms.user_id = u.id
         WHERE ms.job_posting_id = $1
         ORDER BY ms.overall_score DESC
         LIMIT 10`,
        [testJobPostingId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].overall_score).toBe(85.5);
      expect(result.rows[0].name).toBeDefined();
      expect(result.rows[0].email).toBeDefined();

      // Verify results are ordered by score descending
      for (let i = 1; i < result.rows.length; i++) {
        expect(result.rows[i-1].overall_score).toBeGreaterThanOrEqual(result.rows[i].overall_score);
      }
    });
  });
});
