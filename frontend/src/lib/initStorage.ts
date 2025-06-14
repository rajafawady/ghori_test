import { storage, COLLECTIONS } from './storage';
import { mockJobs, mockCompanies, mockUsers, mockCandidates } from './mockData';
import { BatchUpload, BatchCandidate } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Initialize persistent storage with sample data
 * This runs once when the app starts if storage is empty
 */
export function initializeStorage() {
  // Initialize companies
  if (!storage.hasData(COLLECTIONS.COMPANIES)) {
    storage.setCollection(COLLECTIONS.COMPANIES, mockCompanies);
    console.log('Initialized companies data');
  }

  // Initialize users
  if (!storage.hasData(COLLECTIONS.USERS)) {
    storage.setCollection(COLLECTIONS.USERS, mockUsers);
    console.log('Initialized users data');
  }

  // Initialize jobs
  if (!storage.hasData(COLLECTIONS.JOBS)) {
    storage.setCollection(COLLECTIONS.JOBS, mockJobs);
    console.log('Initialized jobs data');
  }

  // Initialize candidates
  if (!storage.hasData(COLLECTIONS.CANDIDATES)) {
    storage.setCollection(COLLECTIONS.CANDIDATES, mockCandidates);
    console.log('Initialized candidates data');
  }

  // Initialize batch uploads with sample data
  if (!storage.hasData(COLLECTIONS.BATCH_UPLOADS)) {
    const sampleBatchUploads: BatchUpload[] = [
      {
        id: uuidv4(),
        company_id: mockCompanies[0]?.id || 'company1',
        job_id: mockJobs[0]?.id || 'job1',
        file_name: 'candidates_batch_1.csv',
        file_size: 2048,
        status: 'completed',
        uploaded_by: mockUsers[0]?.id || 'user1',
        total_candidates: 10,
        processed_candidates: 10,
        successful_candidates: 8,
        failed_candidates: 2,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        updated_at: new Date(Date.now() - 23 * 60 * 60 * 1000)
      },
      {
        id: uuidv4(),
        company_id: mockCompanies[0]?.id || 'company1',
        job_id: mockJobs[1]?.id || 'job2',
        file_name: 'resumes_batch_2.zip',
        file_size: 15360,
        status: 'failed',
        uploaded_by: mockUsers[0]?.id || 'user1',
        total_candidates: 5,
        processed_candidates: 3,
        successful_candidates: 2,
        failed_candidates: 3,
        error_message: 'Some files could not be processed',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000)
      }
    ];
    storage.setCollection(COLLECTIONS.BATCH_UPLOADS, sampleBatchUploads);
    console.log('Initialized batch uploads data');
  }

  // Initialize batch candidates
  if (!storage.hasData(COLLECTIONS.BATCH_CANDIDATES)) {
    const batchUploads = storage.getCollection<BatchUpload>(COLLECTIONS.BATCH_UPLOADS);
    const sampleBatchCandidates: BatchCandidate[] = [
      {
        id: uuidv4(),
        batch_upload_id: batchUploads[0]?.id || 'batch1',
        candidate_id: mockCandidates[0]?.id || 'candidate1',
        file_name: 'john_doe_resume.pdf',
        status: 'completed',
        created_at: new Date(Date.now() - 23 * 60 * 60 * 1000),
        updated_at: new Date(Date.now() - 23 * 60 * 60 * 1000)
      },
      {
        id: uuidv4(),
        batch_upload_id: batchUploads[0]?.id || 'batch1',
        candidate_id: mockCandidates[1]?.id || 'candidate2',
        file_name: 'jane_smith_resume.pdf',
        status: 'completed',
        created_at: new Date(Date.now() - 23 * 60 * 60 * 1000),
        updated_at: new Date(Date.now() - 23 * 60 * 60 * 1000)
      },
      {
        id: uuidv4(),
        batch_upload_id: batchUploads[1]?.id || 'batch2',
        file_name: 'corrupted_resume.pdf',
        status: 'failed',
        error_message: 'File format not supported',
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000),
        updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000)
      }
    ];
    storage.setCollection(COLLECTIONS.BATCH_CANDIDATES, sampleBatchCandidates);
    console.log('Initialized batch candidates data');
  }

  // Initialize other collections as empty arrays
  const emptyCollections = [
    COLLECTIONS.JOB_MATCHES,
    COLLECTIONS.AI_PROCESSING_QUEUE,
    COLLECTIONS.AUDIT_LOGS,
    COLLECTIONS.SAVED_SEARCHES,
    COLLECTIONS.CANDIDATE_TAGS,
    COLLECTIONS.PROCESSING_METRICS,
    COLLECTIONS.CANDIDATE_STATUS_HISTORY,
    COLLECTIONS.CANDIDATE_COMMENTS,
    COLLECTIONS.API_USAGE
  ];

  emptyCollections.forEach(collection => {
    if (!storage.hasData(collection)) {
      storage.setCollection(collection, []);
    }
  });

  console.log('Storage initialization completed');
}

/**
 * Clear all storage data - useful for development/testing
 */
export function clearAllStorage() {
  Object.values(COLLECTIONS).forEach(collection => {
    storage.clearCollection(collection);
  });
  console.log('All storage data cleared');
}

/**
 * Get storage statistics
 */
export function getStorageStats() {
  return Object.entries(COLLECTIONS).reduce((stats, [name, collection]) => {
    stats[name] = storage.getCollectionSize(collection);
    return stats;
  }, {} as Record<string, number>);
}
