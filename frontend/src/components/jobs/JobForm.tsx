"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Job, EmploymentType } from '@/types/index';
import { useJobs } from '@/hooks/use-jobs';
import { X } from 'lucide-react';

interface JobFormProps {
  job?: Job | null;
  onSave: () => void;
  onCancel: () => void;
}

export function JobForm({ job, onSave, onCancel }: JobFormProps) {
  const { createJob, updateJob } = useJobs();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    employment_type: 'full_time' as EmploymentType,
    salary_min: '',
    salary_max: '',
    company_id: 'comp-1', // Default company for demo
  });

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title,
        description: job.description,
        location: job.location || '',
        employment_type: job.employment_type || 'full_time',
        salary_min: job.salary_min?.toString() || '',
        salary_max: job.salary_max?.toString() || '',
        company_id: job.company_id,
      });
    }
  }, [job]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const jobData = {
        ...formData,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : undefined,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : undefined,
        is_active: true,
      };

      if (job) {
        await updateJob(job.id, jobData);
      } else {
        await createJob(jobData);
      }
      
      onSave();
    } catch (error) {
      console.error('Failed to save job:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {job ? 'Edit Job' : 'Create New Job'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Senior Software Engineer"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Job description and requirements..."
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. New York, NY or Remote"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employment Type
              </label>
              <select
                value={formData.employment_type}
                onChange={(e) => setFormData({ ...formData, employment_type: e.target.value as EmploymentType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Salary
              </label>
              <Input
                type="number"
                value={formData.salary_min}
                onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                placeholder="e.g. 80000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Salary
              </label>
              <Input
                type="number"
                value={formData.salary_max}
                onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                placeholder="e.g. 120000"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" onClick={onCancel} type="button">
              Cancel
            </Button>
            <Button type="submit">
              {job ? 'Update Job' : 'Create Job'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}