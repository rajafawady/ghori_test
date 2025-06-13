import { mockCandidates } from '@/lib/mockData';
import { Candidate } from '@/types/index';


export const candidateService = {
  async getAll(): Promise<Candidate[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockCandidates]), 100);
    });
  },

  async create(candidate: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>): Promise<Candidate> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newCandidate: Candidate = {
          ...candidate,
          id: `cand-${Date.now()}`,
          created_at: new Date(),
          updated_at: new Date()
        };
        resolve(newCandidate);
      }, 200);
    });
  },

  async update(id: string, updates: Partial<Candidate>): Promise<Candidate | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const candidate = mockCandidates.find(c => c.id === id);
        if (candidate) {
          const updated = { ...candidate, ...updates, updated_at: new Date() };
          resolve(updated);
        } else {
          resolve(null);
        }
      }, 200);
    });
  },

  async delete(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 200);
    });
  }
};