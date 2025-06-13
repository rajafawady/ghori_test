import { Job } from '@/types/index';
import { mockJobs, mockCompanies } from '@/lib/mockData';

let jobs = [...mockJobs];

export const jobService = {
  async getAll(): Promise<Job[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const jobsWithCompanies = jobs.map(job => ({
          ...job,
          company: mockCompanies.find(c => c.id === job.company_id)
        }));
        resolve(jobsWithCompanies);
      }, 100);
    });
  },

  async getById(id: string): Promise<Job | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const job = jobs.find(j => j.id === id);
        if (job) {
          const jobWithCompany = {
            ...job,
            company: mockCompanies.find(c => c.id === job.company_id)
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
        const companyJobs = jobs
          .filter(j => j.company_id === companyId)
          .map(job => ({
            ...job,
            company: mockCompanies.find(c => c.id === job.company_id)
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
          id: `job-${Date.now()}`,
          created_at: new Date(),
          updated_at: new Date()
        };
        jobs.push(newJob);
        resolve(newJob);
      }, 200);
    });
  },

  async update(id: string, updates: Partial<Job>): Promise<Job | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = jobs.findIndex(j => j.id === id);
        if (index !== -1) {
          jobs[index] = { 
            ...jobs[index], 
            ...updates, 
            updated_at: new Date() 
          };
          resolve(jobs[index]);
        } else {
          resolve(null);
        }
      }, 200);
    });
  },

  async delete(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = jobs.findIndex(j => j.id === id);
        if (index !== -1) {
          jobs.splice(index, 1);
          resolve(true);
        } else {
          resolve(false);
        }
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
        let filteredJobs = [...jobs];

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

        const jobsWithCompanies = filteredJobs.map(job => ({
          ...job,
          company: mockCompanies.find(c => c.id === job.company_id)
        }));

        resolve(jobsWithCompanies);
      }, 300);
    });
  }
};