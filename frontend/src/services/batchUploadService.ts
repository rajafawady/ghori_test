import { BatchUpload, ProcessingStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Dummy data
const batchUploads: BatchUpload[] = [
  {
    id: uuidv4(),
    company_id: 'company1',
    job_id: 'job1',
    file_name: 'candidates_batch_1.csv',
    status: 'completed',
    uploaded_by: 'user1',
    created_at: new Date(),
    updated_at: new Date()
  }
];

type UploadSubscriber = (uploads: BatchUpload[]) => void;

class BatchUploadService {
  private subscribers: UploadSubscriber[] = [];
  private uploads: Map<string, BatchUpload> = new Map();

  subscribeToUploads(callback: UploadSubscriber) {
    this.subscribers.push(callback);
    callback(Array.from(this.uploads.values()));
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers() {
    const uploads = Array.from(this.uploads.values());
    this.subscribers.forEach(callback => callback(uploads));
  }

  async getBatchUploads(companyId: string, jobId?: string): Promise<BatchUpload[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return batchUploads.filter(upload => 
      upload.company_id === companyId && 
      (!jobId || upload.job_id === jobId)
    );
  }

  async getBatchUpload(id: string): Promise<BatchUpload> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const upload = batchUploads.find(u => u.id === id);
    if (!upload) throw new Error('Batch upload not found');
    return upload;
  }

  async createBatchUpload(
    companyId: string,
    fileName: string,
    uploadedBy: string,
    jobId: string
  ): Promise<BatchUpload> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const upload: BatchUpload = {
      id: uuidv4(),
      company_id: companyId,
      job_id: jobId,
      file_name: fileName,
      status: 'pending',
      uploaded_by: uploadedBy,
      created_at: new Date(),
      updated_at: new Date()
    };

    batchUploads.push(upload);
    this.uploads.set(upload.id, upload);
    this.notifySubscribers();

    // Simulate upload process
    setTimeout(() => {
      this.updateBatchStatus(upload.id, 'processing');
      
      setTimeout(() => {
        this.updateBatchStatus(upload.id, 'completed');
      }, 3000);
    }, 1000);

    return upload;
  }

  async updateBatchStatus(id: string, status: ProcessingStatus): Promise<BatchUpload> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const upload = batchUploads.find(u => u.id === id);
    if (!upload) throw new Error('Batch upload not found');

    upload.status = status;
    upload.updated_at = new Date();
    this.uploads.set(id, upload);
    this.notifySubscribers();

    return upload;
  }

  async cancelUpload(id: string): Promise<void> {
    const upload = this.uploads.get(id);
    if (!upload) throw new Error('Upload not found');

    upload.status = 'failed';
    upload.updated_at = new Date();
    this.uploads.set(id, upload);
    this.notifySubscribers();
  }

  async retryFailedUpload(id: string): Promise<BatchUpload> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const upload = batchUploads.find(u => u.id === id);
    if (!upload) throw new Error('Batch upload not found');

    upload.status = 'pending';
    upload.updated_at = new Date();
    this.uploads.set(id, upload);
    this.notifySubscribers();

    // Simulate retry process
    setTimeout(() => {
      this.updateBatchStatus(upload.id, 'processing');
      
      setTimeout(() => {
        this.updateBatchStatus(upload.id, 'completed');
      }, 3000);
    }, 1000);

    return upload;
  }
}

export const batchUploadService = new BatchUploadService(); 