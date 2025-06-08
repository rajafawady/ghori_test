const { query, closePool } = require('../helpers/db');
const { createTestUser, createTestCompany, createTestJobPosting, createTestSkill, cleanupTestData } = require('../helpers/testHelpers');

describe('Integration Tests', () => {
  let testUserId, testCompanyId, testJobPostingId, testSkillId;

  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('Complete User Journey - Job Seeker', () => {
    test('should complete full job application workflow', async () => {
      // 1. Create user
      testUserId = await createTestUser({
        email: 'jobseeker@example.com',
        name: 'Jane Doe',
        user_type: 'job_seeker'
      });

      // 2. Create user profile
      const profileResult = await query(
        `INSERT INTO user_profiles (user_id, phone, location, bio, experience_years, education_level)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [testUserId, '+1234567890', 'San Francisco, CA', 'Experienced software developer', 5, 'Bachelor']
      );

      expect(profileResult.rows).toHaveLength(1);

      // 3. Add skills to user
      testSkillId = await createTestSkill({ name: 'JavaScript', category: 'Programming' });
      
      await query(
        `INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience)
         VALUES ($1, $2, $3, $4)`,
        [testUserId, testSkillId, 'advanced', 5]
      );

      // 4. Create company and job posting
      testCompanyId = await createTestCompany();
      testJobPostingId = await createTestJobPosting(testCompanyId);

      // 5. Add required skills to job posting
      await query(
        `INSERT INTO job_skills (job_posting_id, skill_id, required_level, is_required)
         VALUES ($1, $2, $3, $4)`,
        [testJobPostingId, testSkillId, 'intermediate', true]
      );

      // 6. Calculate matching score
      const matchingResult = await query(
        `INSERT INTO matching_scores (user_id, job_posting_id, overall_score, skills_score, experience_score, education_score)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, overall_score`,
        [testUserId, testJobPostingId, 88.5, 95.0, 85.0, 80.0]
      );

      expect(matchingResult.rows[0].overall_score).toBe(88.5);

      // 7. Submit application
      const applicationResult = await query(
        `INSERT INTO applications (user_id, job_posting_id, cover_letter, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id, status, applied_at`,
        [testUserId, testJobPostingId, 'I am very interested in this position and believe my skills align well.', 'submitted']
      );

      expect(applicationResult.rows[0].status).toBe('submitted');
      expect(applicationResult.rows[0].applied_at).toBeDefined();

      // 8. Create notification for application submission
      await query(
        `INSERT INTO notifications (user_id, type, title, message, read)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId, 'application_confirmation', 'Application Submitted', 'Your application has been successfully submitted', false]
      );

      // 9. Verify complete application data
      const completeApplicationData = await query(`
        SELECT 
          u.name as user_name,
          u.email,
          up.experience_years,
          jp.title as job_title,
          c.name as company_name,
          a.status as application_status,
          ms.overall_score,
          COUNT(n.id) as notification_count
        FROM users u
        JOIN user_profiles up ON u.id = up.user_id
        JOIN applications a ON u.id = a.user_id
        JOIN job_postings jp ON a.job_posting_id = jp.id
        JOIN companies c ON jp.company_id = c.id
        JOIN matching_scores ms ON u.id = ms.user_id AND jp.id = ms.job_posting_id
        LEFT JOIN notifications n ON u.id = n.user_id
        WHERE u.id = $1
        GROUP BY u.id, u.name, u.email, up.experience_years, jp.title, c.name, a.status, ms.overall_score
      `, [testUserId]);

      expect(completeApplicationData.rows).toHaveLength(1);
      const appData = completeApplicationData.rows[0];
      expect(appData.user_name).toBe('Jane Doe');
      expect(appData.experience_years).toBe(5);
      expect(appData.application_status).toBe('submitted');
      expect(appData.overall_score).toBe(88.5);
      expect(parseInt(appData.notification_count)).toBeGreaterThan(0);
    });

    test('should handle job matching algorithm integration', async () => {
      // Create multiple users with different skills
      const user1Id = await createTestUser({ email: 'dev1@example.com', name: 'Dev One' });
      const user2Id = await createTestUser({ email: 'dev2@example.com', name: 'Dev Two' });
      
      // Create skills
      const jsSkillId = await createTestSkill({ name: 'JavaScript', category: 'Programming' });
      const reactSkillId = await createTestSkill({ name: 'React', category: 'Frontend' });
      const nodeSkillId = await createTestSkill({ name: 'Node.js', category: 'Backend' });

      // Assign different skills to users
      await query(
        `INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience)
         VALUES ($1, $2, $3, $4), ($1, $5, $3, $4)`,
        [user1Id, jsSkillId, 'advanced', 4, reactSkillId]
      );

      await query(
        `INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience)
         VALUES ($1, $2, $3, $4), ($1, $5, $3, $4)`,
        [user2Id, jsSkillId, 'intermediate', 2, nodeSkillId]
      );

      // Create job posting requiring JavaScript and React
      testCompanyId = await createTestCompany();
      testJobPostingId = await createTestJobPosting(testCompanyId);

      await query(
        `INSERT INTO job_skills (job_posting_id, skill_id, required_level, is_required)
         VALUES ($1, $2, $3, $4), ($1, $5, $3, $4)`,
        [testJobPostingId, jsSkillId, 'intermediate', true, reactSkillId]
      );

      // Calculate matching scores
      await query(
        `INSERT INTO matching_scores (user_id, job_posting_id, overall_score, skills_score, experience_score, education_score)
         VALUES ($1, $2, $3, $4, $5, $6), ($7, $2, $8, $9, $5, $6)`,
        [user1Id, testJobPostingId, 92.0, 95.0, 90.0, 85.0, user2Id, 75.0, 70.0]
      );

      // Get ranked candidates for the job
      const rankedCandidates = await query(`
        SELECT 
          u.name,
          u.email,
          ms.overall_score,
          ms.skills_score,
          COUNT(us.skill_id) as matching_skills_count
        FROM matching_scores ms
        JOIN users u ON ms.user_id = u.id
        JOIN user_skills us ON u.id = us.user_id
        JOIN job_skills js ON us.skill_id = js.skill_id AND js.job_posting_id = ms.job_posting_id
        WHERE ms.job_posting_id = $1
        GROUP BY u.id, u.name, u.email, ms.overall_score, ms.skills_score
        ORDER BY ms.overall_score DESC
      `, [testJobPostingId]);

      expect(rankedCandidates.rows).toHaveLength(2);
      expect(rankedCandidates.rows[0].name).toBe('Dev One'); // Higher score first
      expect(rankedCandidates.rows[0].overall_score).toBe(92.0);
      expect(rankedCandidates.rows[1].name).toBe('Dev Two');
      expect(rankedCandidates.rows[1].overall_score).toBe(75.0);
    });
  });

  describe('Complete Employer Journey', () => {
    test('should complete full job posting and candidate review workflow', async () => {
      // 1. Create employer user
      const employerUserId = await createTestUser({
        email: 'employer@company.com',
        name: 'HR Manager',
        user_type: 'employer'
      });

      // 2. Create company
      testCompanyId = await createTestCompany({
        name: 'Tech Solutions Inc',
        industry: 'Technology',
        size: '51-200'
      });

      // 3. Create job posting
      testJobPostingId = await createTestJobPosting(testCompanyId, {
        title: 'Senior Full Stack Developer',
        employment_type: 'full_time',
        salary_min: 90000,
        salary_max: 130000
      });

      // 4. Add required skills
      const skills = [
        { name: 'JavaScript', required_level: 'advanced', is_required: true },
        { name: 'React', required_level: 'advanced', is_required: true },
        { name: 'Node.js', required_level: 'intermediate', is_required: false }
      ];

      for (const skill of skills) {
        const skillId = await createTestSkill({ name: skill.name, category: 'Programming' });
        await query(
          `INSERT INTO job_skills (job_posting_id, skill_id, required_level, is_required)
           VALUES ($1, $2, $3, $4)`,
          [testJobPostingId, skillId, skill.required_level, skill.is_required]
        );
      }

      // 5. Create job seekers and applications
      const candidate1Id = await createTestUser({ email: 'candidate1@example.com', name: 'Alice Smith' });
      const candidate2Id = await createTestUser({ email: 'candidate2@example.com', name: 'Bob Johnson' });

      const app1Result = await query(
        `INSERT INTO applications (user_id, job_posting_id, cover_letter, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [candidate1Id, testJobPostingId, 'Excellent cover letter', 'submitted']
      );

      const app2Result = await query(
        `INSERT INTO applications (user_id, job_posting_id, cover_letter, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [candidate2Id, testJobPostingId, 'Good cover letter', 'submitted']
      );

      // 6. Review applications
      await query(
        'UPDATE applications SET status = $1 WHERE id = $2',
        ['reviewed', app1Result.rows[0].id]
      );

      await query(
        'UPDATE applications SET status = $1 WHERE id = $2',
        ['interview_scheduled', app2Result.rows[0].id]
      );

      // 7. Schedule interview for selected candidate
      await query(
        `INSERT INTO interviews (application_id, interview_type, scheduled_at, status)
         VALUES ($1, $2, $3, $4)`,
        [app2Result.rows[0].id, 'phone_screen', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'scheduled']
      );

      // 8. Generate comprehensive hiring report
      const hiringReport = await query(`
        SELECT 
          jp.title as job_title,
          c.name as company_name,
          COUNT(a.id) as total_applications,
          COUNT(CASE WHEN a.status = 'submitted' THEN 1 END) as pending_applications,
          COUNT(CASE WHEN a.status = 'reviewed' THEN 1 END) as reviewed_applications,
          COUNT(CASE WHEN a.status = 'interview_scheduled' THEN 1 END) as interviews_scheduled,
          COUNT(i.id) as total_interviews,
          AVG(ms.overall_score) as average_candidate_score
        FROM job_postings jp
        JOIN companies c ON jp.company_id = c.id
        LEFT JOIN applications a ON jp.id = a.job_posting_id
        LEFT JOIN interviews i ON a.id = i.application_id
        LEFT JOIN matching_scores ms ON jp.id = ms.job_posting_id AND a.user_id = ms.user_id
        WHERE jp.id = $1
        GROUP BY jp.id, jp.title, c.name
      `, [testJobPostingId]);

      expect(hiringReport.rows).toHaveLength(1);
      const report = hiringReport.rows[0];
      expect(report.job_title).toBe('Senior Full Stack Developer');
      expect(parseInt(report.total_applications)).toBe(2);
      expect(parseInt(report.reviewed_applications)).toBe(1);
      expect(parseInt(report.interviews_scheduled)).toBe(1);
      expect(parseInt(report.total_interviews)).toBe(1);
    });
  });

  describe('Billing and API Usage Integration', () => {
    test('should integrate billing with API usage tracking', async () => {
      // 1. Create user
      testUserId = await createTestUser();

      // 2. Create billing plans
      const basicPlanResult = await query(
        `INSERT INTO billing_plans (name, price, currency, interval, api_limit)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['Basic Plan', 9.99, 'USD', 'monthly', 1000]
      );

      const proPlanResult = await query(
        `INSERT INTO billing_plans (name, price, currency, interval, api_limit)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['Pro Plan', 29.99, 'USD', 'monthly', 5000]
      );

      // 3. Subscribe user to basic plan
      await query(
        `INSERT INTO user_subscriptions (user_id, billing_plan_id, status, current_period_start, current_period_end)
         VALUES ($1, $2, $3, $4, $5)`,
        [testUserId, basicPlanResult.rows[0].id, 'active', 
         new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
      );

      // 4. Track API usage
      const today = new Date().toISOString().split('T')[0];
      await query(
        `INSERT INTO api_usage (user_id, endpoint, request_count, date)
         VALUES ($1, $2, $3, $4), ($1, $5, $6, $4)`,
        [testUserId, '/api/jobs/search', 500, today, '/api/applications', 200]
      );

      // 5. Check if user is approaching limit
      const usageCheck = await query(`
        SELECT 
          u.email,
          bp.name as plan_name,
          bp.api_limit,
          COALESCE(SUM(au.request_count), 0) as current_usage,
          bp.api_limit - COALESCE(SUM(au.request_count), 0) as remaining_requests,
          CASE 
            WHEN COALESCE(SUM(au.request_count), 0) > bp.api_limit * 0.8 
            THEN true 
            ELSE false 
          END as approaching_limit
        FROM users u
        JOIN user_subscriptions us ON u.id = us.user_id
        JOIN billing_plans bp ON us.billing_plan_id = bp.id
        LEFT JOIN api_usage au ON u.id = au.user_id AND au.date >= us.current_period_start
        WHERE u.id = $1 AND us.status = 'active'
        GROUP BY u.id, u.email, bp.name, bp.api_limit, us.current_period_start
      `, [testUserId]);

      expect(usageCheck.rows).toHaveLength(1);
      const usage = usageCheck.rows[0];
      expect(usage.plan_name).toBe('Basic Plan');
      expect(usage.api_limit).toBe(1000);
      expect(parseInt(usage.current_usage)).toBe(700);
      expect(parseInt(usage.remaining_requests)).toBe(300);
      expect(usage.approaching_limit).toBe(false);

      // 6. Upgrade plan
      await query(
        'UPDATE user_subscriptions SET billing_plan_id = $1 WHERE user_id = $2',
        [proPlanResult.rows[0].id, testUserId]
      );

      // 7. Verify upgrade
      const upgradeCheck = await query(`
        SELECT bp.name, bp.api_limit
        FROM user_subscriptions us
        JOIN billing_plans bp ON us.billing_plan_id = bp.id
        WHERE us.user_id = $1 AND us.status = 'active'
      `, [testUserId]);

      expect(upgradeCheck.rows[0].name).toBe('Pro Plan');
      expect(upgradeCheck.rows[0].api_limit).toBe(5000);
    });
  });

  describe('Notification System Integration', () => {
    test('should create notifications for various user actions', async () => {
      // Create users
      const jobSeekerId = await createTestUser({ user_type: 'job_seeker' });
      const employerId = await createTestUser({ user_type: 'employer' });
      
      testCompanyId = await createTestCompany();
      testJobPostingId = await createTestJobPosting(testCompanyId);

      // Job seeker applies for job
      const applicationResult = await query(
        `INSERT INTO applications (user_id, job_posting_id, cover_letter, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [jobSeekerId, testJobPostingId, 'Cover letter', 'submitted']
      );

      // Create notifications for both parties
      await query(
        `INSERT INTO notifications (user_id, type, title, message, read)
         VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $5)`,
        [jobSeekerId, 'application_confirmation', 'Application Submitted', 
         'Your application has been submitted successfully', false,
         employerId, 'new_application', 'New Application Received', 
         'A new candidate has applied for your job posting']
      );

      // Update application status
      await query(
        'UPDATE applications SET status = $1 WHERE id = $2',
        ['interview_scheduled', applicationResult.rows[0].id]
      );

      // Notify job seeker of status change
      await query(
        `INSERT INTO notifications (user_id, type, title, message, read)
         VALUES ($1, $2, $3, $4, $5)`,
        [jobSeekerId, 'application_status', 'Interview Scheduled', 
         'Great news! An interview has been scheduled for your application', false]
      );

      // Get notification summary
      const notificationSummary = await query(`
        SELECT 
          u.user_type,
          COUNT(n.id) as total_notifications,
          COUNT(CASE WHEN n.read = false THEN 1 END) as unread_count,
          STRING_AGG(DISTINCT n.type, ', ') as notification_types
        FROM users u
        LEFT JOIN notifications n ON u.id = n.user_id
        WHERE u.id IN ($1, $2)
        GROUP BY u.id, u.user_type
        ORDER BY u.user_type
      `, [employerId, jobSeekerId]);

      expect(notificationSummary.rows).toHaveLength(2);
      
      // Check employer notifications
      const employerNotifs = notificationSummary.rows.find(r => r.user_type === 'employer');
      expect(parseInt(employerNotifs.total_notifications)).toBe(1);
      expect(parseInt(employerNotifs.unread_count)).toBe(1);
      expect(employerNotifs.notification_types).toContain('new_application');

      // Check job seeker notifications
      const jobSeekerNotifs = notificationSummary.rows.find(r => r.user_type === 'job_seeker');
      expect(parseInt(jobSeekerNotifs.total_notifications)).toBe(2);
      expect(parseInt(jobSeekerNotifs.unread_count)).toBe(2);
      expect(jobSeekerNotifs.notification_types).toContain('application_confirmation');
      expect(jobSeekerNotifs.notification_types).toContain('application_status');
    });
  });

  describe('Complex Query Integration', () => {
    test('should execute complex matching algorithm with multiple criteria', async () => {
      // Setup complex test scenario
      const candidates = [];
      const skills = [];
      
      // Create skills
      for (let i = 0; i < 5; i++) {
        skills.push(await createTestSkill({ 
          name: `Skill${i}`, 
          category: 'Programming' 
        }));
      }

      // Create candidates with varying skill sets
      for (let i = 0; i < 3; i++) {
        const userId = await createTestUser({ 
          email: `candidate${i}@example.com`,
          name: `Candidate ${i}` 
        });
        candidates.push(userId);

        // Create profile
        await query(
          `INSERT INTO user_profiles (user_id, experience_years, education_level, location)
           VALUES ($1, $2, $3, $4)`,
          [userId, 2 + i * 2, i === 0 ? 'Bachelor' : (i === 1 ? 'Master' : 'PhD'), 'San Francisco, CA']
        );

        // Add skills (each candidate has different skill combinations)
        for (let j = 0; j <= i + 2; j++) {
          await query(
            `INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience)
             VALUES ($1, $2, $3, $4)`,
            [userId, skills[j], j < 2 ? 'advanced' : 'intermediate', 1 + j]
          );
        }
      }

      // Create job with specific requirements
      testCompanyId = await createTestCompany();
      testJobPostingId = await createTestJobPosting(testCompanyId);

      // Add job skills requirements
      for (let i = 0; i < 3; i++) {
        await query(
          `INSERT INTO job_skills (job_posting_id, skill_id, required_level, is_required)
           VALUES ($1, $2, $3, $4)`,
          [testJobPostingId, skills[i], i < 2 ? 'advanced' : 'intermediate', i < 2]
        );
      }

      // Calculate comprehensive matching scores
      for (const candidateId of candidates) {
        const matchingData = await query(`
          WITH skill_matches AS (
            SELECT 
              us.user_id,
              COUNT(*) as total_user_skills,
              COUNT(CASE WHEN js.skill_id IS NOT NULL THEN 1 END) as matching_skills,
              COUNT(CASE WHEN js.is_required = true AND js.skill_id IS NOT NULL THEN 1 END) as required_skills_met,
              AVG(CASE 
                WHEN js.skill_id IS NOT NULL THEN 
                  CASE 
                    WHEN us.proficiency_level = 'advanced' THEN 100
                    WHEN us.proficiency_level = 'intermediate' THEN 75
                    ELSE 50
                  END
                ELSE 0
              END) as avg_skill_score
            FROM user_skills us
            LEFT JOIN job_skills js ON us.skill_id = js.skill_id AND js.job_posting_id = $1
            WHERE us.user_id = $2
            GROUP BY us.user_id
          ),
          experience_score AS (
            SELECT 
              up.user_id,
              LEAST(up.experience_years * 10, 100) as exp_score
            FROM user_profiles up
            WHERE up.user_id = $2
          ),
          education_score AS (
            SELECT 
              up.user_id,
              CASE 
                WHEN up.education_level = 'PhD' THEN 100
                WHEN up.education_level = 'Master' THEN 85
                WHEN up.education_level = 'Bachelor' THEN 70
                ELSE 50
              END as edu_score
            FROM user_profiles up
            WHERE up.user_id = $2
          )
          SELECT 
            sm.user_id,
            sm.matching_skills,
            sm.required_skills_met,
            COALESCE(sm.avg_skill_score, 0) as skills_score,
            COALESCE(es.exp_score, 0) as experience_score,
            COALESCE(eds.edu_score, 0) as education_score,
            (COALESCE(sm.avg_skill_score, 0) * 0.4 + 
             COALESCE(es.exp_score, 0) * 0.35 + 
             COALESCE(eds.edu_score, 0) * 0.25) as overall_score
          FROM skill_matches sm
          LEFT JOIN experience_score es ON sm.user_id = es.user_id
          LEFT JOIN education_score eds ON sm.user_id = eds.user_id
        `, [testJobPostingId, candidateId]);

        const scores = matchingData.rows[0];
        
        await query(
          `INSERT INTO matching_scores (user_id, job_posting_id, overall_score, skills_score, experience_score, education_score)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [candidateId, testJobPostingId, scores.overall_score, scores.skills_score, scores.experience_score, scores.education_score]
        );
      }

      // Get final ranking
      const finalRanking = await query(`
        SELECT 
          u.name,
          up.experience_years,
          up.education_level,
          ms.overall_score,
          ms.skills_score,
          ms.experience_score,
          ms.education_score,
          COUNT(us.skill_id) as total_skills
        FROM matching_scores ms
        JOIN users u ON ms.user_id = u.id
        JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN user_skills us ON u.id = us.user_id
        WHERE ms.job_posting_id = $1
        GROUP BY u.id, u.name, up.experience_years, up.education_level, ms.overall_score, ms.skills_score, ms.experience_score, ms.education_score
        ORDER BY ms.overall_score DESC
      `, [testJobPostingId]);

      expect(finalRanking.rows).toHaveLength(3);
      
      // Verify ranking order (higher scores first)
      for (let i = 1; i < finalRanking.rows.length; i++) {
        expect(finalRanking.rows[i-1].overall_score)
          .toBeGreaterThanOrEqual(finalRanking.rows[i].overall_score);
      }

      // Top candidate should have highest education and experience
      const topCandidate = finalRanking.rows[0];
      expect(topCandidate.name).toBe('Candidate 2');
      expect(topCandidate.education_level).toBe('PhD');
      expect(topCandidate.experience_years).toBe(6);
    });
  });
});
