const { query, closePool } = require('../helpers/db');
const { 
  createTestUser, 
  createTestCompany, 
  createTestJob, 
  createTestCandidate, 
  createTestJobMatch,
  cleanupAllTestData 
} = require('../helpers/testHelpers');

describe('CRUD Operations Tests', () => {
  let testCompanyId, testUserId, testJobId, testCandidateId, testJobMatchId;

  beforeEach(async () => {
    // Clean up any existing test data
    await cleanupAllTestData();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupAllTestData();
  });

  afterAll(async () => {
    await closePool();
  });

  describe('Companies CRUD', () => {
    test('should create a new company', async () => {
      const companyData = {
        name: 'Test CRUD Company',
        slug: 'test-crud-company',
        subscription_plan: 'professional',
        max_users: 20,
        max_jobs_per_month: 50
      };

      const result = await query(
        `INSERT INTO companies (name, slug, subscription_plan, max_users, max_jobs_per_month)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, slug, subscription_plan, max_users, max_jobs_per_month, is_active`,
        [companyData.name, companyData.slug, companyData.subscription_plan, companyData.max_users, companyData.max_jobs_per_month]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe(companyData.name);
      expect(result.rows[0].slug).toBe(companyData.slug);
      expect(result.rows[0].subscription_plan).toBe(companyData.subscription_plan);
      expect(result.rows[0].max_users).toBe(companyData.max_users);
      expect(result.rows[0].max_jobs_per_month).toBe(companyData.max_jobs_per_month);
      expect(result.rows[0].is_active).toBe(true);
      expect(result.rows[0].id).toBeDefined();

      testCompanyId = result.rows[0].id;
    });

    test('should read company by id', async () => {
      testCompanyId = await createTestCompany();

      const result = await query(
        'SELECT id, name, slug, subscription_plan, is_active FROM companies WHERE id = $1',
        [testCompanyId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe(testCompanyId);
      expect(result.rows[0].name).toContain('Test');
      expect(result.rows[0].is_active).toBe(true);
    });

    test('should update company information', async () => {
      testCompanyId = await createTestCompany();

      const updatedPlan = 'enterprise';
      const result = await query(
        'UPDATE companies SET subscription_plan = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING subscription_plan, updated_at',
        [updatedPlan, testCompanyId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].subscription_plan).toBe(updatedPlan);
      expect(result.rows[0].updated_at).toBeDefined();
    });

    test('should delete company', async () => {
      testCompanyId = await createTestCompany();

      const deleteResult = await query(
        'DELETE FROM companies WHERE id = $1',
        [testCompanyId]
      );

      expect(deleteResult.rowCount).toBe(1);

      // Verify company is deleted
      const selectResult = await query(
        'SELECT id FROM companies WHERE id = $1',
        [testCompanyId]
      );

      expect(selectResult.rows).toHaveLength(0);
    });

    test('should not allow duplicate slugs', async () => {
      const slug = 'duplicate-test-company';
      
      // Create first company
      await query(
        `INSERT INTO companies (name, slug, subscription_plan)
         VALUES ($1, $2, $3)`,
        ['Company 1', slug, 'starter']
      );

      // Try to create second company with same slug
      await expect(
        query(
          `INSERT INTO companies (name, slug, subscription_plan)
           VALUES ($1, $2, $3)`,
          ['Company 2', slug, 'professional']
        )
      ).rejects.toThrow();
    });
  });

  describe('Users CRUD', () => {
    beforeEach(async () => {
      testCompanyId = await createTestCompany();
    });

    test('should create a new user', async () => {
      const userData = {
        company_id: testCompanyId,
        email: 'test-crud@example.com',
        name: 'Test CRUD User',
        user_type: 'employer',
        password_hash: 'hashed_password_123'
      };

      const result = await query(
        `INSERT INTO users (company_id, email, name, user_type, password_hash)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, name, user_type, is_active`,
        [userData.company_id, userData.email, userData.name, userData.user_type, userData.password_hash]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].email).toBe(userData.email);
      expect(result.rows[0].name).toBe(userData.name);
      expect(result.rows[0].user_type).toBe(userData.user_type);
      expect(result.rows[0].is_active).toBe(true);
      expect(result.rows[0].id).toBeDefined();

      testUserId = result.rows[0].id;
    });

    test('should read user by id', async () => {
      testUserId = await createTestUser(testCompanyId);

      const result = await query(
        'SELECT id, email, name, user_type FROM users WHERE id = $1',
        [testUserId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe(testUserId);
      expect(result.rows[0].email).toContain('@example.com');
    });

    test('should update user information', async () => {
      testUserId = await createTestUser(testCompanyId);

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
      testUserId = await createTestUser(testCompanyId);

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
        `INSERT INTO users (company_id, email, name, user_type, password_hash)
         VALUES ($1, $2, $3, $4, $5)`,
        [testCompanyId, email, 'User 1', 'job_seeker', 'hash1']
      );

      // Try to create second user with same email
      await expect(
        query(
          `INSERT INTO users (company_id, email, name, user_type, password_hash)
           VALUES ($1, $2, $3, $4, $5)`,
          [testCompanyId, email, 'User 2', 'employer', 'hash2']
        )
      ).rejects.toThrow();
    });
  });

  describe('Jobs CRUD', () => {
    beforeEach(async () => {
      testCompanyId = await createTestCompany();
      testUserId = await createTestUser(testCompanyId);
    });

    test('should create a new job', async () => {
      const jobData = {
        company_id: testCompanyId,
        created_by_user_id: testUserId,
        title: 'Senior Software Engineer',
        description: 'We are looking for a talented software engineer...',
        requirements: 'Bachelor\'s degree in Computer Science, 5+ years experience',
        employment_type: 'full_time',
        salary_min: 100000,
        salary_max: 150000,
        location: 'San Francisco, CA',
        required_skills: ['JavaScript', 'Node.js', 'React'],
        status: 'active'
      };

      const result = await query(
        `INSERT INTO jobs (company_id, created_by_user_id, title, description, requirements, 
                          employment_type, salary_min, salary_max, location, required_skills, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, title, salary_min, salary_max, status, required_skills`,
        [jobData.company_id, jobData.created_by_user_id, jobData.title, jobData.description, 
         jobData.requirements, jobData.employment_type, jobData.salary_min, jobData.salary_max, 
         jobData.location, jobData.required_skills, jobData.status]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].title).toBe(jobData.title);
      expect(result.rows[0].salary_min).toBe(jobData.salary_min);
      expect(result.rows[0].salary_max).toBe(jobData.salary_max);
      expect(result.rows[0].status).toBe(jobData.status);
      expect(result.rows[0].required_skills).toEqual(jobData.required_skills);

      testJobId = result.rows[0].id;
    });

    test('should read job by id', async () => {
      testJobId = await createTestJob(testCompanyId, testUserId);

      const result = await query(
        'SELECT id, title, employment_type, status FROM jobs WHERE id = $1',
        [testJobId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe(testJobId);
      expect(result.rows[0].title).toContain('Test');
      expect(result.rows[0].status).toBe('active');
    });

    test('should filter jobs by salary range', async () => {
      testJobId = await createTestJob(testCompanyId, testUserId);

      const result = await query(
        'SELECT id, title, salary_min, salary_max FROM jobs WHERE salary_min >= $1 AND salary_max <= $2',
        [60000, 120000]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      result.rows.forEach(job => {
        expect(job.salary_min).toBeGreaterThanOrEqual(60000);
        expect(job.salary_max).toBeLessThanOrEqual(120000);
      });
    });

    test('should filter jobs by employment type', async () => {
      testJobId = await createTestJob(testCompanyId, testUserId);

      const result = await query(
        'SELECT id, title, employment_type FROM jobs WHERE employment_type = $1',
        ['full_time']
      );

      expect(result.rows.length).toBeGreaterThan(0);
      result.rows.forEach(job => {
        expect(job.employment_type).toBe('full_time');
      });
    });

    test('should update job status', async () => {
      testJobId = await createTestJob(testCompanyId, testUserId);

      const result = await query(
        'UPDATE jobs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING status, updated_at',
        ['closed', testJobId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].status).toBe('closed');
      expect(result.rows[0].updated_at).toBeDefined();
    });
  });

  describe('Candidates CRUD', () => {
    beforeEach(async () => {
      testCompanyId = await createTestCompany();
      testUserId = await createTestUser(testCompanyId);
    });

    test('should create a new candidate', async () => {
      const candidateData = {
        company_id: testCompanyId,
        uploaded_by_user_id: testUserId,
        name: 'John Test Candidate',
        email: 'john.candidate@example.com',
        phone: '+1-555-0123',
        cv_file_path: '/uploads/cv/john_candidate_cv.pdf',
        top_skills: ['Python', 'Machine Learning', 'SQL'],
        desired_position: 'Data Scientist',
        desired_salary: 85000
      };

      const result = await query(
        `INSERT INTO candidates (company_id, uploaded_by_user_id, name, email, phone, 
                               cv_file_path, top_skills, desired_position, desired_salary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, name, email, top_skills, desired_position`,
        [candidateData.company_id, candidateData.uploaded_by_user_id, candidateData.name, 
         candidateData.email, candidateData.phone, candidateData.cv_file_path, 
         candidateData.top_skills, candidateData.desired_position, candidateData.desired_salary]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe(candidateData.name);
      expect(result.rows[0].email).toBe(candidateData.email);
      expect(result.rows[0].top_skills).toEqual(candidateData.top_skills);
      expect(result.rows[0].desired_position).toBe(candidateData.desired_position);

      testCandidateId = result.rows[0].id;
    });

    test('should read candidate by id', async () => {
      testCandidateId = await createTestCandidate(testCompanyId, testUserId);

      const result = await query(
        'SELECT id, name, email, top_skills FROM candidates WHERE id = $1',
        [testCandidateId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe(testCandidateId);
      expect(result.rows[0].name).toContain('Test');
      expect(result.rows[0].email).toContain('@example.com');
      expect(Array.isArray(result.rows[0].top_skills)).toBe(true);
    });

    test('should filter candidates by skills', async () => {
      testCandidateId = await createTestCandidate(testCompanyId, testUserId);

      const result = await query(
        'SELECT id, name, top_skills FROM candidates WHERE $1 = ANY(top_skills)',
        ['JavaScript']
      );

      expect(result.rows.length).toBeGreaterThan(0);
      result.rows.forEach(candidate => {
        expect(candidate.top_skills).toContain('JavaScript');
      });
    });

    test('should update candidate information', async () => {
      testCandidateId = await createTestCandidate(testCompanyId, testUserId);

      const updatedSalary = 95000;
      const result = await query(
        'UPDATE candidates SET desired_salary = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING desired_salary, updated_at',
        [updatedSalary, testCandidateId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].desired_salary).toBe(updatedSalary);
      expect(result.rows[0].updated_at).toBeDefined();
    });
  });

  describe('Job Matches CRUD', () => {
    beforeEach(async () => {
      testCompanyId = await createTestCompany();
      testUserId = await createTestUser(testCompanyId);
      testJobId = await createTestJob(testCompanyId, testUserId);
      testCandidateId = await createTestCandidate(testCompanyId, testUserId);
    });

    test('should create job match', async () => {
      const matchData = {
        job_id: testJobId,
        candidate_id: testCandidateId,
        match_score: 87.5,
        skills_match_score: 90.0,
        experience_match_score: 85.0,
        status: 'pending'
      };

      const result = await query(
        `INSERT INTO job_matches (job_id, candidate_id, match_score, skills_match_score, experience_match_score, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, match_score, status, created_at`,
        [matchData.job_id, matchData.candidate_id, matchData.match_score, 
         matchData.skills_match_score, matchData.experience_match_score, matchData.status]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].match_score).toBe(matchData.match_score);
      expect(result.rows[0].status).toBe(matchData.status);
      expect(result.rows[0].created_at).toBeDefined();

      testJobMatchId = result.rows[0].id;
    });

    test('should get top matches for job', async () => {
      // Create job match
      await query(
        `INSERT INTO job_matches (job_id, candidate_id, match_score, skills_match_score, experience_match_score, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [testJobId, testCandidateId, 87.5, 90.0, 85.0, 'pending']
      );

      const result = await query(
        `SELECT jm.match_score, c.name, c.email, c.desired_position
         FROM job_matches jm
         JOIN candidates c ON jm.candidate_id = c.id
         WHERE jm.job_id = $1
         ORDER BY jm.match_score DESC
         LIMIT 10`,
        [testJobId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].match_score).toBe(87.5);
      expect(result.rows[0].name).toBeDefined();
      expect(result.rows[0].email).toBeDefined();

      // Verify results are ordered by score descending
      for (let i = 1; i < result.rows.length; i++) {
        expect(result.rows[i-1].match_score).toBeGreaterThanOrEqual(result.rows[i].match_score);
      }
    });

    test('should update match status', async () => {
      // Create job match
      const createResult = await query(
        `INSERT INTO job_matches (job_id, candidate_id, match_score, skills_match_score, experience_match_score, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [testJobId, testCandidateId, 87.5, 90.0, 85.0, 'pending']
      );

      const matchId = createResult.rows[0].id;

      // Update status
      const updateResult = await query(
        'UPDATE job_matches SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING status, updated_at',
        ['reviewed', matchId]
      );

      expect(updateResult.rows).toHaveLength(1);
      expect(updateResult.rows[0].status).toBe('reviewed');
      expect(updateResult.rows[0].updated_at).toBeDefined();
    });

    test('should filter matches by minimum score', async () => {
      // Create job match
      await query(
        `INSERT INTO job_matches (job_id, candidate_id, match_score, skills_match_score, experience_match_score, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [testJobId, testCandidateId, 87.5, 90.0, 85.0, 'pending']
      );

      const result = await query(
        'SELECT id, match_score FROM job_matches WHERE match_score >= $1',
        [80.0]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      result.rows.forEach(match => {
        expect(match.match_score).toBeGreaterThanOrEqual(80.0);
      });
    });
  });

  describe('Complex Query Tests', () => {
    beforeEach(async () => {
      testCompanyId = await createTestCompany();
      testUserId = await createTestUser(testCompanyId);
      testJobId = await createTestJob(testCompanyId, testUserId);
      testCandidateId = await createTestCandidate(testCompanyId, testUserId);
    });

    test('should get job details with company information', async () => {
      const result = await query(
        `SELECT j.id, j.title, j.employment_type, j.salary_min, j.salary_max,
                c.name as company_name, c.subscription_plan
         FROM jobs j
         JOIN companies c ON j.company_id = c.id
         WHERE j.id = $1`,
        [testJobId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].title).toContain('Test');
      expect(result.rows[0].company_name).toContain('Test');
      expect(result.rows[0].subscription_plan).toBeDefined();
    });

    test('should get candidate matches with job and company details', async () => {
      // Create job match
      await query(
        `INSERT INTO job_matches (job_id, candidate_id, match_score, status)
         VALUES ($1, $2, $3, $4)`,
        [testJobId, testCandidateId, 85.0, 'pending']
      );

      const result = await query(
        `SELECT jm.match_score, c.name as candidate_name, j.title as job_title, 
                comp.name as company_name
         FROM job_matches jm
         JOIN candidates c ON jm.candidate_id = c.id
         JOIN jobs j ON jm.job_id = j.id
         JOIN companies comp ON j.company_id = comp.id
         WHERE jm.candidate_id = $1`,
        [testCandidateId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].match_score).toBe(85.0);
      expect(result.rows[0].candidate_name).toContain('Test');
      expect(result.rows[0].job_title).toContain('Test');
      expect(result.rows[0].company_name).toContain('Test');
    });

    test('should count active jobs by company', async () => {
      const result = await query(
        `SELECT c.name, COUNT(j.id) as active_jobs
         FROM companies c
         LEFT JOIN jobs j ON c.id = j.company_id AND j.status = 'active'
         WHERE c.id = $1
         GROUP BY c.id, c.name`,
        [testCompanyId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toContain('Test');
      expect(result.rows[0].active_jobs).toBeGreaterThanOrEqual(0);
    });
  });
});
