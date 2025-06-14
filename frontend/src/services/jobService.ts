import { Job, Company } from '@/types/index';
import { storage, COLLECTIONS } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

export const jobService = {
  async getAll(): Promise<Job[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const jobs = storage.getCollection<Job>(COLLECTIONS.JOBS);
        const companies = storage.getCollection<Company>(COLLECTIONS.COMPANIES);
        
        const jobsWithCompanies = jobs.map(job => ({
          ...job,
          company: companies.find(c => c.id === job.company_id)
        }));
        resolve(jobsWithCompanies);
      }, 100);
    });
  },

  async getById(id: string): Promise<Job | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const job = storage.getFromCollection<Job>(COLLECTIONS.JOBS, id);
        if (job) {
          const companies = storage.getCollection<Company>(COLLECTIONS.COMPANIES);
          const jobWithCompany = {
            ...job,
            company: companies.find(c => c.id === job.company_id)
          };
          resolve(jobWithCompany);
        } else {
          resolve(null);
        }
      }, 100);
    });
  },

  async getByCompany(companyId: string): Promise<Job[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const jobs = storage.searchCollection<Job>(
          COLLECTIONS.JOBS, 
          job => job.company_id === companyId
        );
        const companies = storage.getCollection<Company>(COLLECTIONS.COMPANIES);
        
        const companyJobs = jobs.map(job => ({
          ...job,
          company: companies.find(c => c.id === job.company_id)
        }));
        resolve(companyJobs);
      }, 100);
    });
  },

  async create(job: Omit<Job, 'id' | 'created_at' | 'updated_at'>): Promise<Job> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newJob: Job = {
          ...job,
          id: uuidv4(),
          created_at: new Date(),
          updated_at: new Date()
        };
        storage.addToCollection(COLLECTIONS.JOBS, newJob);
        resolve(newJob);
      }, 200);
    });
  },

  async update(id: string, updates: Partial<Job>): Promise<Job | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const updatedJob = storage.updateInCollection<Job>(COLLECTIONS.JOBS, id, updates);
        resolve(updatedJob);
      }, 200);
    });
  },

  async delete(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const deleted = storage.removeFromCollection<Job>(COLLECTIONS.JOBS, id);
        resolve(deleted);
      }, 200);
    });
  },

  async search(query: {
    keywords?: string[];
    location?: string;
    employment_type?: string;
    salary_min?: number;
    salary_max?: number;
  }): Promise<Job[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filteredJobs = storage.getCollection<Job>(COLLECTIONS.JOBS);

        if (query.keywords && query.keywords.length > 0) {
          filteredJobs = filteredJobs.filter(job => 
            query.keywords!.some(keyword => 
              job.title.toLowerCase().includes(keyword.toLowerCase()) ||
              job.description.toLowerCase().includes(keyword.toLowerCase())
            )
          );
        }

        if (query.location) {
          filteredJobs = filteredJobs.filter(job => 
            job.location?.toLowerCase().includes(query.location!.toLowerCase())
          );
        }

        if (query.employment_type) {
          filteredJobs = filteredJobs.filter(job => 
            job.employment_type === query.employment_type
          );
        }

        if (query.salary_min) {
          filteredJobs = filteredJobs.filter(job => 
            job.salary_max && job.salary_max >= query.salary_min!
          );
        }

        if (query.salary_max) {
          filteredJobs = filteredJobs.filter(job => 
            job.salary_min && job.salary_min <= query.salary_max!
          );
        }

        const companies = storage.getCollection<Company>(COLLECTIONS.COMPANIES);
        const jobsWithCompanies = filteredJobs.map(job => ({
          ...job,
          company: companies.find(c => c.id === job.company_id)
        }));

        resolve(jobsWithCompanies);
      }, 300);
    });
  }
};