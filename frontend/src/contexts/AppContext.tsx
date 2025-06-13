"use client";

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Company, User, Job, Candidate, JobMatch } from '@/types/index';

interface AppState {
  currentUser: User | null;
  currentCompany: Company | null;
  jobs: Job[];
  candidates: Candidate[];
  matches: JobMatch[];
  loading: boolean;
  error: string | null;
}

type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
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
  | { type: 'UPDATE_MATCH'; payload: JobMatch };

const initialState: AppState = {
  currentUser: null,
  currentCompany: null,
  jobs: [],
  candidates: [],
  matches: [],
  loading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
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