'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { batchUploadService } from '@/services/batchUploadService';
import { BatchUpload, BatchUploadSummary, ProcessingStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Download, 
  RefreshCw,
  Eye,
  Trash2,
  FileText,
  Users,
  Calendar,
  Filter,
  Building
} from 'lucide-react';

interface UploadHistoryPageProps {
  companyId?: string;
  jobId?: string;
}

export function UploadHistoryPage({ companyId = 'company1', jobId }: UploadHistoryPageProps) {
  const [uploads, setUploads] = useState<BatchUpload[]>([]);
  const [summary, setSummary] = useState<BatchUploadSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ProcessingStatus | 'all'>('all');
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get jobId from URL params if not provided as prop
  const effectiveJobId = jobId || searchParams.get('jobId') || undefined;  useEffect(() => {
    loadData();
    
    // Subscribe to real-time updates
    const unsubscribe = batchUploadService.subscribeToUploads((updatedUploads) => {
      let filteredUploads = updatedUploads.filter(upload => upload.company_id === companyId);
      
      // Filter by job if specified
      if (effectiveJobId) {
        filteredUploads = filteredUploads.filter(upload => upload.job_id === effectiveJobId);
      }
      
      setUploads(filteredUploads);
    });

    return unsubscribe;
  }, [companyId, effectiveJobId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [uploadsData, summaryData] = await Promise.all([
        batchUploadService.getBatchUploads(companyId, effectiveJobId),
        batchUploadService.getBatchUploadSummary(companyId)
      ]);
      setUploads(uploadsData);
      setSummary(summaryData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load upload history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await batchUploadService.retryFailedUpload(id);
      await loadData();
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
      await loadData();
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

  const filteredUploads = uploads.filter(upload => 
    statusFilter === 'all' || upload.status === statusFilter
  );

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading upload history...</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <AdminGuard requireRole="recruiter" message="You need recruiter or admin access to view upload history.">
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Upload History{effectiveJobId ? ' - Job Specific' : ' - All Jobs'}
            </h1>
            {effectiveJobId && (
              <p className="text-muted-foreground mt-1">
                Showing uploads for selected job only
              </p>
            )}
          </div>
        <div className="flex items-center space-x-2">
          {effectiveJobId && (
            <Button 
              onClick={() => router.push('/uploads')} 
              variant="outline" 
              size="sm"
            >
              View All Uploads
            </Button>
          )}
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Uploads</p>
                  <p className="text-2xl font-bold">{summary.total_uploads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Processing</p>
                  <p className="text-2xl font-bold">{summary.processing_uploads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{summary.completed_uploads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold">{summary.failed_uploads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Candidates</p>
                  <p className="text-2xl font-bold">{summary.total_candidates_processed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Options */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filter by status:</span>
            <div className="flex space-x-2">
              {(['all', 'pending', 'processing', 'completed', 'failed'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload List */}
      <Card>
        <CardHeader>
          <CardTitle>Upload History ({filteredUploads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUploads.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No uploads found</p>
              </div>
            ) : (
              filteredUploads.map((upload) => {
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
                        
                        {/* Job Information */}
                        {upload.job && !effectiveJobId && (
                          <div className="mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                              <Building className="w-3 h-3 mr-1" />
                              {upload.job.title}
                            </span>
                          </div>
                        )}
                        
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
                    </div>                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/uploads/${upload.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      
                      {upload.job && !effectiveJobId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/uploads/job/${upload.job_id}`)}
                        >
                          View Job Uploads
                        </Button>
                      )}
                      
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
                  </div>                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    </AdminGuard>
  );
}
