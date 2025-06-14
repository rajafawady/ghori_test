"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { User, UserActivity } from '@/types/index';
import { useAppContext } from '@/contexts/AppContext';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Building, 
  Shield, 
  Eye, 
  Calendar,
  Clock,
  Activity,
  MapPin,
  Edit,
  Trash2,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  UserCheck
} from 'lucide-react';

interface UserDetailsProps {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

// Mock user activity data - in a real app, this would come from an API
const mockUserActivity: UserActivity[] = [
  {
    id: '1',
    user_id: 'user1',
    action: 'login',
    resource_type: 'session',
    details: { ip_address: '192.168.1.1', user_agent: 'Chrome/91.0' },
    created_at: new Date('2024-01-15T10:30:00'),
  },
  {
    id: '2',
    user_id: 'user1',
    action: 'create',
    resource_type: 'job',
    resource_id: 'job-123',
    details: { job_title: 'Software Engineer' },
    created_at: new Date('2024-01-15T11:45:00'),
  },
  {
    id: '3',
    user_id: 'user1',
    action: 'update',
    resource_type: 'candidate',
    resource_id: 'candidate-456',
    details: { field: 'status', old_value: 'new', new_value: 'reviewed' },
    created_at: new Date('2024-01-15T14:20:00'),
  }
];

export function UserDetails({ user, onEdit, onDelete, onBack }: UserDetailsProps) {
  const { state } = useAppContext();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const isCurrentUser = user.id === state.currentUser?.id;
  const canEdit = state.currentUser?.role === 'admin' || isCurrentUser;
  const canDelete = state.currentUser?.role === 'admin' && !isCurrentUser;

  const loadUserActivities = useCallback(async () => {
    try {
      setLoading(true);
      // In a real app, this would be an API call
      setTimeout(() => {
        setActivities(mockUserActivity.filter(activity => activity.user_id === user.id));
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load user activities:', error);
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadUserActivities();
  }, [loadUserActivities]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-5 h-5" />;
      case 'recruiter': return <UserIcon className="w-5 h-5" />;
      case 'viewer': return <Eye className="w-5 h-5" />;
      default: return <UserIcon className="w-5 h-5" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'recruiter': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive': return <XCircle className="w-4 h-4 text-gray-600" />;
      case 'suspended': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <UserCheck className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatActivityAction = (activity: UserActivity) => {
    const action = activity.action.charAt(0).toUpperCase() + activity.action.slice(1);
    const resource = activity.resource_type;
    const resourceId = activity.resource_id ? ` (${activity.resource_id})` : '';
    
    return `${action} ${resource}${resourceId}`;
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'login': return <UserCheck className="w-4 h-4 text-green-600" />;
      case 'create': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'update': return <Edit className="w-4 h-4 text-yellow-600" />;
      case 'delete': return <Trash2 className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold">User Details</h1>
        </div>
        <div className="flex items-center space-x-2">
          {canDelete && (
            <Button
              variant="outline"
              onClick={onDelete}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <Card className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-2xl font-semibold text-gray-900">{user.full_name}</h2>
                  <Badge className={`${getRoleColor(user.role)} flex items-center gap-1`}>
                    {getRoleIcon(user.role)}
                    {user.role}
                  </Badge>
                  <Badge className={`${getStatusColor(user.status)} flex items-center gap-1`}>
                    {getStatusIcon(user.status)}
                    {user.status || 'active'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>{user.email}</span>
                  </div>
                  {user.profile?.phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{user.profile.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <Building className="w-4 h-4 mr-2" />
                    <span>{user.company?.name}</span>
                  </div>
                  {user.profile?.timezone && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{user.profile.timezone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {user.profile?.bio && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Bio</h3>
                <p className="text-gray-600">{user.profile.bio}</p>
              </div>
            )}
          </Card>

          {/* Account Stats */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{user.login_count || 0}</div>
                <div className="text-sm text-gray-600">Total Logins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                </div>
                <div className="text-sm text-gray-600">Last Login</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-600">Member Since</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {user.is_active ? 'Active' : 'Inactive'}
                </div>
                <div className="text-sm text-gray-600">Status</div>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Recent Activity
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="ml-2 text-gray-600">Loading activities...</span>
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-3">
                {activities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {formatActivityAction(activity)}
                      </div>
                      {activity.details && (
                        <div className="text-xs text-gray-600 mt-1">
                          {Object.entries(activity.details).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(activity.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No recent activity found</p>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {state.currentUser?.role === 'admin' && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    disabled
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    disabled
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Reset Password
                  </Button>
                </>
              )}
              {canDelete && (
                <Button
                  variant="outline"
                  onClick={onDelete}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </Button>
              )}
            </div>
          </Card>

          {/* User Timeline */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Account Created</p>
                  <p className="text-xs text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {user.last_login && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Activity className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Login</p>
                    <p className="text-xs text-gray-500">
                      {new Date(user.last_login).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Last Updated</p>
                  <p className="text-xs text-gray-500">
                    {new Date(user.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
