"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCandidates } from '@/hooks/use-candidates';
import { Candidate } from '@/types/index';
import { Plus, Search, User, Mail, Phone, FileText, Calendar, Upload } from 'lucide-react';

export function CandidateManagement() {
  const { candidates, loading, createCandidate, updateCandidate, deleteCandidate } = useCandidates();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [batchUploading, setBatchUploading] = useState(false);
  const [batchResults, setBatchResults] = useState<Candidate[] | null>(null);

  const filteredCandidates = candidates.filter(candidate =>
    candidate.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Simulate batch upload and AI matching
  const handleBatchUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setBatchUploading(true);
    setBatchResults(null);
    // Simulate parsing and AI matching
    setTimeout(() => {
      // For demo: shuffle and sort candidates by random 'match score'
      const scored = candidates.map(c => ({ ...c, matchScore: Math.random() * 100 }));
      scored.sort((a, b) => b.matchScore - a.matchScore);
      setBatchResults(scored);
      setBatchUploading(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading candidates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Candidate Management</h1>
        <div className="flex gap-2">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Candidate
          </Button>
          <Button
            className="flex items-center gap-2"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={batchUploading}
          >
            <Upload className="w-4 h-4" />
            Batch Upload CVs
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.zip"
            multiple
            className="hidden"
            onChange={handleBatchUpload}
          />
        </div>
      </div>

      {/* Show batch results if available */}
      {batchUploading && (
        <div className="p-4 bg-blue-50 rounded text-blue-700">Processing batch upload...</div>
      )}
      {batchResults && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">Batch Upload Results (Sorted by Best Match)</h2>
          <ol className="list-decimal pl-6 space-y-2">
            {batchResults.map((c, idx) => (
              <li key={c.id} className="flex items-center justify-between">
                <span>{c.full_name} <span className="text-gray-500">({c.email})</span></span>
                <span className="font-mono text-blue-700">Score: {(c as any).matchScore?.toFixed(1)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex items-center space-x-4">
        <div className="flex-1 flex items-center space-x-2">
          <Input
            placeholder="Search candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button variant="outline" size="icon">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Candidates ({filteredCandidates.length})</h2>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {filteredCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedCandidate?.id === candidate.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => setSelectedCandidate(candidate)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{candidate.full_name}</h3>
                      <div className="text-sm text-gray-500 space-y-1">
                        <div className="flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {candidate.email}
                        </div>
                        {candidate.phone && (
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {candidate.phone}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Added {candidate.created_at.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      candidate.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {candidate.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {candidate.resume_url && (
                      <div className="flex items-center text-xs text-blue-600">
                        <FileText className="w-3 h-3 mr-1" />
                        Resume
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredCandidates.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No candidates found
              </div>
            )}
          </div>
        </div>

        <div>
          {selectedCandidate ? (
            <div className="bg-white rounded-lg shadow-lg">
              <div className="p-6 border-b">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedCandidate.full_name}</h2>
                      <div className="flex items-center text-gray-600 mt-1">
                        <Mail className="w-4 h-4 mr-2" />
                        {selectedCandidate.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm">
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {selectedCandidate.phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {selectedCandidate.phone}
                    </div>
                  )}
                  
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    Added {selectedCandidate.created_at.toLocaleDateString()}
                  </div>
                </div>

                <div className="mt-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedCandidate.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedCandidate.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {selectedCandidate.resume_url && (
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Resume
                  </h3>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-600">Resume file available</span>
                    <Button variant="outline" size="sm">
                      View Resume
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-6">
                <h3 className="text-lg font-semibold mb-3">Job Matches</h3>
                <div className="text-center py-8 text-gray-500">
                  <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No job matches found for this candidate</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Find Matches
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a candidate</h3>
              <p className="text-gray-500">Choose a candidate from the list to view their details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}