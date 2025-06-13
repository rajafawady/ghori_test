'use client';

import { useEffect, useState } from 'react';
import { BatchUpload } from '@/components/candidates/BatchUpload';
import { BatchUploadList } from '@/components/candidates/BatchUploadList';
import { MatchingCandidates } from '@/components/candidates/MatchingCandidates';
import { Toaster } from '@/components/ui/toaster';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { jobService } from '@/services/jobService';
import { Job } from '@/types';

interface BatchUploadPageClientProps {
  jobId: string;
}

export function BatchUploadPageClient({ jobId }: BatchUploadPageClientProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJob = async () => {
      try {
        const jobData = await jobService.getById(jobId);
        setJob(jobData);
      } catch (error) {
        console.error('Failed to load job:', error);
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [jobId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!job) {
    return <div>Job not found</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{job.title}</h1>
          <p className="text-muted-foreground mt-2">{job.location}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Employment Type</p>
          <p className="font-medium">{job.employment_type}</p>
        </div>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload CVs for this Position</CardTitle>
          </CardHeader>
          <CardContent>
            <BatchUpload jobId={jobId} />
          </CardContent>
        </Card>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <BatchUploadList jobId={jobId} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Matching Candidates</CardTitle>
            </CardHeader>
            <CardContent>
              <MatchingCandidates jobId={jobId} />
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster />
    </div>
  );
} 