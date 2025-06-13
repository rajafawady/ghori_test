import { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { jobService } from '@/services/jobService';
import { Job } from '@/types/index';

export function useJobs() {
  const { state, dispatch } = useAppContext();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const jobs = await jobService.getAll();
      dispatch({ type: 'SET_JOBS', payload: jobs });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load jobs' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createJob = async (jobData: Omit<Job, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newJob = await jobService.create(jobData);
      dispatch({ type: 'ADD_JOB', payload: newJob });
      return newJob;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create job' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateJob = async (id: string, updates: Partial<Job>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedJob = await jobService.update(id, updates);
      if (updatedJob) {
        dispatch({ type: 'UPDATE_JOB', payload: updatedJob });
      }
      return updatedJob;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update job' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteJob = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await jobService.delete(id);
      dispatch({ type: 'DELETE_JOB', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete job' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const searchJobs = async (query: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const jobs = await jobService.search(query);
      dispatch({ type: 'SET_JOBS', payload: jobs });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Search failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return {
    jobs: state.jobs,
    loading: state.loading,
    error: state.error,
    loadJobs,
    createJob,
    updateJob,
    deleteJob,
    searchJobs,
  };
}