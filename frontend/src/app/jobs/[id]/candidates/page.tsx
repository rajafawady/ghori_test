"use client";

import { useEffect, useCallback, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useMatches } from '@/hooks/use-matches';
import { useCandidates } from '@/hooks/use-candidates';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, FileText, Mail, Phone, Calendar } from 'lucide-react';
import Link from 'next/link';
import { JobMatchStatus } from '@/types';
// import { PDFViewer } from '@/components/ui/pdf-viewer';

export default function JobCandidatesPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { matches, loading: matchesLoading, loadMatches, updateMatchStatus } = useMatches();
  const { candidates, loading: candidatesLoading } = useCandidates();
  const { toast } = useToast();
  const [selectedResumeUrl, setSelectedResumeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (jobId) {
      loadMatches(jobId);
    }
  }, [jobId, loadMatches]);

  const enrichedMatches = useMemo(() => {
    return matches.map(match => {
      const candidate = candidates.find(c => c.id === match.candidate_id);
      return {
        ...match,
        candidate
      };
    });
  }, [matches, candidates]);

  const handleStatusChange = useCallback(async (matchId: string, status: JobMatchStatus) => {
    try {
      await updateMatchStatus(matchId, status);
      toast({
        title: 'Success',
        description: 'Candidate status updated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update candidate status',
        variant: 'destructive',
      });
    }
  }, [updateMatchStatus, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hired':
        return 'text-green-500';
      case 'rejected':
        return 'text-red-500';
      case 'interviewing':
        return 'text-blue-500';
      case 'offered':
        return 'text-purple-500';
      default:
        return 'text-yellow-500';
    }
  };

  if (matchesLoading || candidatesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading candidates...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href={`/`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Matching Candidates</h1>
        </div>
      </div>

      <div className="grid gap-6">
        {enrichedMatches.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matching candidates found</h3>
              <p className="text-gray-500">Upload CVs to find matching candidates for this position.</p>
            </CardContent>
          </Card>
        ) : (
          enrichedMatches.map((match) => (
            <Card key={match.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium">{match.candidate?.full_name || 'Unknown Candidate'}</h3>
                    <div className="text-sm text-gray-500 space-y-1">
                      {match.candidate?.email && (
                        <div className="flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {match.candidate.email}
                        </div>
                      )}
                      {match.candidate?.phone && (
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {match.candidate.phone}
                        </div>
                      )}
                      {match.candidate?.created_at && (
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Added {new Date(match.candidate.created_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <p className={`text-sm ${getStatusColor(match.status)} mt-1`}>
                      Status: {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(match.id, 'interviewing')}
                      disabled={match.status === 'interviewing'}
                    >
                      Interview
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(match.id, 'offered')}
                      disabled={match.status === 'offered'}
                    >
                      Offer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(match.id, 'hired')}
                      disabled={match.status === 'hired'}
                    >
                      Hire
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(match.id, 'rejected')}
                      disabled={match.status === 'rejected'}
                    >
                      Reject
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Match Score: {((match.score || 0) * 100).toFixed(1)}%</h4>
                    <Progress value={(match.score || 0) * 100} className="w-full" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">Skills Match</h4>
                      <Progress value={match.analysis.skills_match * 100} className="w-full" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Experience Match</h4>
                      <Progress value={match.analysis.experience_match * 100} className="w-full" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Education Match</h4>
                      <Progress value={match.analysis.education_match * 100} className="w-full" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Location Match</h4>
                      <Progress value={match.analysis.location_match * 100} className="w-full" />
                    </div>
                  </div>

                  {match.candidate?.resume_url && (
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-600">Resume available</span>
                      </div>                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => match.candidate?.resume_url && setSelectedResumeUrl(match.candidate.resume_url)}
                      >
                        View Resume
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* {selectedResumeUrl && (
        <PDFViewer
          url={selectedResumeUrl}
          isOpen={!!selectedResumeUrl}
          onClose={() => setSelectedResumeUrl(null)}
        />
      )} */}
    </div>
  );
} 