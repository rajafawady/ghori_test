import { User } from '@/types/index';
import { storage, COLLECTIONS } from '@/lib/storage';
import { mockCompanies } from '@/lib/mockData';

/**
 * User Service with persistent localStorage-based storage
 * 
 * Provides comprehensive user management functionality including:
 * - CRUD operations with automatic persistence
 * - Search and filtering capabilities
 * - Bulk operations for efficient data handling
 * - Analytics and statistics
 * - Company relationship management
 * 
 * All operations are asynchronous and simulate realistic database latency
 * Data is automatically persisted to localStorage and survives page refreshes
 */

// Helper function to validate user data
const validateUserData = (user: Partial<User>): string[] => {
  const errors: string[] = [];
  
  if (user.full_name !== undefined && !user.full_name?.trim()) {
    errors.push('Full name is required');
  }
  
  if (user.email !== undefined) {
    if (!user.email?.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      errors.push('Invalid email format');
    }
  }
  
  if (user.company_id !== undefined && !user.company_id?.trim()) {
    errors.push('Company ID is required');
  }
  
  return errors;
};

// Helper function to check if email is already taken
const isEmailTaken = async (email: string, excludeId?: string): Promise<boolean> => {
  const users = storage.getCollection<User>(COLLECTIONS.USERS);
  return users.some(u => 
    u.email.toLowerCase() === email.toLowerCase() && 
    u.id !== excludeId
  );
};

export const userService = {
  async getAll(): Promise<User[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = storage.getCollection<User>(COLLECTIONS.USERS);
        const usersWithCompanies = users.map((user: User) => ({
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
        const user = storage.getFromCollection<User>(COLLECTIONS.USERS, id);
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
        const companyUsers = storage
          .searchCollection<User>(COLLECTIONS.USERS, (u: User) => u.company_id === companyId)
          .map((user: User) => ({
            ...user,
            company: mockCompanies.find(c => c.id === user.company_id)
          }));
        resolve(companyUsers);
      }, 100);
    });
  },
  async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    return new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        try {
          // Validate user data
          const validationErrors = validateUserData(user);
          if (validationErrors.length > 0) {
            reject(new Error(`Validation failed: ${validationErrors.join(', ')}`));
            return;
          }

          // Check if email is already taken
          const emailTaken = await isEmailTaken(user.email);
          if (emailTaken) {
            reject(new Error('Email address is already in use'));
            return;
          }

          const newUser: User = {
            ...user,
            id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date(),
            updated_at: new Date()
          };
          
          const savedUser = storage.addToCollection<User>(COLLECTIONS.USERS, newUser);
          resolve(savedUser);
        } catch (error) {
          reject(error);
        }
      }, 200);
    });
  },

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    return new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        try {
          // Validate update data
          const validationErrors = validateUserData(updates);
          if (validationErrors.length > 0) {
            reject(new Error(`Validation failed: ${validationErrors.join(', ')}`));
            return;
          }

          // Check if email is already taken (if email is being updated)
          if (updates.email) {
            const emailTaken = await isEmailTaken(updates.email, id);
            if (emailTaken) {
              reject(new Error('Email address is already in use'));
              return;
            }
          }

          const updatedUser = storage.updateInCollection<User>(COLLECTIONS.USERS, id, updates);
          resolve(updatedUser);
        } catch (error) {
          reject(error);
        }
      }, 200);
    });
  },

  async delete(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = storage.removeFromCollection<User>(COLLECTIONS.USERS, id);
        resolve(success);
      }, 200);
    });
  },

  // Additional utility methods for better user management
  async getByEmail(email: string): Promise<User | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = storage.searchCollection<User>(
          COLLECTIONS.USERS, 
          (u: User) => u.email.toLowerCase() === email.toLowerCase()
        );
        const user = users.length > 0 ? users[0] : null;
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

  async getByRole(role: string): Promise<User[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const roleUsers = storage
          .searchCollection<User>(COLLECTIONS.USERS, (u: User) => u.role === role)
          .map((user: User) => ({
            ...user,
            company: mockCompanies.find(c => c.id === user.company_id)
          }));
        resolve(roleUsers);
      }, 100);
    });
  },

  async updateLastLogin(id: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = storage.getFromCollection<User>(COLLECTIONS.USERS, id);
        if (user) {
          storage.updateInCollection<User>(COLLECTIONS.USERS, id, {
            last_login: new Date(),
            login_count: (user.login_count || 0) + 1
          });
        }
        resolve();
      }, 100);
    });
  },
  async search(query: string): Promise<User[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const lowerQuery = query.toLowerCase();
        const matchingUsers = storage
          .searchCollection<User>(COLLECTIONS.USERS, (u: User) => 
            u.full_name.toLowerCase().includes(lowerQuery) ||
            u.email.toLowerCase().includes(lowerQuery) ||
            (u.profile?.phone?.includes(query) || false)
          )
          .map((user: User) => ({
            ...user,
            company: mockCompanies.find(c => c.id === user.company_id)
          }));
        resolve(matchingUsers);
      }, 150);
    });
  },

  // Bulk operations
  async bulkCreate(users: Omit<User, 'id' | 'created_at' | 'updated_at'>[]): Promise<User[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const createdUsers: User[] = [];
        users.forEach(user => {
          const newUser: User = {
            ...user,
            id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date(),
            updated_at: new Date()
          };
          const savedUser = storage.addToCollection<User>(COLLECTIONS.USERS, newUser);
          createdUsers.push(savedUser);
        });
        resolve(createdUsers);
      }, 300);
    });
  },

  async bulkUpdate(updates: { id: string; data: Partial<User> }[]): Promise<(User | null)[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const updatedUsers = updates.map(({ id, data }) => 
          storage.updateInCollection<User>(COLLECTIONS.USERS, id, data)
        );
        resolve(updatedUsers);
      }, 300);
    });
  },

  // Statistics and analytics
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
    byCompany: Record<string, number>;
  }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = storage.getCollection<User>(COLLECTIONS.USERS);
        const stats = {
          total: users.length,
          active: users.filter(u => u.is_active).length,
          inactive: users.filter(u => !u.is_active).length,
          byRole: users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          byCompany: users.reduce((acc, user) => {
            const company = mockCompanies.find(c => c.id === user.company_id);
            const companyName = company?.name || 'Unknown';
            acc[companyName] = (acc[companyName] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        };
        resolve(stats);
      }, 100);
    });
  },

  // Helper function to validate user data
  validateUserData(user: Partial<User>): string[] {
    const errors: string[] = [];
    
    if (user.full_name !== undefined && !user.full_name?.trim()) {
      errors.push('Full name is required');
    }
    
    if (user.email !== undefined) {
      if (!user.email?.trim()) {
        errors.push('Email is required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
        errors.push('Invalid email format');
      }
    }
    
    if (user.company_id !== undefined && !user.company_id?.trim()) {
      errors.push('Company ID is required');
    }
    
    return errors;
  },

  // Helper function to check if email is already taken
  async isEmailTaken(email: string, excludeId?: string): Promise<boolean> {
    const users = storage.getCollection<User>(COLLECTIONS.USERS);
    return users.some(u => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.id !== excludeId
    );
  }
};