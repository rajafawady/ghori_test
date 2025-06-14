import { JobMatch, JobMatchStatus, Job, Candidate } from '@/types';
import { storage, COLLECTIONS } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

type ChangeListener = () => void;

export const jobMatchService = {
  _subscribers: new Set<ChangeListener>(),

  subscribe(listener: ChangeListener): () => void {
    this._subscribers.add(listener);
    return () => this._subscribers.delete(listener);
  },

  _notifySubscribers(): void {
    this._subscribers.forEach(listener => listener());
  },
  async getJobMatches(jobId?: string): Promise<JobMatch[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let matches = storage.getCollection<JobMatch>(COLLECTIONS.JOB_MATCHES);
        
        if (jobId) {
          matches = matches.filter(match => match.job_id === jobId);
        }
        
        const jobs = storage.getCollection<Job>(COLLECTIONS.JOBS);
        const candidates = storage.getCollection<Candidate>(COLLECTIONS.CANDIDATES);
        
        const matchesWithRelations = matches
          .map(match => ({
            ...match,
            job: jobs.find(j => j.id === match.job_id),
            candidate: candidates.find(c => c.id === match.candidate_id)
          }))
          .sort((a, b) => (b.score || 0) - (a.score || 0));

        console.log('Matches with relations:', matchesWithRelations);
        
        resolve(matchesWithRelations);
      }, 500);
    });
  },

  async getCandidateMatches(candidateId: string): Promise<JobMatch[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const matches = storage.searchCollection<JobMatch>(
          COLLECTIONS.JOB_MATCHES,
          match => match.candidate_id === candidateId
        );
        
        const jobs = storage.getCollection<Job>(COLLECTIONS.JOBS);
        const candidates = storage.getCollection<Candidate>(COLLECTIONS.CANDIDATES);
        
        const matchesWithRelations = matches.map(match => ({
          ...match,
          job: jobs.find(j => j.id === match.job_id),
          candidate: candidates.find(c => c.id === match.candidate_id)
        }));
        
        resolve(matchesWithRelations);
      }, 500);
    });
  },
  async updateMatchStatus(matchId: string, status: JobMatchStatus): Promise<JobMatch | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const updatedMatch = storage.updateInCollection<JobMatch>(
          COLLECTIONS.JOB_MATCHES,
          matchId,
          { status }
        );
        this._notifySubscribers();
        resolve(updatedMatch);
      }, 500);
    });
  },

  async calculateMatchScore(jobId: string, candidateId: string): Promise<JobMatch> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate AI matching logic
        const score = Math.random() * 0.5 + 0.5; // Random score between 0.5 and 1.0
        const analysis = {
          skills_match: Math.random() * 0.3 + 0.7,
          experience_match: Math.random() * 0.3 + 0.7,
          education_match: Math.random() * 0.3 + 0.7,
          salary_expectations: Math.random() * 0.3 + 0.7
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

        storage.addToCollection(COLLECTIONS.JOB_MATCHES, match);
        resolve(match);
      }, 1000);
    });
  },

  async createMatch(jobId: string, candidateId: string, status: JobMatchStatus = 'applied'): Promise<JobMatch> {
    return new Promise((resolve) => {
      setTimeout(() => {        const match: JobMatch = {
          id: uuidv4(),
          job_id: jobId,
          candidate_id: candidateId,
          status,
          created_at: new Date(),
          updated_at: new Date()
        };

        storage.addToCollection(COLLECTIONS.JOB_MATCHES, match);
        this._notifySubscribers();
        resolve(match);
      }, 200);
    });
  },

  async deleteMatch(matchId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const deleted = storage.removeFromCollection<JobMatch>(COLLECTIONS.JOB_MATCHES, matchId);
        resolve(deleted);
      }, 200);
    });
  },
  async bulkCreateMatches(jobId: string, candidateIds: string[]): Promise<JobMatch[]> {
    return new Promise((resolve) => {
      setTimeout(() => {        
        const matches = candidateIds.map(candidateId => {
            const score = Math.random() * 0.5 + 0.5; // Random score between 0.5 and 1.0
            const analysis = {
            skills_match: Math.random() * 0.3 + 0.7,
            experience_match: Math.random() * 0.3 + 0.7,
            education_match: Math.random() * 0.3 + 0.7,
            salary_expectations: Math.random() * 0.3 + 0.7
            };

            const match: JobMatch = {
            id: uuidv4(),
            job_id: jobId,
            candidate_id: candidateId,
            status: 'applied',
            score,
            analysis,
            created_at: new Date(),
            updated_at: new Date(),
            ai_summary: `Based on the analysis, this candidate shows strong potential for this role with a ${(score * 100).toFixed(0)}% match. Key strengths include relevant skills and experience alignment.`
            };
          
          storage.addToCollection(COLLECTIONS.JOB_MATCHES, match);
          return match;
        });
        
        this._notifySubscribers();
        resolve(matches);
      }, 500);
    });
  }
};