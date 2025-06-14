"use client";

import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Navbar } from '@/components/ui/navbar';

interface MainLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  userRole: 'admin' | 'recruiter' | 'viewer';
  onRoleChange: (role: 'admin' | 'recruiter' | 'viewer') => void;
}

export function MainLayout({ 
  children, 
  activeSection, 
  onSectionChange, 
  userRole, 
  onRoleChange 
}: MainLayoutProps) {
  const { state } = useAppContext();

  if (!state.initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Initializing Job Matcher</h2>
          <p className="text-gray-600">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        userRole={userRole}
        onRoleChange={onRoleChange}
      />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
