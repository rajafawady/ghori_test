import { Company } from '@/types/index';
import { mockCompanies } from '@/lib/mockData';

const companies = [...mockCompanies];

export const companyService = {
  async getAll(): Promise<Company[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...companies]), 100);
    });
  },

  async getById(id: string): Promise<Company | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const company = companies.find(c => c.id === id) || null;
        resolve(company);
      }, 100);
    });
  },

  async create(company: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Promise<Company> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newCompany: Company = {
          ...company,
          id: `comp-${Date.now()}`,
          created_at: new Date(),
          updated_at: new Date()
        };
        companies.push(newCompany);
        resolve(newCompany);
      }, 200);
    });
  },

  async update(id: string, updates: Partial<Company>): Promise<Company | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = companies.findIndex(c => c.id === id);
        if (index !== -1) {
          companies[index] = { 
            ...companies[index], 
            ...updates, 
            updated_at: new Date() 
          };
          resolve(companies[index]);
        } else {
          resolve(null);
        }
      }, 200);
    });
  },

  async delete(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = companies.findIndex(c => c.id === id);
        if (index !== -1) {
          companies.splice(index, 1);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 200);
    });
  }
};