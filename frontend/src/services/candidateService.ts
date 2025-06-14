import { Candidate } from '@/types/index';
import { storage, COLLECTIONS } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

export const candidateService = {
  async getAll(): Promise<Candidate[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const candidates = storage.getCollection<Candidate>(COLLECTIONS.CANDIDATES);
        resolve(candidates);
      }, 100);
    });
  },

  async getById(id: string): Promise<Candidate | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const candidate = storage.getFromCollection<Candidate>(COLLECTIONS.CANDIDATES, id);
        resolve(candidate);
      }, 100);
    });
  },

  async create(candidate: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>): Promise<Candidate> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newCandidate: Candidate = {
          ...candidate,
          id: uuidv4(),
          created_at: new Date(),
          updated_at: new Date()
        };
        storage.addToCollection(COLLECTIONS.CANDIDATES, newCandidate);
        resolve(newCandidate);
      }, 200);
    });
  },

  async update(id: string, updates: Partial<Candidate>): Promise<Candidate | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const updatedCandidate = storage.updateInCollection<Candidate>(
          COLLECTIONS.CANDIDATES,
          id,
          updates
        );
        resolve(updatedCandidate);
      }, 200);
    });
  },

  async delete(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const deleted = storage.removeFromCollection<Candidate>(COLLECTIONS.CANDIDATES, id);
        resolve(deleted);
      }, 200);
    });
  },

  async search(query: {
    keywords?: string[];
    email?: string;
    phone?: string;
  }): Promise<Candidate[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let candidates = storage.getCollection<Candidate>(COLLECTIONS.CANDIDATES);

        if (query.keywords && query.keywords.length > 0) {
          candidates = candidates.filter(candidate => 
            query.keywords!.some(keyword => 
              candidate.full_name.toLowerCase().includes(keyword.toLowerCase()) ||
              candidate.email.toLowerCase().includes(keyword.toLowerCase())
            )
          );
        }

        if (query.email) {
          candidates = candidates.filter(candidate => 
            candidate.email.toLowerCase().includes(query.email!.toLowerCase())
          );
        }

        if (query.phone) {
          candidates = candidates.filter(candidate => 
            candidate.phone?.includes(query.phone!)
          );
        }

        resolve(candidates);
      }, 300);
    });
  }
};