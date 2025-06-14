import { BatchUpload, BatchCandidate, BatchUploadSummary, ProcessingStatus, Job, User, Candidate } from '@/types';
import { storage, COLLECTIONS } from '@/lib/storage';
import { candidateService } from './candidateService';
import { jobMatchService } from './jobMatchService';
import { v4 as uuidv4 } from 'uuid';

export const batchUploadService = {
  async getAllBatchUploads(): Promise<BatchUpload[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const batchUploads = storage.getCollection<BatchUpload>(COLLECTIONS.BATCH_UPLOADS);
        const jobs = storage.getCollection<Job>(COLLECTIONS.JOBS);
        const users = storage.getCollection<User>(COLLECTIONS.USERS);
        
        const uploadsWithRelations = batchUploads.map(upload => ({
          ...upload,
          job: jobs.find(j => j.id === upload.job_id),
          uploader: users.find(u => u.id === upload.uploaded_by)
        }));
        
        resolve(uploadsWithRelations);
      }, 100);
    });
  },

  async getBatchUploadById(id: string): Promise<BatchUpload | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const upload = storage.getFromCollection<BatchUpload>(COLLECTIONS.BATCH_UPLOADS, id);
        if (upload) {
          const jobs = storage.getCollection<Job>(COLLECTIONS.JOBS);
          const users = storage.getCollection<User>(COLLECTIONS.USERS);
          const batchCandidates = storage.searchCollection<BatchCandidate>(
            COLLECTIONS.BATCH_CANDIDATES,
            candidate => candidate.batch_upload_id === id
          );
          
          const uploadWithRelations = {
            ...upload,
            job: jobs.find(j => j.id === upload.job_id),
            uploader: users.find(u => u.id === upload.uploaded_by),
            batch_candidates: batchCandidates
          };
          
          resolve(uploadWithRelations);
        } else {
          resolve(null);
        }
      }, 100);
    });
  },
  async getBatchUploadsByJob(jobId: string): Promise<BatchUpload[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const batchUploads = storage.searchCollection<BatchUpload>(
          COLLECTIONS.BATCH_UPLOADS,
          upload => upload.job_id === jobId
        );
        
        const jobs = storage.getCollection<Job>(COLLECTIONS.JOBS);
        const users = storage.getCollection<User>(COLLECTIONS.USERS);
        
        const uploadsWithRelations = batchUploads.map(upload => ({
          ...upload,
          job: jobs.find(j => j.id === upload.job_id),
          uploader: users.find(u => u.id === upload.uploaded_by)
        }));
        
        resolve(uploadsWithRelations);
      }, 100);
    });
  },

  async getBatchUploads(companyId: string, jobId?: string): Promise<BatchUpload[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let batchUploads = storage.searchCollection<BatchUpload>(
          COLLECTIONS.BATCH_UPLOADS,
          upload => upload.company_id === companyId
        );
        
        // Filter by job if specified
        if (jobId) {
          batchUploads = batchUploads.filter(upload => upload.job_id === jobId);
        }
        
        const jobs = storage.getCollection<Job>(COLLECTIONS.JOBS);
        const users = storage.getCollection<User>(COLLECTIONS.USERS);
        
        const uploadsWithRelations = batchUploads.map(upload => ({
          ...upload,
          job: jobs.find(j => j.id === upload.job_id),
          uploader: users.find(u => u.id === upload.uploaded_by)
        }));
        
        resolve(uploadsWithRelations);
      }, 100);
    });
  },  
  
  async createBatchUpload(
    companyId: string,
    jobId: string,
    fileName: string,
    uploadedBy: string,
    fileSize?: number
  ): Promise<BatchUpload> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUpload: BatchUpload = {
          id: uuidv4(),
          company_id: companyId,
          job_id: jobId,
          file_name: fileName,
          file_size: fileSize,
          uploaded_by: uploadedBy,
          status: 'pending',
          total_candidates: 0,
          processed_candidates: 0,
          successful_candidates: 0,
          failed_candidates: 0,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        // Determine candidate count based on file type
        let candidateCount = 1;
        if (fileName.endsWith('.zip')) {
          candidateCount = Math.floor(Math.random() * 5) + 3; // 3-7 candidates
        } else if (fileName.endsWith('.csv') || fileName.endsWith('.xlsx')) {
          candidateCount = Math.floor(Math.random() * 10) + 5; // 5-14 candidates
        }
        
        newUpload.total_candidates = candidateCount;
        
        storage.addToCollection(COLLECTIONS.BATCH_UPLOADS, newUpload);
        
        // Notify subscribers of the new upload
        this._notifySubscribers();

        // Start simulation process
        this._simulateUploadProcess(newUpload.id, candidateCount, fileName);
        
        resolve(newUpload);
      }, 200);
    });
  },

  _simulateUploadProcess(uploadId: string, candidateCount: number, fileName: string): void {
    // Step 1: Move to processing after 1 second
    setTimeout(() => {
      storage.updateInCollection<BatchUpload>(
        COLLECTIONS.BATCH_UPLOADS,
        uploadId,
        { status: 'processing', updated_at: new Date() }
      );
      this._notifySubscribers();
      
      // Step 2: Simulate processing individual candidates
      this._simulateCandidateProcessing(uploadId, candidateCount, fileName);
    }, 1000);
  },
  _simulateCandidateProcessing(uploadId: string, candidateCount: number, fileName: string): void {
    let processedCount = 0;
    let successfulCount = 0;
    const createdCandidateIds: string[] = [];
    
    const processInterval = setInterval(async () => {
      processedCount++;
      
      // Simulate some failures (10% chance)
      const isSuccess = Math.random() > 0.1;
      let candidateId: string | undefined;
      
      if (isSuccess) {
        successfulCount++;
        
        // Create a real candidate
        try {
          const candidateNames = [
            'Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Brown', 'Emma Davis',
            'Frank Miller', 'Grace Wilson', 'Henry Moore', 'Ivy Taylor', 'Jack Anderson',
            'Kate Thompson', 'Liam Garcia', 'Maya Martinez', 'Noah Robinson', 'Olivia Clark',
            'Paul Rodriguez', 'Quinn Lewis', 'Ruby Lee', 'Sam Walker', 'Tara Hall'
          ];
          
          const skills = [
            ['JavaScript', 'React', 'Node.js'],
            ['Python', 'Django', 'PostgreSQL'],
            ['Java', 'Spring Boot', 'MySQL'],
            ['C#', '.NET', 'SQL Server'],
            ['TypeScript', 'Angular', 'MongoDB'],
            ['PHP', 'Laravel', 'Redis'],
            ['Go', 'Docker', 'Kubernetes'],
            ['Rust', 'WebAssembly', 'GraphQL']
          ];
          
          const randomName = candidateNames[Math.floor(Math.random() * candidateNames.length)];
          const randomSkills = skills[Math.floor(Math.random() * skills.length)];
          
          const newCandidate = await candidateService.create({
            full_name: `${randomName} (Batch ${processedCount})`,
            email: `${randomName.toLowerCase().replace(' ', '.')}${processedCount}@example.com`,
            phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
            resume_url: fileName.endsWith('.zip') 
              ? `/resumes/dummy.pdf`
              : `/resumes/dummy.pdf`,
            skills: randomSkills,
            experience_years: Math.floor(Math.random() * 10) + 1,
            is_active: true
          });
          
          candidateId = newCandidate.id;
          createdCandidateIds.push(candidateId);
        } catch (error) {
          console.error('Failed to create candidate:', error);
          candidateId = undefined;
        }
      }
      
      // Create a mock batch candidate entry
      const candidateName = fileName.endsWith('.zip') 
        ? `candidate_${processedCount}.pdf`
        : fileName.endsWith('.csv') || fileName.endsWith('.xlsx')
        ? `row_${processedCount}`
        : fileName;
        
      const batchCandidate: BatchCandidate = {
        id: uuidv4(),
        batch_upload_id: uploadId,
        candidate_id: candidateId,
        file_name: candidateName,
        status: isSuccess ? 'completed' : 'failed',
        error_message: isSuccess ? undefined : 'Processing failed',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      storage.addToCollection(COLLECTIONS.BATCH_CANDIDATES, batchCandidate);
      
      // Update batch upload progress
      storage.updateInCollection<BatchUpload>(
        COLLECTIONS.BATCH_UPLOADS,
        uploadId,
        {
          processed_candidates: processedCount,
          successful_candidates: successfulCount,
          failed_candidates: processedCount - successfulCount,
          updated_at: new Date()
        }
      );
      
      this._notifySubscribers();
      
      // Check if processing is complete
      if (processedCount >= candidateCount) {
        clearInterval(processInterval);
        
        // Final status update and create job matches
        setTimeout(async () => {
          storage.updateInCollection<BatchUpload>(
            COLLECTIONS.BATCH_UPLOADS,
            uploadId,
            {
              status: 'completed',
              updated_at: new Date()
            }
          );
          
          // Create job matches for all successful candidates
          if (createdCandidateIds.length > 0) {
            try {
              const batchUpload = storage.getFromCollection<BatchUpload>(COLLECTIONS.BATCH_UPLOADS, uploadId);
              if (batchUpload?.job_id) {
                await jobMatchService.bulkCreateMatches(batchUpload.job_id, createdCandidateIds);
                console.log(`✅ Created ${createdCandidateIds.length} job matches for batch upload ${uploadId}`);
              }
            } catch (error) {
              console.error('Failed to create job matches:', error);
            }
          }
          
          this._notifySubscribers();
        }, 500);
      }
    }, 800); // Process one candidate every 800ms
  },
  async updateBatchUploadStatus(
    id: string,
    status: ProcessingStatus,
    updates?: Partial<BatchUpload>
  ): Promise<BatchUpload | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const updatedUpload = storage.updateInCollection<BatchUpload>(
          COLLECTIONS.BATCH_UPLOADS,
          id,
          { status, ...updates }
        );
        
        // Notify subscribers of the update
        this._notifySubscribers();
        
        resolve(updatedUpload);
      }, 100);
    });
  },

  async getBatchUploadSummary(companyId: string): Promise<BatchUploadSummary> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const uploads = storage.searchCollection<BatchUpload>(
          COLLECTIONS.BATCH_UPLOADS,
          upload => upload.company_id === companyId
        );

        const summary: BatchUploadSummary = {
          total_uploads: uploads.length,
          pending_uploads: uploads.filter(u => u.status === 'pending').length,
          processing_uploads: uploads.filter(u => u.status === 'processing').length,
          completed_uploads: uploads.filter(u => u.status === 'completed').length,
          failed_uploads: uploads.filter(u => u.status === 'failed').length,
          total_candidates_processed: uploads.reduce((sum, u) => sum + (u.processed_candidates || 0), 0),
          recent_uploads: uploads
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
        };

        resolve(summary);
      }, 150);
    });
  },

  async getBatchCandidates(batchUploadId: string): Promise<BatchCandidate[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const batchCandidates = storage.searchCollection<BatchCandidate>(
          COLLECTIONS.BATCH_CANDIDATES,
          candidate => candidate.batch_upload_id === batchUploadId
        );
        
        const candidates = storage.getCollection<Candidate>(COLLECTIONS.CANDIDATES);
        
        const candidatesWithRelations = batchCandidates.map(batchCandidate => ({
          ...batchCandidate,
          candidate: candidates.find(c => c.id === batchCandidate.candidate_id)
        }));
        
        resolve(candidatesWithRelations);
      }, 100);
    });
  },

  async addBatchCandidate(
    batchUploadId: string,
    fileName: string,
    candidateId?: string
  ): Promise<BatchCandidate> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newBatchCandidate: BatchCandidate = {
          id: uuidv4(),
          batch_upload_id: batchUploadId,
          candidate_id: candidateId,
          file_name: fileName,
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date()
        };
        
        storage.addToCollection(COLLECTIONS.BATCH_CANDIDATES, newBatchCandidate);
          // Update batch upload totals
        const upload = storage.getFromCollection<BatchUpload>(COLLECTIONS.BATCH_UPLOADS, batchUploadId);
        if (upload) {
          storage.updateInCollection<BatchUpload>(
            COLLECTIONS.BATCH_UPLOADS,
            batchUploadId,
            { total_candidates: (upload.total_candidates || 0) + 1 }
          );
        }
        
        // Notify subscribers of the update
        this._notifySubscribers();
        
        resolve(newBatchCandidate);
      }, 100);
    });
  },

  async updateBatchCandidateStatus(
    id: string,
    status: ProcessingStatus,
    errorMessage?: string,
    candidateId?: string
  ): Promise<BatchCandidate | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const updates: Partial<BatchCandidate> = { status };
        if (errorMessage) updates.error_message = errorMessage;
        if (candidateId) updates.candidate_id = candidateId;
        
        const updatedCandidate = storage.updateInCollection<BatchCandidate>(
          COLLECTIONS.BATCH_CANDIDATES,
          id,
          updates
        );
          if (updatedCandidate) {
          // Update batch upload counters
          const upload = storage.getFromCollection<BatchUpload>(
            COLLECTIONS.BATCH_UPLOADS, 
            updatedCandidate.batch_upload_id
          );
          
          if (upload) {
            const processed = (upload.processed_candidates || 0) + 1;
            const successful = status === 'completed' 
              ? (upload.successful_candidates || 0) + 1 
              : upload.successful_candidates || 0;
            const failed = status === 'failed' 
              ? (upload.failed_candidates || 0) + 1 
              : upload.failed_candidates || 0;
            
            storage.updateInCollection<BatchUpload>(
              COLLECTIONS.BATCH_UPLOADS,
              updatedCandidate.batch_upload_id,
              { 
                processed_candidates: processed,
                successful_candidates: successful,
                failed_candidates: failed
              }
            );
          }
          
          // Notify subscribers of the update
          this._notifySubscribers();
        }
        
        resolve(updatedCandidate);
      }, 100);
    });
  },
  async deleteBatchUpload(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Delete associated batch candidates first
        const batchCandidates = storage.searchCollection<BatchCandidate>(
          COLLECTIONS.BATCH_CANDIDATES,
          candidate => candidate.batch_upload_id === id
        );
        
        batchCandidates.forEach(candidate => {
          storage.removeFromCollection<BatchCandidate>(COLLECTIONS.BATCH_CANDIDATES, candidate.id);
        });
        
        // Delete the batch upload
        const deleted = storage.removeFromCollection<BatchUpload>(COLLECTIONS.BATCH_UPLOADS, id);
        
        // Notify subscribers of the change
        this._notifySubscribers();
        
        resolve(deleted);
      }, 200);
    });  },

  async retryFailedUpload(id: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Reset the upload to pending status and restart the simulation
        const upload = storage.getFromCollection<BatchUpload>(COLLECTIONS.BATCH_UPLOADS, id);
        if (upload) {
          storage.updateInCollection<BatchUpload>(
            COLLECTIONS.BATCH_UPLOADS,
            id,
            { 
              status: 'pending',
              processed_candidates: 0,
              successful_candidates: 0,
              failed_candidates: 0,
              updated_at: new Date()
            }
          );
          
          // Notify subscribers
          this._notifySubscribers();
          
          // Restart the simulation
          setTimeout(() => {
            storage.updateInCollection<BatchUpload>(
              COLLECTIONS.BATCH_UPLOADS,
              id,
              { status: 'processing', updated_at: new Date() }
            );
            this._notifySubscribers();
          }, 1000);

          setTimeout(() => {
            storage.updateInCollection<BatchUpload>(
              COLLECTIONS.BATCH_UPLOADS,
              id,
              { 
                status: 'completed', 
                updated_at: new Date(),
                processed_candidates: upload.total_candidates || 0,
                successful_candidates: upload.total_candidates || 0
              }
            );
            this._notifySubscribers();
          }, 3000);
        }
        
        resolve();
      }, 100);
    });
  },

  async cancelUpload(id: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const updatedUpload = storage.updateInCollection<BatchUpload>(
          COLLECTIONS.BATCH_UPLOADS,
          id,
          { 
            status: 'failed',
            updated_at: new Date(),
            error_message: 'Upload cancelled by user'
          }
        );
        
        if (updatedUpload) {
          // Notify subscribers of the change
          this._notifySubscribers();
        }
        
        resolve();
      }, 100);
    });
  },

  // Subscription management for real-time updates
  _subscribers: [] as Array<(uploads: BatchUpload[]) => void>,

  subscribeToUploads(callback: (uploads: BatchUpload[]) => void): () => void {
    this._subscribers.push(callback);
    
    // Immediately send current uploads
    this.getAllBatchUploads().then(uploads => {
      callback(uploads);
    });
    
    // Return unsubscribe function
    return () => {
      const index = this._subscribers.indexOf(callback);
      if (index > -1) {
        this._subscribers.splice(index, 1);
      }
    };
  },

  _notifySubscribers(): void {
    this.getAllBatchUploads().then(uploads => {
      this._subscribers.forEach(callback => {
        try {
          callback(uploads);
        } catch (error) {
          console.error('Error in batch upload subscriber:', error);
        }
      });
    });
  }
};