'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { batchUploadService } from '@/services/batchUploadService';
import { BatchUpload } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';

interface GlobalUploadProgressProps {
  companyId?: string;
}

export function GlobalUploadProgress({ companyId = 'company1' }: GlobalUploadProgressProps) {
  const [uploads, setUploads] = useState<BatchUpload[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();
  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = batchUploadService.subscribeToUploads((updatedUploads) => {
      console.log('GlobalUploadProgress received uploads:', updatedUploads.length, updatedUploads);
      
      const activeUploads = updatedUploads.filter(upload => 
        upload.company_id === companyId && 
        (upload.status === 'pending' || upload.status === 'processing')
      );
      
      console.log('Active uploads for company', companyId, ':', activeUploads.length, activeUploads);
      
      setUploads(activeUploads);
      setIsVisible(activeUploads.length > 0);
      
      // Show completion notifications
      // updatedUploads.forEach(upload => {
      //   if (upload.status === 'completed' && upload.company_id === companyId) {
      //     toast({
      //       title: 'Upload Complete',
      //       description: `${upload.file_name} has been processed successfully.`,
      //     });
      //   }
      // });
    });

    return unsubscribe;
  }, [companyId, toast]);

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

  const getStatusIcon = (status: string) => {
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

  const getStatusColor = (status: string) => {
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

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 z-50">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Active Uploads ({uploads.length})
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1"
              >
                {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="p-1"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="space-y-3 max-h-64 overflow-y-auto">
            {uploads.map((upload) => {
              const StatusIcon = getStatusIcon(upload.status);
              const progressPercentage = upload.total_candidates 
                ? Math.round((upload.processed_candidates || 0) / upload.total_candidates * 100)
                : 0;

              return (
                <div key={upload.id} className="p-3 border rounded-lg bg-background">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <StatusIcon className={`w-4 h-4 ${getStatusColor(upload.status)}`} />
                      <span className="text-sm font-medium truncate">{upload.file_name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {upload.status}
                      </Badge>
                    </div>
                    
                    {upload.status === 'processing' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancel(upload.id)}
                        className="p-1"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  {upload.status === 'processing' && upload.total_candidates && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Processing candidates...</span>
                        <span>{upload.processed_candidates || 0}/{upload.total_candidates}</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                  )}

                  {upload.status === 'pending' && (
                    <div className="text-xs text-muted-foreground">
                      Preparing upload...
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        )}
      </Card>
    </div>
  );
}