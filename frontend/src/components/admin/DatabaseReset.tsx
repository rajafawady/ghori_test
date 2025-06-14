'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { databaseResetService } from '@/lib/databaseReset';
import { AdminGuard } from './AdminGuard';
import { 
  AlertTriangle, 
  RotateCcw, 
  Database, 
  Download,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';

export function DatabaseReset() {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const loadStats = () => {
    setStats(databaseResetService.getDatabaseStats());
  };

  // Load stats on component mount
  useState(() => {
    loadStats();
  });

  const handleReset = async () => {
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setIsResetting(true);
    try {
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      databaseResetService.resetDatabase();
      loadStats();
      
      toast({
        title: 'Database Reset Complete',
        description: 'All data has been cleared and reinitialized with fresh mock data.',
      });
      
      // Reload the page to ensure all components reflect the new data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Database reset failed:', error);
      toast({
        title: 'Reset Failed',
        description: 'There was an error resetting the database.',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
      setShowConfirmation(false);
    }
  };

  const handleExport = () => {
    try {
      const data = databaseResetService.exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job-matcher-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Complete',
        description: 'Database backup has been downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export database.',
        variant: 'destructive',
      });
    }
  };

  const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0);
  return (
    <AdminGuard>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Database Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Database Statistics */}
            <div>
              <h4 className="text-sm font-medium mb-3">Current Database Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(stats).map(([collection, count]) => (
                  <div key={collection} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-xs font-medium capitalize">
                      {collection.replace(/_/g, ' ')}
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {count}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Records:</span>
                <Badge variant="default" className="text-base px-3 py-1">
                  {totalRecords}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                onClick={loadStats}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Stats
              </Button>
              
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Backup
              </Button>
            </div>

            {/* Reset Section */}
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-800">Danger Zone</h4>
                  <p className="text-sm text-red-700 mt-1">
                    This will permanently delete all data and reinitialize with fresh mock data. 
                    This action cannot be undone.
                  </p>
                  
                  {showConfirmation && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                      <p className="text-sm font-medium text-red-800 mb-2">
                        ⚠️ Are you absolutely sure?
                      </p>
                      <p className="text-xs text-red-700 mb-3">
                        This will delete all jobs, candidates, uploads, and other data.
                        Type YES to confirm or click Cancel.
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleReset}
                          disabled={isResetting}
                          variant="destructive"
                          size="sm"
                        >
                          {isResetting ? (
                            <>
                              <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                              Resetting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-2" />
                              YES, Reset Database
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => setShowConfirmation(false)}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {!showConfirmation && (
                    <Button
                      onClick={handleReset}
                      disabled={isResetting}
                      variant="destructive"
                      size="sm"
                      className="mt-3"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Reset Database
                    </Button>
                  )}
                </div>              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </AdminGuard>
  );
}
