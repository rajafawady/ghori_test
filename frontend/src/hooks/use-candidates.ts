import { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Candidate } from '@/types/index';
import { mockCandidates } from '@/lib/mockData';

import { candidateService } from '@/services/candidateService';

export function useCandidates() {
  const { state, dispatch } = useAppContext();

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const candidates = await candidateService.getAll();
      dispatch({ type: 'SET_CANDIDATES', payload: candidates });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load candidates' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createCandidate = async (candidateData: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newCandidate = await candidateService.create(candidateData);
      dispatch({ type: 'ADD_CANDIDATE', payload: newCandidate });
      return newCandidate;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create candidate' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateCandidate = async (id: string, updates: Partial<Candidate>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedCandidate = await candidateService.update(id, updates);
      if (updatedCandidate) {
        dispatch({ type: 'UPDATE_CANDIDATE', payload: updatedCandidate });
      }
      return updatedCandidate;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update candidate' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteCandidate = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await candidateService.delete(id);
      dispatch({ type: 'DELETE_CANDIDATE', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete candidate' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return {
    candidates: state.candidates,
    loading: state.loading,
    error: state.error,
    loadCandidates,
    createCandidate,
    updateCandidate,
    deleteCandidate,
  };
}