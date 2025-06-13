'use client';

import { useParams } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { BatchUpload } from '@/components/candidates/BatchUpload';
import { BatchUploadList } from '@/components/candidates/BatchUploadList';
import { MatchingCandidates } from '@/components/candidates/MatchingCandidates';
import { Toaster } from '@/components/ui/toaster';

export function BatchUploadPageClient() {
  const params = useParams();
  const jobId = params.jobId as string;
  const { state } = useAppContext();
  const job = state.jobs.find(j => j.id === jobId);

  if (!job) {
    return <div>Job not found</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Batch Upload CVs for {job.title}</h1>
      <div className="grid gap-8">
        <BatchUpload jobId={jobId} />
        <BatchUploadList jobId={jobId} />
        <MatchingCandidates jobId={jobId} />
      </div>
      <Toaster />
    </div>
  );
} 