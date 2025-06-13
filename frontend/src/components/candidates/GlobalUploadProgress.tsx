'use client';
import { useEffect, useState, useRef } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { X, CheckCircle2 } from 'lucide-react';
import { batchUploadService } from '@/services/batchUploadService';
import { BatchUpload, ProcessingStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function GlobalUploadProgress() {
  const [activeUploads, setActiveUploads] = useState<BatchUpload[]>([]);
  const { toast } = useToast();
  const completedUploadsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Subscribe to upload progress updates
    const unsubscribe = batchUploadService.subscribeToUploads((uploads) => {
      const newActiveUploads = uploads.filter(upload => 
        upload.status === 'processing' || upload.status === 'pending'
      );
      
      // Check for newly completed uploads
      uploads.forEach(upload => {
        if (upload.status === 'completed' && !completedUploadsRef.current.has(upload.id)) {
          completedUploadsRef.current.add(upload.id);
          toast({
            title: 'Upload Complete',
            description: `${upload.file_name} has been processed successfully.`,
          });
        }
      });

      setActiveUploads(newActiveUploads);
    });

    return () => unsubscribe();
  }, [toast]);

  const getProgressValue = (status: ProcessingStatus) => {
    switch (status) {
      case 'completed':
        return 100;
      case 'failed':
        return 0;
      case 'processing':
        return 50;
      case 'pending':
        return 0;
      default:
        return 0;
    }
  };

  if (activeUploads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {activeUploads.map((upload) => (
        <Card key={upload.id} className="p-4 w-80 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium truncate">{upload.file_name}</span>
            <button 
              onClick={() => batchUploadService.cancelUpload(upload.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <Progress value={getProgressValue(upload.status)} className="w-full" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{upload.status}</span>
            <span>{getProgressValue(upload.status)}%</span>
          </div>
        </Card>
      ))}
    </div>
  );
} 