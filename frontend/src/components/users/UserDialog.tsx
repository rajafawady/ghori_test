"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User, Company, UserRole, UserStatus } from '@/types/index';
import { userService } from '@/services/userService';
import { companyService } from '@/services/companyService';
import { useAppContext } from '@/contexts/AppContext';
import { 
  User as UserIcon, 
  Mail, 
  Building, 
  Shield, 
  Eye, 
  UserCheck,
  Save,
  X,
  AlertCircle
} from 'lucide-react';

interface UserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSave: (user: User) => void;
}

export function UserDialog({ isOpen, onClose, user, onSave }: UserDialogProps) {
  const { state } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'viewer' as UserRole,
    company_id: '',
    is_active: true,
    status: 'active' as UserStatus,
    phone: '',
    bio: '',
    timezone: ''
  });

  const isEditing = !!user;
  const isCurrentUser = user?.id === state.currentUser?.id;
  const canEditRole = state.currentUser?.role === 'admin' && !isCurrentUser;

  useEffect(() => {
    if (isOpen) {
      loadCompanies();
      if (user) {
        setFormData({
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          company_id: user.company_id,
          is_active: user.is_active,
          status: user.status || 'active',
          phone: user.profile?.phone || '',
          bio: user.profile?.bio || '',
          timezone: user.profile?.timezone || ''
        });
      } else {
        // Reset form for new user
        setFormData({
          full_name: '',
          email: '',
          role: 'viewer',
          company_id: state.currentCompany?.id || '',
          is_active: true,
          status: 'active',
          phone: '',
          bio: '',
          timezone: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, user, state.currentCompany]);

  const loadCompanies = async () => {
    try {
      const data = await companyService.getAll();
      setCompanies(data);
    } catch (error) {
      console.error('Failed to load companies:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.company_id) {
      newErrors.company_id = 'Company is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);

      let savedUser: User;
      
      if (isEditing && user) {
        // Update existing user
        savedUser = await userService.update(user.id, {
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          company_id: formData.company_id,
          is_active: formData.is_active,
          status: formData.status
        }) as User;
      } else {
        // Create new user
        savedUser = await userService.create({
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          company_id: formData.company_id,
          is_active: formData.is_active,
          status: formData.status,
          password_hash: 'temp_hash', // In real app, this would be handled differently
          login_count: 0
        });
      }

      onSave(savedUser);
      onClose();
    } catch (error) {
      console.error('Failed to save user:', error);
      setErrors({ submit: 'Failed to save user. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'recruiter': return <UserIcon className="w-4 h-4" />;
      case 'viewer': return <Eye className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'recruiter': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
    }
  };  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit User' : 'Add New User'}
              </DialogTitle>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Update user details and permissions' : 'Create a new user account'}              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Enter full name"
                      className={errors.full_name ? 'border-red-500' : ''}
                    />
                    {errors.full_name && (
                      <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Company & Role */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Company & Role</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company *
                    </label>
                    <select
                      value={formData.company_id}
                      onChange={(e) => handleInputChange('company_id', e.target.value)}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.company_id ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">Select a company</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                    {errors.company_id && (
                      <p className="text-red-500 text-xs mt-1">{errors.company_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value as UserRole)}
                      disabled={!canEditRole}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="admin">Admin</option>
                    </select>
                    {!canEditRole && isCurrentUser && (
                      <p className="text-xs text-gray-500 mt-1">You cannot change your own role</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <Badge className={`${getRoleColor(formData.role)} flex items-center gap-1`}>
                    {getRoleIcon(formData.role)}
                    {formData.role}
                  </Badge>
                </div>
              </div>

              {/* Status & Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Status & Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value as UserStatus)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <Input
                      value={formData.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      placeholder="e.g., America/New_York"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Account is active
                  </label>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Enter user bio or description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Error Message */}
              {errors.submit && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors.submit}</span>
                </div>
              )}
            </form>
          </div>          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? 'Update User' : 'Create User'}</span>
                </>
              )}
            </Button>
          </div>
      </DialogContent>
    </Dialog>
  );
}
