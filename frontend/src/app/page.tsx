"use client";

import { useState } from 'react';
import { AppProvider, useAppContext } from '@/contexts/AppContext';
import { DashboardLayout } from '@/components/dashboard/layout';
import { UserManagement } from '@/components/users/UserManagement';
import { JobManagement } from '@/components/jobs/JobManagement';
import { UploadHistoryPage } from '@/components/candidates/UploadHistoryPage';
import { DatabaseReset } from '@/components/admin/DatabaseReset';

function HomeContent() {
  // Simulate user role selection for RBAC
  const [role, setRole] = useState<'admin' | 'recruiter' | 'viewer'>('admin');
  const [activeSection, setActiveSection] = useState('jobs');
  const { state, dispatch } = useAppContext();

  // Only show tabs based on role
  const tabs = [
    { id: 'jobs', name: 'Jobs' },
    { id: 'uploads', name: 'Batch Uploads' },
    // Only admin can manage users and database
    ...(role === 'admin' ? [
      { id: 'users', name: 'Users' },
      { id: 'admin', name: 'Database Admin' }
    ] : [])
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return <UserManagement />;
      case 'jobs':
        return <JobManagement />;
      case 'uploads':
        return <UploadHistoryPage />;
      case 'admin':
        return <DatabaseReset />;
      default:
        return <JobManagement />;
    }
  };

  return (
    <div>
      {!state.initialized ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Initializing application...</p>
          </div>
        </div>
      ) : (
        <div className="p-6">
          {/* Role selector for simulation */}
            <div className="mb-4 flex items-center space-x-2">
            <span className="font-medium">Role:</span>
            <select
              className="border rounded px-2 py-1"
              value={role}
              onChange={e => {
              const newRole = e.target.value as 'admin' | 'recruiter' | 'viewer';
              setRole(newRole);
              // Update the app context with the new role
              dispatch({ 
                type: 'SET_CURRENT_USER', 
                payload: { 
                  id: state.currentUser?.id || 'temp-user',
                  email: state.currentUser?.email || 'temp@example.com',
                  full_name: state.currentUser?.full_name || 'Temp User',
                  role: newRole,
                  company_id: state.currentUser?.company_id || undefined,
                  password_hash: state.currentUser?.password_hash || '',
                  created_at: state.currentUser?.created_at || undefined,
                  updated_at: state.currentUser?.updated_at || undefined,
                  last_login: state.currentUser?.last_login || undefined,
                  is_active: state.currentUser?.is_active ?? true,
                  profile: state.currentUser?.profile || undefined
                } as any
              });
              }}
            >
              <option value="admin">Admin</option>
              <option value="recruiter">Recruiter</option>
              <option value="viewer">Viewer</option>
            </select>
            </div>
          <div className="mb-6">
            <nav className="flex space-x-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeSection === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
          {renderContent()}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <HomeContent />
    </AppProvider>
  );
}