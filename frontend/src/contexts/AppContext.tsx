"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Company, User, Job, Candidate, JobMatch, BatchUpload } from '@/types/index';
import { initializeStorage } from '@/lib/initStorage';

interface AppState {
  currentUser: User | null;
  currentCompany: Company | null;
  jobs: Job[];
  candidates: Candidate[];
  matches: JobMatch[];
  batchUploads: BatchUpload[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'SET_CURRENT_COMPANY'; payload: Company | null }
  | { type: 'SET_JOBS'; payload: Job[] }
  | { type: 'ADD_JOB'; payload: Job }
  | { type: 'UPDATE_JOB'; payload: Job }
  | { type: 'DELETE_JOB'; payload: string }
  | { type: 'SET_CANDIDATES'; payload: Candidate[] }
  | { type: 'ADD_CANDIDATE'; payload: Candidate }
  | { type: 'UPDATE_CANDIDATE'; payload: Candidate }
  | { type: 'DELETE_CANDIDATE'; payload: string }
  | { type: 'SET_MATCHES'; payload: JobMatch[] }
  | { type: 'UPDATE_MATCH'; payload: JobMatch }
  | { type: 'SET_BATCH_UPLOADS'; payload: BatchUpload[] }
  | { type: 'ADD_BATCH_UPLOAD'; payload: BatchUpload }
  | { type: 'UPDATE_BATCH_UPLOAD'; payload: BatchUpload }
  | { type: 'DELETE_BATCH_UPLOAD'; payload: string };

const initialState: AppState = {
  currentUser: null,
  currentCompany: null,
  jobs: [],
  candidates: [],
  matches: [],
  batchUploads: [],
  loading: false,
  error: null,
  initialized: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, initialized: action.payload };
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_CURRENT_COMPANY':
      return { ...state, currentCompany: action.payload };
    case 'SET_JOBS':
      return { ...state, jobs: action.payload };
    case 'ADD_JOB':
      return { ...state, jobs: [...state.jobs, action.payload] };
    case 'UPDATE_JOB':
      return { 
        ...state, 
        jobs: state.jobs.map(job => job.id === action.payload.id ? action.payload : job) 
      };
    case 'DELETE_JOB':
      return { 
        ...state, 
        jobs: state.jobs.filter(job => job.id !== action.payload) 
      };
    case 'SET_CANDIDATES':
      return { ...state, candidates: action.payload };
    case 'ADD_CANDIDATE':
      return { ...state, candidates: [...state.candidates, action.payload] };
    case 'UPDATE_CANDIDATE':
      return { 
        ...state, 
        candidates: state.candidates.map(candidate => 
          candidate.id === action.payload.id ? action.payload : candidate
        ) 
      };
    case 'DELETE_CANDIDATE':
      return { 
        ...state, 
        candidates: state.candidates.filter(candidate => candidate.id !== action.payload) 
      };
    case 'SET_MATCHES':
      return { ...state, matches: action.payload };
    case 'UPDATE_MATCH':
      return { 
        ...state, 
        matches: state.matches.map(match => 
          match.id === action.payload.id ? action.payload : match
        ) 
      };
    case 'SET_BATCH_UPLOADS':
      return { ...state, batchUploads: action.payload };
    case 'ADD_BATCH_UPLOAD':
      return { ...state, batchUploads: [...state.batchUploads, action.payload] };
    case 'UPDATE_BATCH_UPLOAD':
      return { 
        ...state, 
        batchUploads: state.batchUploads.map(upload => 
          upload.id === action.payload.id ? action.payload : upload
        ) 
      };
    case 'DELETE_BATCH_UPLOAD':
      return { 
        ...state, 
        batchUploads: state.batchUploads.filter(upload => upload.id !== action.payload) 
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize storage on mount
  useEffect(() => {
    const initApp = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Initialize persistent storage with seed data
        initializeStorage();
        
        // Set a default company and user for the demo
        const mockUser: User = {
          id: 'user1',
          company_id: 'company1',
          email: 'admin@example.com',
          password_hash: '',
          full_name: 'Admin User',
          role: 'admin',
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true
        };

        const mockCompany: Company = {
          id: 'company1',
          name: 'Demo Company',
          slug: 'demo-company',
          subscription_plan: 'professional',
          max_users: 10,
          max_jobs_per_month: 50,
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true
        };

        dispatch({ type: 'SET_CURRENT_USER', payload: mockUser });
        dispatch({ type: 'SET_CURRENT_COMPANY', payload: mockCompany });
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      } catch (error) {
        console.error('Failed to initialize app:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize application' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initApp();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
