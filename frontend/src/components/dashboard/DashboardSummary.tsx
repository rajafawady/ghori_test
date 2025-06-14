"use client";

import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Briefcase,  
  CheckCircle, 
  Clock 
} from 'lucide-react';

export function DashboardSummary() {
  const { state } = useAppContext();
  const stats = {
    totalJobs: state.jobs.length,
    activeJobs: state.jobs.filter(job => job.is_active).length,
    totalCandidates: state.candidates.length,
    totalMatches: state.matches.length,
    batchUploads: state.batchUploads.length,
    pendingMatches: state.matches.filter(match => match.status === 'applied').length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeJobs}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalJobs} total jobs
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCandidates}</div>
          <p className="text-xs text-muted-foreground">
            From {stats.batchUploads} batch uploads
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Job Matches</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalMatches}</div>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {stats.pendingMatches} pending
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
