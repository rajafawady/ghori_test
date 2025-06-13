export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';
export type UserRole = 'admin' | 'recruiter' | 'viewer';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship';
export type JobMatchStatus = 'applied' | 'interviewing' | 'offered' | 'rejected' | 'hired';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type CandidateStatus = 'new' | 'reviewed' | 'interviewed' | 'offered' | 'hired' | 'rejected';

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
  company?: Company;
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
  analysis?: any;
  created_at: Date;
  updated_at: Date;
  job?: Job;
  candidate?: Candidate;
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

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string;
  details?: any;
  created_at: Date;
  user?: User;
}

export interface BatchUpload {
  id: string;
  company_id: string;
  job_id: string;
  file_name: string;
  uploaded_by: string;
  status: ProcessingStatus;
  created_at: Date;
  updated_at: Date;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  query: any;
  created_at: Date;
  updated_at: Date;
  user?: User;
}

export interface CandidateTag {
  id: string;
  candidate_id: string;
  tag: string;
  created_at: Date;
  candidate?: Candidate;
}

export interface ProcessingMetric {
  id: string;
  job_id: string;
  candidate_id: string;
  metric: string;
  value: number;
  created_at: Date;
  job?: Job;
  candidate?: Candidate;
}

export interface CandidateStatusHistory {
  id: string;
  candidate_id: string;
  status: CandidateStatus;
  updated_by: string;
  updated_at: Date;
  candidate?: Candidate;
  updater?: User;
}

export interface CandidateComment {
  id: string;
  candidate_id: string;
  user_id: string;
  comment: string;
  created_at: Date;
  candidate?: Candidate;
  user?: User;
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