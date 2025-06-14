"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { userService } from '@/services/userService';
import { User, UserRole, UserStatus } from '@/types/index';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { UserDialog } from './UserDialog';
import { UserDetails } from './UserDetails';
import { UserActivityLog } from './UserActivityLog';
import { 
  Plus, 
  Search, 
  User as UserIcon, 
  Shield, 
  Eye, 
  Mail, 
  Calendar,
  Edit,
  Trash2,
  MoreVertical,
  Filter,
  Download,
  UserCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Settings
} from 'lucide-react';

export function UserManagement() {
  const { state } = useAppContext();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [currentView, setCurrentView] = useState<'list' | 'details' | 'activity'>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateUser = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setCurrentView('details');
  };
  const handleDeleteUser = async (userId: string) => {
    try {
      await userService.delete(userId);
      setUsers(users.filter(u => u.id !== userId));
      setShowDeleteConfirm(null);
      
      // If we're viewing the deleted user, go back to list
      if (selectedUser?.id === userId) {
        setCurrentView('list');
        setSelectedUser(null);
      }
      
      toast({
        title: "User deleted",
        description: "User has been successfully deleted.",
      });
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };  const handleSaveUser = (savedUser: User) => {
    if (editingUser) {
      // Update existing user
      setUsers(users.map(u => u.id === savedUser.id ? savedUser : u));
      toast({
        title: "User updated",
        description: "User information has been successfully updated.",
      });
    } else {
      // Add new user
      setUsers([...users, savedUser]);
      toast({
        title: "User created",
        description: "New user has been successfully created.",
      });
    }
    setEditingUser(null);
    setIsDialogOpen(false); // Close the dialog after saving
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (user.status || 'active') === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const userStats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    admins: users.filter(u => u.role === 'admin').length,
    recruiters: users.filter(u => u.role === 'recruiter').length,
    viewers: users.filter(u => u.role === 'viewer').length
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Company', 'Status', 'Last Login', 'Created'],
      ...filteredUsers.map(user => [
        user.full_name,
        user.email,
        user.role,
        user.company?.name || '',
        user.is_active ? 'Active' : 'Inactive',
        user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never',
        new Date(user.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'recruiter': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'recruiter': return <UserIcon className="w-4 h-4" />;
      case 'viewer': return <Eye className="w-4 h-4" />;
      default: return <UserIcon className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status?: UserStatus, isActive?: boolean) => {
    if (!isActive) return <XCircle className="w-4 h-4 text-red-600" />;
    
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive': return <XCircle className="w-4 h-4 text-gray-600" />;
      case 'suspended': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
  };

  const getStatusColor = (status?: UserStatus, isActive?: boolean) => {
    if (!isActive) return 'bg-red-100 text-red-800';
    
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  // Show different views based on current state
  if (currentView === 'details' && selectedUser) {
    return (
      <AdminGuard>
        <UserDetails
          user={selectedUser}
          onEdit={() => handleEditUser(selectedUser)}
          onDelete={() => setShowDeleteConfirm(selectedUser.id)}
          onBack={() => {
            setCurrentView('list');
            setSelectedUser(null);
          }}
        />
        {showDeleteConfirm === selectedUser.id && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="p-6 max-w-md mx-auto">
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold">Delete User</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{selectedUser.full_name}</strong>? 
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Delete
                </Button>
              </div>
            </Card>
          </div>
        )}
      </AdminGuard>
    );
  }

  if (currentView === 'activity') {
    return (
      <AdminGuard>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentView('list')}
                className="flex items-center space-x-2"
              >
                <UserIcon className="w-4 h-4" />
                <span>Back to Users</span>
              </Button>
              <h1 className="text-3xl font-bold">User Activity</h1>
            </div>
          </div>
          <UserActivityLog showUserColumn={true} />
        </div>
      </AdminGuard>
    );
  }

  if (loading) {
    return (
      <AdminGuard>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-gray-600">Loading users...</span>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
                      <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
            </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={exportUsers}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentView('activity')}
              className="flex items-center space-x-2"
            >
              <Activity className="w-4 h-4" />
              <span>Activity Log</span>
            </Button>
            <Button 
              onClick={handleCreateUser}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add User</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <UserIcon className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{userStats.total}</p>
                <p className="text-xs text-gray-600">Total Users</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{userStats.active}</p>
                <p className="text-xs text-gray-600">Active</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{userStats.inactive}</p>
                <p className="text-xs text-gray-600">Inactive</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{userStats.admins}</p>
                <p className="text-xs text-gray-600">Admins</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <UserIcon className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{userStats.recruiters}</p>
                <p className="text-xs text-gray-600">Recruiters</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-2xl font-bold text-gray-600">{userStats.viewers}</p>
                <p className="text-xs text-gray-600">Viewers</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="recruiter">Recruiter</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Users ({filteredUsers.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.company?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status, user.is_active)}`}>
                        {getStatusIcon(user.status, user.is_active)}
                        {user.is_active ? (user.status || 'active') : 'inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {user.last_login 
                          ? new Date(user.last_login).toLocaleDateString()
                          : 'Never'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {user.created_at instanceof Date 
                          ? user.created_at.toLocaleDateString()
                          : new Date(user.created_at).toLocaleDateString()
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewUser(user)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        {state.currentUser?.role === 'admin' && user.id !== state.currentUser.id && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowDeleteConfirm(user.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">
              {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters to see more users.'
                : 'Get started by adding your first user.'
              }
            </p>
            <Button className="mt-4" onClick={handleCreateUser}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        )}

        {/* User Dialog */}
        <UserDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          user={editingUser}
          onSave={handleSaveUser}
        />

        {/* Delete Confirmation */}
        {showDeleteConfirm && !selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="p-6 max-w-md mx-auto">
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold">Delete User</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeleteUser(showDeleteConfirm)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Delete
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
