'use client';
import { useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { batchUploadService } from '@/services/batchUploadService';
import { useToast } from '@/hooks/use-toast';

interface BatchUploadProps {
  jobId: string;
}

export function BatchUpload({ jobId }: BatchUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls', '.xlsx'],
      'application/zip': ['.zip'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    validator: (file) => {
      // If it's a ZIP file, we'll accept it
      if (file.type === 'application/zip') {
        return null;
      }
      
      // For other files, check if they're CSV, Excel, or PDF
      if (
        file.type === 'text/csv' ||
        file.type === 'application/vnd.ms-excel' ||
        file.type === 'application/pdf'
      ) {
        return null;
      }

      return {
        code: 'file-invalid-type',
        message: 'File must be CSV, Excel, PDF, or ZIP containing PDFs'
      };
    },
    onDrop: async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (acceptedFiles.length === 0) {
        const error = fileRejections[0]?.errors[0]?.message;
        toast({
          title: 'Invalid File',
          description: error || 'Please upload a valid file',
          variant: 'destructive',
        });
        return;
      }

      const file = acceptedFiles[0];
      setUploading(true);
      setProgress(0);

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 500);

        // Create batch upload
        const upload = await batchUploadService.createBatchUpload(
          'company1', // TODO: Get from auth context
          file.name,
          'user1', // TODO: Get from auth context
          jobId
        );

        clearInterval(progressInterval);
        setProgress(100);

        toast({
          title: 'Upload Successful',
          description: file.type === 'application/zip' 
            ? 'Your ZIP file is being processed. PDFs will be extracted and analyzed.'
            : 'Your file is being processed. You will be notified when complete.',
        });
      } catch (error) {
        toast({
          title: 'Upload Failed',
          description: 'There was an error uploading your file. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setUploading(false);
      }
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Batch Upload CVs</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary'}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="space-y-4">
              <p>Uploading...</p>
              <Progress value={progress} className="w-full" />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {isDragActive ? 'Drop your file here' : 'Drag & drop your CV file here'}
              </p>
              <p className="text-sm text-muted-foreground">
                Supports CSV, Excel, PDF, or ZIP containing PDFs
              </p>
              <Button variant="outline" className="mt-4">
                Select File
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 