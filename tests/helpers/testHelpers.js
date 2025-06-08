const db = require('../helpers/db');

/**
 * Test helper functions for database testing
 */

/**
 * Create a test company
 */
async function createTestCompany(companyData = {}) {
  const defaultData = {
    name: 'Test Company',
    subscription_plan: 'professional',
    max_users: 10,
    max_jobs_per_month: 25
  };
  
  const data = { ...defaultData, ...companyData };
  const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  const result = await db.query(`
    INSERT INTO companies (name, slug, subscription_plan, max_users, max_jobs_per_month)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [data.name, slug, data.subscription_plan, data.max_users, data.max_jobs_per_month]);
  return result.rows[0].id;
}

/**
 * Create a test user
 */
async function createTestUser(companyId, userData = {}) {
  if (!companyId) {
    companyId = await createTestCompany();
  }
  
  const defaultData = {
    role: 'recruiter',
    name: 'Test User',
    emailPrefix: 'test'
  };
  
  const data = { ...defaultData, ...userData };
  const email = data.email || `${data.emailPrefix}-${Date.now()}@example.com`;
  
  const result = await db.query(`
    INSERT INTO users (company_id, email, name, role, password_hash)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [companyId, email, data.name, data.role, 'test_hash_123']);
  return result.rows[0].id;
}

/**
 * Create a test job
 */
async function createTestJob(companyId, createdByUserId, jobData = {}) {
  if (!companyId) {
    companyId = await createTestCompany();
  }
  if (!createdByUserId) {
    createdByUserId = await createTestUser(companyId);
  }
  
  const defaultData = {
    title: 'Test Job',
    description: 'Test job description',
    requirements: 'Test requirements',
    employment_type: 'full_time',
    salary_min: 70000,
    salary_max: 100000,
    location: 'Test Location',
    required_skills: ['JavaScript', 'Node.js', 'PostgreSQL'],
    status: 'active'
  };
  
  const data = { ...defaultData, ...jobData };
  
  const result = await db.query(`
    INSERT INTO jobs (company_id, created_by_user_id, title, description, requirements, required_skills, employment_type, salary_min, salary_max, location, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id
  `, [companyId, createdByUserId, data.title, data.description, data.requirements, data.required_skills, data.employment_type, data.salary_min, data.salary_max, data.location, data.status]);
  return result.rows[0].id;
}

/**
 * Create a test candidate
 */
async function createTestCandidate(companyId, uploadedByUserId, candidateData = {}) {
  if (!companyId) {
    companyId = await createTestCompany();
  }
  if (!uploadedByUserId) {
    uploadedByUserId = await createTestUser(companyId);
  }
  
  const defaultData = {
    name: 'Test Candidate',
    emailPrefix: 'candidate',
    phone: '555-123-4567',
    location: 'Test Location',
    top_skills: ['JavaScript', 'Node.js', 'PostgreSQL'],
    desired_position: 'Software Engineer',
    desired_salary: 80000
  };
  
  const data = { ...defaultData, ...candidateData };
  const email = data.email || `${data.emailPrefix}-${Date.now()}@example.com`;
  
  const result = await db.query(`
    INSERT INTO candidates (company_id, uploaded_by_user_id, name, email, phone, location, cv_file_path, cv_file_name, cv_text_content, top_skills, desired_position, desired_salary)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id
  `, [
    companyId, 
    uploadedByUserId,
    data.name, 
    email, 
    data.phone,
    data.location,
    '/uploads/test-cv.pdf',
    'test-cv.pdf',
    'Test resume content with various skills and experience.',
    data.top_skills,
    data.desired_position,
    data.desired_salary
  ]);
  return result.rows[0].id;
}

/**
 * Create a test job match
 */
async function createTestJobMatch(companyId, jobId, candidateId, score = 85.5) {
  const result = await db.query(`
    INSERT INTO job_matches (company_id, job_id, candidate_id, match_score, ai_summary)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [companyId, jobId, candidateId, score, 'Test AI summary for the match']);
  return result.rows[0].id;
}

/**
 * Clean up test data for a company
 */
async function cleanupTestData(companyIds = []) {
  if (companyIds.length === 0) return;
  
  const placeholders = companyIds.map((_, i) => `$${i + 1}`).join(',');
  
  // Delete in order to respect foreign key constraints
  await db.query(`DELETE FROM candidate_comments WHERE company_id IN (${placeholders})`, companyIds);
  await db.query(`DELETE FROM candidate_tag_assignments WHERE company_id IN (${placeholders})`, companyIds);
  await db.query(`DELETE FROM candidate_tags WHERE company_id IN (${placeholders})`, companyIds);
  await db.query(`DELETE FROM candidate_statuses WHERE company_id IN (${placeholders})`, companyIds);
  await db.query(`DELETE FROM job_matches WHERE company_id IN (${placeholders})`, companyIds);
  await db.query(`DELETE FROM candidates WHERE company_id IN (${placeholders})`, companyIds);
  await db.query(`DELETE FROM job_match_configs WHERE company_id IN (${placeholders})`, companyIds);
  await db.query(`DELETE FROM jobs WHERE company_id IN (${placeholders})`, companyIds);
  await db.query(`DELETE FROM batch_uploads WHERE company_id IN (${placeholders})`, companyIds);
  await db.query(`DELETE FROM saved_searches WHERE company_id IN (${placeholders})`, companyIds);
  await db.query(`DELETE FROM processing_metrics WHERE company_id IN (${placeholders})`, companyIds);
  await db.query(`DELETE FROM audit_logs WHERE company_id IN (${placeholders})`, companyIds);
  await db.query(`DELETE FROM api_usage WHERE company_id IN (${placeholders})`, companyIds);
  await db.query(`DELETE FROM users WHERE company_id IN (${placeholders})`, companyIds);
  await db.query(`DELETE FROM companies WHERE id IN (${placeholders})`, companyIds);
}

/**
 * Clean up all test data (use with caution)
 */
async function cleanupAllTestData() {
  // Delete all test data in correct order
  await db.query(`DELETE FROM candidate_comments WHERE company_id IN (SELECT id FROM companies WHERE name LIKE '%Test%' OR slug LIKE '%test%')`);
  await db.query(`DELETE FROM candidate_tag_assignments WHERE company_id IN (SELECT id FROM companies WHERE name LIKE '%Test%' OR slug LIKE '%test%')`);
  await db.query(`DELETE FROM candidate_tags WHERE company_id IN (SELECT id FROM companies WHERE name LIKE '%Test%' OR slug LIKE '%test%')`);
  await db.query(`DELETE FROM candidate_statuses WHERE company_id IN (SELECT id FROM companies WHERE name LIKE '%Test%' OR slug LIKE '%test%')`);
  await db.query(`DELETE FROM job_matches WHERE company_id IN (SELECT id FROM companies WHERE name LIKE '%Test%' OR slug LIKE '%test%')`);
  await db.query(`DELETE FROM candidates WHERE company_id IN (SELECT id FROM companies WHERE name LIKE '%Test%' OR slug LIKE '%test%')`);
  await db.query(`DELETE FROM job_match_configs WHERE company_id IN (SELECT id FROM companies WHERE name LIKE '%Test%' OR slug LIKE '%test%')`);
  await db.query(`DELETE FROM jobs WHERE company_id IN (SELECT id FROM companies WHERE name LIKE '%Test%' OR slug LIKE '%test%')`);
  await db.query(`DELETE FROM batch_uploads WHERE company_id IN (SELECT id FROM companies WHERE name LIKE '%Test%' OR slug LIKE '%test%')`);
  await db.query(`DELETE FROM saved_searches WHERE company_id IN (SELECT id FROM companies WHERE name LIKE '%Test%' OR slug LIKE '%test%')`);  await db.query(`DELETE FROM processing_metrics WHERE company_id IN (SELECT id FROM companies WHERE name LIKE '%Test%' OR slug LIKE '%test%')`);
  await db.query(`DELETE FROM audit_logs WHERE company_id IN (SELECT id FROM companies WHERE name LIKE '%Test%' OR slug LIKE '%test%')`);
  await db.query(`DELETE FROM api_usage WHERE company_id IN (SELECT id FROM companies WHERE name LIKE '%Test%' OR slug LIKE '%test%')`);
  await db.query(`DELETE FROM users WHERE company_id IN (SELECT id FROM companies WHERE name LIKE '%Test%' OR slug LIKE '%test%')`);
  await db.query(`DELETE FROM companies WHERE name LIKE '%Test%' OR slug LIKE '%test%'`);
}

/**
 * Create a complete test scenario with company, user, job, and candidates
 */
async function createTestScenario() {
  const companyId = await createTestCompany({ name: 'Test Scenario Company' });
  const adminId = await createTestUser(companyId, { role: 'admin', name: 'Test Admin', emailPrefix: 'admin' });
  const recruiterId = await createTestUser(companyId, { role: 'recruiter', name: 'Test Recruiter', emailPrefix: 'recruiter' });
  const viewerId = await createTestUser(companyId, { role: 'viewer', name: 'Test Viewer', emailPrefix: 'viewer' });
  const jobId = await createTestJob(companyId, recruiterId, { title: 'Senior Developer', description: 'Looking for a senior developer' });
  const candidateId1 = await createTestCandidate(companyId, recruiterId, { name: 'John Doe', emailPrefix: 'john.doe' });
  const candidateId2 = await createTestCandidate(companyId, recruiterId, { name: 'Jane Smith', emailPrefix: 'jane.smith' });
  
  return {
    companyId,
    adminId,
    recruiterId,
    viewerId,
    jobId,
    candidateId1,
    candidateId2
  };
}

/**
 * Check if table exists
 */
async function tableExists(tableName) {
  const result = await db.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    )
  `, [tableName]);
  return result.rows[0].exists;
}

/**
 * Check if column exists in table
 */
async function columnExists(tableName, columnName) {
  const result = await db.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1 
      AND column_name = $2
    )
  `, [tableName, columnName]);
  return result.rows[0].exists;
}

/**
 * Check if index exists
 */
async function indexExists(indexName) {
  const result = await db.query(`
    SELECT EXISTS (
      SELECT FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname = $1
    )
  `, [indexName]);
  return result.rows[0].exists;
}

/**
 * Get table row count
 */
async function getTableRowCount(tableName) {
  const result = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
  return parseInt(result.rows[0].count);
}

/**
 * Check if constraint exists
 */
async function constraintExists(tableName, constraintName) {
  const result = await db.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
      AND table_name = $1 
      AND constraint_name = $2
    )
  `, [tableName, constraintName]);
  return result.rows[0].exists;
}

module.exports = {
  createTestCompany,
  createTestUser,
  createTestJob,
  createTestCandidate,
  createTestJobMatch,
  cleanupTestData,
  cleanupAllTestData,
  createTestScenario,
  tableExists,
  columnExists,
  indexExists,
  getTableRowCount,
  constraintExists
};
