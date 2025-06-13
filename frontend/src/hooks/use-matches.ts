import { useEffect, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { jobMatchService } from '@/services/jobMatchService';
import { JobMatch, JobMatchStatus } from '@/types';

export function useMatches() {
  const { state, dispatch } = useAppContext();

  const loadMatches = useCallback(async (jobId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const matches = await jobMatchService.getJobMatches(jobId);
      dispatch({ type: 'SET_MATCHES', payload: matches });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load matches' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  const updateMatchStatus = useCallback(async (matchId: string, status: JobMatchStatus) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedMatch = await jobMatchService.updateMatchStatus(matchId, status);
      if (updatedMatch) {
        dispatch({ type: 'UPDATE_MATCH', payload: updatedMatch });
      }
      return updatedMatch;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update match status' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  return {
    matches: state.matches,
    loading: state.loading,
    error: state.error,
    loadMatches,
    updateMatchStatus,
  };
} 