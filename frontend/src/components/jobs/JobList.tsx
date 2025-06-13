"use client";
import { Job } from '@/types/index';
import { Button } from '@/components/ui/button';
import { Edit, MapPin, DollarSign, Calendar } from 'lucide-react';

interface JobListProps {
  jobs: Job[];
  onJobSelect: (job: Job) => void;
  onJobEdit: (job: Job) => void;
  selectedJobId?: string;
}

export function JobList({ jobs, onJobSelect, onJobEdit, selectedJobId }: JobListProps) {
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
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Jobs ({jobs.length})</h2>
      </div>
      <div className="divide-y max-h-96 overflow-y-auto">
        {jobs.map((job) => (
          <div
            key={job.id}
            className={`p-4 cursor-pointer hover:bg-gray-50 ${
              selectedJobId === job.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
            }`}
            onClick={() => onJobSelect(job)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {job.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {job.company?.name}
                </p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {job.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {job.location}
                    </div>
                  )}
                  {job.employment_type && (
                    <div className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      {formatEmploymentType(job.employment_type)}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {formatSalary(job.salary_min, job.salary_max)}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {job.created_at.toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onJobEdit(job);
                }}
                className="ml-2"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        
        {jobs.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No jobs found
          </div>
        )}
      </div>
    </div>
  );
}