import { JobMatch, JobMatchStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { mockJobMatches as jobMatches } from '@/lib/mockData';

export const jobMatchService = {
  async getJobMatches(jobId?: string): Promise<JobMatch[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (jobId) {
      return jobMatches.filter(match => match.job_id === jobId);
    }
    return jobMatches;
  },

  async getCandidateMatches(candidateId: string): Promise<JobMatch[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return jobMatches.filter(match => match.candidate_id === candidateId);
  },

  async updateMatchStatus(matchId: string, status: JobMatchStatus): Promise<JobMatch> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const match = jobMatches.find(m => m.id === matchId);
    if (!match) throw new Error('Match not found');
    
    match.status = status;
    match.updated_at = new Date();
    return match;
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
  }
}; 