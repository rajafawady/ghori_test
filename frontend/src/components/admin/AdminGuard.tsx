"use client";

import { ReactNode } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Shield, AlertCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireRole?: 'admin' | 'recruiter' | 'viewer';
  message?: string;
}

export function AdminGuard({ 
  children, 
  fallback, 
  requireRole = 'admin',
  message = "You don't have permission to access this section."
}: AdminGuardProps) {
  const { state } = useAppContext();

  // Check if user is authenticated and has required role
  const hasRequiredRole = () => {
    if (!state.currentUser) return false;
    
    const userRole = state.currentUser.role;
    
    // Admin has access to everything
    if (userRole === 'admin') return true;
    
    // For other roles, check exact match
    return userRole === requireRole;
  };

  if (!state.initialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!state.currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 max-w-md mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to access this page.
          </p>
          <Button className="w-full">
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (!hasRequiredRole()) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const getRoleDisplayName = (role: string) => {
      switch (role) {
        case 'admin': return 'Administrator';
        case 'recruiter': return 'Recruiter';
        case 'viewer': return 'Viewer';
        default: return role;
      }
    };

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 max-w-md mx-auto text-center">
          <Shield className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {getRoleDisplayName(requireRole)} Access Required
          </h2>
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Required role: <span className="font-medium">{getRoleDisplayName(requireRole)}</span>
            </p>
            <p className="text-sm text-gray-500">
              Current role: <span className="font-medium">{getRoleDisplayName(state.currentUser.role)}</span>
            </p>
            <p className="text-sm text-gray-500">
              User: <span className="font-medium">{state.currentUser.full_name}</span>
            </p>
          </div>
          <Button 
            className="w-full mt-6" 
            onClick={() => window.history.back()}
          >
            <Home className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
