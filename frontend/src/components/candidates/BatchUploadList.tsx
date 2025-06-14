'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { batchUploadService } from '@/services/batchUploadService';
import { BatchUpload, ProcessingStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Eye,
  Users,
  Calendar,
  File
} from 'lucide-react';

interface BatchUploadListProps {
  jobId: string;
}

export function BatchUploadList({ jobId }: BatchUploadListProps) {
  const [uploads, setUploads] = useState<BatchUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadUploads();
    
    // Subscribe to real-time updates
    const unsubscribe = batchUploadService.subscribeToUploads((updatedUploads) => {
      const filteredUploads = updatedUploads.filter(upload => upload.job_id === jobId);
      setUploads(filteredUploads);
    });

    return unsubscribe;
  }, [jobId]);
  const loadUploads = async () => {
    try {
      const data = await batchUploadService.getBatchUploadsByJob(jobId);
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
  };  const handleRetry = async (id: string) => {
    try {
      await batchUploadService.retryFailedUpload(id);
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

  const handleCancel = async (id: string) => {
    try {
      await batchUploadService.cancelUpload(id);
      toast({
        title: 'Success',
        description: 'Upload cancelled',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel upload',
        variant: 'destructive',
      });
    }
  };
  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'failed':
        return XCircle;
      case 'processing':
        return Clock;
      default:
        return AlertCircle;
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
  const getStatusBadgeVariant = (status: ProcessingStatus) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'processing':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Batch Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Clock className="w-8 h-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recent Batch Uploads</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/uploads')}
          >
            View All History
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {uploads.length === 0 ? (
            <div className="text-center py-8">
              <File className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No batch uploads found for this job</p>
            </div>
          ) : (
            uploads.slice(0, 5).map((upload) => {
              const StatusIcon = getStatusIcon(upload.status);
              const progressPercentage = upload.total_candidates 
                ? Math.round((upload.processed_candidates || 0) / upload.total_candidates * 100)
                : 0;

              return (
                <div
                  key={upload.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <StatusIcon className={`w-5 h-5 ${getStatusColor(upload.status)}`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium truncate">{upload.file_name}</p>
                        <Badge variant={getStatusBadgeVariant(upload.status)}>
                          {upload.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(upload.created_at).toLocaleString()}
                        </span>
                        <span>{formatFileSize(upload.file_size)}</span>
                        {upload.total_candidates && (
                          <span className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {upload.successful_candidates || 0}/{upload.total_candidates} candidates
                          </span>
                        )}
                      </div>

                      {upload.status === 'processing' && upload.total_candidates && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Processing candidates...</span>
                            <span>{upload.processed_candidates || 0}/{upload.total_candidates}</span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                      )}

                      {upload.error_message && (
                        <p className="text-sm text-red-500 mt-1">{upload.error_message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/uploads/${upload.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                    
                    {upload.status === 'failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(upload.id)}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Retry
                      </Button>
                    )}
                    
                    {upload.status === 'processing' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(upload.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}