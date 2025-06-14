'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { batchUploadService } from '@/services/batchUploadService';
import { BatchUpload, BatchCandidate, ProcessingStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Download, 
  RefreshCw,
  FileText,
  Users,
  Calendar,
  AlertTriangle,
  User,
  File
} from 'lucide-react';

interface BatchDetailsViewProps {
  batchId: string;
}

export function BatchDetailsView({ batchId }: BatchDetailsViewProps) {
  const [batchUpload, setBatchUpload] = useState<BatchUpload | null>(null);
  const [batchCandidates, setBatchCandidates] = useState<BatchCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadBatchDetails();
  }, [batchId]);

  const loadBatchDetails = async () => {
    try {
      setLoading(true);      const [batchData, candidatesData] = await Promise.all([
        batchUploadService.getBatchUploadById(batchId),
        batchUploadService.getBatchCandidates(batchId)
      ]);
      setBatchUpload(batchData);
      setBatchCandidates(candidatesData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load batch details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!batchUpload) return;
    try {
      await batchUploadService.retryFailedUpload(batchUpload.id);
      await loadBatchDetails();
      toast({
        title: 'Success',
        description: 'Batch upload retry initiated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to retry batch upload',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async () => {
    if (!batchUpload) return;
    try {
      await batchUploadService.cancelUpload(batchUpload.id);
      await loadBatchDetails();
      toast({
        title: 'Success',
        description: 'Batch upload cancelled',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel batch upload',
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
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading batch details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!batchUpload) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Batch Upload Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested batch upload could not be found.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(batchUpload.status);
  const progressPercentage = batchUpload.total_candidates 
    ? Math.round((batchUpload.processed_candidates || 0) / batchUpload.total_candidates * 100)
    : 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Batch Upload Details</h1>
            <p className="text-muted-foreground">{batchUpload.file_name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {batchUpload.status === 'failed' && (
            <Button onClick={handleRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Upload
            </Button>
          )}
          {batchUpload.status === 'processing' && (
            <Button variant="outline" onClick={handleCancel}>
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Upload
            </Button>
          )}
        </div>
      </div>

      {/* Batch Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <StatusIcon className={`w-5 h-5 ${getStatusColor(batchUpload.status)}`} />
            <span>Batch Overview</span>
            <Badge variant={getStatusBadgeVariant(batchUpload.status)}>
              {batchUpload.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                Upload Date
              </div>
              <p className="font-medium">{new Date(batchUpload.created_at).toLocaleString()}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <File className="w-4 h-4 mr-2" />
                File Size
              </div>
              <p className="font-medium">{formatFileSize(batchUpload.file_size)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="w-4 h-4 mr-2" />
                Total Candidates
              </div>
              <p className="font-medium">{batchUpload.total_candidates || 0}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="w-4 h-4 mr-2" />
                Uploaded By
              </div>
              <p className="font-medium">{batchUpload.uploader?.full_name || batchUpload.uploaded_by}</p>
            </div>

            {batchUpload.job && (
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <FileText className="w-4 h-4 mr-2" />
                  Job Position
                </div>
                <p className="font-medium">{batchUpload.job.title}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/uploads/job/${batchUpload.job_id}`)}
                >
                  View All Job Uploads
                </Button>
              </div>
            )}
          </div>

          {/* Progress Section */}
          {batchUpload.status === 'processing' && batchUpload.total_candidates && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing Progress</span>
                <span>{batchUpload.processed_candidates || 0}/{batchUpload.total_candidates}</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
          )}

          {/* Results Summary */}
          {(batchUpload.status === 'completed' || batchUpload.processed_candidates) && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3">Processing Results</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Successful: {batchUpload.successful_candidates || 0}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Failed: {batchUpload.failed_candidates || 0}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Processed: {batchUpload.processed_candidates || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {batchUpload.error_message && (
            <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Error Details</p>
                  <p className="text-sm text-red-700">{batchUpload.error_message}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Candidate Details */}
      <Card>
        <CardHeader>
          <CardTitle>Candidate Processing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {batchCandidates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No candidate details available</p>
              </div>
            ) : (
              batchCandidates.map((candidate) => {
                const CandidateStatusIcon = getStatusIcon(candidate.status);
                
                return (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <CandidateStatusIcon className={`w-4 h-4 ${getStatusColor(candidate.status)}`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium truncate">{candidate.file_name}</p>
                          <Badge variant={getStatusBadgeVariant(candidate.status)} className="text-xs">
                            {candidate.status}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          Processed {new Date(candidate.updated_at).toLocaleString()}
                        </div>

                        {candidate.error_message && (
                          <p className="text-sm text-red-500 mt-1">{candidate.error_message}</p>
                        )}
                      </div>
                    </div>

                    {candidate.candidate_id && (
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <User className="w-4 h-4 mr-1" />
                          View Candidate
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
