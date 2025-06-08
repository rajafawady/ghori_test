const db = require('../helpers/db');

/**
 * Test helper functions for database testing
 */

/**
 * Create a test company
 */
async function createTestCompany(name = 'Test Company', subscription = 'professional') {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const result = await db.query(`
    INSERT INTO companies (name, slug, subscription_plan)
    VALUES ($1, $2, $3)
    RETURNING id
  `, [name, slug, subscription]);
  return result.rows[0].id;
}

/**
 * Create a test user
 */
async function createTestUser(companyId, role = 'admin', name = 'Test User', emailPrefix = 'test') {
  const email = `${emailPrefix}@test-company.test`;
  const result = await db.query(`
    INSERT INTO users (company_id, email, full_name, role, password_hash)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [companyId, email, name, role, 'test_hash_123']);
  return result.rows[0].id;
}

/**
 * Create a test job
 */
async function createTestJob(companyId, title = 'Test Job', description = 'Test job description') {
  const result = await db.query(`
    INSERT INTO jobs (company_id, title, description, skills_required, experience_required)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [companyId, title, description, ['skill1', 'skill2', 'skill3'], '2+ years']);
  return result.rows[0].id;
}

/**
 * Create a test candidate
 */
async function createTestCandidate(companyId, name = 'Test Candidate', emailPrefix = 'candidate') {
  const email = `${emailPrefix}@example.com`;
  const result = await db.query(`
    INSERT INTO candidates (company_id, full_name, email, phone, resume_text, skills, experience_years)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `, [
    companyId, 
    name, 
    email, 
    '555-123-4567',
    'Test resume content with various skills and experience.',
    ['javascript', 'nodejs', 'postgresql'],
    3
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
 * Create a complete test scenario with company, user, job, and candidates
 */
async function createTestScenario() {
  const companyId = await createTestCompany('Test Scenario Company');
  const adminId = await createTestUser(companyId, 'admin', 'Test Admin', 'admin');
  const recruiterId = await createTestUser(companyId, 'recruiter', 'Test Recruiter', 'recruiter');
  const viewerId = await createTestUser(companyId, 'viewer', 'Test Viewer', 'viewer');
  const jobId = await createTestJob(companyId, 'Senior Developer', 'Looking for a senior developer');
  const candidateId1 = await createTestCandidate(companyId, 'John Doe', 'john.doe');
  const candidateId2 = await createTestCandidate(companyId, 'Jane Smith', 'jane.smith');
  
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
  createTestScenario,
  tableExists,
  columnExists,
  indexExists,
  getTableRowCount,
  constraintExists
};
