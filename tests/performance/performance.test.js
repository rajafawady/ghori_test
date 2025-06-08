const { query, closePool } = require('../helpers/db');
const { createTestUser, createTestCompany, createTestJobPosting, createTestSkill, cleanupTestData } = require('../helpers/testHelpers');

describe('Performance Tests', () => {
  let testUserIds = [];
  let testCompanyIds = [];
  let testJobPostingIds = [];
  let testSkillIds = [];

  beforeAll(async () => {
    // Clean up before performance tests
    await cleanupTestData();
  });

  afterAll(async () => {
    // Clean up after performance tests
    await cleanupTestData();
  });

  describe('Database Query Performance', () => {
    test('should handle large user dataset efficiently', async () => {
      const startTime = Date.now();
      const batchSize = 100;
      
      // Create users in batches for better performance
      for (let batch = 0; batch < 3; batch++) {
        const userPromises = [];
        for (let i = 0; i < batchSize; i++) {
          const userIndex = batch * batchSize + i;
          userPromises.push(
            createTestUser({
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
      
      // Performance should be reasonable (less than 10 seconds for 300 users)
      expect(userCreationTime).toBeLessThan(10000);
      expect(testUserIds).toHaveLength(300);
    });

    test('should query users efficiently with pagination', async () => {
      const pageSize = 50;
      const startTime = Date.now();

      // Test paginated query performance
      const result = await query(`
        SELECT id, email, name, user_type, created_at
        FROM users
        WHERE user_type = 'job_seeker'
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
      const companyId = await createTestCompany();
      const jobPostingId = await createTestJobPosting(companyId);
      const skillId = await createTestSkill();

      // Create applications for some users
      const applicationPromises = [];
      for (let i = 0; i < 50; i++) {
        if (testUserIds[i]) {
          applicationPromises.push(
            query(
              `INSERT INTO applications (user_id, job_posting_id, cover_letter, status)
               VALUES ($1, $2, $3, $4)`,
              [testUserIds[i], jobPostingId, `Cover letter ${i}`, 'submitted']
            )
          );
        }
      }
      await Promise.all(applicationPromises);

      const startTime = Date.now();

      // Complex join query
      const result = await query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          up.experience_years,
          up.education_level,
          a.status as application_status,
          jp.title as job_title,
          c.name as company_name,
          COUNT(us.skill_id) as skill_count
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN applications a ON u.id = a.user_id
        LEFT JOIN job_postings jp ON a.job_posting_id = jp.id
        LEFT JOIN companies c ON jp.company_id = c.id
        LEFT JOIN user_skills us ON u.id = us.user_id
        WHERE u.user_type = 'job_seeker'
        GROUP BY u.id, u.name, u.email, up.experience_years, up.education_level, a.status, jp.title, c.name
        ORDER BY u.created_at DESC
        LIMIT 100
      `);

      const queryTime = Date.now() - startTime;
      console.log(`Complex join query took ${queryTime}ms`);

      expect(queryTime).toBeLessThan(2000); // Should be under 2 seconds
      expect(result.rows.length).toBeGreaterThan(0);
    });
  });

  describe('Matching Algorithm Performance', () => {
    test('should calculate matching scores efficiently for large datasets', async () => {
      // Create skills
      const skillPromises = [];
      for (let i = 0; i < 20; i++) {
        skillPromises.push(
          createTestSkill({
            name: `Performance Skill ${i}`,
            category: 'Programming'
          })
        );
      }
      testSkillIds = await Promise.all(skillPromises);

      // Create companies and job postings
      const companyPromises = [];
      for (let i = 0; i < 10; i++) {
        companyPromises.push(
          createTestCompany({
            name: `Performance Company ${i}`,
            industry: 'Technology'
          })
        );
      }
      testCompanyIds = await Promise.all(companyPromises);

      const jobPostingPromises = [];
      for (let i = 0; i < 20; i++) {
        jobPostingPromises.push(
          createTestJobPosting(testCompanyIds[i % testCompanyIds.length], {
            title: `Performance Job ${i}`,
            salary_min: 50000 + (i * 1000),
            salary_max: 80000 + (i * 1500)
          })
        );
      }
      testJobPostingIds = await Promise.all(jobPostingPromises);

      // Add skills to users (random distribution)
      const userSkillPromises = [];
      for (let i = 0; i < Math.min(100, testUserIds.length); i++) {
        const numSkills = Math.floor(Math.random() * 8) + 3; // 3-10 skills per user
        for (let j = 0; j < numSkills; j++) {
          const skillIndex = Math.floor(Math.random() * testSkillIds.length);
          userSkillPromises.push(
            query(
              `INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (user_id, skill_id) DO NOTHING`,
              [
                testUserIds[i],
                testSkillIds[skillIndex],
                ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
                Math.floor(Math.random() * 8) + 1
              ]
            )
          );
        }
      }
      await Promise.all(userSkillPromises);

      // Add skills to job postings
      const jobSkillPromises = [];
      for (const jobId of testJobPostingIds) {
        const numSkills = Math.floor(Math.random() * 5) + 2; // 2-6 skills per job
        for (let i = 0; i < numSkills; i++) {
          const skillIndex = Math.floor(Math.random() * testSkillIds.length);
          jobSkillPromises.push(
            query(
              `INSERT INTO job_skills (job_posting_id, skill_id, required_level, is_required)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (job_posting_id, skill_id) DO NOTHING`,
              [
                jobId,
                testSkillIds[skillIndex],
                ['intermediate', 'advanced'][Math.floor(Math.random() * 2)],
                Math.random() > 0.5
              ]
            )
          );
        }
      }
      await Promise.all(jobSkillPromises);

      console.log('Test data setup complete. Starting matching algorithm performance test...');

      const startTime = Date.now();

      // Calculate matching scores using a batch approach
      const matchingPromises = [];
      for (let i = 0; i < Math.min(50, testUserIds.length); i++) {
        for (let j = 0; j < Math.min(5, testJobPostingIds.length); j++) {
          matchingPromises.push(
            calculateMatchingScore(testUserIds[i], testJobPostingIds[j])
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
      expect(totalTime).toBeLessThan(30000); // Total should be under 30 seconds
      expect(avgTimePerCalculation).toBeLessThan(100); // Each calculation should be under 100ms
    });

    test('should efficiently find top matches for job postings', async () => {
      if (testJobPostingIds.length === 0) {
        console.log('Skipping test - no job postings available');
        return;
      }

      const jobId = testJobPostingIds[0];
      const startTime = Date.now();

      const topMatches = await query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          ms.overall_score,
          ms.skills_score,
          ms.experience_score,
          ms.education_score,
          ROW_NUMBER() OVER (ORDER BY ms.overall_score DESC) as rank
        FROM matching_scores ms
        JOIN users u ON ms.user_id = u.id
        WHERE ms.job_posting_id = $1
        ORDER BY ms.overall_score DESC
        LIMIT 20
      `, [jobId]);

      const queryTime = Date.now() - startTime;
      console.log(`Top matches query took ${queryTime}ms`);

      expect(queryTime).toBeLessThan(1000); // Should be under 1 second
      expect(topMatches.rows.length).toBeGreaterThan(0);

      // Verify results are properly ordered
      for (let i = 1; i < topMatches.rows.length; i++) {
        expect(topMatches.rows[i-1].overall_score)
          .toBeGreaterThanOrEqual(topMatches.rows[i].overall_score);
      }
    });
  });

  describe('Bulk Operations Performance', () => {
    test('should handle bulk inserts efficiently', async () => {
      const startTime = Date.now();
      const batchSize = 1000;

      // Generate bulk notification data
      const values = [];
      const params = [];
      let paramIndex = 1;

      for (let i = 0; i < batchSize; i++) {
        const userIndex = i % Math.min(testUserIds.length, 100);
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
          INSERT INTO notifications (user_id, type, title, message, read)
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
        SET read = true, updated_at = CURRENT_TIMESTAMP
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
      if (testJobPostingIds.length === 0) {
        console.log('Skipping search test - no job postings available');
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
            jp.id,
            jp.title,
            jp.description,
            jp.location,
            c.name as company_name,
            jp.salary_min,
            jp.salary_max
          FROM job_postings jp
          JOIN companies c ON jp.company_id = c.id
          WHERE 
            jp.status = 'active' AND (
              jp.title ILIKE $1 OR 
              jp.description ILIKE $1 OR 
              jp.requirements ILIKE $1
            )
          ORDER BY 
            CASE 
              WHEN jp.title ILIKE $1 THEN 1
              WHEN jp.description ILIKE $1 THEN 2
              ELSE 3
            END,
            jp.created_at DESC
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
          jp.id,
          jp.title,
          jp.salary_min,
          jp.salary_max,
          jp.employment_type,
          c.name as company_name,
          c.industry,
          COUNT(DISTINCT js.skill_id) as required_skills_count,
          AVG(ms.overall_score) as avg_candidate_score
        FROM job_postings jp
        JOIN companies c ON jp.company_id = c.id
        LEFT JOIN job_skills js ON jp.id = js.job_posting_id
        LEFT JOIN matching_scores ms ON jp.id = ms.job_posting_id
        WHERE 
          jp.status = 'active' AND
          jp.salary_min >= $1 AND
          jp.salary_max <= $2 AND
          c.industry = $3
        GROUP BY jp.id, jp.title, jp.salary_min, jp.salary_max, jp.employment_type, c.name, c.industry
        HAVING COUNT(DISTINCT js.skill_id) >= $4
        ORDER BY avg_candidate_score DESC NULLS LAST, jp.salary_max DESC
        LIMIT 20
      `, [50000, 150000, 'Technology', 2]);

      const filterTime = Date.now() - startTime;
      console.log(`Complex filtering query took ${filterTime}ms`);

      expect(filterTime).toBeLessThan(2000); // Should be under 2 seconds
    });
  });

  describe('Concurrent Operations Performance', () => {
    test('should handle concurrent reads efficiently', async () => {
      const concurrentReads = 20;
      const startTime = Date.now();

      const readPromises = [];
      for (let i = 0; i < concurrentReads; i++) {
        readPromises.push(
          query(`
            SELECT 
              u.id, u.name, u.email,
              COUNT(a.id) as application_count,
              COUNT(n.id) as notification_count
            FROM users u
            LEFT JOIN applications a ON u.id = a.user_id
            LEFT JOIN notifications n ON u.id = n.user_id
            WHERE u.user_type = 'job_seeker'
            GROUP BY u.id, u.name, u.email
            ORDER BY u.created_at DESC
            LIMIT 100
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
      const operations = 10;
      const startTime = Date.now();

      const operationPromises = [];
      
      for (let i = 0; i < operations; i++) {
        if (i % 3 === 0) {
          // Write operation - create notification
          if (testUserIds[i % testUserIds.length]) {
            operationPromises.push(
              query(
                `INSERT INTO notifications (user_id, type, title, message, read)
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
async function calculateMatchingScore(userId, jobPostingId) {
  // Simplified matching score calculation for performance testing
  const skillsMatch = await query(`
    SELECT 
      COUNT(CASE WHEN js.skill_id IS NOT NULL THEN 1 END) as matching_skills,
      COUNT(*) as total_user_skills
    FROM user_skills us
    LEFT JOIN job_skills js ON us.skill_id = js.skill_id AND js.job_posting_id = $1
    WHERE us.user_id = $2
  `, [jobPostingId, userId]);

  const skillsScore = skillsMatch.rows[0].total_user_skills > 0 
    ? (skillsMatch.rows[0].matching_skills / skillsMatch.rows[0].total_user_skills) * 100 
    : 0;

  const experienceScore = Math.min(Math.random() * 100, 100); // Simulated
  const educationScore = Math.min(Math.random() * 100, 100); // Simulated
  const overallScore = (skillsScore * 0.4) + (experienceScore * 0.35) + (educationScore * 0.25);

  return query(
    `INSERT INTO matching_scores (user_id, job_posting_id, overall_score, skills_score, experience_score, education_score)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, job_posting_id) DO UPDATE SET
       overall_score = EXCLUDED.overall_score,
       skills_score = EXCLUDED.skills_score,
       experience_score = EXCLUDED.experience_score,
       education_score = EXCLUDED.education_score,
       calculated_at = CURRENT_TIMESTAMP`,
    [userId, jobPostingId, overallScore, skillsScore, experienceScore, educationScore]
  );
}
