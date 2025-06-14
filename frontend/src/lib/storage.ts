/**
 * Client-side persistent storage utility using localStorage with JSON serialization
 * Provides a simple database-like interface for persistent data storage
 */

export class LocalStorage {
  private prefix: string;

  constructor(prefix: string = 'job-matcher') {
    this.prefix = prefix;
  }
  private getKey(collection: string): string {
    return `${this.prefix}:${collection}`;
  }
  // Convert date strings back to Date objects for known date fields
  private convertDates<T>(items: T[]): T[] {
    const dateFields = ['created_at', 'updated_at', 'upload_date', 'processed_at', 'completed_at'];
    
    return items.map(item => {
      if (typeof item === 'object' && item !== null) {
        const convertedItem = { ...item } as any;
        
        dateFields.forEach(field => {
          if (convertedItem[field] && typeof convertedItem[field] === 'string') {
            try {
              convertedItem[field] = new Date(convertedItem[field]);
            } catch (error) {
              console.warn(`Failed to convert ${field} to Date:`, convertedItem[field]);
            }
          }
        });
        
        return convertedItem;
      }
      return item;
    });
  }

  // Get all items from a collection
  getCollection<T>(collection: string): T[] {
    try {
      const data = localStorage.getItem(this.getKey(collection));
      const items = data ? JSON.parse(data) : [];
      return this.convertDates(items);
    } catch (error) {
      console.error(`Error reading collection ${collection}:`, error);
      return [];
    }
  }

  // Set entire collection
  setCollection<T>(collection: string, items: T[]): void {
    try {
      localStorage.setItem(this.getKey(collection), JSON.stringify(items));
    } catch (error) {
      console.error(`Error writing collection ${collection}:`, error);
    }
  }
  // Add item to collection
  addToCollection<T extends { id: string; created_at?: Date; updated_at?: Date }>(collection: string, item: T): T {
    const items = this.getCollection<T>(collection);
    const newItem = {
      ...item,
      created_at: item.created_at || new Date(),
      updated_at: new Date()
    } as T;
    items.push(newItem);
    this.setCollection(collection, items);
    return newItem;
  }

  // Update item in collection
  updateInCollection<T extends { id: string }>(
    collection: string, 
    id: string, 
    updates: Partial<T>
  ): T | null {
    const items = this.getCollection<T>(collection);
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) return null;
    
    items[index] = {
      ...items[index],
      ...updates,
      updated_at: new Date()
    } as T;
    
    this.setCollection(collection, items);
    return items[index];
  }
  // Remove item from collection
  removeFromCollection<T extends { id: string }>(collection: string, id: string): boolean {
    const items = this.getCollection<T>(collection);
    const initialLength = items.length;
    const filteredItems = items.filter(item => item.id !== id);
    
    if (filteredItems.length !== initialLength) {
      this.setCollection(collection, filteredItems);
      return true;
    }
    return false;
  }

  // Get item by ID from collection
  getFromCollection<T extends { id: string }>(collection: string, id: string): T | null {
    const items = this.getCollection<T>(collection);
    return items.find(item => item.id === id) || null;
  }

  // Search items in collection
  searchCollection<T>(
    collection: string, 
    predicate: (item: T) => boolean
  ): T[] {
    const items = this.getCollection<T>(collection);
    return items.filter(predicate);
  }

  // Clear entire collection
  clearCollection(collection: string): void {
    localStorage.removeItem(this.getKey(collection));
  }

  // Initialize collections with default data if empty
  initializeCollection<T>(collection: string, defaultData: T[]): void {
    const existing = this.getCollection(collection);
    if (existing.length === 0) {
      this.setCollection(collection, defaultData);
    }
  }

  // Get collection size
  getCollectionSize(collection: string): number {
    return this.getCollection(collection).length;
  }

  // Check if collection exists and has data
  hasData(collection: string): boolean {
    return this.getCollectionSize(collection) > 0;
  }
}

// Export a default instance
export const storage = new LocalStorage();

// Collection names constants
export const COLLECTIONS = {
  COMPANIES: 'companies',
  USERS: 'users',
  JOBS: 'jobs',
  CANDIDATES: 'candidates',
  JOB_MATCHES: 'job_matches',
  BATCH_UPLOADS: 'batch_uploads',
  BATCH_CANDIDATES: 'batch_candidates',
  AI_PROCESSING_QUEUE: 'ai_processing_queue',
  AUDIT_LOGS: 'audit_logs',
  SAVED_SEARCHES: 'saved_searches',
  CANDIDATE_TAGS: 'candidate_tags',
  PROCESSING_METRICS: 'processing_metrics',
  CANDIDATE_STATUS_HISTORY: 'candidate_status_history',
  CANDIDATE_COMMENTS: 'candidate_comments',
  API_USAGE: 'api_usage'
} as const;
