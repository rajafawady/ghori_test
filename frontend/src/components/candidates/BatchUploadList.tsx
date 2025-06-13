'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { batchUploadService } from '@/services/batchUploadService';
import { BatchUpload, ProcessingStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface BatchUploadListProps {
  jobId: string;
}

export function BatchUploadList({ jobId }: BatchUploadListProps) {
  const [uploads, setUploads] = useState<BatchUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUploads();
  }, [jobId]);

  const loadUploads = async () => {
    try {
      const data = await batchUploadService.getBatchUploads('company1', jobId); // TODO: Get from auth context
      setUploads(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load batch uploads',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await batchUploadService.retryFailedUpload(id);
      await loadUploads();
      toast({
        title: 'Success',
        description: 'Upload retry initiated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to retry upload',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: ProcessingStatus) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      case 'processing':
        return 'text-blue-500';
      default:
        return 'text-yellow-500';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Batch Uploads</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {uploads.length === 0 ? (
            <p className="text-muted-foreground">No batch uploads found</p>
          ) : (
            uploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <p className="font-medium">{upload.file_name}</p>
                  <p className={`text-sm ${getStatusColor(upload.status)}`}>
                    {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Uploaded {new Date(upload.created_at).toLocaleString()}
                  </p>
                </div>
                {upload.status === 'failed' && (
                  <Button
                    variant="outline"
                    onClick={() => handleRetry(upload.id)}
                  >
                    Retry
                  </Button>
                )}
                {upload.status === 'processing' && (
                  <Progress value={50} className="w-24" />
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 