"use client";

import { useState } from 'react';
import { AppProvider } from '@/contexts/AppContext';
import { DashboardLayout } from '@/components/dashboard/layout';
import { UserManagement } from '@/components/users/UserManagement';
import { JobManagement } from '@/components/jobs/JobManagement';
import { CandidateManagement } from '@/components/candidates/CandidateManagement';

function HomeContent() {
  // Simulate user role selection for RBAC
  const [role, setRole] = useState<'admin' | 'recruiter' | 'viewer'>('admin');
  const [activeSection, setActiveSection] = useState('jobs');

  // Only show tabs based on role
  const tabs = [
    { id: 'jobs', name: 'Jobs' },
    { id: 'candidates', name: 'Candidates' },
    // Only admin can manage users
    ...(role === 'admin' ? [{ id: 'users', name: 'Users' }] : [])
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return role === 'admin' ? <UserManagement /> : null;
      case 'jobs':
        return <JobManagement />;
      case 'candidates':
        return <CandidateManagement />;
      default:
        return <JobManagement />;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Role selector for simulation */}
        <div className="mb-4 flex items-center space-x-2">
          <span className="font-medium">Role:</span>
          <select
            className="border rounded px-2 py-1"
            value={role}
            onChange={e => setRole(e.target.value as any)}
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
    </DashboardLayout>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <HomeContent />
    </AppProvider>
  );
}