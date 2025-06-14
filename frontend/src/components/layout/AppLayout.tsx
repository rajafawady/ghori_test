"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Navbar } from '@/components/ui/navbar';
import { Breadcrumb } from '@/components/ui/breadcrumb';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { state, dispatch } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<'admin' | 'recruiter' | 'viewer'>('admin');
  const [activeSection, setActiveSection] = useState('jobs');

  // Initialize user role and active section based on current route
  useEffect(() => {
    // Map pathname to active section
    if (pathname.includes('/users')) {
      setActiveSection('users');
    } else if (pathname.includes('/uploads') || pathname.includes('/candidates')) {
      setActiveSection('uploads');
    } else if (pathname.includes('/admin')) {
      setActiveSection('admin');
    } else {
      setActiveSection('jobs');
    }

    // Initialize role from context or default
    if (state.currentUser?.role) {
      setRole(state.currentUser.role as 'admin' | 'recruiter' | 'viewer');
    }
  }, [pathname, state.currentUser]);

  // Handle role change and update context
  const handleRoleChange = (newRole: 'admin' | 'recruiter' | 'viewer') => {
    setRole(newRole);
    
    // Update the app context with the new role
    dispatch({ 
      type: 'SET_CURRENT_USER', 
      payload: { 
        id: state.currentUser?.id || 'demo-user-1',
        email: state.currentUser?.email || 'demo@jobmatcher.com',
        full_name: state.currentUser?.full_name || 'Demo User',
        role: newRole,
        company_id: state.currentUser?.company_id || 'company-1',
        password_hash: state.currentUser?.password_hash || 'demo-hash',
        created_at: state.currentUser?.created_at || new Date(),
        updated_at: state.currentUser?.updated_at || new Date(),
        last_login: state.currentUser?.last_login,
        is_active: state.currentUser?.is_active ?? true,
        login_count: state.currentUser?.login_count || 0,
        status: state.currentUser?.status || 'active',
        profile: state.currentUser?.profile
      }
    });

    // Reset to jobs section when role changes to ensure user has access
    if (newRole === 'viewer' && (activeSection === 'users' || activeSection === 'admin')) {
      setActiveSection('jobs');
      router.push('/');
    } else if (newRole === 'recruiter' && (activeSection === 'users' || activeSection === 'admin')) {
      setActiveSection('jobs');
      router.push('/');
    }
  };

  // Handle section change and navigation
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    
    // Navigate to appropriate route
    switch (section) {
      case 'users':
        router.push('/users');
        break;
      case 'uploads':
        router.push('/uploads');
        break;
      case 'admin':
        router.push('/admin');
        break;
      case 'jobs':
      default:
        router.push('/');
        break;
    }
  };

  // Show loading state while app is initializing
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
        onSectionChange={handleSectionChange}
        userRole={role}
        onRoleChange={handleRoleChange}      />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Breadcrumb />
          {children}
        </div>
      </main>
    </div>
  );
}
