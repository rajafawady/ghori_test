import { User } from '@/types/index';
import { mockUsers, mockCompanies } from '@/lib/mockData';

let users = [...mockUsers];

export const userService = {
  async getAll(): Promise<User[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const usersWithCompanies = users.map(user => ({
          ...user,
          company: mockCompanies.find(c => c.id === user.company_id)
        }));
        resolve(usersWithCompanies);
      }, 100);
    });
  },

  async getById(id: string): Promise<User | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = users.find(u => u.id === id);
        if (user) {
          const userWithCompany = {
            ...user,
            company: mockCompanies.find(c => c.id === user.company_id)
          };
          resolve(userWithCompany);
        } else {
          resolve(null);
        }
      }, 100);
    });
  },

  async getByCompany(companyId: string): Promise<User[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const companyUsers = users
          .filter(u => u.company_id === companyId)
          .map(user => ({
            ...user,
            company: mockCompanies.find(c => c.id === user.company_id)
          }));
        resolve(companyUsers);
      }, 100);
    });
  },

  async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser: User = {
          ...user,
          id: `user-${Date.now()}`,
          created_at: new Date(),
          updated_at: new Date()
        };
        users.push(newUser);
        resolve(newUser);
      }, 200);
    });
  },

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
          users[index] = { 
            ...users[index], 
            ...updates, 
            updated_at: new Date() 
          };
          resolve(users[index]);
        } else {
          resolve(null);
        }
      }, 200);
    });
  },

  async delete(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
          users.splice(index, 1);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 200);
    });
  }
};