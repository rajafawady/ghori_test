const { query, closePool } = require('../helpers/db');
const { 
  createTestUser, 
  createTestCompany, 
  createTestJob, 
  createTestCandidate,
  createTestJobMatch,
  cleanupAllTestData 
} = require('../helpers/testHelpers');

describe('Performance Tests', () => {
  let testUserIds = [];
  let testCompanyIds = [];
  let testJobIds = [];
  let testCandidateIds = [];

  beforeAll(async () => {
    // Clean up before performance tests
    await cleanupAllTestData();
  });

  afterAll(async () => {
    // Clean up after performance tests
    await cleanupAllTestData();
    await closePool();
  });

  describe('Database Query Performance', () => {
    test('should handle large user dataset efficiently', async () => {
      const startTime = Date.now();
      const batchSize = 50; // Reduced for better test performance
      
      // Create a test company first
      const companyId = await createTestCompany({
        name: 'Performance Test Company',
        slug: 'performance-test-company'
      });
      testCompanyIds.push(companyId);

      // Create users in batches for better performance
      for (let batch = 0; batch < 2; batch++) {
        const userPromises = [];
        for (let i = 0; i < batchSize; i++) {
          const userIndex = batch * batchSize + i;
          userPromises.push(
            createTestUser(companyId, {
              email: `perftest${userIndex}@example.com`,
              name: `Performance Test User ${userIndex}`
            })
          );
        }
        const batchUserIds = await Promise.all(userPromises);
        testUserIds.push(...batchUserIds);
      }

      const userCreationTime = Date.now() - startTime;
      console.log(`Created ${testUserIds.length} users in ${userCreationTime}ms`);
      
      // Performance should be reasonable (less than 10 seconds for 100 users)
      expect(userCreationTime).toBeLessThan(10000);
      expect(testUserIds).toHaveLength(100);
    });

    test('should query users efficiently with pagination', async () => {
      const pageSize = 25;
      const startTime = Date.now();

      // Test paginated query performance
      const result = await query(`
        SELECT id, email, name, role, created_at
        FROM users
        WHERE role = 'recruiter'
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `, [pageSize, 0]);

      const queryTime = Date.now() - startTime;
      console.log(`Paginated query (${pageSize} records) took ${queryTime}ms`);

      expect(queryTime).toBeLessThan(1000); // Should be under 1 second
      expect(result.rows.length).toBeLessThanOrEqual(pageSize);
    });

    test('should handle complex joins efficiently', async () => {
      // Create test data for join performance
      const companyId = testCompanyIds[0];
      const userId = testUserIds[0];
      
      if (!companyId || !userId) {
        console.log('Skipping test - insufficient test data');
        return;
      }

      const jobId = await createTestJob(companyId, userId, {
        title: 'Performance Test Job',
        description: 'A job for performance testing'
      });
      testJobIds.push(jobId);

      // Create candidates for matching
      const candidatePromises = [];
      for (let i = 0; i < 20; i++) {
        candidatePromises.push(
          createTestCandidate(companyId, userId, {
            name: `Performance Candidate ${i}`,
            email: `candidate${i}@example.com`
          })
        );
      }
      testCandidateIds = await Promise.all(candidatePromises);

      // Create job matches
      const matchPromises = [];
      for (let i = 0; i < 10; i++) {
        matchPromises.push(
          createTestJobMatch(jobId, testCandidateIds[i], {
            match_score: Math.random() * 100,
            explanation: `Performance test match ${i}`
          })
        );
      }
      await Promise.all(matchPromises);

      const startTime = Date.now();

      // Complex join query
      const result = await query(`
        SELECT 
          c.id,
          c.name,
          c.email,
          c.experience_level,
          c.location,
          jm.match_score,
          jm.status as match_status,
          j.title as job_title,
          comp.name as company_name,
          array_length(c.top_skills, 1) as skill_count
        FROM candidates c
        LEFT JOIN job_matches jm ON c.id = jm.candidate_id
        LEFT JOIN jobs j ON jm.job_id = j.id
        LEFT JOIN companies comp ON j.company_id = comp.id
        WHERE c.company_id = $1
        ORDER BY c.created_at DESC
        LIMIT 50
      `, [companyId]);

      const queryTime = Date.now() - startTime;
      console.log(`Complex join query took ${queryTime}ms`);

      expect(queryTime).toBeLessThan(2000); // Should be under 2 seconds
      expect(result.rows.length).toBeGreaterThan(0);
    });
  });

  describe('Matching Algorithm Performance', () => {
    test('should calculate matching scores efficiently for large datasets', async () => {
      if (testJobIds.length === 0 || testCandidateIds.length === 0) {
        console.log('Skipping test - insufficient test data');
        return;
      }

      console.log('Starting matching algorithm performance test...');

      const startTime = Date.now();

      // Calculate matching scores using a batch approach
      const matchingPromises = [];
      for (let i = 0; i < Math.min(10, testCandidateIds.length); i++) {
        for (let j = 0; j < Math.min(3, testJobIds.length); j++) {
          matchingPromises.push(
            calculateMatchingScore(testJobIds[j], testCandidateIds[i])
          );
        }
      }

      await Promise.all(matchingPromises);

      const totalTime = Date.now() - startTime;
      const totalCalculations = matchingPromises.length;
      const avgTimePerCalculation = totalTime / totalCalculations;

      console.log(`Calculated ${totalCalculations} matching scores in ${totalTime}ms`);
      console.log(`Average time per calculation: ${avgTimePerCalculation.toFixed(2)}ms`);

      // Performance benchmarks
      expect(totalTime).toBeLessThan(10000); // Total should be under 10 seconds
      expect(avgTimePerCalculation).toBeLessThan(500); // Each calculation should be under 500ms
    });

    test('should efficiently find top matches for jobs', async () => {
      if (testJobIds.length === 0) {
        console.log('Skipping test - no jobs available');
        return;
      }

      const jobId = testJobIds[0];
      const startTime = Date.now();

      const topMatches = await query(`
        SELECT 
          c.id,
          c.name,
          c.email,
          jm.match_score,
          jm.explanation,
          ROW_NUMBER() OVER (ORDER BY jm.match_score DESC) as rank
        FROM job_matches jm
        JOIN candidates c ON jm.candidate_id = c.id
        WHERE jm.job_id = $1
        ORDER BY jm.match_score DESC
        LIMIT 20
      `, [jobId]);

      const queryTime = Date.now() - startTime;
      console.log(`Top matches query took ${queryTime}ms`);

      expect(queryTime).toBeLessThan(1000); // Should be under 1 second
      expect(topMatches.rows.length).toBeGreaterThanOrEqual(0);

      // Verify results are properly ordered
      for (let i = 1; i < topMatches.rows.length; i++) {
        expect(topMatches.rows[i-1].match_score)
          .toBeGreaterThanOrEqual(topMatches.rows[i].match_score);
      }
    });
  });

  describe('Bulk Operations Performance', () => {
    test('should handle bulk inserts efficiently', async () => {
      const startTime = Date.now();
      const batchSize = 500; // Reduced for better test performance

      // Generate bulk notification data
      const values = [];
      const params = [];
      let paramIndex = 1;

      for (let i = 0; i < batchSize; i++) {
        const userIndex = i % Math.min(testUserIds.length, 50);
        if (testUserIds[userIndex]) {
          values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`);
          params.push(
            testUserIds[userIndex],
            'bulk_test',
            `Bulk Test Notification ${i}`,
            `This is bulk test message ${i}`,
            false
          );
          paramIndex += 5;
        }
      }

      if (values.length > 0) {
        const bulkInsertQuery = `
          INSERT INTO notifications (user_id, type, title, message, is_read)
          VALUES ${values.join(', ')}
        `;

        await query(bulkInsertQuery, params);
      }

      const bulkInsertTime = Date.now() - startTime;
      console.log(`Bulk insert of ${values.length} notifications took ${bulkInsertTime}ms`);

      expect(bulkInsertTime).toBeLessThan(5000); // Should be under 5 seconds
    });

    test('should handle bulk updates efficiently', async () => {
      const startTime = Date.now();

      // Bulk update all test notifications
      const bulkUpdateResult = await query(`
        UPDATE notifications 
        SET is_read = true
        WHERE type = 'bulk_test'
      `);

      const bulkUpdateTime = Date.now() - startTime;
      console.log(`Bulk update of ${bulkUpdateResult.rowCount} notifications took ${bulkUpdateTime}ms`);

      expect(bulkUpdateTime).toBeLessThan(2000); // Should be under 2 seconds
      expect(bulkUpdateResult.rowCount).toBeGreaterThan(0);
    });

    test('should handle bulk deletes efficiently', async () => {
      const startTime = Date.now();

      // Bulk delete all test notifications
      const bulkDeleteResult = await query(`
        DELETE FROM notifications 
        WHERE type = 'bulk_test'
      `);

      const bulkDeleteTime = Date.now() - startTime;
      console.log(`Bulk delete of ${bulkDeleteResult.rowCount} notifications took ${bulkDeleteTime}ms`);

      expect(bulkDeleteTime).toBeLessThan(2000); // Should be under 2 seconds
      expect(bulkDeleteResult.rowCount).toBeGreaterThan(0);
    });
  });

  describe('Search Performance', () => {
    test('should perform full-text search efficiently', async () => {
      if (testJobIds.length === 0) {
        console.log('Skipping search test - no jobs available');
        return;
      }

      const searchTerms = [
        'developer',
        'engineer',
        'manager',
        'senior',
        'javascript',
        'python',
        'remote',
        'full-time'
      ];

      for (const term of searchTerms) {
        const startTime = Date.now();

        const searchResult = await query(`
          SELECT 
            j.id,
            j.title,
            j.description,
            j.location,
            c.name as company_name,
            j.salary_min,
            j.salary_max
          FROM jobs j
          JOIN companies c ON j.company_id = c.id
          WHERE 
            j.is_active = true AND (
              j.title ILIKE $1 OR 
              j.description ILIKE $1
            )
          ORDER BY 
            CASE 
              WHEN j.title ILIKE $1 THEN 1
              WHEN j.description ILIKE $1 THEN 2
              ELSE 3
            END,
            j.created_at DESC
          LIMIT 50
        `, [`%${term}%`]);

        const searchTime = Date.now() - startTime;
        console.log(`Search for "${term}" took ${searchTime}ms, found ${searchResult.rows.length} results`);

        expect(searchTime).toBeLessThan(1000); // Should be under 1 second per search
      }
    });

    test('should handle complex filtering efficiently', async () => {
      const startTime = Date.now();

      const filteredResult = await query(`
        SELECT 
          j.id,
          j.title,
          j.salary_min,
          j.salary_max,
          j.employment_type,
          c.name as company_name,
          c.subscription_plan,
          array_length(j.required_skills, 1) as required_skills_count,
          AVG(jm.match_score) as avg_candidate_score
        FROM jobs j
        JOIN companies c ON j.company_id = c.id
        LEFT JOIN job_matches jm ON j.id = jm.job_id
        WHERE 
          j.is_active = true AND
          j.salary_min >= $1 AND
          j.salary_max <= $2 AND
          c.subscription_plan = $3
        GROUP BY j.id, j.title, j.salary_min, j.salary_max, j.employment_type, c.name, c.subscription_plan, j.required_skills
        HAVING array_length(j.required_skills, 1) >= $4
        ORDER BY avg_candidate_score DESC NULLS LAST, j.salary_max DESC
        LIMIT 20
      `, [50000, 150000, 'professional', 2]);

      const filterTime = Date.now() - startTime;
      console.log(`Complex filtering query took ${filterTime}ms`);

      expect(filterTime).toBeLessThan(2000); // Should be under 2 seconds
    });
  });

  describe('Concurrent Operations Performance', () => {
    test('should handle concurrent reads efficiently', async () => {
      const concurrentReads = 10; // Reduced for better test performance
      const startTime = Date.now();

      const readPromises = [];
      for (let i = 0; i < concurrentReads; i++) {
        readPromises.push(
          query(`
            SELECT 
              u.id, u.name, u.email,
              COUNT(jm.id) as match_count,
              COUNT(n.id) as notification_count
            FROM users u
            LEFT JOIN job_matches jm ON jm.job_id IN (
              SELECT id FROM jobs WHERE created_by_user_id = u.id
            )
            LEFT JOIN notifications n ON u.id = n.user_id
            WHERE u.role = 'recruiter'
            GROUP BY u.id, u.name, u.email
            ORDER BY u.created_at DESC
            LIMIT 50
          `)
        );
      }

      const results = await Promise.all(readPromises);
      const concurrentReadTime = Date.now() - startTime;

      console.log(`${concurrentReads} concurrent reads took ${concurrentReadTime}ms`);

      expect(concurrentReadTime).toBeLessThan(5000); // Should handle concurrent reads efficiently
      expect(results).toHaveLength(concurrentReads);
      results.forEach(result => {
        expect(result.rows).toBeDefined();
      });
    });

    test('should handle mixed read/write operations', async () => {
      const operations = 8;
      const startTime = Date.now();

      const operationPromises = [];
      
      for (let i = 0; i < operations; i++) {
        if (i % 3 === 0) {
          // Write operation - create notification
          if (testUserIds[i % testUserIds.length]) {
            operationPromises.push(
              query(
                `INSERT INTO notifications (user_id, type, title, message, is_read)
                 VALUES ($1, $2, $3, $4, $5)`,
                [testUserIds[i % testUserIds.length], 'concurrent_test', 
                 `Concurrent Test ${i}`, `Message ${i}`, false]
              )
            );
          }
        } else {
          // Read operation
          operationPromises.push(
            query(`
              SELECT COUNT(*) as count 
              FROM notifications 
              WHERE user_id = $1
            `, [testUserIds[i % testUserIds.length] || testUserIds[0]])
          );
        }
      }

      const results = await Promise.all(operationPromises);
      const mixedOpsTime = Date.now() - startTime;

      console.log(`${operations} mixed operations took ${mixedOpsTime}ms`);

      expect(mixedOpsTime).toBeLessThan(3000); // Should handle mixed operations efficiently
      expect(results).toHaveLength(operations);
    });
  });
});

// Helper function for calculating matching scores
async function calculateMatchingScore(jobId, candidateId) {
  // Simplified matching score calculation for performance testing
  const jobResult = await query(`
    SELECT required_skills FROM jobs WHERE id = $1
  `, [jobId]);

  const candidateResult = await query(`
    SELECT top_skills FROM candidates WHERE id = $1
  `, [candidateId]);

  if (jobResult.rows.length === 0 || candidateResult.rows.length === 0) {
    return;
  }

  const jobSkills = jobResult.rows[0].required_skills || [];
  const candidateSkills = candidateResult.rows[0].top_skills || [];

  // Calculate skill match score
  const matchingSkills = jobSkills.filter(skill => 
    candidateSkills.some(cSkill => 
      cSkill.toLowerCase().includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(cSkill.toLowerCase())
    )
  );

  const skillScore = jobSkills.length > 0 
    ? (matchingSkills.length / jobSkills.length) * 100 
    : 0;

  const overallScore = Math.min(skillScore + Math.random() * 20, 100); // Add some randomness

  return query(
    `INSERT INTO job_matches (job_id, candidate_id, match_score, explanation, status)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (job_id, candidate_id) DO UPDATE SET
       match_score = EXCLUDED.match_score,
       explanation = EXCLUDED.explanation,
       updated_at = CURRENT_TIMESTAMP`,
    [jobId, candidateId, overallScore, 
     `Skills match: ${matchingSkills.length}/${jobSkills.length}`, 'pending']
  );
}
