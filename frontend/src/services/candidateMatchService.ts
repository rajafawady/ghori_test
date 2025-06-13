import { Candidate, Job, JobMatch } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Dummy data
const candidates: Candidate[] = [
  {
    id: uuidv4(),
    full_name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    resume_url: 'https://example.com/resumes/john.pdf',
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true
  },
  {
    id: uuidv4(),
    full_name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1987654321',
    resume_url: 'https://example.com/resumes/jane.pdf',
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true
  }
];

const jobs: Job[] = [
  {
    id: uuidv4(),
    company_id: 'company1',
    title: 'Senior Software Engineer',
    description: 'Looking for an experienced software engineer...',
    location: 'New York, NY',
    employment_type: 'full_time',
    salary_min: 120000,
    salary_max: 180000,
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true
  }
];

const jobMatches: JobMatch[] = [
  {
    id: uuidv4(),
    job_id: jobs[0].id,
    candidate_id: candidates[0].id,
    status: 'applied',
    score: 0.85,
    analysis: {
      skills_match: 0.9,
      experience_match: 0.8,
      education_match: 0.85,
      location_match: 0.7
    },
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: uuidv4(),
    job_id: jobs[0].id,
    candidate_id: candidates[1].id,
    status: 'applied',
    score: 0.75,
    analysis: {
      skills_match: 0.8,
      experience_match: 0.7,
      education_match: 0.75,
      location_match: 0.8
    },
    created_at: new Date(),
    updated_at: new Date()
  }
];

export const candidateMatchService = {
  async getMatchingCandidates(jobId: string): Promise<JobMatch[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return jobMatches
      .filter(match => match.job_id === jobId)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  },

  async getCandidateMatches(candidateId: string): Promise<JobMatch[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return jobMatches.filter(match => match.candidate_id === candidateId);
  },

  async calculateMatchScore(jobId: string, candidateId: string): Promise<JobMatch> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate AI matching logic
    const score = Math.random() * 0.5 + 0.5; // Random score between 0.5 and 1.0
    const analysis = {
      skills_match: Math.random() * 0.3 + 0.7,
      experience_match: Math.random() * 0.3 + 0.7,
      education_match: Math.random() * 0.3 + 0.7,
      location_match: Math.random() * 0.3 + 0.7
    };

    const match: JobMatch = {
      id: uuidv4(),
      job_id: jobId,
      candidate_id: candidateId,
      status: 'applied',
      score,
      analysis,
      created_at: new Date(),
      updated_at: new Date()
    };

    jobMatches.push(match);
    return match;
  },

  async updateMatchStatus(matchId: string, status: string): Promise<JobMatch> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const match = jobMatches.find(m => m.id === matchId);
    if (!match) throw new Error('Match not found');
    
    match.status = status as any;
    match.updated_at = new Date();
    return match;
  },

  async getMatchDetails(matchId: string): Promise<JobMatch & { job: Job; candidate: Candidate }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const match = jobMatches.find(m => m.id === matchId);
    if (!match) throw new Error('Match not found');

    const job = jobs.find(j => j.id === match.job_id);
    const candidate = candidates.find(c => c.id === match.candidate_id);

    if (!job || !candidate) throw new Error('Job or candidate not found');

    return {
      ...match,
      job,
      candidate
    };
  }
}; 