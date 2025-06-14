"use client";

import { useEffect, useCallback, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMatches } from '@/hooks/use-matches';
import { useCandidates } from '@/hooks/use-candidates';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, FileText, Mail, Phone, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { JobMatchStatus } from '@/types';
import { PDFViewer } from '@/components/ui/pdf-viewer';

export default function JobCandidatesPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { matches, loading: matchesLoading, loadMatches, updateMatchStatus } = useMatches();
  const { candidates, loading: candidatesLoading } = useCandidates();
  const { toast } = useToast();
  const [selectedResumeUrl, setSelectedResumeUrl] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

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

  const toggleItem = useCallback((id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

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
            <Collapsible key={match.id} className="w-full" open={openItems[match.id]} onOpenChange={() => toggleItem(match.id)}>
              <Card>
                <CardContent className="p-6">                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
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
                      </div>                      <p className={`text-sm ${getStatusColor(match.status)} mt-2`}>
                        Status: {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(match.id, 'interviewing')}
                          disabled={match.status === 'interviewing'}
                        >
                          Interview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(match.id, 'offered')}
                          disabled={match.status === 'offered'}
                        >
                          Offer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(match.id, 'hired')}
                          disabled={match.status === 'hired'}
                        >
                          Hire
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(match.id, 'rejected')}
                          disabled={match.status === 'rejected'}
                        >
                          Reject
                        </Button>
                      </div>                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-2">
                          {openItems[match.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                  
                  {/* Total Score and Resume Row */}
                  <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Total Match Score</span>
                        <span className="text-sm font-semibold text-blue-600">{((match.score || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={(match.score || 0) * 100} className="w-full" />
                    </div>
                    {match.candidate?.resume_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => match.candidate?.resume_url && setSelectedResumeUrl(match.candidate.resume_url)}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        View Resume
                      </Button>
                    )}
                  </div>                  
                  <CollapsibleContent>
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      {match.analysis && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <h4 className="font-medium mb-2 flex items-center justify-between">
                              Skills Match
                              <span className="text-sm text-gray-600">{(match.analysis.skills_match * 100).toFixed(1)}%</span>
                            </h4>
                            <Progress value={match.analysis.skills_match * 100} className="w-full" />
                          </div>
                          <div>
                            <h4 className="font-medium mb-2 flex items-center justify-between">
                              Experience Match
                              <span className="text-sm text-gray-600">{(match.analysis.experience_match * 100).toFixed(1)}%</span>
                            </h4>
                            <Progress value={match.analysis.experience_match * 100} className="w-full" />
                          </div>
                          <div>
                            <h4 className="font-medium mb-2 flex items-center justify-between">
                              Education Match
                              <span className="text-sm text-gray-600">{(match.analysis.education_match * 100).toFixed(1)}%</span>
                            </h4>
                            <Progress value={match.analysis.education_match * 100} className="w-full" />
                          </div>
                          <div>
                            <h4 className="font-medium mb-2 flex items-center justify-between">
                              Location Match
                              <span className="text-sm text-gray-600">{(match.analysis.salary_expectations * 100).toFixed(1)}%</span>
                            </h4>
                            <Progress value={match.analysis.salary_expectations * 100} className="w-full" />
                          </div>
                        </div>
                      )}
                      
                      {match.ai_summary && (
                        <div className="space-y-2">
                          <h4 className="font-medium">AI Summary</h4>
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {match.ai_summary}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
          ))
        )}
      </div>

       {selectedResumeUrl && (
        <PDFViewer
          url={selectedResumeUrl}
          isOpen={!!selectedResumeUrl}
          onClose={() => setSelectedResumeUrl(null)}
        />
      )}
    </div>
  );
}