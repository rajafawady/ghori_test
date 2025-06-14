"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserActivity, User } from '@/types/index';
import { userService } from '@/services/userService';
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  Clock,
  User as UserIcon,
  Eye,
  Edit,
  Trash2,
  Plus,
  LogIn,
  LogOut,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface UserActivityLogProps {
  userId?: string;
  showUserColumn?: boolean;
  maxHeight?: string;
}

// Mock activity data - in a real app, this would come from an API
const mockActivities: UserActivity[] = [
  {
    id: '1',
    user_id: 'user1',
    action: 'login',
    resource_type: 'session',
    details: { ip_address: '192.168.1.1', user_agent: 'Chrome/91.0' },
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0 (Chrome)',
    created_at: new Date('2024-01-15T10:30:00'),
  },
  {
    id: '2',
    user_id: 'user1',
    action: 'create',
    resource_type: 'job',
    resource_id: 'job-123',
    details: { job_title: 'Software Engineer', company: 'Tech Corp' },
    created_at: new Date('2024-01-15T11:45:00'),
  },
  {
    id: '3',
    user_id: 'user2',
    action: 'update',
    resource_type: 'candidate',
    resource_id: 'candidate-456',
    details: { field: 'status', old_value: 'new', new_value: 'reviewed' },
    created_at: new Date('2024-01-15T14:20:00'),
  },
  {
    id: '4',
    user_id: 'user1',
    action: 'delete',
    resource_type: 'job',
    resource_id: 'job-789',
    details: { job_title: 'Marketing Manager' },
    created_at: new Date('2024-01-15T16:10:00'),
  },
  {
    id: '5',
    user_id: 'user3',
    action: 'view',
    resource_type: 'report',
    resource_id: 'report-001',
    details: { report_type: 'candidate_summary' },
    created_at: new Date('2024-01-16T09:15:00'),
  },
  {
    id: '6',
    user_id: 'user2',
    action: 'logout',
    resource_type: 'session',
    details: { session_duration: '2h 30m' },
    created_at: new Date('2024-01-16T12:45:00'),
  }
];

export function UserActivityLog({ userId, showUserColumn = true, maxHeight = "600px" }: UserActivityLogProps) {  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load users for user mapping
      const usersData = await userService.getAll();
      setUsers(usersData);
      
      // Simulate API call for activities
      setTimeout(() => {
        let filteredActivities = [...mockActivities];
        
        if (userId) {
          filteredActivities = filteredActivities.filter(activity => activity.user_id === userId);        }
        
        // Add user data to activities
        const activitiesWithUsers = filteredActivities.map(activity => ({
          ...activity,
          user: usersData.find(u => u.id === activity.user_id)
        }));
        
        setActivities(activitiesWithUsers);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load activity data:', error);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login': return <LogIn className="w-4 h-4 text-green-600" />;
      case 'logout': return <LogOut className="w-4 h-4 text-gray-600" />;
      case 'create': return <Plus className="w-4 h-4 text-blue-600" />;
      case 'update': return <Edit className="w-4 h-4 text-yellow-600" />;
      case 'delete': return <Trash2 className="w-4 h-4 text-red-600" />;
      case 'view': return <Eye className="w-4 h-4 text-purple-600" />;
      case 'settings': return <Settings className="w-4 h-4 text-gray-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login': return 'bg-green-100 text-green-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      case 'create': return 'bg-blue-100 text-blue-800';
      case 'update': return 'bg-yellow-100 text-yellow-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'view': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatActivityDescription = (activity: UserActivity) => {
    const action = activity.action.charAt(0).toUpperCase() + activity.action.slice(1);
    const resource = activity.resource_type;
    const resourceId = activity.resource_id ? ` (${activity.resource_id})` : '';
    
    if (activity.details) {
      switch (activity.action) {
        case 'create':
          if (activity.details.job_title) {
            return `Created job: ${activity.details.job_title}`;
          }
          break;
        case 'update':
          if (activity.details.field && activity.details.old_value && activity.details.new_value) {
            return `Updated ${activity.details.field} from "${activity.details.old_value}" to "${activity.details.new_value}"`;
          }
          break;
        case 'login':
          return `Logged in from ${activity.details.ip_address || 'unknown IP'}`;
        case 'logout':
          if (activity.details.session_duration) {
            return `Logged out after ${activity.details.session_duration}`;
          }
          break;
      }
    }
    
    return `${action} ${resource}${resourceId}`;
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.resource_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activity.user?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activity.resource_id || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'all' || activity.action === actionFilter;

    const matchesDate = (() => {
      if (dateFilter === 'all') return true;
      
      const activityDate = new Date(activity.created_at);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          return activityDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return activityDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return activityDate >= monthAgo;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesAction && matchesDate;
  });

  const uniqueActions = [...new Set(activities.map(a => a.action))];

  const exportActivities = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Resource', 'Resource ID', 'IP Address', 'Details'],
      ...filteredActivities.map(activity => [
        new Date(activity.created_at).toISOString(),
        activity.user?.full_name || 'Unknown User',
        activity.action,
        activity.resource_type,
        activity.resource_id || '',
        activity.ip_address || '',
        JSON.stringify(activity.details || {})
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-activity-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">User Activity Log</h3>
          <Badge variant="outline" className="ml-2">
            {filteredActivities.length} activities
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportActivities}
          className="flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>
                {action.charAt(0).toUpperCase() + action.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
        </div>
      </div>

      {/* Activity List */}
      <div 
        className="space-y-3 overflow-y-auto"
        style={{ maxHeight }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-gray-600">Loading activities...</span>
          </div>
        ) : filteredActivities.length > 0 ? (
          <>
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0 mt-1">
                  {getActionIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge className={`${getActionColor(activity.action)} text-xs`}>
                      {activity.action}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {activity.resource_type}
                    </span>
                    {activity.resource_id && (
                      <span className="text-xs text-gray-400">
                        #{activity.resource_id}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {formatActivityDescription(activity)}
                  </p>
                  
                  {showUserColumn && activity.user && (
                    <div className="flex items-center space-x-2 mb-2">
                      <UserIcon className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {activity.user.full_name} ({activity.user.email})
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(activity.created_at).toLocaleString()}</span>
                    </div>
                    {activity.ip_address && (
                      <span>IP: {activity.ip_address}</span>
                    )}
                  </div>
                  
                  {activity.details && Object.keys(activity.details).length > 0 && (
                    <div className="mt-2 text-xs">
                      <details className="group">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                          View details
                        </summary>
                        <div className="mt-1 p-2 bg-gray-100 rounded text-gray-700">
                          <pre className="whitespace-pre-wrap text-xs">
                            {JSON.stringify(activity.details, null, 2)}
                          </pre>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-500">
              {searchQuery || actionFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters to see more activities.'
                : 'User activities will appear here once they start using the system.'
              }
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
