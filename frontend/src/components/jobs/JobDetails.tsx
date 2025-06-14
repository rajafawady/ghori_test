"use client";
import { useState, useRef } from 'react';
import { Job } from '@/types/index';
import { Button } from '@/components/ui/button';
import { useJobs } from '@/hooks/use-jobs';
import { useRouter } from 'next/navigation';
import { batchUploadService } from '@/services/batchUploadService';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { databaseResetService } from '@/lib/databaseReset';
import { 
  MapPin, 
  DollarSign, 
  Calendar, 
  Building, 
  Edit, 
  Trash2, 
  Clock,
  Users,
  Upload,
  History,
  Database
} from 'lucide-react';

interface JobDetailsProps {
  job: Job;
  onEdit: () => void;
  onDelete: () => void;
}

export function JobDetails({ job, onEdit, onDelete }: JobDetailsProps) {
  const { deleteJob } = useJobs();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await deleteJob(job.id);
        onDelete();
        toast({
          title: 'Success',
          description: 'Job deleted successfully',
        });
      } catch (error) {
        console.error('Failed to delete job:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete job',
          variant: 'destructive',
        });
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;    const file = files[0];
    setIsUploading(true);    try {
      await batchUploadService.createBatchUpload(
        'company1', // TODO: Get from auth context
        job.id,
        file.name,
        'user1', // TODO: Get from auth context
        file.size
      );
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      });    } finally {
      setIsUploading(false);
    }
  };

  const handleQuickReset = () => {
    if (window.confirm('⚠️ This will reset ALL database data. Are you sure?')) {
      databaseResetService.resetDatabase();
      toast({
        title: 'Database Reset',
        description: 'Database has been reset with fresh data. Page will reload...',
      });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return '';
  };

  const formatEmploymentType = (type?: string) => {
    if (!type) return '';
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h2>
            <div className="flex items-center text-gray-600 mb-2">
              <Building className="w-4 h-4 mr-2" />
              {job.company?.name}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {job.location && (
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              {job.location}
            </div>
          )}
          
          <div className="flex items-center text-gray-600">
            <DollarSign className="w-4 h-4 mr-2" />
            {formatSalary(job.salary_min, job.salary_max)}
          </div>
          
          {job.employment_type && (
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              {formatEmploymentType(job.employment_type)}
            </div>
          )}
          
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />            Posted {formatDate(job.created_at)}
          </div>
        </div>

        <div className="mt-4">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            job.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {job.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="p-6">        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Job Description</h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleUploadClick}
              className="flex items-center"
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload CVs'}
            </Button>            <Button
              variant="outline"
              onClick={() => router.push(`/uploads/job/${job.id}`)}
              className="flex items-center"
            >
              <History className="w-4 h-4 mr-2" />
              Upload History
            </Button>            <Button
              variant="outline"
              onClick={() => router.push(`/jobs/${job.id}/candidates`)}
              className="flex items-center"
            >
              <Users className="w-4 h-4 mr-2" />
              View Candidates
            </Button>
          </div>
        </div>

        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {job.description}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.zip"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>
    </div>
  );
}