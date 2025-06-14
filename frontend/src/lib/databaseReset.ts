import { storage, COLLECTIONS } from './storage';
import { 
  mockCompanies, 
  mockUsers, 
  mockJobs, 
  mockCandidates,
  mockAPIUsage
} from './mockData';

/**
 * Database reset and reinitialization service
 */
export class DatabaseResetService {
  /**
   * Completely clears all data from localStorage
   */
  clearAllData(): void {
    console.log('🗑️ Clearing all data from localStorage...');
    
    // Clear all known collections
    Object.values(COLLECTIONS).forEach(collection => {
      storage.clearCollection(collection);
    });
    
    // Also clear any additional localStorage items with our prefix
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('job-matcher:')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`✅ Cleared ${keysToRemove.length} localStorage items`);
  }

  /**
   * Reinitializes all collections with fresh mock data
   */
  initializeWithMockData(): void {
    console.log('🔄 Initializing database with fresh mock data...');
    
    // Initialize core data
    storage.setCollection(COLLECTIONS.COMPANIES, mockCompanies);
    console.log(`✅ Initialized ${mockCompanies.length} companies`);
    
    storage.setCollection(COLLECTIONS.USERS, mockUsers);
    console.log(`✅ Initialized ${mockUsers.length} users`);
    
    storage.setCollection(COLLECTIONS.JOBS, mockJobs);
    console.log(`✅ Initialized ${mockJobs.length} jobs`);
    
    storage.setCollection(COLLECTIONS.CANDIDATES, mockCandidates);
    console.log(`✅ Initialized ${mockCandidates.length} candidates`);
    
    // Initialize additional data
    // storage.setCollection(COLLECTIONS.JOB_MATCHES, mockJobMatches);
    // console.log(`✅ Initialized ${mockJobMatches.length} job matches`);
    
    // storage.setCollection(COLLECTIONS.AI_PROCESSING_QUEUE, mockAIProcessingQueue);
    // console.log(`✅ Initialized ${mockAIProcessingQueue.length} AI processing queue items`);
    
    // storage.setCollection(COLLECTIONS.AUDIT_LOGS, mockAuditLogs);
    // console.log(`✅ Initialized ${mockAuditLogs.length} audit logs`);
    
    // storage.setCollection(COLLECTIONS.BATCH_UPLOADS, mockBatchUploads);
    // console.log(`✅ Initialized ${mockBatchUploads.length} batch uploads`);
    
    // storage.setCollection(COLLECTIONS.SAVED_SEARCHES, mockSavedSearches);
    // console.log(`✅ Initialized ${mockSavedSearches.length} saved searches`);
    
    // storage.setCollection(COLLECTIONS.CANDIDATE_TAGS, mockCandidateTags);
    // console.log(`✅ Initialized ${mockCandidateTags.length} candidate tags`);
    
    // storage.setCollection(COLLECTIONS.PROCESSING_METRICS, mockProcessingMetrics);
    // console.log(`✅ Initialized ${mockProcessingMetrics.length} processing metrics`);
    
    // storage.setCollection(COLLECTIONS.CANDIDATE_STATUS_HISTORY, mockCandidateStatusHistory);
    // console.log(`✅ Initialized ${mockCandidateStatusHistory.length} candidate status history items`);
    
    // storage.setCollection(COLLECTIONS.CANDIDATE_COMMENTS, mockCandidateComments);
    // console.log(`✅ Initialized ${mockCandidateComments.length} candidate comments`);
    
    storage.setCollection(COLLECTIONS.API_USAGE, mockAPIUsage);
    console.log(`✅ Initialized ${mockAPIUsage.length} API usage records`);
    
    // // Initialize empty collections for other data
    // storage.setCollection(COLLECTIONS.BATCH_CANDIDATES, []);
    // console.log(`✅ Initialized empty batch candidates collection`);
  }

  /**
   * Complete database reset: clear all data and reinitialize with mock data
   */
  resetDatabase(): void {
    console.log('Starting complete database reset...');
    
    this.clearAllData();
    this.initializeWithMockData();
    
    console.log('Database reset completed successfully!');
  }

  /**
   * Get database statistics
   */
  getDatabaseStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  
  const collectionsToInclude = ['candidates', 'jobs', 'users', 'api_usage', 'batch_uploads', 'job_matches', 'batch_candidates'];
  
  Object.entries(COLLECTIONS).forEach(([key, collection]) => {
    if (collectionsToInclude.includes(collection)) {
    stats[key] = storage.getCollectionSize(collection);
   }} );
    
    return stats;
  }

  /**
   * Export all data for backup
   */
  exportAllData(): Record<string, any[]> {
    const exportData: Record<string, any[]> = {};

    ['candidates', 'jobs', 'users', 'api_usage', 'batch_uploads', 'job_matches', 'batch_candidates'].forEach(collection => {
      exportData[collection] = storage.getCollection(collection);
    });
    
    return exportData;
  }
}

// Export singleton instance
export const databaseResetService = new DatabaseResetService();
