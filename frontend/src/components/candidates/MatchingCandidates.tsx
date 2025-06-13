'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { candidateMatchService } from '@/services/candidateMatchService';
import { JobMatch } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface MatchingCandidatesProps {
  jobId: string;
}

export function MatchingCandidates({ jobId }: MatchingCandidatesProps) {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMatches();
  }, [jobId]);

  const loadMatches = async () => {
    try {
      const data = await candidateMatchService.getMatchingCandidates(jobId);
      setMatches(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load matching candidates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (matchId: string, status: string) => {
    try {
      await candidateMatchService.updateMatchStatus(matchId, status);
      await loadMatches();
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
  };

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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Matching Candidates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {matches.length === 0 ? (
            <p className="text-muted-foreground">No matching candidates found</p>
          ) : (
            matches.map((match) => (
              <div
                key={match.id}
                className="p-4 border rounded-lg space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Match Score: {(match.score || 0) * 100}%</h3>
                    <p className={`text-sm ${getStatusColor(match.status)}`}>
                      Status: {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                    </p>
                  </div>
                  <div className="flex gap-2">
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
                {match.analysis && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Match Analysis</h4>
                    <div className="grid gap-2">
                      <div>
                        <p className="text-sm">Skills Match</p>
                        <Progress value={match.analysis.skills_match * 100} className="w-full" />
                      </div>
                      <div>
                        <p className="text-sm">Experience Match</p>
                        <Progress value={match.analysis.experience_match * 100} className="w-full" />
                      </div>
                      <div>
                        <p className="text-sm">Education Match</p>
                        <Progress value={match.analysis.education_match * 100} className="w-full" />
                      </div>
                      <div>
                        <p className="text-sm">Location Match</p>
                        <Progress value={match.analysis.location_match * 100} className="w-full" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 