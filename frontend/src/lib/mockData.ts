import { 
  Company, User, Job, Candidate, JobMatch, AIProcessingQueue, 
  UserActivity, BatchUpload, APIUsage
} from '@/types/index';

// Utility function to generate UUIDs
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Mock Companies
export const mockCompanies: Company[] = [
  {
    id: 'comp-1',
    name: 'TechCorp Solutions',
    slug: 'techcorp-solutions',
    subscription_plan: 'enterprise',
    max_users: 50,
    max_jobs_per_month: 100,
    created_at: new Date('2023-01-15'),
    updated_at: new Date('2024-01-15'),
    is_active: true
  }
];

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    company_id: 'comp-1',
    email: 'admin@techcorp.com',
    password_hash: 'hashed_password_1',
    full_name: 'John Anderson',
    role: 'admin',
    created_at: new Date('2023-01-16'),
    updated_at: new Date('2024-01-16'),
    is_active: true
  },
  {
    id: 'user-2',
    company_id: 'comp-1',
    email: 'recruiter@techcorp.com',
    password_hash: 'hashed_password_2',
    full_name: 'Sarah Johnson',
    role: 'recruiter',
    created_at: new Date('2023-02-01'),
    updated_at: new Date('2024-02-01'),
    is_active: true
  },
  {
    id: 'user-3',
    company_id: 'comp-2',
    email: 'admin@startupHub.com',
    password_hash: 'hashed_password_3',
    full_name: 'Mike Chen',
    role: 'admin',
    created_at: new Date('2023-06-11'),
    updated_at: new Date('2024-06-11'),
    is_active: true
  },
  {
    id: 'user-4',
    company_id: 'comp-2',
    email: 'recruiter@startupHub.com',
    password_hash: 'hashed_password_4',
    full_name: 'Emily Davis',
    role: 'recruiter',
    created_at: new Date('2023-07-01'),
    updated_at: new Date('2024-07-01'),
    is_active: true
  },
  {
    id: 'user-5',
    company_id: 'comp-3',
    email: 'owner@smallbiz.com',
    password_hash: 'hashed_password_5',
    full_name: 'David Wilson',
    role: 'admin',
    created_at: new Date('2023-09-21'),
    updated_at: new Date('2024-09-21'),
    is_active: true
  }
];

// Mock Jobs
export const mockJobs: Job[] = [
  {
    id: 'job-1',
    company_id: 'comp-1',
    title: 'Senior Software Engineer',
    description: 'We are looking for a senior software engineer with 5+ years of experience in React, Node.js, and TypeScript. The ideal candidate will have experience with microservices architecture and cloud platforms.',
    location: 'San Francisco, CA',
    employment_type: 'full_time',
    salary_min: 120000,
    salary_max: 180000,
    created_at: new Date('2024-01-10'),
    updated_at: new Date('2024-01-10'),
    is_active: true
  },
  {
    id: 'job-2',
    company_id: 'comp-1',
    title: 'Product Manager',
    description: 'Seeking an experienced product manager to lead our enterprise software products. Must have 3+ years of product management experience and strong analytical skills.',
    location: 'New York, NY',
    employment_type: 'full_time',
    salary_min: 100000,
    salary_max: 140000,
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15'),
    is_active: true
  },
  {
    id: 'job-3',
    company_id: 'comp-2',
    title: 'Frontend Developer',
    description: 'Join our startup as a frontend developer! We\'re looking for someone passionate about creating amazing user experiences with React and modern web technologies.',
    location: 'Austin, TX',
    employment_type: 'full_time',
    salary_min: 80000,
    salary_max: 110000,
    created_at: new Date('2024-01-20'),
    updated_at: new Date('2024-01-20'),
    is_active: true
  },
  {
    id: 'job-4',
    company_id: 'comp-2',
    title: 'DevOps Engineer',
    description: 'We need a DevOps engineer to help scale our infrastructure. Experience with AWS, Docker, and Kubernetes is required.',
    location: 'Remote',
    employment_type: 'contract',
    salary_min: 90000,
    salary_max: 130000,
    created_at: new Date('2024-02-01'),
    updated_at: new Date('2024-02-01'),
    is_active: true
  },
  {
    id: 'job-5',
    company_id: 'comp-3',
    title: 'Full Stack Developer',
    description: 'Small but growing company looking for a versatile full stack developer. Must be comfortable with both frontend and backend technologies.',
    location: 'Denver, CO',
    employment_type: 'full_time',
    salary_min: 70000,
    salary_max: 95000,
    created_at: new Date('2024-02-10'),
    updated_at: new Date('2024-02-10'),
    is_active: true
  }
];

// Mock Candidates
export const mockCandidates: Candidate[] = [
  {
    id: 'cand-1',
    full_name: 'Alice Thompson',
    email: 'alice.thompson@email.com',
    phone: '+1-555-0101',
    resume_url: '/resumes/alice-thompson.pdf',
    created_at: new Date('2024-01-05'),
    updated_at: new Date('2024-01-05'),
    is_active: true
  },
  {
    id: 'cand-2',
    full_name: 'Bob Rodriguez',
    email: 'bob.rodriguez@email.com',
    phone: '+1-555-0102',
    resume_url: '/resumes/bob-rodriguez.pdf',
    created_at: new Date('2024-01-08'),
    updated_at: new Date('2024-01-08'),
    is_active: true
  },
  {
    id: 'cand-3',
    full_name: 'Carol Kim',
    email: 'carol.kim@email.com',
    phone: '+1-555-0103',
    resume_url: '/resumes/carol-kim.pdf',
    created_at: new Date('2024-01-12'),
    updated_at: new Date('2024-01-12'),
    is_active: true
  },
  {
    id: 'cand-4',
    full_name: 'Daniel Brown',
    email: 'daniel.brown@email.com',
    phone: '+1-555-0104',
    resume_url: '/resumes/daniel-brown.pdf',
    created_at: new Date('2024-01-18'),
    updated_at: new Date('2024-01-18'),
    is_active: true
  },
  {
    id: 'cand-5',
    full_name: 'Eva Martinez',
    email: 'eva.martinez@email.com',
    phone: '+1-555-0105',
    resume_url: '/resumes/eva-martinez.pdf',
    created_at: new Date('2024-01-25'),
    updated_at: new Date('2024-01-25'),
    is_active: true
  },
  {
    id: 'cand-6',
    full_name: 'Frank Liu',
    email: 'frank.liu@email.com',
    phone: '+1-555-0106',
    resume_url: '/resumes/frank-liu.pdf',
    created_at: new Date('2024-02-02'),
    updated_at: new Date('2024-02-02'),
    is_active: true
  }
];

// Mock Job Matches
export const mockJobMatches: JobMatch[] = [
  {
    id: 'match-1',
    job_id: 'job-1',
    candidate_id: 'cand-1',
    status: 'interviewing',
    score: 0.89,
    analysis: {
      skills_match: 0.92,
      experience_match: 0.85,
      education_match: 0.90,
      salary_expectations: 0.88
    },
    created_at: new Date('2024-01-11'),
    updated_at: new Date('2024-01-20')
  },
  {
    id: 'match-2',
    job_id: 'job-1',
    candidate_id: 'cand-2',
    status: 'applied',
    score: 0.76,
    analysis: {
      skills_match: 0.80,
      experience_match: 0.75,
      education_match: 0.85,
      salary_expectations: 0.65
    },
    created_at: new Date('2024-01-12'),
    updated_at: new Date('2024-01-12')
  },
  {
    id: 'match-3',
    job_id: 'job-2',
    candidate_id: 'cand-3',
    status: 'applied',
    score: 0.91,
    analysis: {
      skills_match: 0.88,
      experience_match: 0.95,
      education_match: 0.92,
      salary_expectations: 0.90
    },
    created_at: new Date('2024-01-16'),
    updated_at: new Date('2024-02-01')
  },
  {
    id: 'match-4',
    job_id: 'job-3',
    candidate_id: 'cand-4',
    status: 'rejected',
    score: 0.45,
    analysis: {
      skills_match: 0.50,
      experience_match: 0.30,
      education_match: 0.60,
      salary_expectations: 0.40
    },
    created_at: new Date('2024-01-21'),
    updated_at: new Date('2024-01-25')
  },
  
  {
    id: 'match-5',
    job_id: 'job-4',
    candidate_id: 'cand-5',
    status: 'hired',
    score: 0.94,
    analysis: {
      skills_match: 0.96,
      experience_match: 0.90,
      education_match: 0.95,
      salary_expectations: 0.95
    },
    created_at: new Date('2024-02-03'),
    updated_at: new Date('2024-02-15')
  }
];

// Generate additional mock data for other entities
export const mockAIProcessingQueue: AIProcessingQueue[] = [
  {
    id: 'ai-1',
    job_id: 'job-1',
    candidate_id: 'cand-6',
    status: 'processing',
    result: null,
    created_at: new Date('2024-02-20'),
    updated_at: new Date('2024-02-20')
  },
  {
    id: 'ai-2',
    job_id: 'job-2',
    candidate_id: 'cand-4',
    status: 'completed',
    result: {
      match_score: 0.72,
      processing_time: 1.5,
      confidence: 0.85
    },
    created_at: new Date('2024-02-19'),
    updated_at: new Date('2024-02-19')
  }
];


export const mockBatchUploads: BatchUpload[] = [
  {
    id: 'batch-1',
    company_id: 'comp-1',
    job_id: 'job-1',
    file_name: 'resumes_batch_january.zip',
    status: 'completed',
    uploaded_by: 'user-2',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  },
  {
    id: 'batch-2',
    company_id: 'comp-2',
    job_id: 'job-3',
    file_name: 'candidate_cvs_feb.zip',
    status: 'processing',
    uploaded_by: 'user-4',
    created_at: new Date('2024-02-10'),
    updated_at: new Date('2024-02-10')
  }
];

export const mockAPIUsage: APIUsage[] = [
  {
    id: 'api-1',
    company_id: 'comp-1',
    user_id: 'user-1',
    endpoint: '/api/candidates',
    request_payload: { query: 'React developer' },
    response_payload: { results: 15 },
    status_code: 200,
    created_at: new Date('2024-02-01')
  },
  {
    id: 'api-2',
    company_id: 'comp-1',
    user_id: 'user-2',
    endpoint: '/api/job-matches',
    request_payload: { job_id: 'job-1' },
    response_payload: { matches: 5 },
    status_code: 200,
    created_at: new Date('2024-02-01')
  }
];