export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';
export type UserRole = 'admin' | 'recruiter' | 'viewer';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship';
export type JobMatchStatus = 'applied' | 'interviewing' | 'offered' | 'rejected' | 'hired';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type CandidateStatus = 'new' | 'reviewed' | 'interviewed' | 'offered' | 'hired' | 'rejected';

// Additional user management types
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type UserPermission = 'read' | 'write' | 'delete' | 'admin';

export interface UserProfile {
  id: string;
  user_id: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  timezone?: string;
  last_login?: Date;
  login_count: number;
  preferences?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
  user?: User;
}

export interface UserInvitation {
  id: string;
  company_id: string;
  email: string;
  role: UserRole;
  invited_by: string;
  expires_at: Date;
  accepted_at?: Date;
  created_at: Date;
  inviter?: User;
  company?: Company;
}

export type Analysis = {
  skills_match: number;
  experience_match: number;
  education_match: number;
  salary_expectations: number;
};

export interface Company {
  id: string;
  name: string;
  slug: string;
  subscription_plan: SubscriptionPlan;
  max_users: number;
  max_jobs_per_month: number;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface User {
  id: string;
  company_id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  status?: UserStatus;
  last_login?: Date;
  login_count?: number;
  company?: Company;
  profile?: UserProfile;
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  description: string;
  location?: string;
  employment_type?: EmploymentType;
  salary_min?: number;
  salary_max?: number;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  company?: Company;
}

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  skills?: string[];
  experience_years?: number;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface JobMatch {
  id: string;
  job_id: string;
  candidate_id: string;
  status: JobMatchStatus;
  score?: number;
  analysis?: Analysis;
  created_at: Date;
  updated_at: Date;
  job?: Job;
  candidate?: Candidate;
  ai_summary?: string;
}

export interface AIProcessingQueue {
  id: string;
  job_id: string;
  candidate_id: string;
  status: ProcessingStatus;
  result?: any;
  created_at: Date;
  updated_at: Date;
  job?: Job;
  candidate?: Candidate;
}

export interface BatchUpload {
  id: string;
  company_id: string;
  job_id: string;
  file_name: string;
  file_size?: number;
  uploaded_by: string;
  status: ProcessingStatus;
  total_candidates?: number;
  processed_candidates?: number;
  successful_candidates?: number;
  failed_candidates?: number;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
  job?: Job;
  uploader?: User;
  batch_candidates?: BatchCandidate[];
}

export interface BatchCandidate {
  id: string;
  batch_upload_id: string;
  candidate_id?: string;
  file_name: string;
  status: ProcessingStatus;
  error_message?: string;
  ai_processing_id?: string;
  created_at: Date;
  updated_at: Date;
  candidate?: Candidate;
  ai_processing?: AIProcessingQueue;
}

export interface BatchUploadSummary {
  total_uploads: number;
  pending_uploads: number;
  processing_uploads: number;
  completed_uploads: number;
  failed_uploads: number;
  total_candidates_processed: number;
  recent_uploads: BatchUpload[];
}
export interface APIUsage {
  id: string;
  company_id: string;
  user_id: string;
  endpoint: string;
  request_payload?: any;
  response_payload?: any;
  status_code: number;
  created_at: Date;
  company?: Company;
  user?: User;
}