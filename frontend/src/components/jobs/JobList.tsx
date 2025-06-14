"use client";
import { Job, EmploymentType } from '@/types/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, MapPin, DollarSign, Calendar, Search, Filter, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';

interface JobListProps {
  jobs: Job[];
  onJobSelect: (job: Job) => void;
  onJobEdit: (job: Job) => void;
  selectedJobId?: string;
  onSearch: (query: string) => void;
  searchTerm: string;
}

export function JobList({ jobs, onJobSelect, onJobEdit, selectedJobId, onSearch, searchTerm }: JobListProps) {

  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<EmploymentType[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Get unique employment types and locations from jobs
  const availableEmploymentTypes = useMemo(() => {
    const types = jobs
      .map(job => job.employment_type)
      .filter((type): type is EmploymentType => type !== undefined);
    return Array.from(new Set(types));
  }, [jobs]);

  const availableLocations = useMemo(() => {
    const locations = jobs
      .map(job => job.location)
      .filter((location): location is string => location !== undefined && location !== '');
    return Array.from(new Set(locations));
  }, [jobs]);

  // Filter jobs based on search term, employment type, and location
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = !searchTerm || 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEmploymentType = selectedEmploymentTypes.length === 0 ||
        (job.employment_type && selectedEmploymentTypes.includes(job.employment_type));

      const matchesLocation = selectedLocations.length === 0 ||
        (job.location && selectedLocations.includes(job.location));

      return matchesSearch && matchesEmploymentType && matchesLocation;
    });
  }, [jobs, searchTerm, selectedEmploymentTypes, selectedLocations]);

  const toggleEmploymentType = (type: EmploymentType) => {
    setSelectedEmploymentTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleLocation = (location: string) => {
    setSelectedLocations(prev => 
      prev.includes(location) 
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const clearAllFilters = () => {
    onSearch('');
    setSelectedEmploymentTypes([]);
    setSelectedLocations([]);
  };

  const hasActiveFilters = searchTerm || selectedEmploymentTypes.length > 0 || selectedLocations.length > 0;
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
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Jobs ({filteredJobs.length})</h2>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-1" />
              Filters
            </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search jobs by title, company, or description..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="space-y-3 pt-2 border-t">
            {/* Employment Type Filter */}
            {availableEmploymentTypes.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Employment Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableEmploymentTypes.map(type => (
                    <Badge
                      key={type}
                      variant={selectedEmploymentTypes.includes(type) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleEmploymentType(type)}
                    >
                      {formatEmploymentType(type)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Location Filter */}
            {availableLocations.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Location
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableLocations.map(location => (
                    <Badge
                      key={location}
                      variant={selectedLocations.includes(location) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleLocation(location)}
                    >
                      {location}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="divide-y max-h-96 overflow-y-auto">
        {filteredJobs.map((job) => (
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
                    {formatDate(job.created_at)}
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
        
        {filteredJobs.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {hasActiveFilters ? 'No jobs match your filters' : 'No jobs found'}
          </div>
        )}
      </div>
    </div>
  );
}