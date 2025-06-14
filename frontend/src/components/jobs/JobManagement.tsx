"use client";
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingPage } from '@/components/ui/loader/loading-page';
import { LoadingCard } from '@/components/ui/loader/loading-card';
import { LoadingButton } from '@/components/ui/loader/loading-button';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useJobs } from '@/hooks/use-jobs';
import { Job } from '@/types/index';
import { JobList } from './JobList';
import { JobForm } from './JobForm';
import { JobDetails } from './JobDetails';
import { Plus, Search } from 'lucide-react';

export function JobManagement() {
  const { jobs, loading, searchJobs } = useJobs();
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [searching, setSearching] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Handle initial load
  useEffect(() => {
    if (!loading && jobs.length > 0) {
      setIsInitialLoad(false);
    }
  }, [loading, jobs]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      return;
    }

    try {
      setSearching(true);
      await searchJobs({
        keywords: [searchQuery]
      });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  }, [searchQuery, searchJobs]);

  const handleCreateJob = useCallback(() => {
    setEditingJob(null);
    setShowForm(true);
  }, []);

  const handleEditJob = useCallback((job: Job) => {
    setEditingJob(job);
    setShowForm(true);
  }, []);

  const handleJobSaved = useCallback(() => {
    setShowForm(false);
    setEditingJob(null);
  }, []);

  const handleJobDeleted = useCallback(() => {
    setSelectedJob(null);
  }, []);

  const handleJobSelect = useCallback((job: Job) => {
    setSelectedJob(job);
  }, []);

  const handleSearchQueryChange = useCallback((query:string) => {
    setSearchQuery(query);
  }, []);

  const handleSearchKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const filteredJobs = useMemo(() => 
    jobs.filter(job =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [jobs, searchQuery]
  );

  if (loading && isInitialLoad) {
    return (
      <LoadingPage 
        message="Loading jobs..." 
        variant="pulse" 
        size="lg"
      />
    );
  }

  return (
    <AdminGuard requireRole="recruiter" message="You need recruiter or admin access to manage jobs.">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Job Management</h1>
          <Button onClick={handleCreateJob} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Job
          </Button>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {searching ? (
            <LoadingCard variant="job" count={3} />
          ) : (
            <JobList
              jobs={filteredJobs}
              onJobSelect={handleJobSelect}
              onJobEdit={handleEditJob}
              selectedJobId={selectedJob?.id}
              onSearch={handleSearchQueryChange}
              searchTerm={searchQuery}
            />
          )}
        </div>
        <div>
          {selectedJob ? (
            <JobDetails
              job={selectedJob}
              onEdit={() => handleEditJob(selectedJob)}
              onDelete={handleJobDeleted}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a job</h3>
              <p className="text-gray-500">Choose a job from the list to view details and manage candidates.</p>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <JobForm
              job={editingJob}
              onSave={handleJobSaved}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
    </AdminGuard>
  );
}